import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({
    description: 'Book display name (slug is derived from it)',
    example: 'Translation Book',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({
    description: 'Optional description of the book',
    example: 'Register for sworn translations',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether this book uses volumes',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  has_volume?: boolean;

  @ApiPropertyOptional({
    description: 'How volume numbers are formatted',
    enum: VolumeFormat,
    example: VolumeFormat.ROMAN,
  })
  @IsOptional()
  @IsEnum(VolumeFormat)
  volume_format?: VolumeFormat;

  @ApiPropertyOptional({
    description: 'Records per volume before rolling to the next (0 = no limit)',
    example: 50,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  records_per_volume?: number;

  @ApiPropertyOptional({
    description: 'Separator between number and volume, e.g. the "/" in 142/IV',
    example: '/',
    maxLength: 5,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  volume_separator?: string;

  @ApiPropertyOptional({
    description: 'Require a UPI when serving into this book',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requires_upi?: boolean;

  @ApiPropertyOptional({
    description: 'Advance the volume counter on each serve (land-style books)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  increments_volume_on_serve?: boolean;

  @ApiPropertyOptional({
    description: 'Initial volume for the tracker',
    example: 'I',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  current_volume?: string;

  @ApiPropertyOptional({
    description: 'Initial current record number',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  current_number?: number;

  @ApiPropertyOptional({
    description: 'Initial number of records already in the current volume',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  records_in_current_volume?: number;
}

export class UpdateBookDto {
  @ApiPropertyOptional({ description: 'Book name', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ description: 'Book description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the book uses volumes' })
  @IsOptional()
  @IsBoolean()
  has_volume?: boolean;

  @ApiPropertyOptional({ enum: VolumeFormat, description: 'Volume format' })
  @IsOptional()
  @IsEnum(VolumeFormat)
  volume_format?: VolumeFormat;

  @ApiPropertyOptional({
    description: 'Records per volume (0 = no limit)',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  records_per_volume?: number;

  @ApiPropertyOptional({ description: 'Volume separator', maxLength: 5 })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  volume_separator?: string;

  @ApiPropertyOptional({ description: 'Require UPI on serve' })
  @IsOptional()
  @IsBoolean()
  requires_upi?: boolean;

  @ApiPropertyOptional({ description: 'Advance volume on each serve' })
  @IsOptional()
  @IsBoolean()
  increments_volume_on_serve?: boolean;

  @ApiPropertyOptional({
    description: 'Active flag (false = deactivated/soft-deleted)',
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateBookTrackerDto {
  @ApiPropertyOptional({
    description: 'Set the current volume',
    example: 'IV',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  current_volume?: string;

  @ApiPropertyOptional({
    description: 'Set the current record number',
    example: 141,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  current_number?: number;

  @ApiPropertyOptional({
    description: 'Set records already in the current volume',
    example: 41,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  records_in_current_volume?: number;

  @ApiPropertyOptional({
    description: 'Set records per volume (0 = no limit)',
    example: 50,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  records_per_volume?: number;

  @ApiPropertyOptional({ description: 'Active flag' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class BookTrackerResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() book_id: string;
  @ApiProperty({ nullable: true }) current_volume: string | null;
  @ApiProperty() current_number: number;
  @ApiProperty() records_per_volume: number;
  @ApiProperty() records_in_current_volume: number;
  @ApiProperty() is_active: boolean;
  @ApiProperty() updated_at: Date;
}

export class NextNumberResponseDto {
  @ApiProperty() book_id: string;
  @ApiProperty({ nullable: true }) volume: string | null;
  @ApiProperty() number: number;
  @ApiProperty() display_number: string;
  @ApiProperty() records_in_volume_after: number;
  @ApiProperty() total_records_after: number;
  @ApiProperty() will_start_new_volume: boolean;
}
