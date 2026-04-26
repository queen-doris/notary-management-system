/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { BookType } from '../../../shared/enums/book-type.enum';

export class ImportRecordsDto {
  @IsEnum(BookType)
  book_type: BookType;

  @IsOptional()
  @IsBoolean()
  skip_duplicates?: boolean = true;

  @IsOptional()
  @IsBoolean()
  update_trackers?: boolean = true;
}

export class ImportValidationResultDto {
  valid_records: number;
  invalid_records: number;
  duplicate_records: number;
  errors: {
    row: number;
    field: string;
    error: string;
    value: any;
  }[];
  preview: {
    client_name: string;
    record_number: string;
    volume?: string;
    service: string;
    amount: number;
    date: string;
  }[];
}

export class BulkRecordCreateDto {
  @IsEnum(BookType)
  book_type: BookType;

  @IsArray()
  records: {
    client_id: string;
    record_number: string;
    volume?: string;
    service_category: string;
    sub_service: string;
    amount: number;
    vat_amount?: number;
    upi?: string;
    served_date: string;
    notary_notes?: string;
  }[];
}
