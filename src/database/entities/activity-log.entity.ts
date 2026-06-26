import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Task } from './task.entity';
import { User } from './user.entity';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventType: string; // e.g. 'TASK_CREATED', 'STATUS_CHANGED', 'ASSIGNEE_CHANGED', etc.

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'text' })
  oldValue: string | null;

  @Column({ nullable: true, type: 'text' })
  newValue: string | null;

  @Column()
  taskId: string;

  @Column()
  performerId: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ManyToOne(() => Task, (task) => task.activityLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @ManyToOne(() => User, (user) => user.activityLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'performerId' })
  performer: User;
}
