import { Task } from '../../../database/entities/task.entity';
import { TaskResponseDto } from '../dto/task-response.dto';
import { UserMapper } from '../../users/mappers/user.mapper';

export class TaskMapper {
  static toResponseDto(task: Task, commentsCount?: number): TaskResponseDto {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      order: task.order,
      projectId: task.projectId,
      assigneeId: task.assigneeId,
      reporterId: task.reporterId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      commentsCount,
      assignee: task.assignee ? UserMapper.toSummaryDto(task.assignee) : null,
      reporter: task.reporter ? UserMapper.toSummaryDto(task.reporter) : null,
      project: task.project ? { id: task.project.id, name: task.project.name } : null,
    };
  }
}
