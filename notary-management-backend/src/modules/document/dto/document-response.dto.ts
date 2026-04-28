import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DocumentStatus,
  DocumentCategory,
} from '../../../shared/enums/document-status.enum';

export class DocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  record_id: string;

  @ApiProperty()
  record_display_number: string;

  @ApiProperty()
  client_name: string;

  @ApiProperty()
  client_id_number: string;

  @ApiProperty()
  file_name: string;

  @ApiProperty()
  file_url: string;

  @ApiProperty()
  file_size: number;

  @ApiProperty()
  file_size_mb: string;

  @ApiProperty()
  mime_type: string;

  @ApiProperty()
  public_id: string;

  @ApiPropertyOptional({ enum: DocumentCategory })
  category?: DocumentCategory;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  upi?: string;

  @ApiProperty()
  is_primary: boolean;

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;

  @ApiProperty()
  uploaded_by_name: string;

  @ApiProperty()
  uploaded_by_role: string;

  @ApiProperty()
  uploaded_at: Date;

  @ApiProperty()
  download_url: string;

  @ApiPropertyOptional()
  preview_url?: string;
}

export class PendingUploadItemDto {
  @ApiProperty()
  record_id: string;

  @ApiProperty()
  record_display_number: string;

  @ApiProperty()
  book_type: string;

  @ApiProperty()
  client_name: string;

  @ApiProperty()
  client_id_number: string;

  @ApiProperty()
  service_name: string;

  @ApiProperty()
  served_date: Date;

  @ApiProperty()
  days_since_served: number;

  @ApiProperty()
  document_count: number;

  @ApiProperty({ enum: ['high', 'medium', 'low'] })
  urgency: 'high' | 'medium' | 'low';
}

export class PaginatedDocumentsResponseDto {
  @ApiProperty({ type: [DocumentResponseDto] })
  data: DocumentResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class UploadDocumentResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  document: DocumentResponseDto;
}

export class BulkUploadResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  successful: DocumentResponseDto[];

  @ApiProperty()
  failed: Array<{ file: string; error: string }>;

  @ApiProperty()
  total_success: number;

  @ApiProperty()
  total_failed: number;
}
