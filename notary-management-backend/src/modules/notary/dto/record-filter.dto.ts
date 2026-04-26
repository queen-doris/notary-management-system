import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookType } from '../../../shared/enums/book-type.enum';
import { RecordStatus } from '../../../shared/enums/record-status.enum';

export class RecordFilterDto {
  @IsOptional()
  @IsEnum(BookType)
  book_type?: BookType;

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsUUID()
  client_id?: string;

  @IsOptional()
  @IsUUID()
  bill_id?: string;

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

export class RecordDetailResponseDto {
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
  served_by: {
    id: string;
    full_name: string;
    role: string;
  };
  served_date: Date;
  client: {
    id: string;
    full_name: string;
    id_number: string;
    phone?: string;
    father_name?: string;
    mother_name?: string;
    verification_status: string;
  };
  bill: {
    id: string;
    bill_number: string;
    grand_total: number;
    paid_at?: Date;
  };
  created_at: Date;
  updated_at: Date;
}
