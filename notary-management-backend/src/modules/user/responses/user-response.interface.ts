// user-response.interface.ts
import { EUserRole } from 'src/shared/enums/user-role.enum';
import { EUserStatus } from 'src/shared/enums/user-status.enum';
export interface IUserData {
  id: string;
  fullNames: string;
  email?: string;
  phone: string;
  role: EUserRole;
  status: EUserStatus;
  isVerified: boolean;
  createdAt: Date;
}
export interface IUserProfile {
  // customerType?: ECustomerType;
  // notes?: string;
  // loyaltyPoints?: number;

  // hireDate?: Date;
  // certifications?: string[];
  // performanceScore?: number;

  [key: string]: any;
}

export interface IUserResponse {
  user: IUserData;
  profile?: IUserProfile;
}
