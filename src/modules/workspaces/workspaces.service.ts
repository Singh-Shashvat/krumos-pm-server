import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource,Repository, In } from 'typeorm';
import { Workspace } from '../../database/entities/workspace.entity';
import { WorkspaceMember, WorkspaceRole } from '../../database/entities/workspace-member.entity';
import { Project } from '../../database/entities/project.entity';
import { Task } from '../../database/entities/task.entity';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly dataSource : DataSource,

    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async findByUserId(userId: string): Promise<Workspace[]> {
    const memberships = await this.memberRepository.find({
      where: { userId },
      relations: { workspace: true },
    });
    return memberships
      .filter((m) => m.workspace)
      .map((m) => m.workspace);
  }

  async findById(id: string): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findOne({ where: { id } });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    return workspace;
  }

  async findBySlug(slug: string): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findOne({ where: { slug: slug.toLowerCase() } });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    return workspace;
  }

  async createWorkspace(name: string, userId: string): Promise<Workspace> {
    // Generate unique slug
    let baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    if (!baseSlug) {
      baseSlug = 'workspace';
    }

    let slug = baseSlug;
    let exists = await this.workspaceRepository.findOne({ where: { slug } });
    while (exists) {
      const suffix = Math.random().toString(36).substring(2, 6);
      slug = `${baseSlug}-${suffix}`;
      exists = await this.workspaceRepository.findOne({ where: { slug } });
    }
    return this.dataSource.transaction(async (manager)=> {
      const workspace = manager.create(Workspace,{
        name:name.trim(),
        slug,
      });

      const savedWorkspace = await manager.save(workspace)

      const member = manager.create(WorkspaceMember,{
        workspaceId: savedWorkspace.id,
        userId,
        role: WorkspaceRole.ADMIN,
      });

      await manager.save(member);
      return savedWorkspace;
    })
    // // Save Workspace
    // const workspace = this.workspaceRepository.create({
    //   name: name.trim(),
    //   slug,
    // });
    // const savedWorkspace = await this.workspaceRepository.save(workspace);

    // // Add User as ADMIN
    // const member = this.memberRepository.create({
    //   userId,
    //   workspaceId: savedWorkspace.id,
    //   role: WorkspaceRole.ADMIN,
    // });
    // await this.memberRepository.save(member);

    // return savedWorkspace;
  }

  async updateWorkspace(workspaceId: string, name: string, logo?: string): Promise<Workspace> {
    const workspace = await this.findById(workspaceId);
    workspace.name = name.trim();
    if (logo !== undefined) {
      workspace.logo = logo;
    }
    return this.workspaceRepository.save(workspace);
  }

  async deleteWorkspace(workspaceId: string, confirmName: string): Promise<void> {
    
    await this.dataSource.transaction(async (manager) =>{
      const workspace = await manager.findOne(Workspace, {where: { id : workspaceId},relations:{members:true}});
      if(!workspace){
        throw new NotFoundException("workspace not found");
      }

      if (workspace.name.toLowerCase() !== confirmName.trim().toLowerCase()) {
        throw new ForbiddenException("Confirm name does not match workspace name");
      }
      const projects = await manager.find(Project,{where:{workspaceId}});
      const projectIds = projects.map((p)=>p.id);

      if(projectIds.length > 0){
        await manager.softDelete(Task,{projectId:In(projectIds)})
      
      await manager.softDelete(Project,{workspaceId});
      }
      await manager.softRemove(workspace);
    })
    // Soft-delete all tasks of all projects within the workspace
    // const projects = await this.projectRepository.find({ where: { workspaceId } });
    // const projectIds = projects.map((p) => p.id);
    // if (projectIds.length > 0) {
    //   await this.taskRepository.softDelete({ projectId: In(projectIds) });
    //   await this.projectRepository.softDelete({ workspaceId });
    // }

    // await this.workspaceRepository.softRemove(workspace);
  }
}
