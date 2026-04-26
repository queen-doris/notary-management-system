import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { NotaryServiceName } from '../../../shared/enums/notary-service-name.enum';
import { BookType } from '../../../shared/enums/book-type.enum';

export class CreateNotarySubServiceDto {
  @IsString()
  sub_service: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  base_price?: number;

  @IsEnum(BookType)
  book_type: BookType;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateNotaryServiceDto {
  @IsEnum(NotaryServiceName)
  service_name: NotaryServiceName;

  @IsOptional()
  @IsString()
  description?: string;
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
  @IsEnum(BookType)
  book_type?: BookType;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
