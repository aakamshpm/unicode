import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entities';
import { Problem } from '../../problems/entities/problem.entity';
import {
  SubmissionLanguage,
  SubmissionStatus,
} from '../enums/submission.enums';

@Entity('submissions')
@Index(['user_id', 'problem_id'])
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('uuid')
  @Index()
  user_id: string;

  @ManyToOne(() => Problem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'problem_id' })
  problem: Problem;

  @Column('uuid')
  @Index()
  problem_id: string;

  @Column('text')
  code: string;

  @Column({
    type: 'enum',
    enum: SubmissionLanguage,
  })
  language: SubmissionLanguage;

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.PENDING,
  })
  status: SubmissionStatus;

  /**
   * Execution time in milliseconds
   * Null until execution completes
   */
  @Column({ type: 'int', nullable: true })
  runtime_ms: number | null;

  /**
   * Memory usage in kilobytes
   * Null until execution completes
   */
  @Column({ type: 'int', nullable: true })
  memory_kb: number | null;

  /**
   * Number of test cases that passed
   * Null until execution completes
   */
  @Column({ type: 'int', nullable: true })
  passed_test_cases: number | null;

  /**
   * Total number of test cases
   * Null until execution completes
   */
  @Column({ type: 'int', nullable: true })
  total_test_cases: number | null;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;
}
