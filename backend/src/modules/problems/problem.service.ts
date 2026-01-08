import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Difficulty, Problem } from './entities/problem.entity';
import { Repository } from 'typeorm';
import { TestCase } from './entities/test-case.entity';
import {
  ProblemDetailResponseDto,
  ProblemListResponseDto,
  SampleTestCaseDto,
} from './dto/problem-response.dto';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';

@Injectable()
export class ProblemsService {
  constructor(
    @InjectRepository(Problem)
    private readonly problemRepository: Repository<Problem>,
    @InjectRepository(TestCase)
    private readonly testCaseRepository: Repository<TestCase>,
  ) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-');
  }

  /**
   * List all active problems with optional difficulty filter
   */
  async findAll(difficulty?: Difficulty): Promise<ProblemListResponseDto[]> {
    const queryBuilder = this.problemRepository
      .createQueryBuilder('problem')
      .where('problem.is_active = :isActive', { isActive: true })
      .orderBy('problem.created_at', 'DESC');

    if (difficulty) {
      queryBuilder.andWhere('problem.difficulty = :difficulty', { difficulty });
    }

    const problems = await queryBuilder.getMany();

    return problems.map((problem) => ({
      id: problem.id,
      slug: problem.slug,
      title: problem.title,
      difficulty: problem.difficulty,
      created_at: problem.created_at,
    }));
  }

  /**
   * Create new problem
   * Test cases default to is_sample: false (hidden)
   */
  async create(createDto: CreateProblemDto, adminId: string): Promise<Problem> {
    const slug = createDto.slug || this.generateSlug(createDto.title);

    // Check if slug already exists
    const existingProblem = await this.problemRepository.findOne({
      where: { slug },
    });

    if (existingProblem) {
      throw new ConflictException(
        `Problem with slug "${slug}" already exists. Choose a different title or provide a custom slug.`,
      );
    }

    // Separate test cases from problem data
    const { test_cases, ...problemData } = createDto;

    // Create problem entity
    const problem = this.problemRepository.create({
      ...problemData,
      slug,
      created_by_id: adminId,
    });

    // Save problem first to get ID
    const savedProblem = await this.problemRepository.save(problem);

    // Create test cases with Many to One relation (from problem to test cases)
    const testCaseEntities = test_cases.map((tc, index) =>
      this.testCaseRepository.create({
        problem_id: savedProblem.id,
        input: tc.input,
        expected_output: tc.expected_output,
        is_sample: tc.is_sample ?? false,
        order: tc.order ?? index,
      }),
    );

    await this.testCaseRepository.save(testCaseEntities);

    return savedProblem;
  }

  /**
   * Update problem (admin only)
   */
  async update(slug: string, updateDto: UpdateProblemDto): Promise<Problem> {
    const problem = await this.problemRepository.findOne({
      where: { slug },
      relations: ['test_cases'],
    });

    if (!problem) {
      throw new NotFoundException(`Problem with slug "${slug}" not found`);
    }

    // If updating slug, check for conflicts
    if (updateDto.slug && updateDto.slug !== slug) {
      const existingProblem = await this.problemRepository.findOne({
        where: { slug: updateDto.slug },
      });

      if (existingProblem) {
        throw new ConflictException(
          `Problem with slug "${updateDto.slug}" already exists`,
        );
      }
    }

    // If updating test cases, delete old ones and create new
    if (updateDto.test_cases) {
      await this.testCaseRepository.delete({ problem_id: problem.id });

      const testCaseEntities = updateDto.test_cases.map((tc, index) =>
        this.testCaseRepository.create({
          problem_id: problem.id,
          input: tc.input,
          expected_output: tc.expected_output,
          is_sample: tc.is_sample ?? false,
          order: tc.order ?? index,
        }),
      );

      await this.testCaseRepository.save(testCaseEntities);
    }

    // Update problem fields
    const { test_cases, ...updateData } = updateDto;
    Object.assign(problem, updateData);

    return this.problemRepository.save(problem);
  }

  /**
   * Soft delete problem (admin only)
   * Sets is_active = false instead of deleting
   */
  async delete(slug: string): Promise<void> {
    const problem = await this.problemRepository.findOne({ where: { slug } });

    if (!problem) {
      throw new NotFoundException(`Problem with slug "${slug}" not found`);
    }

    problem.is_active = false;
    await this.problemRepository.save(problem);
  }

  /**
   * Get single problem by slug with ONLY sample test cases
   */
  async findBySlug(slug: string): Promise<ProblemDetailResponseDto> {
    const problem = await this.problemRepository.findOne({
      where: { slug, is_active: true },
      relations: ['test_cases'],
    });

    if (!problem) {
      throw new NotFoundException(`Problem with slug "${slug}" not found`);
    }

    // Filter sample test cases
    const sampleTestCases: SampleTestCaseDto[] = problem.test_cases
      .filter((tc) => tc.is_sample === true)
      .sort((a, b) => a.order - b.order)
      .map((tc) => ({
        input: tc.input,
        expected_output: tc.expected_output,
        order: tc.order,
      }));

    const response: ProblemDetailResponseDto = {
      id: problem.id,
      slug: problem.slug,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      constraints: problem.constraints,
      examples: problem.examples,
      starter_code: problem.starter_code,
      created_at: problem.created_at,
      updated_at: problem.updated_at,
    };

    // Only include sample_test_cases if there are any
    if (sampleTestCases.length > 0) {
      response.sample_test_cases = sampleTestCases;
    }

    return response;
  }

  /**
   * Helper: Get all test cases for a problem (including hidden ones)
   * Used internally for code execution
   */
  async getAllTestCases(problemId: string): Promise<TestCase[]> {
    return this.testCaseRepository.find({
      where: { problem_id: problemId },
      order: { order: 'ASC' },
    });
  }
}
