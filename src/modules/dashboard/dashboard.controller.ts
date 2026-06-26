import { Controller, Get, UseGuards, Request, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { WorkspaceRolesGuard } from '../../core/guards/workspace-roles.guard';
import { WorkspaceRoles } from '../../core/decorators/roles.decorator';
import { WorkspaceRole } from '../../database/entities/workspace-member.entity';

@Controller('workspaces/:workspaceId/dashboard')
@UseGuards(JwtAuthGuard, WorkspaceRolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER, WorkspaceRole.MEMBER)
  async getSummary(
    @Param('workspaceId') workspaceId: string,
    @Request() req,
  ) {
    return this.dashboardService.getDashboardSummary(workspaceId, req.user.id);
  }

  @Get('analytics')
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER)
  async getAnalytics(@Param('workspaceId') workspaceId: string) {
    return this.dashboardService.getDashboardAnalytics(workspaceId);
  }
}
