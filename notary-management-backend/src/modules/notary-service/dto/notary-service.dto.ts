import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({
    description: 'Category (parent service) name',
    example: 'Translation',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({
    description: 'Optional category description',
    example: 'Sworn translation services',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateNotaryServiceCategoryDto {
  @ApiPropertyOptional({ description: 'Category name', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ description: 'Category description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Active flag (false = deactivated)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CreateNotarySubServiceDto {
  @ApiProperty({
    description: 'Sub-service name (the billable line)',
    example: 'English → Kinyarwanda',
  })
  @IsString()
  sub_service: string;

  @ApiPropertyOptional({
    description: 'Base price in RWF',
    example: 5000,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  base_price?: number;

  @ApiPropertyOptional({
    description: 'UUID of the book records of this sub-service write into',
    example: '8f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f',
  })
  @IsOptional()
  @IsUUID()
  book_id?: string;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * Flat create: a sub-service under an existing category in one call.
 */
export class CreateNotaryServiceDto {
  @ApiProperty({
    description: 'UUID of the parent category',
    example: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @IsUUID()
  category_id: string;

  @ApiProperty({
    description: 'Sub-service name',
    example: 'Kinyarwanda → French',
  })
  @IsString()
  sub_service: string;

  @ApiPropertyOptional({
    description: 'Base price in RWF',
    example: 5000,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  base_price?: number;

  @ApiPropertyOptional({ description: 'UUID of the linked book' })
  @IsOptional()
  @IsUUID()
  book_id?: string;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * Create a brand-new service category together with its sub-services.
 */
export class CreateNotaryServiceBulkDto {
  @ApiProperty({
    description: 'The new category to create',
    type: CreateNotaryServiceCategoryDto,
  })
  @ValidateNested()
  @Type(() => CreateNotaryServiceCategoryDto)
  category: CreateNotaryServiceCategoryDto;

  @ApiProperty({
    description: 'One or more sub-services to create under the category',
    type: [CreateNotarySubServiceDto],
    minItems: 1,
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateNotarySubServiceDto)
  sub_services: CreateNotarySubServiceDto[];
}

export class UpdateNotarySubServiceDto {
  @ApiPropertyOptional({ description: 'Sub-service name' })
  @IsOptional()
  @IsString()
  sub_service?: string;

  @ApiPropertyOptional({
    description: 'Base price in RWF',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  base_price?: number;

  @ApiPropertyOptional({ description: 'UUID of the linked book' })
  @IsOptional()
  @IsUUID()
  book_id?: string;

  @ApiPropertyOptional({ description: 'Active flag' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsOptional()
  @IsString()
  description?: string;
}
