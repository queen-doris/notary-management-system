import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Reset token received after OTP verification',
    example: 'eyJhbGciOiJIUzI1Ni, ...',
  })
  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @ApiProperty({
    description:
      'New password (≥8 chars, with upper, lower, number and special character)',
    example: 'NewPassword456!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Must match newPassword',
    example: 'NewPassword456!',
  })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
