import { ProjectStatus } from '@/types/enum';
import { UserSummaryDto } from '../../users/dto/user-summary.dto';

export class ProjectResponseDto {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  workspaceId: string;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  activeTasksCount?: number;
  creator?: UserSummaryDto | null;
}
