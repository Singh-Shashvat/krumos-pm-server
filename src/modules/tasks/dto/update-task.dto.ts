import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from '@/types/enum';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiProperty({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS, description: 'Updated status of the task', required: false })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
