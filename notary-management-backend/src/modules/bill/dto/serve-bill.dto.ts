import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';

export class ServeBillDto {
  @ApiProperty({
    description: 'Bill ID being served (must be PAID or REJECTED)',
    example: '2b9d6e1a-1c4f-4d8a-9b2e-3c5a7e9f1d0b',
  })
  @IsUUID()
  bill_id: string;

  @ApiProperty({
    description: 'Book ID the notary record will be written into',
    example: '8f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f',
  })
  @IsUUID()
  book_id: string;

  @ApiPropertyOptional({
    description:
      'Confirmed volume. Defaults to the value returned by serve-preview if omitted.',
    example: 'IV',
  })
  @IsOptional()
  @IsString()
  volume?: string;

  @ApiPropertyOptional({
    description:
      'Confirmed record number. Defaults to the next number from serve-preview if omitted.',
    example: 142,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  record_number?: number;

  @ApiPropertyOptional({
    description:
      'UPI (Unique Parcel Identifier). Required when the target book has requires_upi=true and the client has no UPI on file.',
    example: '1/02/08/03/1234',
  })
  @IsOptional()
  @IsString()
  upi?: string;

  @ApiPropertyOptional({
    description: 'Optional notary notes recorded on the notary record',
  })
  @IsOptional()
  @IsString()
  notary_notes?: string;
}

export class ServePreviewNotaryItemDto {
  @ApiProperty() service_name: string;
  @ApiProperty() sub_service_name: string;
  @ApiProperty() quantity: number;
  @ApiProperty() unit_price: number;
  @ApiProperty() subtotal: number;
  @ApiProperty() vat_amount: number;
  @ApiProperty() grand_total: number;
}

export class ServePreviewResponseDto {
  @ApiProperty({ description: 'Bill being previewed' })
  bill_id: string;

  @ApiProperty({ description: 'Target book ID' })
  book_id: string;

  @ApiProperty({ description: 'Target book display name' })
  book_name: string;

  @ApiProperty({
    description: 'Suggested volume (owner may edit before confirming)',
    nullable: true,
  })
  suggested_volume: string | null;

  @ApiProperty({
    description: 'Suggested next record number (owner may edit)',
  })
  suggested_record_number: number;

  @ApiProperty({
    description: 'Suggested display number, e.g. "142/IV"',
  })
  suggested_display_number: string;

  @ApiProperty({
    description: 'Suggested UPI from the client record (owner may edit)',
    nullable: true,
  })
  suggested_upi: string | null;

  @ApiProperty({
    description: 'Whether this book requires a UPI to serve',
  })
  requires_upi: boolean;

  @ApiProperty({
    description: 'Snapshot of the single notary line that will be recorded',
    type: ServePreviewNotaryItemDto,
  })
  notary_item: ServePreviewNotaryItemDto;
}
