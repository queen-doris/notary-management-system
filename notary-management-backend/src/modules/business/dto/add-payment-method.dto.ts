import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

export class AddPaymentMethodDto {
  @ApiProperty({
    description: 'Name of the payment method',
    example: 'Mobile Money',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  methodName: string;

  @ApiPropertyOptional({
    description: 'Account number for the payment method',
    example: '0781234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({
    description: 'Name associated with the payment account',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiPropertyOptional({
    description: 'Whether the payment method is active and available for use',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
