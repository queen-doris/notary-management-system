/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EUserRole } from 'src/shared/enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Array<EUserRole | string>>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const businessRoles: string[] = Array.isArray(user?.businessRoles)
      ? user.businessRoles
      : [];
    const systemRole = user?.role;
    const hasBusinessRole =
      businessRoles.length > 0 &&
      requiredRoles.some((role) => businessRoles.includes(role as string));
    const hasSystemRole = systemRole && requiredRoles.includes(systemRole);

    if (!user || (!hasBusinessRole && !hasSystemRole)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource or perform this action.',
      );
    }
    return true;
  }
}
