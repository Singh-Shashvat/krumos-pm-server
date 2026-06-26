import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { Workspace } from '../../database/entities/workspace.entity';
import { WorkspaceMember } from '../../database/entities/workspace-member.entity';
import { Project } from '../../database/entities/project.entity';
import { Task } from '../../database/entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace, WorkspaceMember, Project, Task])],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
