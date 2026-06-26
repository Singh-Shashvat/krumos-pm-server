import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual } from 'typeorm';
import { Task } from '../../database/entities/task.entity';
import { TaskStatus } from '@/types/enum';
import { Project } from '../../database/entities/project.entity';
import { ActivityLog } from '../../database/entities/activity-log.entity';
import { WorkspaceMember } from '../../database/entities/workspace-member.entity';
import { TaskMapper } from '../tasks/mappers/task.mapper';
import { DashboardMapper } from './mappers/dashboard.mapper';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ActivityLog)
    private readonly logRepository: Repository<ActivityLog>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
  ) {}

  async getDashboardSummary(workspaceId: string, userId: string): Promise<any> {
    // 1. Task Summary Strip
    const taskCounts = await this.taskRepository.createQueryBuilder('task')
      .innerJoin('task.project', 'project')
      .select('task.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('project.workspaceId = :workspaceId', { workspaceId })
      .andWhere('project.deletedAt IS NULL')
      .groupBy('task.status')
      .getRawMany();

    const summaryStrip = {
      TO_DO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
    };
    taskCounts.forEach((row) => {
      if (summaryStrip[row.status] !== undefined) {
        summaryStrip[row.status] = parseInt(row.count, 10);
      }
    });

    // 2. My Tasks (assigned to user in workspace, sorted by dueDate)
    const myTasks = await this.taskRepository.find({
      where: {
        assigneeId: userId,
        project: { workspaceId },
      },
      relations: { project: true },
      order: { dueDate: 'ASC', createdAt: 'DESC' },
    });

    // 3. Recent Activity (last 20 logs)
    const recentActivity = await this.logRepository.find({
      where: {
        task: { project: { workspaceId } },
      },
      relations: { task: true, performer: true },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return {
      summaryStrip,
      myTasks: myTasks.map((task) => TaskMapper.toResponseDto(task)),
      recentActivity: recentActivity.map((log) => DashboardMapper.toRecentActivityDto(log)),
    };
  }

  async getDashboardAnalytics(workspaceId: string): Promise<any> {
    // 1. Tasks by Project
    const projects = await this.projectRepository.find({
      where: { workspaceId },
      relations: { tasks: true },
    });

    const tasksByProject = projects.map((p) => {
      const counts = { TO_DO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
      if (p.tasks) {
        p.tasks.forEach((t) => {
          if (counts[t.status] !== undefined) {
            counts[t.status]++;
          }
        });
      }
      return {
        projectId: p.id,
        projectName: p.name,
        ...counts,
      };
    });

    // 2. Team Workload
    const members = await this.memberRepository.find({
      where: { workspaceId },
      relations: { user: true },
    });

    // Start of current week (Monday)
    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const teamWorkload = await Promise.all(
      members.map(async (m) => {
        // Open tasks
        const openTasksCount = await this.taskRepository.count({
          where: {
            assigneeId: m.userId,
            project: { workspaceId },
            status: In([TaskStatus.TO_DO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW]),
          },
        });

        // Completed this week
        const completedThisWeekCount = await this.taskRepository.count({
          where: {
            assigneeId: m.userId,
            project: { workspaceId },
            status: TaskStatus.DONE,
            updatedAt: MoreThanOrEqual(startOfWeek),
          },
        });

        return {
          memberId: m.id,
          userId: m.userId,
          name: m.user?.name || 'Former Member',
          picture: m.user?.picture || '',
          role: m.role,
          openTasksCount,
          completedThisWeekCount,
        };
      }),
    );

    return {
      tasksByProject,
      teamWorkload,
    };
  }
}
