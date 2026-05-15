import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Matches } from 'class-validator';

export class StaffLoginDto {
  @ApiProperty({
    description: 'UUID of the business the staff member belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  businessId: string;

  @ApiProperty({
    description: '6-digit staff code issued to the staff member',
    example: '001234',
    pattern: '^\\d{6}$',
  })
  @IsString()
  @Matches(/^\d{6}$/)
  staffCode: string;
}
