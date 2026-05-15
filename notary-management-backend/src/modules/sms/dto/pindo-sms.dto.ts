import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendSmsDto {
  @ApiProperty({
    description: 'Recipient phone (E.164)',
    example: '+250788123456',
  })
  to: string;

  @ApiProperty({
    description: 'Message body',
    example: 'Your record is ready.',
  })
  text: string;

  @ApiPropertyOptional({ description: 'Sender ID', example: 'NOTARY' })
  sender?: string;
}

export class BulkRecipient {
  @ApiProperty({
    description: 'Recipient phone (E.164)',
    example: '+250788123456',
  })
  phonenumber: string;

  @ApiPropertyOptional({ description: 'Recipient name' })
  name?: string;

  [key: string]: any;
}

export class SendBulkSmsDto {
  @ApiProperty({ type: [BulkRecipient], description: 'Recipients list' })
  recipients: BulkRecipient[];

  @ApiProperty({ description: 'Message body' })
  text: string;

  @ApiPropertyOptional({ description: 'Sender ID' })
  sender?: string;
}

export class GenerateOtpDto {
  @ApiProperty({ description: 'Brand/app name shown in the OTP message' })
  brand: string;

  @ApiProperty({
    description: 'Phone number (E.164)',
    example: '+250788123456',
  })
  number: string;
}

export class VerifyOtpDto {
  @ApiProperty({ description: 'The OTP code', example: '123456' })
  code: string;

  @ApiProperty({
    description: 'Request id returned by generate-otp',
    example: 12345,
  })
  request_id: number;
}

// Response interfaces
export interface PindoSmsResponse {
  bonus: number;
  discount: number;
  item_count: number;
  item_price: number;
  remaining_balance: number;
  self_url: string;
  sms_id: string;
  status: string;
  to: string;
  total_cost: number;
}

export interface PindoOtpResponse {
  message: string;
  network?: string;
  remaining_balance: number;
  request_id: number;
}

export interface PindoDeliveryReport {
  status: string;
  sms_id: number;
  modified_at: string;
  retries_count: number;
}

export interface PindoInboundSms {
  from: string;
  to: string;
  created_at: string;
  sms_id: number;
  text: string;
  telco: string;
}
