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
import { Type, Transform } from 'class-transformer';
import {
  BillStatus,
  BillType,
  PaymentMethod,
} from '../../../shared/enums/bill-status.enum';

export enum ReportGroupBy {
  DAY = 'day',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

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
    description: 'Book ID filter (for Minijust report)',
  })
  @IsOptional()
  @IsUUID()
  book_id?: string;

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
    description:
      'Group results by period. Combine with start_date/end_date for custom ranges.',
    enum: ReportGroupBy,
  })
  @IsOptional()
  @IsEnum(ReportGroupBy)
  group_by?: ReportGroupBy;

  @ApiPropertyOptional({
    description: 'Export format for /export endpoints: xlsx | pdf | docx',
    enum: ['xlsx', 'pdf', 'docx'],
  })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional({
    description:
      'Report language for headers/labels. Default is Kinyarwanda (rw).',
    enum: ['rw', 'en', 'fr'],
    default: 'rw',
  })
  @IsOptional()
  @IsEnum(['rw', 'en', 'fr'])
  language?: 'rw' | 'en' | 'fr';

  @ApiPropertyOptional({
    description:
      'Minijust export only: include the formatted cover letter. Default true. Set false to get just the records table.',
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    const v = String(value).trim().toLowerCase();
    return !(v === 'false' || v === '0' || v === 'no' || v === '');
  })
  include_letter?: boolean;
}
