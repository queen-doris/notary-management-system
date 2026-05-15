/* eslint-disable @typescript-eslint/no-unused-vars */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
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

export enum RefundOption {
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
    description: 'Refund option',
    enum: RefundOption,
    default: RefundOption.NONE,
  })
  @IsEnum(RefundOption)
  refund_option: RefundOption = RefundOption.NONE;

  @ApiPropertyOptional({
    description: 'Custom refund amount (only if refund_option is CUSTOM)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  custom_refund_amount?: number;
}

export class ProcessRefundDto {
  @ApiProperty({ description: 'Refund ID' })
  @IsUUID()
  refund_id: string;

  @ApiProperty({ description: 'Actual amount to refund' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Refund method (cash, bank, momo)' })
  @IsOptional()
  @IsString()
  refund_method?: string;

  @ApiPropertyOptional({ description: 'Transaction reference' })
  @IsOptional()
  @IsString()
  transaction_reference?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
