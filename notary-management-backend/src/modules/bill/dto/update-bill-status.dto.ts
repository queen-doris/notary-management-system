/* eslint-disable @typescript-eslint/no-unused-vars */
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { BillStatus } from '../../../shared/enums/bill.enum';

export class UpdateBillStatusDto {
  @IsEnum(BillStatus)
  status: BillStatus;

  @IsOptional()
  @IsString()
  rejection_reason?: string;

  @IsOptional()
  @IsString()
  rejection_notes?: string;
}

export class MarkBillPaidDto {
  @IsEnum(BillStatus)
  status: BillStatus = BillStatus.PAID;

  @IsOptional()
  @IsString()
  notes?: string;
}
