export enum SubmissionLanguage {
  PYTHON = 'python',
  JAVASCRIPT = 'javascript',
  C = 'c',
}

/**
 * Submission execution status
 */
export enum SubmissionStatus {
  /** Initial state - saved to DB, not yet queued */
  PENDING = 'pending',

  /** Worker picked up the job, executing code */
  RUNNING = 'running',

  /** All test cases passed */
  ACCEPTED = 'accepted',

  /** Code ran but produced incorrect output */
  WRONG_ANSWER = 'wrong_answer',

  /** Execution exceeded time limit (5 seconds) */
  TIME_LIMIT_EXCEEDED = 'time_limit_exceeded',

  /** Code crashed during execution  */
  RUNTIME_ERROR = 'runtime_error',

  /** Code failed to compile (C) or has syntax errors */
  COMPILATION_ERROR = 'compilation_error',
}
