import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillController } from './bill.controller';
import { BillService } from './bill.service';
import { Bill } from '../../shared/entities/bill.entity';
import { BillItem } from '../../shared/entities/bill-item.entity';
import { Client } from '../../shared/entities/client.entity';
import { Business } from '../../shared/entities/business.entity';
import { User } from '../../shared/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { ClientModule } from '../client/client.module';
import { BusinessUser } from 'src/shared/entities/business-user.entity';
import { NotaryService as NotaryServiceEntity } from 'src/shared/entities/notary-service.entity';
import { SecretariatService } from 'src/shared/entities/secretariat-service.entity';
import { Payment } from 'src/shared/entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Bill,
      BillItem,
      Client,
      Business,
      User,
      BusinessUser,
      NotaryServiceEntity,
      SecretariatService,
      Payment,
    ]),
    AuthModule,
    ClientModule,
  ],
  controllers: [BillController],
  providers: [BillService],
  exports: [BillService],
})
export class BillModule {}
