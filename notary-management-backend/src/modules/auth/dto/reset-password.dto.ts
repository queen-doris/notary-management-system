import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Attribute' })
  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @ApiProperty({ description: 'Attribute' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
  })
  newPassword: string;

  @ApiProperty({ description: 'Attribute' })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
