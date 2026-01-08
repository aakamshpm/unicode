import {
  IsString,
  IsEnum,
  IsArray,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Difficulty } from '../entities/problem.entity';

/**
 * DTO for problem examples shown to users
 */
export class ProblemExampleDto {
  @IsString()
  @IsNotEmpty()
  input: string;

  @IsString()
  @IsNotEmpty()
  output: string;

  @IsString()
  @IsOptional()
  explanation?: string;
}

/**
 * DTO for starter code templates
 */
export class StarterCodeDto {
  @IsString()
  @IsNotEmpty()
  python: string;

  @IsString()
  @IsNotEmpty()
  javascript: string;

  @IsString()
  @IsNotEmpty()
  c: string;
}

/**
 * DTO for test cases (both sample and hidden)
 */
export class TestCaseDto {
  /**
   * Test case input - can be any valid JSON structure
   * Type: unknown - MUST validate/cast before use in execution engine
   * Examples: {nums: [2,7], target: 9} | {s: "()"} | {height: [0,1,0]}
   */
  @IsNotEmpty()
  input: unknown;

  /**
   * Expected output for this test case - can be primitive, array, or object
   * Type: unknown - MUST validate/cast before comparing with actual output
   * Examples: [0,1] (array) | true (boolean) | 6 (number) | [[1,6],[8,10]] (2D array)
   * 
   
   * if (typeof expected_output === 'boolean') { ... }
   * else if (Array.isArray(expected_output)) { ... }
   */
  @IsNotEmpty()
  expected_output: unknown;

  @IsOptional()
  is_sample?: boolean;

  @IsOptional()
  order?: number;
}

export class CreateProblemDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  /**
   * Optional slug - if not provided, will be auto-generated from title
   */
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens only',
  })
  slug?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsString()
  @IsOptional()
  constraints?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProblemExampleDto)
  examples: ProblemExampleDto[];

  @ValidateNested()
  @Type(() => StarterCodeDto)
  starter_code: StarterCodeDto;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one test case is required' })
  @ValidateNested({ each: true })
  @Type(() => TestCaseDto)
  test_cases: TestCaseDto[];
}
