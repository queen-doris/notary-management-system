import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateClientDto } from './create-client.dto';
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { VerificationStatus } from '../../../shared/enums/client.enum';

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @ApiPropertyOptional({
    description: 'Active flag (false = deactivated)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Verification status',
    enum: VerificationStatus,
  })
  @IsOptional()
  @IsEnum(VerificationStatus)
  verification_status?: VerificationStatus;

  @ApiPropertyOptional({ description: 'Verification notes' })
  @IsOptional()
  @IsString()
  verification_notes?: string;
}
