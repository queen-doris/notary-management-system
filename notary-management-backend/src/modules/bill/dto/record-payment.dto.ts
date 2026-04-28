import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsPositive,
  IsUUID,
} from 'class-validator';
import { PaymentMethod } from '../../../shared/enums/bill-status.enum';

export class RecordPaymentDto {
  @ApiProperty({ description: 'Bill ID' })
  @IsUUID()
  bill_id: string;

  @ApiProperty({ description: 'Payment amount in RWF', minimum: 1 })
  @IsInt()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Transaction reference number (for bank/momo)',
  })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Payment notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
