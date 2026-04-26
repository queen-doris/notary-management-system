import { IsOptional, IsString, IsInt, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchClientDto {
  @IsOptional()
  @IsString()
  q?: string; // search query for name or ID

  @IsOptional()
  @IsString()
  id_number?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  verification_status?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
