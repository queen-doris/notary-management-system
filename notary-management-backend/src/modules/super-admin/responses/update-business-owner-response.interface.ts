import { EUserRole } from 'src/shared/enums/user-role.enum';
import { EUserStatus } from 'src/shared/enums/user-status.enum';

export interface IUpdateBusinessOwnerResponse {
  status: string;
  timestamp: string;
  path: string;
  data: {
    businessOwner: {
      id: string;
      fullNames: string;
      email?: string;
      phone: string;
      role: EUserRole;
      status: EUserStatus;
      isVerified: boolean;
      isBusinessRegistered: boolean;
      totalBusinesses?: number;
      totalRevenue?: number;
      ownershipSince?: Date;
      updatedAt: Date;
    };
  };
  message: string;
}
