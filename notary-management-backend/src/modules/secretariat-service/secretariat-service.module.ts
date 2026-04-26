import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecretariatServiceController } from './secretariat-service.controller';
import { SecretariatServiceService } from './secretariat-service.service';
import { SecretariatService } from '../../shared/entities/secretariat-service.entity';
import { Business } from '../../shared/entities/business.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SecretariatService, Business]),
    AuthModule,
  ],
  controllers: [SecretariatServiceController],
  providers: [SecretariatServiceService],
  exports: [SecretariatServiceService],
})
export class SecretariatServiceModule {}
