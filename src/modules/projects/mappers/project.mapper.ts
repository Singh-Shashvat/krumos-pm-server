import { Project } from '../../../database/entities/project.entity';
import { ProjectResponseDto } from '../dto/project-response.dto';
import { UserMapper } from '../../users/mappers/user.mapper';

export class ProjectMapper {
  static toResponseDto(project: Project, activeTasksCount?: number): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      workspaceId: project.workspaceId,
      creatorId: project.creatorId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      activeTasksCount,
      creator: project.creator ? UserMapper.toSummaryDto(project.creator) : null,
    };
  }
}
