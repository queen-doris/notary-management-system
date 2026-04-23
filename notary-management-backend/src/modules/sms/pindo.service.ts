import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  SendSmsDto,
  SendBulkSmsDto,
  GenerateOtpDto,
  VerifyOtpDto,
  PindoSmsResponse,
  PindoOtpResponse,
} from './dto/pindo-sms.dto';

@Injectable()
export class PindoService implements OnModuleInit {
  private readonly logger = new Logger(PindoService.name);
  private apiToken: string | undefined;
  private senderName: string;
  private apiUrl: string;
  private isConfigured: boolean = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  onModuleInit() {
    this.initialize();
  }

  private initialize() {
    this.apiToken = this.configService.get('PINDO_API_TOKEN');
    this.senderName = this.configService.get('PINDO_SENDER_NAME') || 'Rex Plus';
    this.apiUrl =
      this.configService.get('PINDO_API_URL') || 'https://api.pindo.io/v1';

    if (!this.apiToken) {
      this.logger.warn(
        'Pindo API token not configured. SMS service will be disabled.',
      );
      this.isConfigured = false;
      return;
    }

    this.isConfigured = true;
    this.logger.log('Pindo SMS service initialized successfully');
    this.logger.log(`Default sender: ${this.senderName}`);
  }

  /**
   * Get authorization headers for Pindo API requests
   */
  private getHeaders() {
    return {
      Authorization: `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Format phone number to international format
   * Converts local Rwanda numbers (078..., 073...) to +250...
   */
  private formatPhoneNumber(phone: string): string {
    // Remove spaces and hyphens
    let formatted = phone.replace(/[\s-]/g, '');

    // If starts with 0, replace with +250
    if (formatted.startsWith('0')) {
      formatted = '+250' + formatted.substring(1);
    }

    // If doesn't start with +, add +250
    if (!formatted.startsWith('+')) {
      formatted = '+250' + formatted;
    }

    return formatted;
  }

  /**
   * Send a single SMS
   */
  async sendSms(
    to: string,
    text: string,
    sender?: string,
  ): Promise<PindoSmsResponse | null> {
    if (!this.isConfigured) {
      this.logger.warn('Pindo not configured. Skipping SMS send.');
      return null;
    }

    try {
      const payload: SendSmsDto = {
        to: this.formatPhoneNumber(to),
        text,
        sender: sender || this.senderName,
      };

      this.logger.log(`Sending SMS to ${payload.to}`);

      const response = await firstValueFrom(
        this.httpService.post<PindoSmsResponse>(
          `${this.apiUrl}/sms/`,
          payload,
          { headers: this.getHeaders() },
        ),
      );

      this.logger.log(
        `SMS sent successfully to ${payload.to} | SMS ID: ${response.data.sms_id} | Cost: ${response.data.total_cost} | Balance: ${response.data.remaining_balance}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to send SMS to ${to}: ${error.response?.data?.message || error.message}`,
      );
      this.logger.error(`Error details: ${JSON.stringify(error.response?.data)}`);
      return null;
    }
  }

  /**
   * Send bulk SMS with variable support
   */
  async sendBulkSms(
    recipients: Array<{ phonenumber: string; name?: string; [key: string]: any }>,
    text: string,
    sender?: string,
  ): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.warn('Pindo not configured. Skipping bulk SMS send.');
      return false;
    }

    try {
      // Format phone numbers
      const formattedRecipients = recipients.map((r) => ({
        ...r,
        phonenumber: this.formatPhoneNumber(r.phonenumber),
      }));

      const payload: SendBulkSmsDto = {
        recipients: formattedRecipients,
        text,
        sender: sender || this.senderName,
      };

      this.logger.log(`Sending bulk SMS to ${recipients.length} recipients`);

      const response = await firstValueFrom(
        this.httpService.post(`${this.apiUrl}/sms/bulk`, payload, {
          headers: this.getHeaders(),
        }),
      );

      this.logger.log(
        `Bulk SMS sent successfully to ${recipients.length} recipients`,
      );
      this.logger.log(`Response: ${JSON.stringify(response.data)}`);

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send bulk SMS: ${error.response?.data?.message || error.message}`,
      );
      this.logger.error(`Error details: ${JSON.stringify(error.response?.data)}`);
      return false;
    }
  }

  /**
   * Generate OTP for verification
   */
  async generateOtp(
    phoneNumber: string,
    brand?: string,
  ): Promise<PindoOtpResponse | null> {
    if (!this.isConfigured) {
      this.logger.warn('Pindo not configured. Skipping OTP generation.');
      return null;
    }

    try {
      const payload: GenerateOtpDto = {
        brand: brand || this.senderName,
        number: this.formatPhoneNumber(phoneNumber),
      };

      this.logger.log(`Generating OTP for ${payload.number}`);

      const response = await firstValueFrom(
        this.httpService.post<PindoOtpResponse>(
          `${this.apiUrl}/sms/verify`,
          payload,
          { headers: this.getHeaders() },
        ),
      );

      this.logger.log(
        `OTP generated successfully | Request ID: ${response.data.request_id} | Balance: ${response.data.remaining_balance}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to generate OTP for ${phoneNumber}: ${error.response?.data?.message || error.message}`,
      );
      this.logger.error(`Error details: ${JSON.stringify(error.response?.data)}`);
      return null;
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(
    code: string,
    requestId: number,
  ): Promise<PindoOtpResponse | null> {
    if (!this.isConfigured) {
      this.logger.warn('Pindo not configured. Skipping OTP verification.');
      return null;
    }

    try {
      const payload: VerifyOtpDto = {
        code,
        request_id: requestId,
      };

      this.logger.log(`Verifying OTP | Request ID: ${requestId}`);

      const response = await firstValueFrom(
        this.httpService.post<PindoOtpResponse>(
          `${this.apiUrl}/sms/verify/check`,
          payload,
          { headers: this.getHeaders() },
        ),
      );

      this.logger.log(
        `OTP verified successfully | Request ID: ${requestId}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to verify OTP: ${error.response?.data?.message || error.message}`,
      );
      this.logger.error(`Error details: ${JSON.stringify(error.response?.data)}`);
      return null;
    }
  }

  /**
   * Check OTP verification status
   */
  async checkOtpStatus(requestId: number): Promise<any> {
    if (!this.isConfigured) {
      this.logger.warn('Pindo not configured. Skipping OTP status check.');
      return null;
    }

    try {
      this.logger.log(`Checking OTP status | Request ID: ${requestId}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/sms/verify/status/${requestId}`, {
          headers: this.getHeaders(),
        }),
      );

      this.logger.log(`OTP status retrieved for Request ID: ${requestId}`);

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to check OTP status: ${error.response?.data?.message || error.message}`,
      );
      return null;
    }
  }

  /**
   * Cancel OTP verification request
   */
  async cancelOtp(requestId: number): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.warn('Pindo not configured. Skipping OTP cancellation.');
      return false;
    }

    try {
      this.logger.log(`Canceling OTP | Request ID: ${requestId}`);

      await firstValueFrom(
        this.httpService.put(
          `${this.apiUrl}/sms/verify/cancel/${requestId}`,
          {},
          { headers: this.getHeaders() },
        ),
      );

      this.logger.log(`OTP canceled successfully | Request ID: ${requestId}`);

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to cancel OTP: ${error.response?.data?.message || error.message}`,
      );
      return false;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<number> {
    if (!this.isConfigured) {
      this.logger.warn('Pindo not configured. Cannot check balance.');
      return 0;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/balance`, {
          headers: this.getHeaders(),
        }),
      );

      const balance = response.data?.balance || 0;
      this.logger.log(`Account balance: ${balance}`);

      return balance;
    } catch (error) {
      this.logger.warn(
        'Balance check failed (endpoint may not be available in your Pindo plan)',
      );
      this.logger.debug(`Balance error: ${error.message}`);
      return 0; // Return 0 instead of throwing
    }
  }

  /**
   * Send welcome SMS to new users
   */
  async sendWelcomeSms(phone: string, fullName: string): Promise<boolean> {
    const text = `Welcome ${fullName}! Your account has been successfully created at Rex Plus. Thank you for joining us!`;
    const result = await this.sendSms(phone, text);
    return !!result;
  }

  /**
   * Send verification SMS with OTP
   */
  async sendVerificationSms(phone: string, code: string): Promise<boolean> {
    // Pindo's built-in Verify API
    // const result = await this.generateOtp(phone);
    // return !!result;

    // Send custom OTP message
    const text = `Your REX Plus verification code is: ${code}. This code will expire in 10 minutes.`;
    const result = await this.sendSms(phone, text);
    return !!result;
  }

  /**
   * Send password reset SMS with OTP
   */
  async sendPasswordResetSms(phone: string, code: string): Promise<boolean> {
    const text = `Your Rex Plus password reset code is: ${code}. This code will expire in 15 minutes. If you didn't request this, please ignore this message.`;
    const result = await this.sendSms(phone, text);
    return !!result;
  }

  /**
   * Send general notification SMS
   */
  async sendNotificationSms(phone: string, message: string): Promise<boolean> {
    const result = await this.sendSms(phone, message);
    return !!result;
  }

  /**
   * Send payment update notification
   */
  async sendPaymentUpdate(
    phone: string,
    orderNumber: string,
    status: string,
  ): Promise<boolean> {
    let message = '';

    switch (status) {
      case 'PAID':
        message = `Payment successful for order ${orderNumber}. Thank you for your business!`;
        break;
      case 'PAYMENT_FAILED':
        message = `Payment failed for order ${orderNumber}. Please try again or contact support.`;
        break;
      case 'PENDING':
        message = `Payment pending for order ${orderNumber}. Please complete the payment to confirm your order.`;
        break;
      default:
        message = `Payment ${status.toLowerCase()} for order ${orderNumber}.`;
    }

    const result = await this.sendSms(phone, message);
    return !!result;
  }

  /**
   * Send payment success notification
   */
  async sendPaymentSuccess(
    phone: string,
    orderNumber: string,
    amount: number,
  ): Promise<boolean> {
    const text = `Payment successful! Order ${orderNumber} has been confirmed. Amount: RWF ${amount.toLocaleString()}. Thank you for choosing Rex Plus!`;
    const result = await this.sendSms(phone, text);
    return !!result;
  }

  /**
   * Send order status update notification
   */
  async sendOrderStatusUpdate(
    phone: string,
    orderNumber: string,
    status: string,
  ): Promise<boolean> {
    const text = `Your order ${orderNumber} status has been updated to: ${status}. Thank you for your patience!`;
    const result = await this.sendSms(phone, text);
    return !!result;
  }

  /**
   * Check if service is properly configured
   */
  isServiceConfigured(): boolean {
    return this.isConfigured;
  }
}
