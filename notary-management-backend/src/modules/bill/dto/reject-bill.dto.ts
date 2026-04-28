/* eslint-disable @typescript-eslint/no-unused-vars */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  IsNumber,
  Min,
  Max,
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

export enum RefundType {
  NONE = 'none',
  FULL = 'full',
  HALF = 'half',
  CUSTOM = 'custom',
}

export class RejectBillDto {
  @ApiProperty({ description: 'Bill ID' })
  @IsUUID()
  bill_id: string;

  @ApiProperty({ description: 'Reason for rejection', enum: RejectionReason })
  @IsEnum(RejectionReason)
  reason: RejectionReason;

  @ApiPropertyOptional({ description: 'Additional notes about the rejection' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Type of refund to process',
    enum: RefundType,
    default: RefundType.NONE,
  })
  @IsEnum(RefundType)
  refund_type: RefundType = RefundType.NONE;

  @ApiPropertyOptional({
    description: 'Custom refund amount (only if refund_type is CUSTOM)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  custom_refund_amount?: number;
}
