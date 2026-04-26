import { IsOptional, IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { BookType } from '../../../shared/enums/book-type.enum';

export class ArchiveRecordsDto {
  @IsDateString()
  before_date: string;

  @IsOptional()
  @IsEnum(BookType)
  book_type?: BookType;

  @IsOptional()
  @IsBoolean()
  confirm?: boolean = false;
}

export class ArchiveRecordsResponseDto {
  message: string;
  archived_count: number;
  book_type?: BookType;
  before_date: string;
}
