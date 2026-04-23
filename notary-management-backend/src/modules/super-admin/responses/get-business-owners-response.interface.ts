import { EUserRole } from 'src/shared/enums/user-role.enum';
import { EUserStatus } from 'src/shared/enums/user-status.enum';

export interface IGetBusinessOwnersResponse {
  status: string;
  timestamp: string;
  path: string;
  data: {
    businessOwners: Array<{
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
      createdAt: Date;
      updatedAt: Date;
      businesses?: Array<{
        id: string;
        businessName: string;
        businessType: string;
        email: string;
        isActive: boolean;
        isVerified: boolean;
      }>;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message: string;
}
