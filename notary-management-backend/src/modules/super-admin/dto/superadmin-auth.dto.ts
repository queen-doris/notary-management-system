import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SuperadminAuthDto {
  @ApiProperty({
    description: 'Superadmin secret key for authorization',
    example: 'super-secure-admin-key-rex-2025',
  })
  @IsString()
  @IsNotEmpty()
  superadminSecretKey: string;
}
