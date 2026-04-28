import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BulkUploadItemDto {
  @ApiProperty({ description: 'Record ID' })
  @IsUUID()
  record_id: string;

  @ApiProperty({ description: 'Document description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Document category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'UPI for land documents' })
  @IsOptional()
  @IsString()
  upi?: string;
}

export class BulkUploadDto {
  @ApiProperty({
    description: 'Files to upload (multipart/form-data)',
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  files: any[];

  @ApiProperty({
    description: 'Metadata for each file',
    type: [BulkUploadItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUploadItemDto)
  metadata: BulkUploadItemDto[];
}
