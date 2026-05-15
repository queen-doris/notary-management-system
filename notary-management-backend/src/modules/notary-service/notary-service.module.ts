import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotaryServiceController } from './notary-service.controller';
import { NotaryServiceService } from './notary-service.service';
import { NotaryService } from '../../shared/entities/notary-service.entity';
import { NotaryServiceCategory } from '../../shared/entities/notary-service-category.entity';
import { Book } from '../../shared/entities/book.entity';
import { Business } from '../../shared/entities/business.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotaryService,
      NotaryServiceCategory,
      Book,
      Business,
    ]),
    AuthModule,
  ],
  controllers: [NotaryServiceController],
  providers: [NotaryServiceService],
  exports: [NotaryServiceService],
})
export class NotaryServiceModule {}
