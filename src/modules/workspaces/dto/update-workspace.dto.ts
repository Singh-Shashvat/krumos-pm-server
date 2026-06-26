import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateWorkspaceDto {
  @ApiProperty({ example: 'My Updated Workspace', description: 'Updated name of the workspace' })
  @IsString()
  @IsNotEmpty({ message: 'Workspace name is required and cannot be empty' })
  name: string;

  @ApiProperty({ example: 'https://example.com/logo.png', description: 'URL of workspace logo', required: false })
  @IsString()
  @IsOptional()
  logo?: string;
}
