import { EBusinessRole } from '../enums/business-role.enum';
import { EUserRole } from '../enums/user-role.enum';

export interface AuthenticatedUser {
  id: string;
  fullNames?: string;
  phone: string;
  email?: string;
  role: EUserRole | string;
  businessId: string;
  businessRoles: EBusinessRole[];
  isStaff: boolean;
}
