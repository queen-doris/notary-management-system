import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsEnum,
} from 'class-validator';
import { EWorkingDays } from 'src/shared/enums/working-days.enum';

export class UpdateBusinessHoursDto {
  @ApiPropertyOptional({
    description: 'Business opening time in HH:MM format',
    example: '08:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  openingTime?: string;

  @ApiPropertyOptional({
    description: 'Business closing time in HH:MM format',
    example: '18:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  closingTime?: string;

  @ApiPropertyOptional({
    description: 'Array of working days',
    example: [EWorkingDays.MONDAY, EWorkingDays.TUESDAY, EWorkingDays.FRIDAY],
    enum: EWorkingDays,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(EWorkingDays, { each: true })
  workingDays?: EWorkingDays[];

  @ApiPropertyOptional({
    description: 'Indicates if the business operates 24 hours',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is24Hours?: boolean;

  @ApiPropertyOptional({
    description: 'IANA timezone for the business location',
    example: 'Africa/Kigali',
    required: false,
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}
