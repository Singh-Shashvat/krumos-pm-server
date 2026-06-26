import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { Workspace } from './workspace.entity';

import { WorkspaceRole } from '@/types/enum';
export { WorkspaceRole };

@Entity('workspace_members')
@Unique(['userId', 'workspaceId'])
export class WorkspaceMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: WorkspaceRole,
    default: WorkspaceRole.MEMBER,
  })
  role: WorkspaceRole;

  @Column()
  userId: string;

  @Column()
  workspaceId: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.workspaceMembers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Workspace, (workspace) => workspace.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;
}
