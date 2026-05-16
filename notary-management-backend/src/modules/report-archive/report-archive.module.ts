import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ReportArchive } from '../../shared/entities/report-archive.entity';
import { ReportArchiveController } from './report-archive.controller';
import { ReportArchiveService } from './report-archive.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportArchive]),
    MulterModule.register({ limits: { fileSize: 20 * 1024 * 1024 } }),
    CloudinaryModule,
    AuthModule,
  ],
  controllers: [ReportArchiveController],
  providers: [ReportArchiveService],
  exports: [ReportArchiveService],
})
export class ReportArchiveModule {}
