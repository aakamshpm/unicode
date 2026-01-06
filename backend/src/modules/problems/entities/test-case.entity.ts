import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Problem } from './problem.entity';

@Entity('test_cases')
@Index(['problem_id', 'order'])
export class TestCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Problem, (problem) => problem.test_cases, {
    onDelete: 'CASCADE', // Delete test cases when problem is deleted
  })
  @JoinColumn({ name: 'problem_id' })
  problem: Problem;

  @Column('uuid')
  problem_id: string;

  /**
   * Input data for the test case
   * Example: { "nums": [2, 7, 11, 15], "target": 9 }
   */
  @Column('jsonb')
  input: Record<string, any>;

  /**
   * Expected output for this input
   * Example: { "result": [0, 1] }
   */
  @Column('jsonb')
  expected_output: Record<string, any>;

  /**
   * Whether this test case is shown to users
   * true = Sample test case (visible in problem description)
   * false = Hidden test case (used for validation only)
   */
  @Column({ default: false })
  is_sample: boolean;

  /**
   * Display order for test cases
   */
  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn()
  created_at: Date;
}
