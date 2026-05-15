import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { DocumentCategory } from '../../../shared/enums/document-status.enum';

export class UploadDocumentDto {
  @ApiProperty({ description: 'Record ID to attach document to' })
  @IsUUID()
  record_id: string;

  @ApiProperty({
    description: 'File to upload (multipart/form-data)',
    type: 'string',
    format: 'binary',
  })
  file: any;

  @ApiPropertyOptional({
    description: 'Document category',
    enum: DocumentCategory,
    default: DocumentCategory.OTHER,
  })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @ApiPropertyOptional({ description: 'Document description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'UPI (Unique Parcel Identifier) for land documents',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  upi?: string;

  @ApiPropertyOptional({
    description: 'Is this the primary document for this record?',
  })
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}

export class UpdateDocumentMetadataDto {
  @ApiPropertyOptional({
    description: 'Document category',
    enum: DocumentCategory,
  })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @ApiPropertyOptional({ description: 'Document description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'UPI (Unique Parcel Identifier)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  upi?: string;

  @ApiPropertyOptional({ description: 'Is this the primary document?' })
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}
