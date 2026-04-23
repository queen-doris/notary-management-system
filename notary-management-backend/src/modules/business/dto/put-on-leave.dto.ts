import {
  IsOptional,
  IsDateString,
  IsString,
  MaxLength,
} from 'class-validator';

export class PutOnLeaveDTO {
  @IsOptional()
  @IsDateString()
  leaveEndDate?: string;

  @IsOptional()
  @IsDateString()
  leaveStartDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsString()
  userId: string;
}
