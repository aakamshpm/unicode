import {
  Difficulty,
  ProblemExample,
  StarterCode,
} from '../entities/problem.entity';

/**
 * Sample test case (only shown to users)
 * Type: unknown - frontend should display as-is (JSON.stringify for objects/arrays)
 */
export class SampleTestCaseDto {
  /**
   * Test input - can be object, array, or primitive
   * Frontend: Display using JSON.stringify() for proper formatting
   */
  input: unknown;

  /**
   * Expected output - can be any valid JSON value
   * Frontend: Display using JSON.stringify() for proper formatting
   */
  expected_output: unknown;

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
