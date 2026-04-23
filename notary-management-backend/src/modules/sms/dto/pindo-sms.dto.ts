export class SendSmsDto {
  to: string;
  text: string;
  sender?: string;
}

export class BulkRecipient {
  phonenumber: string;
  name?: string;
  [key: string]: any;
}

export class SendBulkSmsDto {
  recipients: BulkRecipient[];
  text: string;
  sender?: string;
}

export class GenerateOtpDto {
  brand: string;
  number: string;
}

export class VerifyOtpDto {
  code: string;
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
