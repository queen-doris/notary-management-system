import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotaryController } from './notary.controller';
import { NotaryService } from './notary.service';
import { NotaryRecord } from '../../shared/entities/notary-record.entity';
import { Bill } from '../../shared/entities/bill.entity';
import { Client } from '../../shared/entities/client.entity';
import { BillItem } from '../../shared/entities/bill-item.entity';
import { BooksModule } from '../books/books.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotaryRecord, Bill, Client, BillItem]),
    BooksModule,
    AuthModule,
  ],
  controllers: [NotaryController],
  providers: [NotaryService],
  exports: [NotaryService],
})
export class NotaryModule {}
