import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../database/entities/comment.entity';
import { WorkspaceRole } from '@/types/enum';
import { TasksService } from '../tasks/tasks.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly tasksService: TasksService,
    private readonly notificationsService: NotificationsService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async getComments(
    workspaceId: string,
    taskId: string,
    performerId?: string,
    performerRole?: WorkspaceRole,
  ): Promise<Comment[]> {
    await this.tasksService.getTask(workspaceId, taskId, performerId, performerRole); // validates task exists in workspace
    return this.commentRepository.find({
      where: { taskId },
      relations: { author: true },
      order: { createdAt: 'ASC' },
    });
  }

  async addComment(
    workspaceId: string,
    taskId: string,
    text: string,
    authorId: string,
    role?: WorkspaceRole,
  ): Promise<Comment> {
    const task = await this.tasksService.getTask(workspaceId, taskId, authorId, role);
    await this.tasksService.checkProjectActive(task.projectId);

    const comment = this.commentRepository.create({
      text: text.trim(),
      taskId,
      authorId,
    });

    const saved = await this.commentRepository.save(comment);

    // Log Activity
    await this.activityLogsService.logActivity(taskId, authorId, 'COMMENT_ADDED', `Comment posted by author`);

    // Notify assignee and reporter
    const notifyUsers = new Set<string>();
    if (task.assigneeId && task.assigneeId !== authorId) {
      notifyUsers.add(task.assigneeId);
    }
    if (task.reporterId && task.reporterId !== authorId) {
      notifyUsers.add(task.reporterId);
    }

    for (const userId of notifyUsers) {
      await this.notificationsService.createNotification(
        userId,
        workspaceId,
        `New comment added on your task: ${task.title}`,
        'COMMENT_ADDED',
        task.id,
      );
    }

    this.eventsGateway.emitTaskUpdated(workspaceId, { type: 'COMMENT_ADD', taskId, comment: saved });

    return this.commentRepository.findOne({ where: { id: saved.id }, relations: { author: true } }) as Promise<Comment>;
  }

  async editComment(workspaceId: string, commentId: string, text: string, authorId: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const task = await this.tasksService.getTask(workspaceId, comment.taskId);
    await this.tasksService.checkProjectActive(task.projectId);

    if (comment.authorId !== authorId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    comment.text = text.trim();
    const saved = await this.commentRepository.save(comment);

    this.eventsGateway.emitTaskUpdated(workspaceId, { type: 'COMMENT_EDIT', taskId: task.id, comment: saved });

    return this.commentRepository.findOne({ where: { id: saved.id }, relations: { author: true } }) as Promise<Comment>;
  }

  async deleteComment(workspaceId: string, commentId: string, userId: string, role: WorkspaceRole): Promise<void> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const task = await this.tasksService.getTask(workspaceId, comment.taskId);
    await this.tasksService.checkProjectActive(task.projectId);

    // ADMIN can delete any comment, others only their own
    if (role !== WorkspaceRole.ADMIN && comment.authorId !== userId) {
      throw new ForbiddenException('Only admins or the comment author can delete comments');
    }

    await this.commentRepository.remove(comment);

    this.eventsGateway.emitTaskUpdated(workspaceId, { type: 'COMMENT_DELETE', taskId: task.id, commentId });
  }
}
