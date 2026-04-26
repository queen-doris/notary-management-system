import { IsString, IsOptional, MaxLength, IsUUID } from 'class-validator';

export class AddRecordNoteDto {
  @IsUUID()
  record_id: string;

  @IsString()
  @MaxLength(1000)
  note: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  note_type?: string;
}

export class UpdateDocumentDescriptionDto {
  @IsUUID()
  record_id: string;

  @IsString()
  @MaxLength(500)
  document_description: string;
}

export class RecordNoteResponseDto {
  id: string;
  record_id: string;
  note: string;
  note_type: string;
  created_by_name: string;
  created_at: Date;
}
