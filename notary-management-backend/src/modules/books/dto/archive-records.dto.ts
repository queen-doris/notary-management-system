import {
  IsOptional,
  IsDateString,
  IsBoolean,
  IsUUID,
} from 'class-validator';

export class ArchiveRecordsDto {
  @IsDateString()
  before_date: string;

  @IsOptional()
  @IsUUID()
  book_id?: string;

  @IsOptional()
  @IsBoolean()
  confirm?: boolean = false;
}

export class ArchiveRecordsResponseDto {
  message: string;
  archived_count: number;
  book_id?: string;
  before_date: string;
}
