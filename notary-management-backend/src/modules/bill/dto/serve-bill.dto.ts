import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { BookType } from '../../../shared/enums/book-type.enum';

export class ServeBillDto {
  @ApiProperty({ description: 'Bill ID' })
  @IsUUID()
  bill_id: string;

  @ApiProperty({ description: 'Book type for the record', enum: BookType })
  @IsEnum(BookType)
  book_type: BookType;

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
