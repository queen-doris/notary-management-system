import {
  IsUUID,
  IsString,
  IsOptional,
  MaxLength,
  IsEnum,
  IsBoolean,
} from 'class-validator';

export enum RejectionReason {
  INCOMPLETE_DOCUMENTS = 'incomplete_documents',
  INCORRECT_INFORMATION = 'incorrect_information',
  CLIENT_CANCELLED = 'client_cancelled',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  ID_EXPIRED = 'id_expired',
  MISSING_SIGNATURES = 'missing_signatures',
  PAYMENT_ISSUE = 'payment_issue',
  OTHER = 'other',
}

export class RejectClientDto {
  @IsUUID()
  bill_id: string;

  @IsEnum(RejectionReason)
  rejection_reason: RejectionReason;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rejection_notes?: string;

  @IsOptional()
  @IsBoolean()
  process_refund?: boolean = true;
}

export class RejectClientResponseDto {
  message: string;
  bill_id: string;
  rejection_reason: string;
  rejection_notes?: string;
  refund_initiated: boolean;
  refund_amount?: number;
}
