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

export class CreateBusinessOwnerDto {
  @ApiProperty({
    description: 'Full names of the business owner',
    example: 'John Doe',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  @IsNotEmpty()
  fullNames: string;

  @ApiProperty({
    description: 'Email address of the business owner',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Phone number of the business owner',
    example: '+250788123456',
  })
  @IsPhoneNumber('RW')
  @IsNotEmpty()
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
