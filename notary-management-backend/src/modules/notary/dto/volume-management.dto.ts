import { IsString, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { BookType } from '../../../shared/enums/book-type.enum';

export class ManualVolumeIncrementDto {
  @IsEnum(BookType)
  book_type: BookType;

  @IsOptional()
  @IsString()
  new_volume?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  start_number?: number = 1;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class VolumeIncrementResponseDto {
  message: string;
  book_type: BookType;
  old_volume: string;
  new_volume: string;
  new_start_number: number;
  previous_last_number: number;
  records_in_old_volume: number;
}
