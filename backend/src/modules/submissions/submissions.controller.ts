import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import {
  SubmissionCreatedResponseDto,
  SubmissionListItemDto,
  SubmissionStatusResponseDto,
} from './dto/submission-response.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthenticatedRequest } from 'src/common/interfaces/auth-request.interface';
import { RolesGuard } from 'src/common/guards/roles..guard';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  /**
   * POST /api/submissions
   * Create a new submission
   * Returns immediately with submission ID
   */
  @Post()
  @Roles('user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(
    @Body() dto: CreateSubmissionDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SubmissionCreatedResponseDto> {
    const userId = req.user.userId;
    const submission = await this.submissionsService.create(dto, userId);

    return {
      id: submission.id,
      status: submission.status,
      message: 'Submission received and queued for execution',
    };
  }

  /**
   * GET /api/submissions/:id/status
   * Poll submission status
   * Only the owner can check their submission
   */
  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  async getStatus(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<SubmissionStatusResponseDto> {
    const userId = req.user.userId;
    const submission = await this.submissionsService.findByIdAndUserOrFail(
      id,
      userId,
    );
    return {
      id: submission.id,
      status: submission.status,
      passed_test_cases: submission.passed_test_cases,
      total_test_cases: submission.total_test_cases,
      runtime_ms: submission.runtime_ms,
      memory_kb: submission.memory_kb,
      error_message: submission.error_message,
      completed_at: submission.completed_at,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMySubmission(
    @Req() req: AuthenticatedRequest,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<SubmissionListItemDto[]> {
    const userId = req.user.userId;
    const submissions = await this.submissionsService.findByUser(userId, limit);

    return submissions.map((submission) => ({
      id: submission.id,
      problem: {
        id: submission.problem.id,
        slug: submission.problem.slug,
        title: submission.problem.title,
        difficulty: submission.problem.difficulty,
      },
      language: submission.language,
      status: submission.status,
      runtime_ms: submission.runtime_ms,
      created_at: submission.created_at,
    }));
  }
}
