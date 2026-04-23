import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateBusinessLocationDto {
  @ApiPropertyOptional({
    description: 'Province where the business is located',
    example: 'Kigali',
    required: false,
  })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({
    description: 'District within the province',
    example: 'Nyarugenge',
    required: false,
  })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({
    description: 'Sector within the district',
    example: 'Nyamirambo',
    required: false,
  })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional({
    description: 'Cell within the sector',
    example: 'Nyamirambo Cell',
    required: false,
  })
  @IsOptional()
  @IsString()
  cell?: string;

  @ApiPropertyOptional({
    description: 'Village within the cell',
    example: 'Nyamirambo Village',
    required: false,
  })
  @IsOptional()
  @IsString()
  village?: string;

  @ApiPropertyOptional({
    description: 'Specific street address of the business',
    example: 'KN 123 St, Building A',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;
}
