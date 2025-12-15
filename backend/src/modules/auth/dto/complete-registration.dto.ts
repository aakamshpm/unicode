import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CompleteRegistrationDto {
  @IsString()
  tempToken: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;
}
