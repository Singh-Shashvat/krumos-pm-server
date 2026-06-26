import { Controller, Get, Post, Patch, UseGuards, Request, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { WorkspaceRolesGuard } from '../../core/guards/workspace-roles.guard';
import { WorkspaceRoles } from '../../core/decorators/roles.decorator';
import { WorkspaceRole } from '../../database/entities/workspace-member.entity';

@Controller('workspaces/:workspaceId/notifications')
@UseGuards(JwtAuthGuard, WorkspaceRolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER, WorkspaceRole.MEMBER)
  async getNotifications(
    @Param('workspaceId') workspaceId: string,
    @Request() req,
  ) {
    return this.notificationsService.listNotifications(req.user.id, workspaceId);
  }

  @Patch(':notificationId/read')
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER, WorkspaceRole.MEMBER)
  async read(
    @Param('workspaceId') workspaceId: string,
    @Param('notificationId') notificationId: string,
    @Request() req,
  ) {
    return this.notificationsService.markAsRead(req.user.id, workspaceId, notificationId);
  }

  @Post('read-all')
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER, WorkspaceRole.MEMBER)
  async readAll(
    @Param('workspaceId') workspaceId: string,
    @Request() req,
  ) {
    await this.notificationsService.markAllAsRead(req.user.id, workspaceId);
    return { message: 'All notifications marked as read' };
  }

  @Post('trigger-reminders')
  @WorkspaceRoles(WorkspaceRole.ADMIN)
  async triggerReminders() {
    await this.notificationsService.runDueRemindersAndCleanup();
    return { message: 'Due reminders and cleanup triggered successfully' };
  }
}
