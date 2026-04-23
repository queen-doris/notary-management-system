import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IEmailOptions } from 'src/shared/interfaces/email-options.interface';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private readonly brandColor = '#942DE0';
  private readonly logoUrl = 'https://your-domain.com/assets/rex.jpeg'; // Update with your actual logo URL
  private readonly slogan = 'Simply The Best';

  constructor(private readonly configService: ConfigService) {}

  /**
   * Get the email template wrapper with header and footer
   */
  private getEmailTemplate(content: string): string {
    const baseUrl =
      this.configService.get('APP_URL') ||
      this.configService.get('FRONTEND_URL') ||
      'https://rex.com';
    // const logoUrl = `${baseUrl}/assets/rex.jpeg`;
    // TODO: Update the logo url
    const logoUrl = `http://localhost:8080/assets/rex.jpeg`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>REX</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      line-height: 1.6;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background: linear-gradient(135deg, ${this.brandColor} 0%, #7a1fc7 100%);
      padding: 30px 20px;
      text-align: center;
      color: #ffffff;
    }
    .logo {
      max-width: 120px;
      height: auto;
      margin-bottom: 10px;
    }
    .slogan {
      font-size: 14px;
      font-weight: 300;
      letter-spacing: 1px;
      margin-top: 5px;
      opacity: 0.95;
    }
    .email-body {
      padding: 40px 30px;
      color: #333333;
    }
    .email-footer {
      background-color: #f8f9fa;
      padding: 25px 30px;
      text-align: center;
      color: #666666;
      font-size: 13px;
      border-top: 1px solid #e9ecef;
    }
    .email-footer a {
      color: ${this.brandColor};
      text-decoration: none;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: ${this.brandColor};
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 5px;
      font-weight: 600;
      margin: 20px 0;
      transition: background-color 0.3s;
    }
    .button:hover {
      background-color: #7a1fc7;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid ${this.brandColor};
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 5px 0;
    }
    .success-box {
      background-color: #d4edda;
      border-left: 4px solid #28a745;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .error-box {
      background-color: #f8d7da;
      border-left: 4px solid #dc3545;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    h1, h2, h3 {
      color: ${this.brandColor};
      margin-top: 0;
    }
    .divider {
      height: 1px;
      background-color: #e9ecef;
      margin: 25px 0;
    }
    @media only screen and (max-width: 600px) {
      .email-body {
        padding: 30px 20px;
      }
      .email-header {
        padding: 25px 15px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <img src="${logoUrl}" alt="REX Logo" class="logo" />
      <div class="slogan">${this.slogan}</div>
    </div>
    <div class="email-body">
      ${content}
    </div>
    <div class="email-footer">
      <p style="margin: 0;">
        <strong>REX</strong> - ${this.slogan}
      </p>
      <div class="divider"></div>
      <p style="margin: 5px 0; font-size: 12px;">
        This is an automated email. Please do not reply directly to this message.
      </p>
      <p style="margin: 5px 0; font-size: 12px;">
        © ${new Date().getFullYear()} REX. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  onModuleInit() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get('SMTP_HOST');
    const port = this.configService.get('SMTP_PORT');
    const user = this.configService.get('SMTP_FROM_EMAIL');
    const pass = this.configService.get('SMTP_PASS');
    this.fromEmail = this.configService.get('SMTP_FROM_EMAIL', user);

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP configuration incomplete. Email service will be disabled.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: port || 587,
      secure: this.configService.get('SMTP_SECURE', 'false') === 'true',
      auth: { user, pass },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    this.logger.log('Email transporter initialized successfully');
  }

  async sendWelcomeEmail(email: string, fullName: string): Promise<boolean> {
    const subject = 'Welcome to REX - Simply The Best';
    const content = `
      <h2>Welcome ${fullName}! 🎉</h2>
      <p>We're thrilled to have you join the REX family! Your account has been successfully created.</p>
      
      <p>You can now enjoy all our premium features and services. We're committed to providing you with an exceptional experience.</p>
      
      <div class="info-box">
        <p><strong>What's next?</strong></p>
        <p>• Complete your profile to get started</p>
        <p>• Explore our services and offerings</p>
        <p>• Get in touch with our support team if you need assistance</p>
      </div>
      
      <p>Thank you for choosing REX. We look forward to serving you!</p>
      
      <p>Best regards,<br/>
      <strong>The REX Team</strong></p>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html: this.getEmailTemplate(content),
    });
  }

  async sendPaymentNotification(
    email: string,
    orderNumber: string,
    status: string,
    amount: number,
  ): Promise<boolean> {
    const subject = `Payment Update - Order ${orderNumber}`;

    let statusMessage = '';
    let statusIcon = '';
    let boxClass = 'info-box';
    let statusText = '';

    switch (status) {
      case 'PAID':
        statusMessage = 'Your payment has been completed successfully!';
        statusIcon = '✅';
        boxClass = 'success-box';
        statusText = 'PAID';
        break;
      case 'PAYMENT_FAILED':
        statusMessage = 'Unfortunately, your payment could not be processed.';
        statusIcon = '❌';
        boxClass = 'error-box';
        statusText = 'FAILED';
        break;
      case 'PENDING':
        statusMessage = 'Your payment is currently pending confirmation.';
        statusIcon = '⏳';
        boxClass = 'warning-box';
        statusText = 'PENDING';
        break;
      default:
        statusMessage = `Your payment status is: ${status}`;
        statusIcon = 'ℹ️';
        statusText = status;
    }

    const content = `
      <h2>Payment Update ${statusIcon}</h2>
      <p>${statusMessage}</p>
      
      <div class="${boxClass}">
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Amount:</strong> RWF ${amount.toLocaleString()}</p>
        <p><strong>Status:</strong> <strong>${statusText}</strong></p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}</p>
      </div>
      
      ${status === 'PAID' ? '<p>Your order is now being processed. You will receive another notification when your order is ready.</p>' : ''}
      ${status === 'PAYMENT_FAILED' ? '<p>Please try again or contact our support team for assistance.</p>' : ''}
      ${status === 'PENDING' ? '<p>Please wait for confirmation. We will notify you once your payment is confirmed.</p>' : ''}
      
      <p>Thank you for choosing REX!</p>
      
      <p>Best regards,<br/>
      <strong>The REX Team</strong></p>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html: this.getEmailTemplate(content),
    });
  }

  // Add payment success notification method
  async sendPaymentSuccessNotification(
    email: string,
    orderNumber: string,
    saleNumber: string,
    amount: number,
  ): Promise<boolean> {
    const subject = `Payment Successful - Order ${orderNumber} 🎉`;

    const content = `
      <h2>Payment Successful! 🎉</h2>
      <p>We're pleased to inform you that your payment has been processed successfully.</p>
      
      <div class="success-box">
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Sale Number:</strong> ${saleNumber}</p>
        <p><strong>Amount Paid:</strong> RWF ${amount.toLocaleString()}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}</p>
      </div>

      <p><strong>What's next?</strong></p>
      <p>Your order is now being processed. You will receive another notification when your order is ready for pickup or delivery.</p>
      
      <div class="info-box">
        <p style="margin: 0;"><strong>Need Help?</strong></p>
        <p style="margin: 5px 0 0 0;">If you have any questions or concerns, please don't hesitate to contact our customer support team. We're here to help!</p>
      </div>
      
      <p>Thank you for choosing REX!</p>
      
      <p>Best regards,<br/>
      <strong>The REX Team</strong></p>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html: this.getEmailTemplate(content),
    });
  }

  async sendVerificationEmail(
    email: string,
    fullName: string,
    code: string,
  ): Promise<boolean> {
    const subject = 'Verify Your Email Address - REX';

    const content = `
      <h2>Hello ${fullName}! 👋</h2>
      <p>Thank you for registering with REX. To complete your account setup, please verify your email address using the code below:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; padding: 20px 40px; background: linear-gradient(135deg, ${this.brandColor} 0%, #7a1fc7 100%); border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <p style="margin: 0; font-size: 32px; font-weight: bold; color: #ffffff; letter-spacing: 5px;">${code}</p>
        </div>
      </div>
      
      <div class="info-box">
        <p style="margin: 0;"><strong>⚠️ Important:</strong> This verification code will expire in <strong>10 minutes</strong>.</p>
        <p style="margin: 5px 0 0 0;">Please use this code immediately to verify your email address.</p>
      </div>
      
      <p>If you didn't request this verification code, please ignore this email.</p>
      
      <p>Best regards,<br/>
      <strong>The REX Team</strong></p>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html: this.getEmailTemplate(content),
    });
  }

  // Add this new method for password reset emails
  async sendPasswordResetEmail(
    email: string,
    fullName: string,
    code: string,
  ): Promise<boolean> {
    const subject = 'Password Reset Request - REX';

    const content = `
      <h2>Hello ${fullName}! 🔐</h2>
      <p>We received a request to reset your password for your REX account.</p>
      
      <p>Please use the verification code below to reset your password:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; padding: 20px 40px; background: linear-gradient(135deg, ${this.brandColor} 0%, #7a1fc7 100%); border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <p style="margin: 0; font-size: 32px; font-weight: bold; color: #ffffff; letter-spacing: 5px;">${code}</p>
        </div>
      </div>
      
      <div class="warning-box">
        <p style="margin: 0;"><strong>⏰ Time Sensitive:</strong> This reset code will expire in <strong>15 minutes</strong>.</p>
        <p style="margin: 5px 0 0 0;">Please use this code immediately to reset your password.</p>
      </div>
      
      <div class="info-box">
        <p style="margin: 0;"><strong>🔒 Security Notice:</strong></p>
        <p style="margin: 5px 0 0 0;">If you didn't request a password reset, please ignore this email and your password will remain unchanged. Your account remains secure.</p>
      </div>
      
      <p>If you have any concerns about your account security, please contact our support team immediately.</p>
      
      <p>Best regards,<br/>
      <strong>The REX Team</strong></p>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html: this.getEmailTemplate(content),
    });
  }

  // Add this new method for general notifications
  async sendNotificationEmail(
    email: string,
    subject: string,
    message: string,
  ): Promise<boolean> {
    const content = `
      <h2>${subject}</h2>
      <p>${message}</p>
      
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      
      <p>Best regards,<br/>
      <strong>The REX Team</strong></p>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html: this.getEmailTemplate(content),
    });
  }

  async sendEmail(options: IEmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        'Email transporter not configured. Skipping email send.',
      );
      return false;
    }

    try {
      const mailOptions = {
        from: options.from || this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${options.to}: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${error.message}`,
      );
      return false;
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) return false;

    try {
      await this.transporter.verify();
      this.logger.log('Email connection verified');
      return true;
    } catch (error) {
      this.logger.error('Email connection verification failed:', error.message);
      return false;
    }
  }
}
