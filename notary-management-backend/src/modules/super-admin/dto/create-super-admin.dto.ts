import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { SuperadminAuthDto } from './superadmin-auth.dto';

export class CreateSuperAdminDto extends SuperadminAuthDto {
  @ApiProperty({ description: 'Full names', example: 'John Doe', minLength: 2 })
  @IsString()
  @MinLength(2)
  @IsNotEmpty({ message: 'Full names are required.' })
  fullNames: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'admin@example.com',
    nullable: true,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Phone number', example: '+250780000000' })
  @IsPhoneNumber()
  @IsNotEmpty({ message: 'Phone number is required.' })
  phone: string;

  @ApiProperty({
    description: 'Password',
    example: 'Test@123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}
