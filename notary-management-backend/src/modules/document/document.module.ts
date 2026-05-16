import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { Document } from '../../shared/entities/document.entity';
import { NotaryRecord } from '../../shared/entities/notary-record.entity';
import { SecretariatRecord } from '../../shared/entities/secretariat-record.entity';
import { User } from '../../shared/entities/user.entity';
import { BusinessUser } from '../../shared/entities/business-user.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Document,
      NotaryRecord,
      SecretariatRecord,
      User,
      BusinessUser,
    ]),
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
    CloudinaryModule,
    AuthModule,
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
