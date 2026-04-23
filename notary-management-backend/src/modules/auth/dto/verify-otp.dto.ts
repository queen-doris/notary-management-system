import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ description: 'Attribute' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Attribute' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
