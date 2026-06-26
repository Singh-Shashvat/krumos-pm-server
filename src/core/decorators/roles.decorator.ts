import { SetMetadata } from '@nestjs/common';
import { WorkspaceRole } from '@/types/enum';

export const ROLES_KEY = 'workspace_roles';
export const WorkspaceRoles = (...roles: WorkspaceRole[]) => SetMetadata(ROLES_KEY, roles);
