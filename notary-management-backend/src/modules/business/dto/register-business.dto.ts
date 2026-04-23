/* eslint-disable @typescript-eslint/no-unused-vars */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { EBusinessType } from 'src/shared/enums/business-type.enum';
import { EWorkingDays } from 'src/shared/enums/working-days.enum';

export class RegisterBusinessDto {
  @ApiProperty({
    example: 'Tech Solutions Rwanda Ltd',
    description: 'The legal name of the business',
  })
  @IsString()
  businessName: string;

  @ApiProperty({
    enum: EBusinessType,
    example: EBusinessType.LAW_FIRM,
    description: 'The type/category of the business',
  })
  @IsEnum(EBusinessType)
  businessType: EBusinessType;

  @ApiProperty({
    example: 'REG-2024-00123',
    description: 'Official business registration number (RDB)',
  })
  @IsString()
  businessRegistrationNumber: string;

  @ApiProperty({
    example: 'TIN-123456789',
    description: 'Tax Identification Number',
  })
  @IsString()
  tinNumber: string;

  @ApiProperty({
    example: 'Kigali',
    description: 'Province where business is located',
  })
  @IsString()
  province: string;

  @ApiProperty({
    example: 'Gasabo',
    description: 'District where business is located',
  })
  @IsString()
  district: string;

  @ApiProperty({
    example: 'Kimihurura',
    description: 'Sector where business is located',
  })
  @IsString()
  sector: string;

  @ApiProperty({
    example: 'Urugano',
    description: 'Cell where business is located',
  })
  @IsString()
  cell: string;

  @ApiProperty({
    example: 'Nyarutarama',
    description: 'Village where business is located',
    required: false,
  })
  @IsOptional()
  @IsString()
  village?: string;

  @ApiProperty({
    example: 'KG 123 St, Kigali Heights, 3rd Floor',
    description: 'Physical address',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: 'info@techsolutions.rw',
    description: 'Business email address',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: '+250788123456',
    description: 'Business phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'https://techsolutions.rw',
    description: 'Business website URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({
    example: 'https://techsolutions.rw/logo.png',
    description: 'Logo image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({
    example: 'https://techsolutions.rw/cover.jpg',
    description: 'Cover image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiProperty({
    enum: EWorkingDays,
    isArray: true,
    example: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    description: 'Days of operation',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(EWorkingDays, { each: true })
  workingDays?: EWorkingDays[];

  @ApiProperty({
    example: 'Africa/Kigali',
    description: 'Business timezone',
    required: false,
    default: 'Africa/Kigali',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({
    example: '08:00:00',
    description: 'Opening time (HH:MM:SS format)',
    required: false,
  })
  @IsOptional()
  @IsString()
  openingTime?: string;

  @ApiProperty({
    example: '18:00:00',
    description: 'Closing time (HH:MM:SS format)',
    required: false,
  })
  @IsOptional()
  @IsString()
  closingTime?: string;

  @ApiProperty({
    example: false,
    description: 'Whether the business operates 24 hours',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is24Hours?: boolean;

  @ApiProperty({
    example: '18',
    description: 'VAT rate percentage',
    required: false,
  })
  @IsOptional()
  @IsString()
  vatRate?: string;

  @ApiProperty({
    example: true,
    description: 'Whether business is VAT registered',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  vatRegistered?: boolean;

  @ApiProperty({
    example: 'HP-2024-00789',
    description: 'Health permit number',
    required: false,
  })
  @IsOptional()
  @IsString()
  healthPermitNumber?: string;

  @ApiProperty({
    example: '2025-12-31',
    description: 'Health permit expiry date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  healthPermitExpiry?: string;

  @ApiProperty({
    example: 50000000,
    description: 'Annual turnover in RWF',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  annualTurnover?: number;

  @ApiProperty({
    example: 'FSC-2024-001',
    description: 'Fire safety certificate number',
    required: false,
  })
  @IsOptional()
  @IsString()
  fireSafetyCertificate?: string;

  @ApiProperty({
    example: 25,
    description: 'Number of employees',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  numberOfEmployees?: number;

  @ApiProperty({
    example: '0788123456',
    description: 'Mobile money number',
    required: false,
  })
  @IsOptional()
  @IsString()
  mobileMoney?: string;

  @ApiProperty({
    example: 'Bank of Kigali',
    description: 'Bank name',
    required: false,
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({
    example: 'BK-1234567890',
    description: 'Bank account number',
    required: false,
  })
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiProperty({
    example: 'Leading technology solutions provider...',
    description: 'Business description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: [String],
    example: ['Software Development', 'IT Consulting', 'Cloud Services'],
    description: 'List of services offered',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @ApiProperty({
    example: '+250788999999',
    description: 'Emergency contact phone',
    required: false,
  })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;
}
