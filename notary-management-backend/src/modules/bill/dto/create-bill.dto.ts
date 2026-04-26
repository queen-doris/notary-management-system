import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsOptional,
  IsInt,
  Min,
  IsString,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BillType } from '../../../shared/enums/bill.enum';

export class NotaryServiceItemDto {
  @IsOptional()
  @IsUUID()
  service_id?: string;

  @IsString()
  service_name: string;

  @IsString()
  sub_service_name: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsInt()
  @Min(0)
  unit_price: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SecretariatServiceItemDto {
  @IsOptional()
  @IsUUID()
  service_id?: string;

  @IsString()
  service_name: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsInt()
  @Min(0)
  unit_price: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBillDto {
  @IsUUID()
  client_id: string;

  @IsEnum(BillType)
  bill_type: BillType;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotaryServiceItemDto)
  notary_items?: NotaryServiceItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SecretariatServiceItemDto)
  secretariat_items?: SecretariatServiceItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
