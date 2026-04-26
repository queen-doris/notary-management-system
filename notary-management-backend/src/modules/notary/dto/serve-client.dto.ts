/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  IsUUID,
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { BookType } from '../../../shared/enums/book-type.enum';

export class ServeClientDto {
  @IsUUID()
  bill_id: string;

  @IsEnum(BookType)
  book_type: BookType;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  volume?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  record_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  upi?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  document_description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notary_notes?: string;

  @IsOptional()
  @IsBoolean()
  auto_increment?: boolean = true;
}

export class ServeClientResponseDto {
  message: string;
  record: {
    id: string;
    record_number: string;
    display_number: string;
    volume: string | null;
    book_type: BookType;
    client_name: string;
    service: string;
    amount: number;
    served_date: Date;
  };
  bill_updated: {
    id: string;
    status: string;
  };
}
