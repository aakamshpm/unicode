import { PartialType } from '@nestjs/swagger';
import { CreateProblemDto } from './create-problem.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateProblemDto extends PartialType(CreateProblemDto) {
  /**
   * Allow admins to activate/deactivate problems (is_active is true by default during creation - marked in entity)
   */
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
