import { Controller, Get, Post, Patch, Delete, Body, UseGuards, Request, Param, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { WorkspaceRolesGuard } from '../../core/guards/workspace-roles.guard';
import { WorkspaceRoles } from '../../core/decorators/roles.decorator';
import { WorkspaceRole } from '@/types/enum';
import { CommentsService } from './comments.service';

@Controller()
@UseGuards(JwtAuthGuard, WorkspaceRolesGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('workspaces/:workspaceId/tasks/:taskId/comments')
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER, WorkspaceRole.MEMBER)
  async getComments(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Request() req,
  ) {
    const role = req.workspaceMember.role;
    return this.commentsService.getComments(workspaceId, taskId, req.user.id, role);
  }

  @Post('workspaces/:workspaceId/tasks/:taskId/comments')
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER, WorkspaceRole.MEMBER)
  async addComment(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Body('text') text: string,
    @Request() req,
  ) {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      throw new BadRequestException('Comment text is required');
    }
    const role = req.workspaceMember.role;
    return this.commentsService.addComment(workspaceId, taskId, text, req.user.id, role);
  }

  @Patch('workspaces/:workspaceId/comments/:commentId')
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER, WorkspaceRole.MEMBER)
  async editComment(
    @Param('workspaceId') workspaceId: string,
    @Param('commentId') commentId: string,
    @Body('text') text: string,
    @Request() req,
  ) {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      throw new BadRequestException('Comment text is required');
    }
    return this.commentsService.editComment(workspaceId, commentId, text, req.user.id);
  }

  @Delete('workspaces/:workspaceId/comments/:commentId')
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER, WorkspaceRole.MEMBER)
  async deleteComment(
    @Param('workspaceId') workspaceId: string,
    @Param('commentId') commentId: string,
    @Request() req,
  ) {
    const role = req.workspaceMember.role;
    await this.commentsService.deleteComment(workspaceId, commentId, req.user.id, role);
    return { message: 'Comment deleted successfully' };
  }
}
