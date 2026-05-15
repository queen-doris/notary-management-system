import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsString, MaxLength } from 'class-validator';

export class PutOnLeaveDTO {
  @ApiPropertyOptional({
    description: 'Leave start date (YYYY-MM-DD)',
    example: '2026-06-01',
  })
  @IsOptional()
  @IsDateString()
  leaveStartDate?: string;

  @ApiPropertyOptional({
    description: 'Leave end date (YYYY-MM-DD)',
    example: '2026-06-15',
  })
  @IsOptional()
  @IsDateString()
  leaveEndDate?: string;

  @ApiPropertyOptional({
    description: 'Reason for the leave',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiProperty({
    description: 'UUID of the staff user being put on leave',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  userId: string;
}
