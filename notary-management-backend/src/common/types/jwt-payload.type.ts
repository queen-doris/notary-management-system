import { EUserRole } from 'src/shared/enums/user-role.enum';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';

export type JwtPayload = {
  sub: string;
  fullNames: string;
  email?: string;
  phone: string;
  role: EUserRole;
  isVerified: boolean;
  businessId?: string;
  businessRoles?: EBusinessRole[];
  membershipCount?: number;
  purpose?: string;
};
