import { IsArray, ValidateNested, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import {
  NotaryServiceItemDto,
  SecretariatServiceItemDto,
} from './create-bill.dto';

export class AddItemsToBillDto {
  @IsUUID()
  bill_id: string;

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
}
