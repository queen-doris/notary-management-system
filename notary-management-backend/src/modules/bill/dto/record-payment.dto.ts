import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsUUID,
} from 'class-validator';
import { PaymentMethod } from '../../../shared/enums/payment-method.enum';

export class RecordPaymentDto {
  @IsUUID()
  bill_id: string;

  @IsInt()
  @Min(1)
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RefundPaymentDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
