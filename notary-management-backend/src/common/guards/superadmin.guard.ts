/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class SuperadminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const body = request.body;

    const providedSecretKey = body?.superadminSecretKey;
    const expectedSecretKey = process.env.SUPERADMIN_SECRET_KEY;

    if (!providedSecretKey || providedSecretKey !== expectedSecretKey) {
      throw new UnauthorizedException(
        'Invalid superadmin credentials. Access denied.',
      );
    }

    return true;
  }
}
