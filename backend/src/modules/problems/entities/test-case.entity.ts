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
   * Input data for the test case (stored as JSONB)
   * Type: unknown - MUST validate before use
   * Can be object, array, or primitive depending on problem
   * Examples:
   *   - Two Sum: { nums: [2,7,11,15], target: 9 }
   *   - Valid Parentheses: { s: "()" }
   *   - Trapping Rain Water: { height: [0,1,0,2,1,0,1,3,2,1,2,1] }
   */
  @Column('jsonb')
  input: unknown;

  /**
   * Expected output for this input (stored as JSONB)
   * Type: unknown - MUST validate/cast before comparing with execution result
   * Can be primitive, array, or object depending on problem return type
   * Examples:
   *   - Two Sum: [0,1] (number array)
   *   - Valid Parentheses: true (boolean)
   *   - Trapping Rain Water: 6 (number)
   *   - Merge Intervals: [[1,6],[8,10]] (2D array)
   *
   * IMPORTANT: When comparing in execution engine, handle all types:
   *   if (typeof expected === 'boolean') { return actual === expected; }
   *   else if (Array.isArray(expected)) { return deepEqual(actual, expected); }
   *   else if (typeof expected === 'number') { return actual === expected; }
   */
  @Column('jsonb')
  expected_output: unknown;

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
