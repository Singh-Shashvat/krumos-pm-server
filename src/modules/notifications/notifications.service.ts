import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { Task } from '../../database/entities/task.entity';
import { TaskStatus } from '@/types/enum';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private getNotificationTitle(type: string): string {
    switch (type) {
      case 'TASK_ASSIGNED':
        return 'Task Assigned';
      case 'COMMENT_ADDED':
        return 'New Comment';
      case 'TASK_DUE':
        return 'Task Due Soon';
      case 'INVITATION_RECEIVED':
        return 'Invitation';
      default:
        return type ? type.replace(/_/g, ' ') : 'Notification';
    }
  }

  async listNotifications(userId: string, workspaceId: string): Promise<any[]> {
    const notifications = await this.notificationRepository.find({
      where: { userId, workspaceId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return notifications.map((n) => ({
      ...n,
      title: this.getNotificationTitle(n.type),
    }));
  }

  async markAsRead(userId: string, workspaceId: string, notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId, workspaceId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    notification.isRead = true;
    const saved = await this.notificationRepository.save(notification);

    await this.emitUnreadCount(userId, workspaceId);
    return saved;
  }

  async markAllAsRead(userId: string, workspaceId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, workspaceId, isRead: false },
      { isRead: true },
    );
    await this.emitUnreadCount(userId, workspaceId);
  }

  async emitUnreadCount(userId: string, workspaceId: string, notification?: Notification) {
    const count = await this.notificationRepository.count({
      where: { userId, workspaceId, isRead: false },
    });
    const notificationWithTitle = notification
      ? { ...notification, title: this.getNotificationTitle(notification.type) }
      : null;
    this.eventsGateway.emitNotificationCreated(userId, count, notificationWithTitle);
  }

  async createNotification(
    userId: string,
    workspaceId: string,
    message: string,
    type: string,
    taskId?: string,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId,
      workspaceId,
      message,
      type,
      taskId,
      isRead: false,
    });
    const saved = await this.notificationRepository.save(notification);

    await this.emitUnreadCount(userId, workspaceId, saved);
    return saved;
  }

  async runDueRemindersAndCleanup(): Promise<void> {
    // 1. Clean notifications older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    await this.notificationRepository.createQueryBuilder()
      .delete()
      .where('createdAt < :thirtyDaysAgo', { thirtyDaysAgo })
      .execute();

    // 2. Alert for tasks due tomorrow
    const tomorrowStart = new Date();
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date();
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const tasksDueTomorrow = await this.taskRepository.find({
      where: {
        dueDate: LessThan(tomorrowEnd) as any,
      },
      relations: { project: true },
    });

    const activeTasksDueTomorrow = tasksDueTomorrow.filter((task) => {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      return due >= tomorrowStart && due <= tomorrowEnd && task.status !== TaskStatus.DONE;
    });

    for (const task of activeTasksDueTomorrow) {
      if (task.assigneeId) {
        const alreadyNotified = await this.notificationRepository.findOne({
          where: {
            userId: task.assigneeId,
            taskId: task.id,
            type: 'TASK_DUE',
            createdAt: MoreThanOrEqual(new Date(Date.now() - 24 * 60 * 60 * 1000)),
          },
        });

        if (!alreadyNotified) {
          const notification = this.notificationRepository.create({
            userId: task.assigneeId,
            workspaceId: task.project.workspaceId,
            message: `Task is due tomorrow: ${task.title}`,
            type: 'TASK_DUE',
            taskId: task.id,
            isRead: false,
          });
          const saved = await this.notificationRepository.save(notification);

          await this.emitUnreadCount(task.assigneeId, task.project.workspaceId, saved);
        }
      }
    }
  }
}
