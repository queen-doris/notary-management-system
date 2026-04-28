import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { BillStatus } from '../../../shared/enums/bill-status.enum';

export class UpdateBillStatusDto {
  @ApiProperty({ description: 'Bill ID' })
  @IsUUID()
  bill_id: string;

  @ApiProperty({ description: 'New bill status', enum: BillStatus })
  @IsEnum(BillStatus)
  status: BillStatus;

  @ApiPropertyOptional({
    description: 'Reason for status change (required for rejection)',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
