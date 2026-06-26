import { Controller, Get, Post, Patch, Delete, Body, UseGuards, Request, Param, BadRequestException } from '@nestjs/common';
import { MembersService } from './members.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { WorkspaceRolesGuard } from '../../core/guards/workspace-roles.guard';
import { WorkspaceRoles } from '../../core/decorators/roles.decorator';
import { WorkspaceRole } from '../../database/entities/workspace-member.entity';

@Controller()
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get('workspaces/:workspaceId/members')
  @UseGuards(WorkspaceRolesGuard)
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER, WorkspaceRole.MEMBER)
  async getMembers(@Param('workspaceId') workspaceId: string) {
    return this.membersService.listMembers(workspaceId);
  }

  @Post('workspaces/:workspaceId/invitations')
  @UseGuards(WorkspaceRolesGuard)
  @WorkspaceRoles(WorkspaceRole.ADMIN)
  async invite(
    @Param('workspaceId') workspaceId: string,
    @Body('email') email: string,
    @Body('role') role: WorkspaceRole,
    @Request() req,
  ) {
    if (!email || !role) {
      throw new BadRequestException('Email and role are required');
    }
    return this.membersService.inviteMember(workspaceId, email, role, req.user.id);
  }

  @Get('workspaces/:workspaceId/invitations')
  @UseGuards(WorkspaceRolesGuard)
  @WorkspaceRoles(WorkspaceRole.ADMIN)
  async getPendingInvites(@Param('workspaceId') workspaceId: string) {
    return this.membersService.getPendingInvitations(workspaceId);
  }

  @Delete('workspaces/:workspaceId/invitations/:invitationId')
  @UseGuards(WorkspaceRolesGuard)
  @WorkspaceRoles(WorkspaceRole.ADMIN)
  async revoke(
    @Param('workspaceId') workspaceId: string,
    @Param('invitationId') invitationId: string,
  ) {
    await this.membersService.revokeInvitation(workspaceId, invitationId);
    return { message: 'Invitation revoked successfully' };
  }

  @Post('auth/accept-invite')
  async acceptInvite(@Body('token') token: string, @Request() req) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }
    return this.membersService.acceptInvitation(token, req.user.id);
  }

  @Patch('workspaces/:workspaceId/members/:memberId')
  @UseGuards(WorkspaceRolesGuard)
  @WorkspaceRoles(WorkspaceRole.ADMIN)
  async changeRole(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body('role') role: WorkspaceRole,
  ) {
    if (!role) {
      throw new BadRequestException('Role is required');
    }
    return this.membersService.changeMemberRole(workspaceId, memberId, role);
  }

  @Delete('workspaces/:workspaceId/members/:memberId')
  @UseGuards(WorkspaceRolesGuard)
  @WorkspaceRoles(WorkspaceRole.ADMIN)
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
  ) {
    await this.membersService.removeMember(workspaceId, memberId);
    return { message: 'Member removed from workspace' };
  }
}
