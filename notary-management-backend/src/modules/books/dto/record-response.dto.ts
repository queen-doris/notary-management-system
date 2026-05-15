import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecordStatus } from '../../../shared/enums/record-status.enum';

export class ClientInfoDto {
  @ApiProperty() id: string;
  @ApiProperty() full_name: string;
  @ApiProperty() id_number: string;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() verification_status?: string;
}

export class BillInfoDto {
  @ApiProperty() id: string;
  @ApiProperty() bill_number: string;
  @ApiProperty() total_amount: number;
  @ApiProperty() status: string;
}

export class RecordResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() book_type: string;
  @ApiProperty({ nullable: true }) book_id: string | null;
  @ApiProperty({ nullable: true }) volume: string | null;
  @ApiProperty() record_number: string;
  @ApiProperty() display_number: string;
  @ApiProperty() service_category: string;
  @ApiProperty() sub_service: string;
  @ApiProperty() amount: number;
  @ApiProperty() vat_amount: number;
  @ApiProperty() total: number;
  @ApiPropertyOptional() upi?: string;
  @ApiPropertyOptional() document_description?: string;
  @ApiPropertyOptional() notary_notes?: string;
  @ApiProperty({ enum: RecordStatus }) status: RecordStatus;
  @ApiProperty() has_documents: boolean;
  @ApiProperty() served_by_name: string;
  @ApiProperty() served_date: Date;
  @ApiProperty({ type: ClientInfoDto }) client: ClientInfoDto;
  @ApiProperty({ type: BillInfoDto }) bill: BillInfoDto;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class RecordListItemDto {
  @ApiProperty() id: string;
  @ApiProperty() record_number: string;
  @ApiProperty({ nullable: true }) volume: string | null;
  @ApiProperty() number: string;
  @ApiProperty() client_name: string;
  @ApiProperty() client_id_number: string;
  @ApiProperty() service: string;
  @ApiProperty() amount: number;
  @ApiProperty() served_date: Date;
  @ApiProperty() has_documents: boolean;
}

export class PaginatedRecordsResponseDto {
  @ApiProperty({ type: [RecordListItemDto] })
  data: RecordListItemDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
