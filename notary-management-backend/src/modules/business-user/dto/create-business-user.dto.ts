import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';

export class CreateBusinessUserDto {
  @ApiProperty({
    description: 'UUID of the user to add to the business',
    example: '123e4567-e89b-12d3-a456-426614174001',
    format: 'uuid',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'UUID of the business',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  businessId: string;

  @ApiProperty({
    description: 'Roles to assign to the user within the business',
    enum: EBusinessRole,
    isArray: true,
    example: ['MANAGER', 'CASHIER'],
    minItems: 1,
  })
  @IsArray()
  @IsEnum(EBusinessRole, { each: true })
  roles: EBusinessRole[];

  @ApiProperty({
    description: 'Unique staff code (6 digits)',
    example: '001234',
    required: false,
    pattern: '^\\d{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/)
  staffCode?: string;
}
