import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
  IsUUID,
  ValidateNested,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNotaryServiceCategoryDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateNotaryServiceCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CreateNotarySubServiceDto {
  @IsString()
  sub_service: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  base_price?: number;

  @IsOptional()
  @IsUUID()
  book_id?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * Flat create: category + sub-service in one call.
 */
export class CreateNotaryServiceDto {
  @IsUUID()
  category_id: string;

  @IsString()
  sub_service: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  base_price?: number;

  @IsOptional()
  @IsUUID()
  book_id?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * Create a brand-new service category together with its sub-services.
 */
export class CreateNotaryServiceBulkDto {
  @ValidateNested()
  @Type(() => CreateNotaryServiceCategoryDto)
  category: CreateNotaryServiceCategoryDto;

  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateNotarySubServiceDto)
  sub_services: CreateNotarySubServiceDto[];
}

export class UpdateNotarySubServiceDto {
  @IsOptional()
  @IsString()
  sub_service?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  base_price?: number;

  @IsOptional()
  @IsUUID()
  book_id?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
