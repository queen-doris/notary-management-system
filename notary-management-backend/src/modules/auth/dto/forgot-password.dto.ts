import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Phone number of the user',
    example: '+250788123456',
  })
  @IsPhoneNumber('RW')
  @IsNotEmpty({ message: 'User phone number is required please.' })
  phone: string;
}
