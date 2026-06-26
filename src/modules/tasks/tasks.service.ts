import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../../database/entities/task.entity';
import { Project } from '../../database/entities/project.entity';
import { Comment } from '../../database/entities/comment.entity';
import { WorkspaceMember } from '../../database/entities/workspace-member.entity';
import { TaskStatus, TaskPriority, ProjectStatus, WorkspaceRole } from '@/types/enum';
import { EventsGateway } from '../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
    private readonly notificationsService: NotificationsService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async checkProjectActive(projectId: string): Promise<void> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.status === ProjectStatus.ARCHIVED) {
      throw new BadRequestException('Cannot modify tasks in an archived project');
    }
  }

  async listTasks(
    workspaceId: string,
    projectId: string,
    queryFilters?: { assigneeId?: string; priority?: TaskPriority; dueFilter?: string },
  ): Promise<any[]> {
    const project = await this.projectRepository.findOne({ where: { id: projectId, workspaceId } });
    if (!project) {
      throw new NotFoundException('Project not found in this workspace');
    }

    const whereClause: any = { projectId };

    if (queryFilters?.assigneeId) {
      whereClause.assigneeId = queryFilters.assigneeId;
    }
    if (queryFilters?.priority) {
      whereClause.priority = queryFilters.priority;
    }

    const tasks = await this.taskRepository.find({
      where: whereClause,
      relations: { assignee: true, reporter: true },
      order: { order: 'ASC', createdAt: 'DESC' },
    });

    const now = new Date();
    let filteredTasks = tasks;

    if (queryFilters?.dueFilter === 'today') {
      filteredTasks = tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate).toDateString() === now.toDateString(),
      );
    } else if (queryFilters?.dueFilter === 'week') {
      const oneWeek = new Date();
      oneWeek.setDate(now.getDate() + 7);
      filteredTasks = tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= oneWeek,
      );
    } else if (queryFilters?.dueFilter === 'overdue') {
      filteredTasks = tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== TaskStatus.DONE,
      );
    }

    return Promise.all(
      filteredTasks.map(async (task) => {
        const commentsCount = await this.commentRepository.count({ where: { taskId: task.id } });
        return { ...task, commentsCount };
      }),
    );
  }

  async getTask(
    workspaceId: string,
    taskId: string,
    performerId?: string,
    performerRole?: WorkspaceRole,
  ): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: { project: true, assignee: true, reporter: true },
    });

    if (!task || task.project.workspaceId !== workspaceId) {
      throw new NotFoundException('Task not found in this workspace');
    }

    if (performerRole === WorkspaceRole.MEMBER && performerId && task.assigneeId !== performerId) {
      throw new ForbiddenException('Members can only access tasks assigned to them');
    }

    return task;
  }

  async createTask(
    workspaceId: string,
    projectId: string,
    title: string,
    creatorId: string,
    data: {
      description?: string;
      priority?: TaskPriority;
      assigneeId?: string;
      dueDate?: Date;
    },
  ): Promise<Task> {
    await this.checkProjectActive(projectId);

    // Get max order in TO_DO column
    const maxTask = await this.taskRepository.findOne({
      where: { projectId, status: TaskStatus.TO_DO },
      order: { order: 'DESC' },
    });
    const order = maxTask ? maxTask.order + 1000 : 1000;

    const task = this.taskRepository.create({
      title: title.trim(),
      description: data.description?.trim() || null,
      priority: data.priority || TaskPriority.MEDIUM,
      status: TaskStatus.TO_DO,
      order,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      projectId,
      assigneeId: data.assigneeId || null,
      reporterId: creatorId,
    });

    const savedTask = await this.taskRepository.save(task);

    // Log Activity
    await this.activityLogsService.logActivity(savedTask.id, creatorId, 'TASK_CREATED', `Task created by reporter`);

    // Assignee Notification
    if (savedTask.assigneeId) {
      await this.notificationsService.createNotification(
        savedTask.assigneeId,
        workspaceId,
        `You have been assigned a new task: ${savedTask.title}`,
        'TASK_ASSIGNED',
        savedTask.id,
      );
    }

    // Broadcast Socket Event
    this.eventsGateway.emitTaskUpdated(workspaceId, { type: 'CREATE', task: savedTask });

    return this.getTask(workspaceId, savedTask.id);
  }

  async updateTask(
    workspaceId: string,
    taskId: string,
    performerId: string,
    performerRole: WorkspaceRole,
    updates: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string;
      dueDate?: Date;
    },
  ): Promise<Task> {
    const task = await this.getTask(workspaceId, taskId);
    await this.checkProjectActive(task.projectId);

    // Guard: MEMBER can only update status of tasks assigned to them
    if (performerRole === WorkspaceRole.MEMBER) {
      if (task.assigneeId !== performerId) {
        throw new ForbiddenException('Members can only modify tasks assigned to them');
      }

      const hasOtherUpdates =
        (updates.title !== undefined && updates.title !== task.title) ||
        (updates.description !== undefined && updates.description !== task.description) ||
        (updates.priority !== undefined && updates.priority !== task.priority) ||
        (updates.assigneeId !== undefined && updates.assigneeId !== task.assigneeId) ||
        (updates.dueDate !== undefined &&
          (task.dueDate ? new Date(task.dueDate).getTime() : 0) !==
            (updates.dueDate ? new Date(updates.dueDate).getTime() : 0));

      if (hasOtherUpdates) {
        throw new ForbiddenException('Members are only allowed to update the status of their tasks');
      }
    }

    const oldTitle = task.title;
    const oldDesc = task.description;
    const oldStatus = task.status;
    const oldPriority = task.priority;
    const oldAssignee = task.assigneeId;
    const oldDueDate = task.dueDate ? new Date(task.dueDate).toISOString() : null;

    if (updates.title && updates.title.trim() !== task.title) {
      task.title = updates.title.trim();
      await this.activityLogsService.logActivity(task.id, performerId, 'TITLE_CHANGED', `Title updated`, oldTitle, task.title);
    }

    if (updates.description !== undefined && updates.description !== task.description) {
      task.description = updates.description || null;
      await this.activityLogsService.logActivity(task.id, performerId, 'DESCRIPTION_CHANGED', `Description updated`, oldDesc || undefined, task.description || undefined);
    }

    if (updates.status && updates.status !== task.status) {
      task.status = updates.status;
      await this.activityLogsService.logActivity(task.id, performerId, 'STATUS_CHANGED', `Status changed to ${task.status}`, oldStatus, task.status);
    }

    if (updates.priority && updates.priority !== task.priority) {
      task.priority = updates.priority;
      await this.activityLogsService.logActivity(task.id, performerId, 'PRIORITY_CHANGED', `Priority changed to ${task.priority}`, oldPriority, task.priority);
    }

    if (updates.dueDate !== undefined) {
      task.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
      const newDueStr = task.dueDate ? task.dueDate.toISOString() : null;
      if (oldDueDate !== newDueStr) {
        await this.activityLogsService.logActivity(task.id, performerId, 'DUE_DATE_CHANGED', `Due date updated`, oldDueDate || undefined, newDueStr || undefined);
      }
    }

    if (updates.assigneeId !== undefined && updates.assigneeId !== task.assigneeId) {
      task.assigneeId = updates.assigneeId || null;
      await this.activityLogsService.logActivity(task.id, performerId, 'ASSIGNEE_CHANGED', `Assignee updated`, oldAssignee || undefined, task.assigneeId || undefined);

      if (task.assigneeId && task.assigneeId !== performerId) {
        await this.notificationsService.createNotification(
          task.assigneeId,
          workspaceId,
          `You have been assigned the task: ${task.title}`,
          'TASK_ASSIGNED',
          task.id,
        );
      }
    }

    const savedTask = await this.taskRepository.save(task);

    this.eventsGateway.emitTaskUpdated(workspaceId, { type: 'UPDATE', task: savedTask });

    return this.getTask(workspaceId, savedTask.id);
  }

  async moveTask(
    workspaceId: string,
    taskId: string,
    status: TaskStatus,
    order: number,
    performerId: string,
    performerRole: WorkspaceRole,
  ): Promise<Task> {
    const task = await this.getTask(workspaceId, taskId);
    await this.checkProjectActive(task.projectId);

    // Guard: MEMBER can only update tasks assigned to them
    if (performerRole === WorkspaceRole.MEMBER && task.assigneeId !== performerId) {
      throw new ForbiddenException('Members can only move tasks assigned to them');
    }

    const oldStatus = task.status;
    task.status = status;
    task.order = order;

    const saved = await this.taskRepository.save(task);

    if (oldStatus !== status) {
      await this.activityLogsService.logActivity(task.id, performerId, 'STATUS_CHANGED', `Status changed to ${status}`, oldStatus, status);
    }

    this.eventsGateway.emitTaskUpdated(workspaceId, { type: 'MOVE', task: saved });

    return this.getTask(workspaceId, saved.id);
  }

  async deleteTask(workspaceId: string, taskId: string): Promise<void> {
    const task = await this.getTask(workspaceId, taskId);
    await this.checkProjectActive(task.projectId);

    await this.taskRepository.softRemove(task);

    this.eventsGateway.emitTaskUpdated(workspaceId, { type: 'DELETE', taskId });
  }
}
