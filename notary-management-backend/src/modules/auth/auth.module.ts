import { Logger, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/shared/entities/user.entity';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { JwtService } from '../jwt/jwt.service';
import { JwtStrategy } from 'src/common/strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Otp } from 'src/shared/entities/otp.entity';
import { EmailModule } from '../email/email.module';
import { SmsModule } from '../sms/sms.module';
import { BusinessUserModule } from '../business-user/business-user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Otp,
    ]),
    PassportModule,
    NestJwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '8h' as const,
        },
      }),
    }),
    EmailModule,
    SmsModule,
    BusinessUserModule,
  ],
  providers: [AuthService, JwtService, JwtStrategy, Logger],
  controllers: [AuthController],
  exports: [JwtService],
})
export class AuthModule {}
