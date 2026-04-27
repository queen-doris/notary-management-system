import { Request } from 'express';
import { EBusinessRole } from '../enums/business-role.enum';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: EBusinessRole;
    businessId: string;
    is_staff?: boolean;
  };
}
