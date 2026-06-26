import { Controller, Get, Post, Patch, Delete, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { WorkspaceRolesGuard } from '../../core/guards/workspace-roles.guard';
import { WorkspaceRoles } from '../../core/decorators/roles.decorator';
import { WorkspaceRole, TaskStatus, TaskPriority } from '@/types/enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { TaskMapper } from './mappers/task.mapper';

@Controller()
@UseGuards(JwtAuthGuard, WorkspaceRolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('workspaces/:workspaceId/projects/:projectId/tasks')
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER, WorkspaceRole.MEMBER)
  async list(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Request() req,
    @Query('assigneeId') assigneeId?: string,
    @Query('priority') priority?: TaskPriority,
    @Query('dueFilter') dueFilter?: string,
  ) {
    const role = req.workspaceMember.role;
    const forcedAssigneeId = role === WorkspaceRole.MEMBER ? req.user.id : assigneeId;
    const tasks = await this.tasksService.listTasks(workspaceId, projectId, { assigneeId: forcedAssigneeId, priority, dueFilter });
    return tasks.map((task) => TaskMapper.toResponseDto(task, task.commentsCount));
  }

  @Get('workspaces/:workspaceId/tasks/:taskId')
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER, WorkspaceRole.MEMBER)
  async get(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Request() req,
  ) {
    const role = req.workspaceMember.role;
    const task = await this.tasksService.getTask(workspaceId, taskId, req.user.id, role);
    return TaskMapper.toResponseDto(task);
  }

  @Post('workspaces/:workspaceId/projects/:projectId/tasks')
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER)
  async create(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Body() createTaskDto: CreateTaskDto,
    @Request() req,
  ) {
    const task = await this.tasksService.createTask(workspaceId, projectId, createTaskDto.title.trim(), req.user.id, {
      description: createTaskDto.description,
      priority: createTaskDto.priority,
      assigneeId: createTaskDto.assigneeId,
      dueDate: createTaskDto.dueDate,
    });
    return TaskMapper.toResponseDto(task);
  }

  @Patch('workspaces/:workspaceId/tasks/:taskId')
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER, WorkspaceRole.MEMBER)
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req,
  ) {
    const role = req.workspaceMember.role;
    if (updateTaskDto.title) {
      updateTaskDto.title = updateTaskDto.title.trim();
    }
    const task = await this.tasksService.updateTask(workspaceId, taskId, req.user.id, role, updateTaskDto);
    return TaskMapper.toResponseDto(task);
  }

  @Patch('workspaces/:workspaceId/tasks/:taskId/move')
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER, WorkspaceRole.MEMBER)
  async move(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Body() moveTaskDto: MoveTaskDto,
    @Request() req,
  ) {
    const role = req.workspaceMember.role;
    const task = await this.tasksService.moveTask(workspaceId, taskId, moveTaskDto.status, moveTaskDto.order, req.user.id, role);
    return TaskMapper.toResponseDto(task);
  }

  @Delete('workspaces/:workspaceId/tasks/:taskId')
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER)
  async delete(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
  ) {
    await this.tasksService.deleteTask(workspaceId, taskId);
    return { message: 'Task deleted successfully' };
  }
}
