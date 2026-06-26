import { ActivityLog } from '../../../database/entities/activity-log.entity';
import { RecentActivityResponseDto } from '../dto/recent-activity-response.dto';
import { UserMapper } from '../../users/mappers/user.mapper';

export class DashboardMapper {
  static toRecentActivityDto(log: ActivityLog): RecentActivityResponseDto {
    return {
      id: log.id,
      eventType: log.eventType,
      description: log.description,
      createdAt: log.createdAt,
      performer: log.performer ? UserMapper.toSummaryDto(log.performer) : null,
      task: log.task ? { id: log.task.id, title: log.task.title } : null,
    };
  }
}
