import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Workspace } from './workspace.entity';
import { Task } from './task.entity';
import { Invitation } from './invitation.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  message: string;

  @Column()
  type: string; // e.g. 'TASK_ASSIGNED', 'COMMENT_ADDED', 'INVITATION_RECEIVED', 'TASK_DUE'

  @Column({ default: false })
  isRead: boolean;

  @Column()
  userId: string;

  @Column()
  workspaceId: string;

  @Column({ type: 'varchar', nullable: true })
  taskId: string | null;

  @Column({ type: 'varchar', nullable: true })
  invitationId: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @ManyToOne(() => Task, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @ManyToOne(() => Invitation, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'invitationId' })
  invitation: Invitation;
}
