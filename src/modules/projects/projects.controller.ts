import { Controller, Get, Post, Patch, Delete, Body, UseGuards, Request, Param, BadRequestException, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { WorkspaceRolesGuard } from '../../core/guards/workspace-roles.guard';
import { WorkspaceRoles } from '../../core/decorators/roles.decorator';
import { WorkspaceRole, ProjectStatus } from '@/types/enum';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { ProjectMapper } from './mappers/project.mapper';

@Controller('workspaces/:workspaceId/projects')
@UseGuards(JwtAuthGuard, WorkspaceRolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER, WorkspaceRole.MEMBER)
  async list(
    @Param('workspaceId') workspaceId: string,
    @Query('status') status?: ProjectStatus,
  ) {
    return this.projectsService.listProjects(workspaceId, status);
  }

  @Get(':projectId')
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER, WorkspaceRole.MEMBER)
  async get(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
  ) {
    const project = await this.projectsService.getProject(workspaceId, projectId);
    return ProjectMapper.toResponseDto(project);
  }

  @Post()
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER)
  async create(
    @Param('workspaceId') workspaceId: string,
    @Body() createProjectDto: CreateProjectDto,
    @Request() req,
  ) {
    const project = await this.projectsService.createProject(
      workspaceId,
      createProjectDto.name.trim(),
      createProjectDto.description ?? '',
      req.user.id,
    );
    return ProjectMapper.toResponseDto(project);
  }

  @Patch(':projectId')
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER)
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    const project = await this.projectsService.updateProject(
      workspaceId,
      projectId,
      updateProjectDto.name ? updateProjectDto.name.trim() : undefined,
      updateProjectDto.description,
    );
    return ProjectMapper.toResponseDto(project);
  }

  @Post(':projectId/archive')
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER)
  async archive(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
  ) {
    const project = await this.projectsService.setProjectStatus(workspaceId, projectId, ProjectStatus.ARCHIVED);
    return ProjectMapper.toResponseDto(project);
  }

  @Post(':projectId/activate')
  @WorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.MANAGER)
  async activate(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
  ) {
    const project = await this.projectsService.setProjectStatus(workspaceId, projectId, ProjectStatus.ACTIVE);
    return ProjectMapper.toResponseDto(project);
  }

  @Delete(':projectId')
  @WorkspaceRoles(WorkspaceRole.ADMIN)
  async delete(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Body('confirmName') confirmName: string,
  ) {
    if (!confirmName || typeof confirmName !== 'string') {
      throw new BadRequestException('Project confirmation name is required');
    }
    await this.projectsService.deleteProject(workspaceId, projectId, confirmName);
    return { message: 'Project deleted successfully' };
  }
}
