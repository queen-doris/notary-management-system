import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MinLength,
  MaxLength,
  IsPhoneNumber,
} from 'class-validator';
import {
  MaritalStatus,
  VerificationStatus,
} from '../../../shared/enums/client.enum';

export class CreateClientDto {
  @ApiProperty({
    description: 'Client full name',
    example: 'Mukamana Aline',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  full_name: string;

  @ApiProperty({
    description: 'National ID / passport number',
    example: '1199080012345678',
    minLength: 5,
    maxLength: 50,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  id_number: string;

  @ApiPropertyOptional({
    description: 'Phone number (E.164)',
    example: '+250788123456',
  })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'aline@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: "Father's name" })
  @IsOptional()
  @IsString()
  father_name?: string;

  @ApiPropertyOptional({ description: "Mother's name" })
  @IsOptional()
  @IsString()
  mother_name?: string;

  @ApiPropertyOptional({ description: 'Province', example: 'Kigali' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ description: 'District', example: 'Gasabo' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'Sector' })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional({ description: 'Cell' })
  @IsOptional()
  @IsString()
  cell?: string;

  @ApiPropertyOptional({ description: 'Village' })
  @IsOptional()
  @IsString()
  village?: string;

  @ApiPropertyOptional({
    description: 'Date of birth (YYYY-MM-DD)',
    example: '1990-08-15',
  })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiPropertyOptional({
    description: 'Marital status',
    enum: MaritalStatus,
  })
  @IsOptional()
  @IsEnum(MaritalStatus)
  marital_status?: MaritalStatus;

  @ApiPropertyOptional({ description: "Spouse/partner's name" })
  @IsOptional()
  @IsString()
  partner_name?: string;

  @ApiPropertyOptional({
    description: 'UPI (Unique Parcel Identifier) for land clients',
    example: '1/02/08/03/1234',
  })
  @IsOptional()
  @IsString()
  upi?: string;

  @ApiPropertyOptional({ description: 'Free-form notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Initial verification status',
    enum: VerificationStatus,
  })
  @IsOptional()
  @IsEnum(VerificationStatus)
  verification_status?: VerificationStatus;

  @ApiPropertyOptional({ description: 'Verification notes' })
  @IsOptional()
  @IsString()
  verification_notes?: string;
}
