import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillController } from './bill.controller';
import { BillService } from './bill.service';
import { Bill } from '../../shared/entities/bill.entity';
import { BillItem } from '../../shared/entities/bill-item.entity';
import { Client } from '../../shared/entities/client.entity';
import { Business } from '../../shared/entities/business.entity';
import { User } from '../../shared/entities/user.entity';
import { BusinessUser } from '../../shared/entities/business-user.entity';
import { NotaryService } from '../../shared/entities/notary-service.entity';
import { SecretariatService } from '../../shared/entities/secretariat-service.entity';
import { NotaryRecord } from '../../shared/entities/notary-record.entity';
import { SecretariatRecord } from '../../shared/entities/secretariat-record.entity';
import { AuditLog } from '../../shared/entities/audit-log.entity';
import { Book } from '../../shared/entities/book.entity';
import { Payment } from '../../shared/entities/payment.entity';
import { Refund } from '../../shared/entities/refund.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Bill,
      BillItem,
      Client,
      Business,
      User,
      BusinessUser,
      NotaryService,
      SecretariatService,
      NotaryRecord,
      SecretariatRecord,
      AuditLog,
      Book,
      Payment,
      Refund,
    ]),
    AuthModule,
  ],
  controllers: [BillController],
  providers: [BillService],
  exports: [BillService],
})
export class BillModule {}
