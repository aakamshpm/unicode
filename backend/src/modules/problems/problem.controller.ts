import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { Difficulty } from './entities/problem.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProblemsService } from './problem.service';
import { RolesGuard } from 'src/common/guards/roles..guard';
import { ProblemMutationResponseDto } from './dto/problem-response.dto';

@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  /**
   * GET /api/problems
   * List all active problems (public route)
   * Optional query: ?difficulty=easy
   */
  @Get()
  async findAll(@Query('difficulty') difficulty?: Difficulty) {
    return this.problemsService.findAll(difficulty);
  }

  /**
   * GET /api/problems/:slug
   * Get single problem by slug (public route)
   */
  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return this.problemsService.findBySlug(slug);
  }

  /**
   * POST /api/problems
   * Create new problem
   */
  @Post()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(
    @Body() createDto: CreateProblemDto,
    @Req() req: any,
  ): Promise<ProblemMutationResponseDto> {
    const adminId = req.user.userId;
    const problem = await this.problemsService.create(createDto, adminId);

    return {
      id: problem.id,
      slug: problem.slug,
      title: problem.title,
      message: 'Problem created successfully',
    };
  }

  /**
   * PATCH /api/problems/:slug
   * Update problem
   */
  @Patch(':slug')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @Param('slug') slug: string,
    @Body() updateDto: UpdateProblemDto,
  ): Promise<ProblemMutationResponseDto> {
    const problem = await this.problemsService.update(slug, updateDto);

    return {
      id: problem.id,
      slug: problem.slug,
      title: problem.title,
      message: 'Problem updated successfully',
    };
  }

  /**
   * DELETE /api/problems/:slug
   * Soft delete problem
   * Sets is_active = false
   */
  @Delete(':slug')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('slug') slug: string) {
    await this.problemsService.delete(slug);
    return { message: 'Problem deleted successfully' };
  }
}
