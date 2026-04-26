/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MinLength,
  MaxLength,
  IsUUID,
  IsBoolean,
  IsPhoneNumber,
} from 'class-validator';
import {
  MaritalStatus,
  VerificationStatus,
} from '../../../shared/enums/client.enum';

export class CreateClientDto {
  // Required fields
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  full_name: string;

  @IsString()
  @MinLength(5)
  @MaxLength(50)
  id_number: string;

  // Optional but recommended
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  // Parent information
  @IsOptional()
  @IsString()
  father_name?: string;

  @IsOptional()
  @IsString()
  mother_name?: string;

  // Address
  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  cell?: string;

  @IsOptional()
  @IsString()
  village?: string;

  // Personal
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @IsOptional()
  @IsEnum(MaritalStatus)
  marital_status?: MaritalStatus;

  @IsOptional()
  @IsString()
  partner_name?: string;

  // UPI
  @IsOptional()
  @IsString()
  upi?: string;

  // Notes
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(VerificationStatus)
  verification_status?: VerificationStatus;

  @IsOptional()
  @IsString()
  verification_notes?: string;
}
