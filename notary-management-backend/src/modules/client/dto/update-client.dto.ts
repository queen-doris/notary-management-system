import { PartialType } from '@nestjs/mapped-types';
import { CreateClientDto } from './create-client.dto';
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { VerificationStatus } from '../../../shared/enums/client.enum';

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsEnum(VerificationStatus)
  verification_status?: VerificationStatus;

  @IsOptional()
  @IsString()
  verification_notes?: string;
}
