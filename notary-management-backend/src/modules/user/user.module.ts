import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { BusinessOwnersController } from './business-owners.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/shared/entities/user.entity';
import { SmsModule } from '../sms/sms.module';
import { EmailModule } from '../email/email.module';
import { Otp } from 'src/shared/entities/otp.entity';
import { BusinessUser } from 'src/shared/entities/business-user.entity';
import { Business } from 'src/shared/entities/business.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Otp, BusinessUser, Business]),
    SmsModule,
    EmailModule,
  ],
  controllers: [UserController, BusinessOwnersController],
  providers: [UserService],
})
export class UserModule {}
