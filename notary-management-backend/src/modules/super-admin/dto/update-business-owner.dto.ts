import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  Matches,
  MinLength,
  MaxLength,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EUserStatus } from 'src/shared/enums/user-status.enum';

export class UpdateBusinessOwnerDto {
  @ApiProperty({
    description: 'Superadmin secret key for authorization',
    example: 'super-secure-admin-key-rex-2025',
  })
  @IsString()
  @IsNotEmpty()
  superadminSecretKey: string;

  @ApiProperty({
    description: 'Full names of the business owner',
    example: 'John Doe Updated',
    required: false,
  })
  @IsString()
  @IsOptional()
  fullNames?: string;

  @ApiProperty({
    description: 'Email address of the business owner',
    example: 'john.doe.updated@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Phone number of the business owner',
    example: '+250788123457',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be a valid international format',
  })
  phone?: string;

  @ApiProperty({
    description: 'User status',
    enum: EUserStatus,
    required: false,
  })
  @IsEnum(EUserStatus)
  @IsOptional()
  status?: EUserStatus;

  @ApiProperty({
    description: 'Whether the account is verified',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @ApiProperty({
    description:
      'New password (must be at least 8 characters with uppercase, lowercase, number, and special character)',
    example: 'NewPassword@123',
    minLength: 8,
    maxLength: 50,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(50, { message: 'Password must not exceed 50 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&.#)',
    },
  )
  password?: string;
}
