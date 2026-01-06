import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Problem } from './entities/problem.entity';
import { TestCase } from './entities/test-case.entity';
import { ProblemsController } from './problem.controller';
import { ProblemsService } from './problem.service';

@Module({
  imports: [TypeOrmModule.forFeature([Problem, TestCase])],
  controllers: [ProblemsController],
  providers: [ProblemsService],
  exports: [ProblemsService],
})
export class ProblemsModule {}
