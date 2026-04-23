import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from 'src/common/types/jwt-payload.type';

@Injectable()
export class JwtService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly config: ConfigService,
  ) {}

  // Generate JWT token
  sign(payload: JwtPayload, expiresIn?: string): string {
    return this.jwtService.sign(payload as Record<string, unknown>, {
      expiresIn: (expiresIn || '8h') as '8h',
    });
  }

  // Verify JWT token
  verify(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: this.config.get<string>('JWT_SECRET'),
    });
  }

  // Decode without verifying
  decode(token: string): JwtPayload {
    return this.jwtService.decode(token);
  }
}
