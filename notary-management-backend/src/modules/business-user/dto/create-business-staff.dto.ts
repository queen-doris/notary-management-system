import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';
import { EEmploymentStatus } from 'src/shared/enums/employee-status.enum';

export class CreateBusinessStaffDto {
  @ApiProperty({
    description: 'UUID of the business where the staff will work',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  businessId: string;

  @ApiProperty({
    description: 'Roles assigned to the staff member',
    enum: EBusinessRole,
    isArray: true,
    example: ['CASHIER', 'SALES'],
    minItems: 1,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(EBusinessRole, { each: true })
  roles: EBusinessRole[];

  @ApiProperty({
    description: 'Unique staff code (6 digits)',
    example: 'EMP001',
    required: false,
    pattern: '^\\d{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Staff code must be exactly 6 digits' })
  staffCode?: string;

  @ApiProperty({
    description: 'Full name of the staff member',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  fullNames: string;

  @ApiProperty({
    description: 'Phone number (Rwandan format)',
    example: '+250788123456',
    pattern: '^\\+250\\d{9}$',
  })
  @IsPhoneNumber('RW')
  phone: string;

  @ApiProperty({
    description: 'Email address (optional but recommended)',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description:
      'Password for the staff account (if not provided, auto-generated)',
    example: 'SecurePass123!',
    required: false,
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({
    description: 'Employment status',
    enum: EEmploymentStatus,
    default: EEmploymentStatus.ACTIVE,
    required: false,
    example: EEmploymentStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(EEmploymentStatus)
  employmentStatus?: EEmploymentStatus;

  @ApiProperty({
    description: 'Job title/position',
    example: 'Senior Cashier',
    required: false,
  })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty({
    description: 'Date of hire (YYYY-MM-DD format)',
    example: '2024-01-15',
    required: false,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @ApiProperty({
    description: 'Monthly salary in RWF',
    example: 350000,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salary?: number;
}
