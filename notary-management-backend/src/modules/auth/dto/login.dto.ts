import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: '+250788123456',
    description: 'Phone number of the user',
  })
  @IsNotEmpty({ message: 'Phone number is required please.' })
  @IsPhoneNumber('RW')
  phone: string;

  @ApiProperty({ example: 'Password@123', description: 'User password' })
  @IsNotEmpty({ message: 'Password is required please.' })
  password: string;
}
