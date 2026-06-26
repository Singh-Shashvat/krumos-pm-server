import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'My Project', description: 'Name of the project' })
  @IsString()
  @IsNotEmpty({ message: 'Project name is required' })
  name: string;

  @ApiProperty({ example: 'Project description details', description: 'Description of the project', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
