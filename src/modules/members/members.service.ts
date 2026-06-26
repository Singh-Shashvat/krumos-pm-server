import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { randomUUID } from 'crypto';
import { Workspace } from '../../database/entities/workspace.entity';
import { WorkspaceMember } from '../../database/entities/workspace-member.entity';
import { Invitation } from '../../database/entities/invitation.entity';
import { User } from '../../database/entities/user.entity';
import { EmailService } from '../email/email.service';
import { EnvConfig } from '../../core/config/env.config';
import { WorkspaceRole, InvitationStatus } from '@/types/enum';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly envConfig: EnvConfig,
  ) {}

  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return this.memberRepository.find({
      where: { workspaceId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
  }

  async inviteMember(
    workspaceId: string,
    email: string,
    role: WorkspaceRole,
    inviterId: string,
  ): Promise<Invitation> {
    const emailLower = email.toLowerCase().trim();

    // 1. Check if workspace exists
    const workspace = await this.workspaceRepository.findOne({ where: { id: workspaceId } });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // 2. Check if user is already a member
    const existingUser = await this.userRepository.findOne({ where: { email: emailLower } });
    if (existingUser) {
      const isMember = await this.memberRepository.findOne({
        where: { userId: existingUser.id, workspaceId },
      });
      if (isMember) {
        throw new ConflictException('User is already a member of this workspace');
      }
    }

    // 3. Remove any existing pending invitation for this email in this workspace
    await this.invitationRepository.delete({
      workspaceId,
      email: emailLower,
      status: InvitationStatus.PENDING,
    });

    // 4. Create new invitation
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // 72 hours from now

    const invitation = this.invitationRepository.create({
      email: emailLower,
      role,
      token: randomUUID(),
      workspaceId,
      inviterId,
      expiresAt,
      status: InvitationStatus.PENDING,
    });

    const savedInvite = await this.invitationRepository.save(invitation);

    // Send email invitation
    const frontendUrl = this.envConfig.appConfig.primaryFrontendUrl;
    const inviteLink = `${frontendUrl}/accept-invite?token=${savedInvite.token}`;
    await this.emailService.sendInvitationEmail(emailLower, workspace.name, inviteLink);

    return savedInvite;
  }

  async getPendingInvitations(workspaceId: string): Promise<Invitation[]> {
    return this.invitationRepository.find({
      where: { workspaceId, status: InvitationStatus.PENDING, expiresAt: MoreThan(new Date()) },
      relations: { inviter: true },
    });
  }

  async revokeInvitation(workspaceId: string, invitationId: string): Promise<void> {
    const invite = await this.invitationRepository.findOne({
      where: { id: invitationId, workspaceId },
    });
    if (!invite) {
      throw new NotFoundException('Invitation not found');
    }
    invite.status = InvitationStatus.REVOKED;
    await this.invitationRepository.save(invite);
  }

  async acceptInvitation(token: string, userId: string): Promise<Workspace> {
    const invite = await this.invitationRepository.findOne({
      where: { token, status: InvitationStatus.PENDING },
    });
    
    if (!invite) {
      throw new NotFoundException('Invalid or expired invitation token');
    }

    if (invite.expiresAt < new Date()) {
      invite.status = InvitationStatus.REVOKED;
      await this.invitationRepository.save(invite);
      throw new BadRequestException('Invitation has expired');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new ForbiddenException('This invitation is for a different email address');
    }

    // Add user as member
    const existingMember = await this.memberRepository.findOne({
      where: { userId, workspaceId: invite.workspaceId },
    });

    if (!existingMember) {
      const newMember = this.memberRepository.create({
        userId,
        workspaceId: invite.workspaceId,
        role: invite.role,
      });
      await this.memberRepository.save(newMember);
    }

    // Mark accepted
    invite.status = InvitationStatus.ACCEPTED;
    await this.invitationRepository.save(invite);

    const workspace = await this.workspaceRepository.findOne({ where: { id: invite.workspaceId } });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    return workspace;
  }

  async changeMemberRole(
    workspaceId: string,
    memberId: string,
    newRole: WorkspaceRole,
  ): Promise<WorkspaceMember> {
    const member = await this.memberRepository.findOne({
      where: { id: memberId, workspaceId },
      relations: { user: true },
    });

    if (!member) {
      throw new NotFoundException('Workspace member not found');
    }

    // If changing from ADMIN to something else, check if they are the last ADMIN
    if (member.role === WorkspaceRole.ADMIN && newRole !== WorkspaceRole.ADMIN) {
      const adminCount = await this.memberRepository.count({
        where: { workspaceId, role: WorkspaceRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('A workspace must always have at least one ADMIN');
      }
    }

    member.role = newRole;
    return this.memberRepository.save(member);
  }

  async removeMember(workspaceId: string, memberId: string): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: { id: memberId, workspaceId },
    });

    if (!member) {
      throw new NotFoundException('Workspace member not found');
    }

    // If they are ADMIN, check if they are the last ADMIN
    if (member.role === WorkspaceRole.ADMIN) {
      const adminCount = await this.memberRepository.count({
        where: { workspaceId, role: WorkspaceRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('A workspace must always have at least one ADMIN');
      }
    }

    await this.memberRepository.remove(member);
  }
}
