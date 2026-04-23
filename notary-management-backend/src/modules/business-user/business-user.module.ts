import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessUser } from 'src/shared/entities/business-user.entity';
import { User } from 'src/shared/entities/user.entity';
import { Business } from 'src/shared/entities/business.entity';
import { BusinessUserService } from './business-user.service';
import { BusinessUserController } from './business-user.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessUser,
      User,
      Business,
    ]),
  ],
  providers: [BusinessUserService],
  controllers: [BusinessUserController],
  exports: [BusinessUserService],
})
export class BusinessUserModule {}
