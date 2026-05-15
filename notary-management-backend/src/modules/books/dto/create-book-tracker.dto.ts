import {
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsString,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { VolumeFormat } from '../../../shared/enums/volume-format.enum';

export class CreateBookDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  has_volume?: boolean;

  @IsOptional()
  @IsEnum(VolumeFormat)
  volume_format?: VolumeFormat;

  @IsOptional()
  @IsInt()
  @Min(0)
  records_per_volume?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  volume_separator?: string;

  @IsOptional()
  @IsBoolean()
  requires_upi?: boolean;

  @IsOptional()
  @IsBoolean()
  increments_volume_on_serve?: boolean;

  // Initial tracker state (optional)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  current_volume?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  current_number?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  records_in_current_volume?: number;
}

export class UpdateBookDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  has_volume?: boolean;

  @IsOptional()
  @IsEnum(VolumeFormat)
  volume_format?: VolumeFormat;

  @IsOptional()
  @IsInt()
  @Min(0)
  records_per_volume?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  volume_separator?: string;

  @IsOptional()
  @IsBoolean()
  requires_upi?: boolean;

  @IsOptional()
  @IsBoolean()
  increments_volume_on_serve?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateBookTrackerDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  current_volume?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  current_number?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  records_in_current_volume?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  records_per_volume?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class BookTrackerResponseDto {
  id: string;
  book_id: string;
  current_volume: string | null;
  current_number: number;
  records_per_volume: number;
  records_in_current_volume: number;
  is_active: boolean;
  updated_at: Date;
}

export class NextNumberResponseDto {
  book_id: string;
  volume: string | null;
  number: number;
  display_number: string;
  records_in_volume_after: number;
  total_records_after: number;
  will_start_new_volume: boolean;
}
