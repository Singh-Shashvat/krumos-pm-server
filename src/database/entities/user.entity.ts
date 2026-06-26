import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { WorkspaceMember } from './workspace-member.entity';
import { Task } from './task.entity';
import { Comment } from './comment.entity';
import { ActivityLog } from './activity-log.entity';
import { Notification } from './notification.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  picture: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @OneToMany(() => WorkspaceMember, (member: WorkspaceMember) => member.user)
  workspaceMembers: WorkspaceMember[];

  @OneToMany(() => Task, (task: Task) => task.reporter)
  reportedTasks: Task[];

  @OneToMany(() => Task, (task: Task) => task.assignee)
  assignedTasks: Task[];

  @OneToMany(() => Comment, (comment: Comment) => comment.author)
  comments: Comment[];

  @OneToMany(() => ActivityLog, (log: ActivityLog) => log.performer)
  activityLogs: ActivityLog[];

  @OneToMany(() => Notification, (notification: Notification) => notification.user)
  notifications: Notification[];
}
