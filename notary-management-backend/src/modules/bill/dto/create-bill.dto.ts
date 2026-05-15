import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsOptional,
  IsInt,
  Min,
  IsString,
  IsEnum,
  IsPositive,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BillType } from '../../../shared/enums/bill-status.enum';

export class NotaryServiceItemDto {
  @ApiProperty({
    description: 'ID of the notary service (from notary_services table)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  service_id?: string;

  @ApiProperty({
    description:
      'Service name (e.g., legalisation, notification, actes, ubutaka, imirage)',
  })
  @IsString()
  service_name: string;

  @ApiProperty({
    description: 'Sub-service name (e.g., Indahiro, Diplome, Ubugure, etc.)',
  })
  @IsString()
  sub_service_name: string;

  @ApiProperty({
    description: 'Quantity of service items',
    default: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description:
      'Unit price in RWF (auto-filled from catalog if service_id provided)',
  })
  @IsInt()
  @IsPositive()
  unit_price: number;

  @ApiPropertyOptional({
    description: 'Additional notes for this service item',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SecretariatServiceItemDto {
  @ApiProperty({
    description:
      'ID of the secretariat service (from secretariat_services table)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  service_id?: string;

  @ApiProperty({
    description: 'Service name (e.g., mutation, inyandiko, attestations, etc.)',
  })
  @IsString()
  service_name: string;

  @ApiProperty({
    description: 'Quantity of service items',
    default: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description:
      'Unit price in RWF (auto-filled from catalog if service_id provided)',
  })
  @IsInt()
  @IsPositive()
  unit_price: number;

  @ApiPropertyOptional({
    description: 'Additional notes for this service item',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBillDto {
  @ApiProperty({ description: 'ID of the client' })
  @IsUUID()
  client_id: string;

  @ApiProperty({
    description: 'Type of bill',
    enum: BillType,
    example: BillType.BOTH,
    enumName: 'BillType',
  })
  @IsEnum(BillType)
  bill_type: BillType;

  @ApiPropertyOptional({
    description:
      'Notary service items (if bill_type is NOTARY or BOTH). A bill may carry AT MOST ONE notary sub-service; use quantity for multiples of the same sub-service.',
    type: [NotaryServiceItemDto],
    maxItems: 1,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1, {
    message: 'A bill may carry at most one notary sub-service',
  })
  @ValidateNested({ each: true })
  @Type(() => NotaryServiceItemDto)
  notary_items?: NotaryServiceItemDto[];

  @ApiPropertyOptional({
    description:
      'Secretariat service items (if bill_type is SECRETARIAT or BOTH)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SecretariatServiceItemDto)
  secretariat_items?: SecretariatServiceItemDto[];

  @ApiPropertyOptional({ description: 'Additional notes for the bill' })
  @IsOptional()
  @IsString()
  notes?: string;
}
