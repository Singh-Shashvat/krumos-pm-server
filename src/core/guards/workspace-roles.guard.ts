import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { WorkspaceRole, WorkspaceMember } from '../../database/entities/workspace-member.entity';
import { Workspace } from '../../database/entities/workspace.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class WorkspaceRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required on the endpoint, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.id) {
      throw new UnauthorizedException('Authentication is required to perform this action');
    }

    // Resolve workspaceId or slug from request context
    let workspaceId =
      request.params?.workspaceId ||
      request.query?.workspaceId ||
      request.body?.workspaceId ||
      request.headers?.['x-workspace-id'];

    const slug = request.params?.slug || request.query?.slug || request.body?.slug;

    // Resolve workspaceId via slug if needed
    if (!workspaceId && slug) {
      const workspaceRepo = this.dataSource.getRepository(Workspace);
      const ws = await workspaceRepo.findOne({ where: { slug: slug.toLowerCase() } });
      if (ws) {
        workspaceId = ws.id;
        request.workspace = ws;
      }
    }

    if (!workspaceId) {
      throw new ForbiddenException('Workspace context (ID or slug) is required for this route');
    }

    // Check membership and role
    const memberRepo = this.dataSource.getRepository(WorkspaceMember);
    const member = await memberRepo.findOne({
      where: { userId: user.id, workspaceId },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const hasRole = requiredRoles.includes(member.role);
    if (!hasRole) {
      throw new ForbiddenException(`Unauthorized. Required role: ${requiredRoles.join(' or ')}`);
    }

    // Attach verified details to request
    request.workspaceMember = member;
    request.workspaceId = workspaceId;

    return true;
  }
}
