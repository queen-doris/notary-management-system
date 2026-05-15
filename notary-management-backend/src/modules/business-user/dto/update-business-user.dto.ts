import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';
import { EEmploymentStatus } from 'src/shared/enums/employee-status.enum';

export class UpdateBusinessUserDto {
  @ApiPropertyOptional({
    description: 'Business roles for this membership',
    enum: EBusinessRole,
    isArray: true,
    example: [EBusinessRole.RECEPTIONIST],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(EBusinessRole, { each: true })
  roles?: EBusinessRole[];

  @ApiPropertyOptional({
    description: '6-digit staff code',
    example: '001234',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/)
  staffCode?: string;

  @ApiPropertyOptional({
    description: 'Employment status',
    enum: EEmploymentStatus,
  })
  @IsOptional()
  @IsEnum(EEmploymentStatus)
  employmentStatus?: EEmploymentStatus;

  @ApiPropertyOptional({
    description: 'Job title',
    example: 'Senior Receptionist',
  })
  @IsOptional()
  @IsString()
  jobTitle?: string;
}
