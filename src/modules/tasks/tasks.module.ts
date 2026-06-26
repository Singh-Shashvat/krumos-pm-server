import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from '../../database/entities/task.entity';
import { Project } from '../../database/entities/project.entity';
import { Comment } from '../../database/entities/comment.entity';
import { WorkspaceMember } from '../../database/entities/workspace-member.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      Project,
      Comment,
      WorkspaceMember,
    ]),
    NotificationsModule,
    forwardRef(() => ActivityLogsModule),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
