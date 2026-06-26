import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { TaskStatus } from '@/types/enum';

export class MoveTaskDto {
  @ApiProperty({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS, description: 'New status level of the task' })
  @IsEnum(TaskStatus)
  @IsNotEmpty({ message: 'Status is required' })
  status: TaskStatus;

  @ApiProperty({ example: 1, description: 'New order of the task in the list' })
  @IsInt()
  @IsNotEmpty({ message: 'Order is required' })
  order: number;
}
