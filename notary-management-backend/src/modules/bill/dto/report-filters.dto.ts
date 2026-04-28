import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  BillStatus,
  BillType,
  PaymentMethod,
} from '../../../shared/enums/bill-status.enum';
import { BookType } from '../../../shared/enums/book-type.enum';

export class ReportFiltersDto {
  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Bill status filter', enum: BillStatus })
  @IsOptional()
  @IsEnum(BillStatus)
  status?: BillStatus;

  @ApiPropertyOptional({ description: 'Bill type filter', enum: BillType })
  @IsOptional()
  @IsEnum(BillType)
  bill_type?: BillType;

  @ApiPropertyOptional({
    description: 'Book type filter (for Minijust report)',
    enum: BookType,
  })
  @IsOptional()
  @IsEnum(BookType)
  book_type?: BookType;

  @ApiPropertyOptional({ description: 'Client ID filter' })
  @IsOptional()
  @IsUUID()
  client_id?: string;

  @ApiPropertyOptional({ description: 'Client name search' })
  @IsOptional()
  @IsString()
  client_name?: string;

  @ApiPropertyOptional({
    description: 'Payment method filter',
    enum: PaymentMethod,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Service name filter' })
  @IsOptional()
  @IsString()
  service_name?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 50,
    minimum: 1,
    maximum: 200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Group by period (day, month, quarter, year)',
  })
  @IsOptional()
  @IsString()
  group_by?: 'day' | 'month' | 'quarter' | 'year';
}
