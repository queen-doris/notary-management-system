import { BookType } from '../../../shared/enums/book-type.enum';
import { RecordStatus } from '../../../shared/enums/record-status.enum';

export class ClientInfoDto {
  id: string;
  full_name: string;
  id_number: string;
  phone?: string;
  verification_status?: string;
}

export class BillInfoDto {
  id: string;
  bill_number: string;
  total_amount: number;
  status: string;
}

export class RecordResponseDto {
  id: string;
  book_type: BookType;
  volume: string | null;
  record_number: string;
  display_number: string;
  service_category: string;
  sub_service: string;
  amount: number;
  vat_amount: number;
  total: number;
  upi?: string;
  document_description?: string;
  notary_notes?: string;
  status: RecordStatus;
  has_documents: boolean;
  served_by_name: string;
  served_date: Date;
  client: ClientInfoDto;
  bill: BillInfoDto;
  created_at: Date;
  updated_at: Date;
}

export class RecordListItemDto {
  id: string;
  record_number: string;
  volume: string | null;
  number: string;
  client_name: string;
  client_id_number: string;
  service: string;
  amount: number;
  served_date: Date;
  has_documents: boolean;
}

export class PaginatedRecordsResponseDto {
  data: RecordListItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
