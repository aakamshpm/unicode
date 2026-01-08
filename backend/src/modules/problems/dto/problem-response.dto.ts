import {
  Difficulty,
  ProblemExample,
  StarterCode,
} from '../entities/problem.entity';

/**
 * Sample test case (only shown to users)
 */
export class SampleTestCaseDto {
  input: Record<string, any>;
  expected_output: Record<string, any>;
  order: number;
}

/**
 * Response DTO for problem list (GET /api/problems)
 */
export class ProblemListResponseDto {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  created_at: Date;
}

/**
 * Response DTO for single problem (GET /api/problems/:slug)
 */
export class ProblemDetailResponseDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  constraints: string | null;
  examples: ProblemExample[];
  starter_code: StarterCode;
  sample_test_cases?: SampleTestCaseDto[];
  created_at: Date;
  updated_at: Date;
}

export class ProblemMutationResponseDto {
  id: string;
  slug: string;
  title: string;
  message: string;
}
