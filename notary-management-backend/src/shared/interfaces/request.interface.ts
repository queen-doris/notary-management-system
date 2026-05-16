import { Request } from 'express';
import { EBusinessRole } from '../enums/business-role.enum';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    /** System role from the JWT (e.g. "STAFF", "SUPERADMIN") — NOT the business role. */
    role: string;
    /** Business roles for the active business (use these for OWNER checks). */
    businessRoles: EBusinessRole[];
    businessId: string;
    is_staff?: boolean;
  };
}
