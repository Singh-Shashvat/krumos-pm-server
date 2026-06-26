import { Controller, Get, Post, Patch, Delete, Body, UseGuards, Request, Param, BadRequestException } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { WorkspaceRolesGuard } from '../../core/guards/workspace-roles.guard';
import { WorkspaceRoles } from '../../core/decorators/roles.decorator';
import { WorkspaceRole } from '../../database/entities/workspace-member.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  async getWorkspaces(@Request() req) {
    return this.workspacesService.findByUserId(req.user.id);
  }

  @Post()
  async createWorkspace(@Body() createWorkspaceDto: CreateWorkspaceDto, @Request() req) {
    return this.workspacesService.createWorkspace(createWorkspaceDto.name.trim(), req.user.id);
  }

  @Patch(':workspaceId')
  @UseGuards(WorkspaceRolesGuard)
  @WorkspaceRoles(WorkspaceRole.ADMIN)
  async updateWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.updateWorkspace(
      workspaceId,
      updateWorkspaceDto.name.trim(),
      updateWorkspaceDto.logo,
    );
  }

  @Delete(':workspaceId')
  @UseGuards(WorkspaceRolesGuard)
  @WorkspaceRoles(WorkspaceRole.ADMIN)
  async deleteWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Body('confirmName') confirmName: string,
  ) {
    if (!confirmName || typeof confirmName !== 'string') {
      throw new BadRequestException('Workspace confirmation name is required');
    }
    await this.workspacesService.deleteWorkspace(workspaceId, confirmName);
    return { message: 'Workspace deleted successfully' };
  }
}
