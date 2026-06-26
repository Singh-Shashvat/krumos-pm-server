import { UserSummaryDto } from '../../users/dto/user-summary.dto';

export class RecentActivityResponseDto {
  id: string;
  eventType: string;
  description: string;
  createdAt: Date;
  performer: UserSummaryDto | null;
  task: { id: string; title: string } | null;
}
