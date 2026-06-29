import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Project } from '../../database/entities/project.entity';
import { Task } from '../../database/entities/task.entity';
import { ProjectStatus } from '../../types/enum';
import { ProjectResponseDto } from './dto/project-response.dto';
import { ProjectMapper } from './mappers/project.mapper';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async listProjects(workspaceId: string, status?: ProjectStatus): Promise<ProjectResponseDto[]> {
    const projects = await this.projectRepository.find({
      where: status ? { workspaceId, status } : { workspaceId },
      relations: { creator: true, tasks: true },
      order: { createdAt: 'DESC' },
    });

    return projects.map((p) => {
      const activeTasksCount = p.tasks ? p.tasks.filter((t) => t.status !== 'DONE').length : 0;
      return ProjectMapper.toResponseDto(p, activeTasksCount);
    });
  }

  async getProject(workspaceId: string, projectId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, workspaceId },
      relations: { creator: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found in this workspace');
    }

    return project;
  }

  async createProject(
    workspaceId: string,
    name: string,
    description: string,
    creatorId: string,
  ): Promise<Project> {
    const nameTrim = name.trim();
    // Check uniqueness within workspace
    const existing = await this.projectRepository.findOne({
      where: { name: nameTrim, workspaceId },
    });
    if (existing) {
      throw new ConflictException('A project with this name already exists in the workspace');
    }

    const project = this.projectRepository.create({
      name: nameTrim,
      description: description?.trim() || null,
      workspaceId,
      creatorId,
      status: ProjectStatus.ACTIVE,
    });

    return this.projectRepository.save(project);
  }

  async updateProject(
    workspaceId: string,
    projectId: string,
    name?: string,
    description?: string,
  ): Promise<Project> {
    const project = await this.getProject(workspaceId, projectId);

    if (name && name.trim() !== project.name) {
      const nameTrim = name.trim();
      const existing = await this.projectRepository.findOne({
        where: { name: nameTrim, workspaceId },
      });
      if (existing && existing.id !== projectId) {
        throw new ConflictException('A project with this name already exists in the workspace');
      }
      project.name = nameTrim;
    }

    if (description !== undefined) {
      project.description = description?.trim() || null;
    }

    return this.projectRepository.save(project);
  }

  async setProjectStatus(
    workspaceId: string,
    projectId: string,
    status: ProjectStatus,
  ): Promise<Project> {
    const project = await this.getProject(workspaceId, projectId);
    project.status = status;
    return this.projectRepository.save(project);
  }

  async deleteProject(workspaceId: string, projectId: string, confirmName: string): Promise<void> {
    const project = await this.getProject(workspaceId, projectId);
    if (project.name.toLowerCase() !== confirmName.trim().toLowerCase()) {
      throw new ForbiddenException('Confirmation name does not match project name');
    }

    // Soft-delete all tasks of the project
    await this.dataSource.transaction(async(manager)=>{
      await manager.softDelete(Task , {projectId,});
      await manager.softDelete(Project , projectId);
    })
  }
}
