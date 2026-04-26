import { forwardRef, Module } from '@nestjs/common';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from 'src/shared/entities/business.entity';
import { User } from 'src/shared/entities/user.entity';
import { EmployeeLeave } from 'src/shared/entities/employee-leave.entity';
import { BusinessUser } from 'src/shared/entities/business-user.entity';
import { BusinessUserModule } from '../business-user/business-user.module';
import { BooksModule } from '../books/books.module';
import { NotaryServiceModule } from '../notary-service/notary-service.module';
import { SecretariatServiceModule } from '../secretariat-service/secretariat-service.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business, User, BusinessUser, EmployeeLeave]),
    BusinessUserModule,
    forwardRef(() => BooksModule),
    forwardRef(() => NotaryServiceModule),
    forwardRef(() => SecretariatServiceModule),
  ],
  controllers: [BusinessController],
  providers: [BusinessService],
})
export class BusinessModule {}
