import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../../database/entities/activity-log.entity';

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly logRepository: Repository<ActivityLog>,
  ) {}

  async logActivity(
    taskId: string,
    performerId: string,
    eventType: string,
    description: string,
    oldValue?: string,
    newValue?: string,
  ): Promise<ActivityLog> {
    const log = this.logRepository.create({
      taskId,
      performerId,
      eventType,
      description,
      oldValue: oldValue || null,
      newValue: newValue || null,
    });
    return this.logRepository.save(log);
  }

  async getActivityLogs(taskId: string): Promise<ActivityLog[]> {
    return this.logRepository.find({
      where: { taskId },
      relations: { performer: true },
      order: { createdAt: 'DESC' },
    });
  }
}
