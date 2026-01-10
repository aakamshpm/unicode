import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission } from './entities/submission.entity';
import { ProblemsService } from '../problems/problem.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { SubmissionStatus } from './enums/submission.enums';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
    private readonly problemsService: ProblemsService,
  ) {}

  async create(dto: CreateSubmissionDto, userId: string): Promise<Submission> {
    const { code, language, problem_id } = dto;

    // check problem exists
    const problem = await this.problemsService.findById(problem_id);
    if (!problem)
      throw new NotFoundException(
        `Problem with id "${dto.problem_id}" not found`,
      );

    // create submission in db and use that id to update queue and user
    const submission = this.submissionRepository.create({
      user_id: userId,
      code,
      problem_id,
      language,
    });

    return this.submissionRepository.save(submission);
  }

  // Find submission details by id and verify ownership
  // used for polling
  async findByIdAndUser(
    id: string,
    userId: string,
  ): Promise<Submission | null> {
    return this.submissionRepository.findOne({
      where: { id, user_id: userId },
      relations: { problem: true },
    });
  }

  async findByIdAndUserOrFail(id: string, userId: string): Promise<Submission> {
    const submission = await this.findByIdAndUser(id, userId);
    if (!submission)
      throw new NotFoundException(
        `Submission with id "${id}" not found or access denied`,
      );
    return submission;
  }

  // Get users submission history
  async findByUser(userId: string, limit: number = 50): Promise<Submission[]> {
    const cappedLimit = Math.min(limit, 200); // limit capped at 200 to prevent large queries

    return this.submissionRepository.find({
      where: { user_id: userId },
      relations: { problem: true },
      order: { created_at: 'DESC' },
      take: cappedLimit,
    });
  }

  // Update submission details in db (called by worker after code execution)
  async updateResults(
    id: string,
    results: {
      status: SubmissionStatus;
      runtime_ms?: number;
      memory_kb?: number;
      passed_test_cases?: number;
      total_test_cases?: number;
      error_message?: string;
    },
  ): Promise<void> {
    await this.submissionRepository.update(id, {
      ...results,
      completed_at: new Date(),
    });
  }
}
