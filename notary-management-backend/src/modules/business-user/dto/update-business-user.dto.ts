import { IsArray, IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';
import { EEmploymentStatus } from 'src/shared/enums/employee-status.enum';

export class UpdateBusinessUserDto {
  @IsOptional()
  @IsArray()
  @IsEnum(EBusinessRole, { each: true })
  roles?: EBusinessRole[];

  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/)
  staffCode?: string;

  @IsOptional()
  @IsEnum(EEmploymentStatus)
  employmentStatus?: EEmploymentStatus;

  @IsOptional()
  @IsString()
  jobTitle?: string;
}
