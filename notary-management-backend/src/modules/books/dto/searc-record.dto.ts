import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchRecordsDto {
  @ApiPropertyOptional({ description: 'Free-text query' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by book UUID or slug' })
  @IsOptional()
  @IsString()
  book_id?: string;

  @ApiPropertyOptional({
    description: 'From date (YYYY-MM-DD)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'To date (YYYY-MM-DD)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Filter by client UUID' })
  @IsOptional()
  @IsString()
  client_id?: string;

  @ApiPropertyOptional({ description: 'Filter by UPI' })
  @IsOptional()
  @IsString()
  upi?: string;

  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Page size',
    example: 20,
    default: 20,
    maximum: 100,
  })
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
    book_type: string;
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
