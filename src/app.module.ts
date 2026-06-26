import { Module } from '@nestjs/common';
import { ConfigModule } from './core/config/config.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { AuthModule } from './modules/auth/auth.module';
import { EventsModule } from './modules/events/events.module';
import { EmailModule } from './modules/email/email.module';
import { MembersModule } from './modules/members/members.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CommentsModule } from './modules/comments/comments.module';
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    UsersModule,
    WorkspacesModule,
    AuthModule,
    EventsModule,
    EmailModule,
    MembersModule,
    ProjectsModule,
    TasksModule,
    NotificationsModule,
    DashboardModule,
    CommentsModule,
    ActivityLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
