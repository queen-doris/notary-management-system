import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { BookTracker } from '../../shared/entities/book-tracker.entity';
import { NotaryRecord } from '../../shared/entities/notary-record.entity';
import { Business } from '../../shared/entities/business.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BookTracker, NotaryRecord, Business]),
    AuthModule,
  ],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
