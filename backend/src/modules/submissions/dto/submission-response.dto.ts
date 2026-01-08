import { Difficulty } from '../../problems/entities/problem.entity';
import {
  SubmissionLanguage,
  SubmissionStatus,
} from '../enums/submission.enums';

/**
 * Returns immediately after submission; a submission will be created in db
 * id will be returned to user, hence user dont need to wait until code execution is over
 * queue will store each submission request
 * user will make use of polling to check status
 */
export class SubmissionCreatedResponseDto {
  id: string;
  status: SubmissionStatus;
  message: string;
}

/**
 * Used for polling submission status
 */
export class SubmissionStatusResponseDto {
  id: string;
  status: SubmissionStatus;

  /** Null until execution completes */
  passed_test_cases: number | null;
  total_test_cases: number | null;
  runtime_ms: number | null;
  memory_kb: number | null;

  /** Only populated for failed submissions */
  error_message: string | null;

  /** Null while pending/running */
  completed_at: Date | null;
}

/**
 * Problem info embedded in submission list response api
 */
export class SubmissionProblemDto {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
}

/**
 * User's submission history
 */
export class SubmissionListItemDto {
  id: string;
  problem: SubmissionProblemDto;
  language: SubmissionLanguage;
  status: SubmissionStatus;
  runtime_ms: number | null;
  created_at: Date;
}
