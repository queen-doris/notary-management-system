import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISmsOptions } from 'src/shared/interfaces/sms-options.interface';
import { PindoService } from './pindo.service';

@Injectable()
export class SmsService implements OnModuleInit {
  private readonly logger = new Logger(SmsService.name);
  private smsProvider: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly pindoService: PindoService,
  ) { }

  onModuleInit() {
    this.smsProvider = this.configService.get('SMS_PROVIDER') || 'pindo';
    this.logger.log(`SMS Service initialized with provider: ${this.smsProvider}`);
  }

  async sendWelcomeSms(phone: string, fullName: string): Promise<boolean> {
    return this.pindoService.sendWelcomeSms(phone, fullName);
  }

  async sendVerificationSms(phone: string, code: string): Promise<boolean> {
    return this.pindoService.sendVerificationSms(phone, code);
  }

  async sendPasswordResetSms(phone: string, code: string): Promise<boolean> {
    return this.pindoService.sendPasswordResetSms(phone, code);
  }

  async sendNotificationSms(phone: string, message: string): Promise<boolean> {
    return this.pindoService.sendNotificationSms(phone, message);
  }

  async sendSms(options: ISmsOptions): Promise<boolean> {
    const result = await this.pindoService.sendSms(
      options.to,
      options.body,
      options.from,
    );
    return !!result;
  }

  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    // Note: Pindo doesn't have a phone validation API like Twilio
    // We can implement basic validation or skip this feature
    const phoneRegex = /^\+?250[0-9]{9}$/;
    const normalized = phoneNumber.replace(/[\s-]/g, '');
    const formatted = normalized.startsWith('0') ? '+250' + normalized.substring(1) : normalized;

    const isValid = phoneRegex.test(formatted);
    if (!isValid) {
      this.logger.warn(`Phone validation failed for ${phoneNumber}`);
    }
    return isValid;
  }

  async sendPaymentUpdate(
    phone: string,
    orderNumber: string,
    status: string,
  ): Promise<boolean> {
    return this.pindoService.sendPaymentUpdate(phone, orderNumber, status);
  }

  async sendPaymentSuccess(
    phone: string,
    orderNumber: string,
    amount: number,
  ): Promise<boolean> {
    return this.pindoService.sendPaymentSuccess(phone, orderNumber, amount);
  }

  async sendOrderStatusUpdate(
    phone: string,
    orderNumber: string,
    status: string,
  ): Promise<boolean> {
    return this.pindoService.sendOrderStatusUpdate(phone, orderNumber, status);
  }
}
