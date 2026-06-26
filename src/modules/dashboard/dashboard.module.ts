import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Task } from '../../database/entities/task.entity';
import { Project } from '../../database/entities/project.entity';
import { ActivityLog } from '../../database/entities/activity-log.entity';
import { WorkspaceMember } from '../../database/entities/workspace-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Project, ActivityLog, WorkspaceMember]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
