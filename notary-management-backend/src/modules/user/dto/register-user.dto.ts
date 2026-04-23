import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsOptional,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsStrongPassword } from 'src/common/decorators/strong-password.decorator';

export class RegisterDto {
  @ApiProperty({
    description: 'Full names of the user',
    example: 'John Doe',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  @IsOptional()
  // @IsNotEmpty({ message: 'Full username is required please.' })
  fullNames: string;

  @ApiPropertyOptional({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
    nullable: true,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '+250788123456',
  })
  @IsPhoneNumber('RW')
  @IsNotEmpty({ message: 'User phone number is required please.' })
  phone: string;

  @ApiProperty({
    description: 'Password for the account',
    example: 'securePassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @IsStrongPassword({
    message:
      'Password must be at least 8 characters long, contain uppercase, lowercase, number and special character',
  })
  password: string; 
}
