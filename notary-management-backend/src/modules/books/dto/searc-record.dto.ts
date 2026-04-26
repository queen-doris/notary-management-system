import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookType } from '../../../shared/enums/book-type.enum';

export class SearchRecordsDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(BookType)
  book_type?: BookType;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  client_id?: string;

  @IsOptional()
  @IsString()
  upi?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}

export class SearchRecordsResponseDto {
  data: {
    id: string;
    record_number: string;
    book_type: BookType;
    client_name: string;
    service: string;
    amount: number;
    served_date: Date;
    upi?: string;
  }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
