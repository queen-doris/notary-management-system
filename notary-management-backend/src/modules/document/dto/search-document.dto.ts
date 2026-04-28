import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentCategory } from '../../../shared/enums/document-status.enum';

export class SearchDocumentDto {
  @ApiPropertyOptional({ description: 'Search by client name' })
  @IsOptional()
  @IsString()
  client_name?: string;

  @ApiPropertyOptional({ description: 'Search by client ID number' })
  @IsOptional()
  @IsString()
  client_id_number?: string;

  @ApiPropertyOptional({ description: 'Search by record number' })
  @IsOptional()
  @IsString()
  record_number?: string;

  @ApiPropertyOptional({
    description: 'Search by UPI (Unique Parcel Identifier)',
  })
  @IsOptional()
  @IsString()
  upi?: string;

  @ApiPropertyOptional({ description: 'Search by file name' })
  @IsOptional()
  @IsString()
  file_name?: string;

  @ApiPropertyOptional({
    description: 'Filter by document category',
    enum: DocumentCategory,
  })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @ApiPropertyOptional({ description: 'Record ID' })
  @IsOptional()
  @IsUUID()
  record_id?: string;

  @ApiPropertyOptional({ description: 'Book type' })
  @IsOptional()
  @IsString()
  book_type?: string;

  @ApiPropertyOptional({ description: 'Start date for served date filter' })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date for served date filter' })
  @IsOptional()
  @IsString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
