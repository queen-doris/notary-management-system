import { IsString, IsUUID, Matches } from 'class-validator';

export class StaffLoginDto {
  @IsUUID()
  businessId: string;

  @IsString()
  @Matches(/^\d{6}$/)
  staffCode: string;
}
