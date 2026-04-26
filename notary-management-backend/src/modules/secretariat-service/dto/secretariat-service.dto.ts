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
  @IsEnum(SecretariatServiceName)
  service_name: SecretariatServiceName;

  @IsOptional()
  @IsInt()
  @Min(0)
  base_price?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSecretariatServiceDto {
  @IsOptional()
  @IsString()
  service_name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  base_price?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
