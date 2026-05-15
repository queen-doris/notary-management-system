import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    // Map JWT payload to user-like object for compatibility with services
    const mappedUser = {
      id: user.sub, // Map sub to id for compatibility
      sub: user.sub,
      fullNames: user.fullNames,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      businessId: user.businessId,
      businessRoles: user.businessRoles,
      membershipCount: user.membershipCount,
    };

    return data ? mappedUser[data] : mappedUser;
  },
);
