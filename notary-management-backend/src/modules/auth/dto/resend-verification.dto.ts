import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { EOtpType } from 'src/shared/enums/otp-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class ResendVerificationDto {
  @ApiProperty({ description: 'Phone number of the user' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Type of OTP to resend',
    enum: EOtpType,
    example: EOtpType.VERIFICATION,
  })
  @IsEnum(EOtpType)
  @IsNotEmpty()
  type: EOtpType;
}
