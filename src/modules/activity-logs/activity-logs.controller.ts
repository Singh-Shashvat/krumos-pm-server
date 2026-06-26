import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { WorkspaceRolesGuard } from '../../core/guards/workspace-roles.guard';
import { WorkspaceRoles } from '../../core/decorators/roles.decorator';
import { WorkspaceRole } from '@/types/enum';
import { ActivityLogsService } from './activity-logs.service';
import { TasksService } from '../tasks/tasks.service';

@Controller()
@UseGuards(JwtAuthGuard, WorkspaceRolesGuard)
export class ActivityLogsController {
  constructor(
    private readonly activityLogsService: ActivityLogsService,
    private readonly tasksService: TasksService,
  ) {}

  @Get('workspaces/:workspaceId/tasks/:taskId/logs')
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER, WorkspaceRole.MEMBER)
  async getLogs(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Request() req,
  ) {
    const role = req.workspaceMember.role;
    // Verify task exists and performer is authorized to access it
    await this.tasksService.getTask(workspaceId, taskId, req.user.id, role);
    return this.activityLogsService.getActivityLogs(taskId);
  }
}
