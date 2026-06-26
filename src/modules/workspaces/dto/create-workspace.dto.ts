import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'My Workspace', description: 'Name of the workspace' })
  @IsString()
  @IsNotEmpty({ message: 'Workspace name is required and cannot be empty' })
  name: string;
}
