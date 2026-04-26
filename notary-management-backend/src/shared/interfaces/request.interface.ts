import { Request } from 'express';
import { EBusinessRole } from '../enums/business-role.enum';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string; // SUPERADMIN or STAFF
    business_id: string;
    business_roles?: EBusinessRole[];
    is_staff?: boolean;
  };
}
