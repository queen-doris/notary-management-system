/* eslint-disable @typescript-eslint/no-unused-vars */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';

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
