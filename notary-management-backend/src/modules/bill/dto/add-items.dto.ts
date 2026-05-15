import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  ValidateNested,
  IsOptional,
  IsUUID,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  NotaryServiceItemDto,
  SecretariatServiceItemDto,
} from './create-bill.dto';

export class AddItemsToBillDto {
  @ApiProperty({ description: 'ID of the pending bill to add items to' })
  @IsUUID()
  bill_id: string;

  @ApiPropertyOptional({
    description:
      'Notary items to add. A bill may carry AT MOST ONE notary sub-service in total (existing + added).',
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
    description: 'Secretariat items to add to the bill.',
    type: [SecretariatServiceItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SecretariatServiceItemDto)
  secretariat_items?: SecretariatServiceItemDto[];
}
