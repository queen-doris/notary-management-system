/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
  IsEnum,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ServiceCategory } from '../../../shared/enums/service-category.enum';
import { BookType } from '../../../shared/enums/book-type.enum';

export class CreateServiceCatalogDto {
  @IsEnum(ServiceCategory)
  category: ServiceCategory;

  @IsString()
  @MaxLength(100)
  sub_service: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  base_price?: number;

  @IsOptional()
  @IsBoolean()
  has_vat?: boolean;

  @IsOptional()
  @IsEnum(BookType)
  book_type?: BookType;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateServiceCatalogDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sub_service?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  base_price?: number;

  @IsOptional()
  @IsBoolean()
  has_vat?: boolean;

  @IsOptional()
  @IsEnum(BookType)
  book_type?: BookType;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
