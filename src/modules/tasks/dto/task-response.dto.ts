import { TaskStatus, TaskPriority } from '@/types/enum';
import { UserSummaryDto } from '../../users/dto/user-summary.dto';

export class TaskResponseDto {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  order: number;
  projectId: string;
  assigneeId: string | null;
  reporterId: string;
  createdAt: Date;
  updatedAt: Date;
  commentsCount?: number;
  assignee?: UserSummaryDto | null;
  reporter?: UserSummaryDto | null;
  project?: { id: string; name: string } | null;
}
