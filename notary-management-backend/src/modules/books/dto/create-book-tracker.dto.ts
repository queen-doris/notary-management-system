import {
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsString,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { BookType } from '../../../shared/enums/book-type.enum';

export class CreateBookTrackerDto {
  @IsEnum(BookType)
  book_type: BookType;

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
  records_per_volume?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  records_in_current_volume?: number;
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
  book_type: BookType;
  current_volume: string | null;
  current_number: number;
  records_per_volume: number;
  records_in_current_volume: number;
  is_active: boolean;
  updated_at: Date;
}

export class NextNumberResponseDto {
  book_type: BookType;
  volume: string | null;
  number: number;
  display_number: string;
  records_in_volume_after: number;
  total_records_after: number;
  will_start_new_volume: boolean;
}
