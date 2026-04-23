import { Controller, Post, Body, Logger, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PindoDeliveryReport, PindoInboundSms } from '../dto/pindo-sms.dto';

@ApiTags('SMS Webhooks')
@Controller('webhooks/pindo')
export class PindoWebhookController {
  private readonly logger = new Logger(PindoWebhookController.name);

  /**
   * Handle SMS delivery report webhook from Pindo
   * Pindo will POST to this endpoint when SMS delivery status changes
   */
  @Post('delivery-report')
  @ApiOperation({ summary: 'Receive SMS delivery status updates from Pindo' })
  @ApiResponse({ status: 200, description: 'Delivery report received' })
  async handleDeliveryReport(
    @Body() report: PindoDeliveryReport,
  ): Promise<{ status: string }> {
    this.logger.log('Received delivery report from Pindo');
    this.logger.log(
      `SMS ID: ${report.sms_id} | Status: ${report.status} | Modified: ${report.modified_at} | Retries: ${report.retries_count}`,
    );

    try {
      // Process delivery report based on status
      switch (report.status) {
        case 'DELIVRD':
          this.logger.log(`SMS ${report.sms_id} delivered successfully`);
          // TODO: Update database with delivery confirmation
          break;
        case 'FAILED':
          this.logger.error(`SMS ${report.sms_id} delivery failed`);
          // TODO: Handle failed delivery (retry logic, notification, etc.)
          break;
        case 'EXPIRED':
          this.logger.warn(`SMS ${report.sms_id} expired`);
          // TODO: Handle expired SMS
          break;
        case 'UNDELIV':
          this.logger.warn(`SMS ${report.sms_id} undelivered`);
          // TODO: Handle undelivered SMS
          break;
        default:
          this.logger.log(`SMS ${report.sms_id} status: ${report.status}`);
      }

      // Store delivery report in database for tracking
      // await this.smsTrackingService.updateDeliveryStatus(report);

      return { status: 'success' };
    } catch (error) {
      this.logger.error(
        `Error processing delivery report: ${error.message}`,
        error.stack,
      );
      return { status: 'error' };
    }
  }

  /**
   * Handle inbound SMS webhook from Pindo
   * Pindo will POST to this endpoint when receiving SMS on your number
   */
  @Post('inbound')
  @ApiOperation({ summary: 'Receive inbound SMS from Pindo' })
  @ApiResponse({ status: 200, description: 'Inbound SMS received' })
  async handleInboundSms(
    @Body() inboundSms: PindoInboundSms,
  ): Promise<{ status: string }> {
    this.logger.log('Received inbound SMS from Pindo');
    this.logger.log(
      `From: ${inboundSms.from} | To: ${inboundSms.to} | Text: ${inboundSms.text} | Telco: ${inboundSms.telco}`,
    );

    try {
      // Process inbound SMS based on your business logic
      // Examples:
      // - Auto-reply to customer queries
      // - Update customer preferences
      // - Handle support tickets
      // - Process commands (e.g., "STOP", "HELP", "INFO")

      const messageText = inboundSms.text.trim().toUpperCase();

      // Example: Handle common commands
      if (messageText === 'STOP' || messageText === 'UNSUBSCRIBE') {
        this.logger.log(`Unsubscribe request from ${inboundSms.from}`);
        // TODO: Unsubscribe user from SMS notifications
      } else if (messageText === 'HELP' || messageText === 'INFO') {
        this.logger.log(`Help request from ${inboundSms.from}`);
        // TODO: Send help information
      } else {
        this.logger.log(`General message from ${inboundSms.from}`);
        // TODO: Route to customer support or automated response system
      }

      // Store inbound SMS in database
      // await this.smsTrackingService.storeInboundSms(inboundSms);

      return { status: 'success' };
    } catch (error) {
      this.logger.error(
        `Error processing inbound SMS: ${error.message}`,
        error.stack,
      );
      return { status: 'error' };
    }
  }

  /**
   * Health check endpoint for webhook
   */
  @Get('health')
  @ApiOperation({ summary: 'Webhook health check' })
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
