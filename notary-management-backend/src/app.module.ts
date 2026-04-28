/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { WinstonModule } from 'nest-winston';
import { transports, format } from 'winston';
import bullConfig from './config/bull.config';
import mailConfig from './config/mail.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import swaggerConfig from './config/swagger.config';
import { BaseEntity } from './shared/entities/base.entity';
import { User } from './shared/entities/user.entity';
import { AuthModule } from './modules/auth/auth.module';
import { Business } from './shared/entities/business.entity';
import { BusinessUser } from './shared/entities/business-user.entity';
import { UserModule } from './modules/user/user.module';
import { EmailModule } from './modules/email/email.module';
import { SmsModule } from './modules/sms/sms.module';
import { BusinessUserModule } from './modules/business-user/business-user.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { BusinessModule } from './modules/business/business.module';
import { Otp } from './shared/entities/otp.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { FileModule } from './modules/file/file.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { EmployeeLeave } from './shared/entities/employee-leave.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BooksModule } from './modules/books/books.module';
import { BillModule } from './modules/bill/bill.module';
import { ClientModule } from './modules/client/client.module';
import { SecretariatServiceModule } from './modules/secretariat-service/secretariat-service.module';
import { NotaryServiceModule } from './modules/notary-service/notary-service.module';
import { DocumentModule } from './modules/document/document.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        redisConfig,
        bullConfig,
        mailConfig,
        swaggerConfig,
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port:
          config.get<number>('database.port') ||
          config.get<number>('DB_PORT_DOCKER'),
        username:
          config.get<string>('database.user') ||
          config.get<string>('DB_USER_DOCKER'),
        password:
          config.get<string>('database.password') ||
          config.get<string>('DB_PASSWORD_DOCKER'),
        database:
          config.get<string>('database.name') ||
          config.get<string>('DB_NAME_DOCKER'),
        autoLoadEntities: true,
        synchronize: true,
        entities: [
          BaseEntity,
          BusinessUser,
          Business,
          User,
          Otp,
          EmployeeLeave,
        ],
      }),
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password'),
        },
      }),
    }),

    WinstonModule.forRoot({
      transports: [
        new transports.Console({
          format: format.combine(
            format.timestamp(),
            format.colorize(),
            format.printf(
              ({ level, message, timestamp }) =>
                `[${timestamp}] ${level}: ${message}`,
            ),
          ),
        }),
      ],
    }),
    AuthModule,
    UserModule,
    EmailModule,
    SmsModule,
    BusinessUserModule,
    SuperAdminModule,
    BusinessModule,
    ScheduleModule.forRoot(),
    FileModule,
    CloudinaryModule,
    ClientModule,
    BillModule,
    BooksModule,
    NotaryServiceModule,
    SecretariatServiceModule,
    DocumentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
