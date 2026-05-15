import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { SecretariatServiceName } from '../../../shared/enums/secretariat-service-name.enum';

export class CreateSecretariatServiceDto {
  @ApiProperty({
    description: 'Secretariat service name',
    enum: SecretariatServiceName,
    example: SecretariatServiceName.SCANS,
  })
  @IsEnum(SecretariatServiceName)
  service_name: SecretariatServiceName;

  @ApiPropertyOptional({
    description: 'Base price in RWF',
    example: 4000,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  base_price?: number;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSecretariatServiceDto {
  @ApiPropertyOptional({ description: 'Service name' })
  @IsOptional()
  @IsString()
  service_name?: string;

  @ApiPropertyOptional({
    description: 'Base price in RWF',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  base_price?: number;

  @ApiPropertyOptional({ description: 'Active flag' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsOptional()
  @IsString()
  description?: string;
}
