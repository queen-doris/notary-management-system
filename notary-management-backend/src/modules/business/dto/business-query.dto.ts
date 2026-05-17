import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { EBusinessType } from 'src/shared/enums/business-type.enum';

export class BusinessQueryDto {
  @ApiProperty({
    description: 'Business name to search',
    required: false,
  })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiProperty({
    description: 'Business type filter',
    required: false,
    enum: EBusinessType,
  })
  @IsOptional()
  @IsEnum(EBusinessType)
  businessType?: EBusinessType;

  @ApiProperty({
    description: 'Province filter',
    required: false,
  })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({
    description: 'District filter',
    required: false,
  })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({
    description: 'Sector filter',
    required: false,
  })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiProperty({
    description: 'Filter by verification status',
    required: false,
    type: Boolean,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVerified?: boolean;

  @ApiProperty({
    description:
      'Filter by active status (default: true for public). Set to false or omit for admin to get all.',
    required: false,
    type: Boolean,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Services filter (comma-separated)',
    required: false,
  })
  @IsOptional()
  @IsString()
  services?: string;

  @ApiProperty({
    description: 'Number of results per page',
    required: false,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({
    description:
      'Number of results to skip (default: 0). Use with limit for offset-based pagination.',
    required: false,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;

  @ApiProperty({
    description:
      'Page number (default: 1). Use with limit for page-based pagination. Takes precedence over offset.',
    required: false,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    description:
      'Return full business objects (incl. owner) instead of a simplified summary. Default: false.',
    required: false,
    type: Boolean,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeRelations?: boolean;
}
