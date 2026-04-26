import { IsUUID, IsOptional, IsBoolean, IsString } from 'class-validator';

export class ReprintRecordDto {
  @IsUUID()
  record_id: string;

  @IsOptional()
  @IsBoolean()
  include_attachments?: boolean = false;

  @IsOptional()
  @IsString()
  format?: 'pdf' | 'html' = 'pdf';
}

export class ReprintRecordResponseDto {
  message: string;
  record: {
    id: string;
    record_number: string;
    display_number: string;
    client_name: string;
    service: string;
    amount: number;
    served_date: Date;
  };
  download_url: string;
  file_size: number;
}
