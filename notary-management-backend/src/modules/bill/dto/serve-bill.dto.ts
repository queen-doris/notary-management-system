import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';

export class ServeBillDto {
  @ApiProperty({ description: 'Bill ID' })
  @IsUUID()
  bill_id: string;

  @ApiProperty({ description: 'Book ID the record will be written into' })
  @IsUUID()
  book_id: string;

  @ApiPropertyOptional({
    description: 'Volume number (auto-generated if not provided)',
  })
  @IsOptional()
  @IsString()
  volume?: string;

  @ApiPropertyOptional({
    description: 'Record number (auto-generated if not provided)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  record_number?: number;

  @ApiPropertyOptional({
    description: 'UPI (Unique Parcel Identifier) - required for land records',
  })
  @IsOptional()
  @IsString()
  upi?: string;

  @ApiPropertyOptional({ description: 'Notary notes for the record' })
  @IsOptional()
  @IsString()
  notary_notes?: string;
}
