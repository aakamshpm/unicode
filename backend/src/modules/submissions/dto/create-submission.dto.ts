import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { SubmissionLanguage } from '../enums/submission.enum';

export class CreateSubmissionDto {
  @IsUUID()
  @IsNotEmpty()
  problem_id: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Code cannot be empty' })
  @MaxLength(50000, {
    message: 'Code exceeds maximum length of 50,000 characters',
  })
  code: string;

  @IsEnum(SubmissionLanguage, {
    message: `Language must be one of: ${Object.values(SubmissionLanguage).join(', ')}`,
  })
  @IsNotEmpty()
  language: SubmissionLanguage;
}
