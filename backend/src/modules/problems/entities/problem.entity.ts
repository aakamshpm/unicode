import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entities';
import { TestCase } from './test-case.entity';

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

/**
 * Starter code templates for different languages
 */
export interface StarterCode {
  python: string;
  javascript: string;
  c: string;
}

@Entity('problems')
export class Problem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * URL-friendly identifier (e.g., "two-sum")
   * Used in routes: /api/problems/two-sum
   */
  @Column({ unique: true })
  @Index()
  slug: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: Difficulty,
    default: Difficulty.EASY,
  })
  difficulty: Difficulty;

  @Column('text', { nullable: true })
  constraints: string | null;

  @Column('jsonb')
  examples: ProblemExample[];

  @Column('jsonb')
  starter_code: StarterCode;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'created_by_id' })
  created_by: User;

  @Column('uuid')
  created_by_id: string;

  @Column({ default: true })
  is_active: boolean;

  /**
   * Hidden test cases (not shown to users)
   * Relationship to TestCase entity
   */
  @OneToMany(() => TestCase, (testCase) => testCase.problem, {
    cascade: true,
  })
  test_cases: TestCase[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
