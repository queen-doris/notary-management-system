import { EUserRole } from 'src/shared/enums/user-role.enum';
import { EUserStatus } from 'src/shared/enums/user-status.enum';

export interface IGetBusinessOwnerResponse {
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
      createdAt: Date;
      updatedAt: Date;
    };
    businesses: Array<{
      id: string;
      businessName: string;
      businessType: string;
      businessRegistrationNumber: string;
      email: string;
      province: string;
      district: string;
      isActive: boolean;
      isVerified: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;
    generalManagers?: Array<{
      id: string;
      fullNames: string;
      email?: string;
      phone: string;
      role: EUserRole;
      status: EUserStatus;
      salary?: number;
      hireDate?: Date;
      createdAt: Date;
    }>;
  };
  message: string;
}
