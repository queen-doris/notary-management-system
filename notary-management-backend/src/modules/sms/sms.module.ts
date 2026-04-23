import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SmsService } from './sms.service';
import { PindoService } from './pindo.service';
import { PindoWebhookController } from './webhooks/pindo-webhook.controller';

@Module({
  imports: [HttpModule],
  controllers: [PindoWebhookController],
  providers: [SmsService, PindoService],
  exports: [SmsService, PindoService],
})
export class SmsModule { }
