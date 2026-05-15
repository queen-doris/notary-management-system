import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Phone number the OTP was sent to',
    example: '+250788123456',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'The OTP code received via SMS/email',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
