import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TaskPriority } from '@/types/enum';

export class CreateTaskDto {
  @ApiProperty({ example: 'Implement login', description: 'Title of the task' })
  @IsString()
  @IsNotEmpty({ message: 'Task title is required' })
  title: string;

  @ApiProperty({ example: 'Use Google OAuth and JWT tokens', description: 'Description of the task', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.MEDIUM, description: 'Priority level of the task', required: false })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiProperty({ example: 'uuid-string', description: 'User ID of the assignee', required: false })
  @IsString()
  @IsOptional()
  assigneeId?: string;

  @ApiProperty({ example: '2024-12-31T23:59:59.999Z', description: 'Due date of the task', required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: Date;
}
