import { EUserStatus } from '../../../shared/enums/user-status.enum';

export interface IDeactivateBusinessOwnerResponse {
  status: string;
  timestamp: string;
  path: string;
  data: {
    deactivatedBusinessOwner: {
      id: string;
      fullNames: string;
      phone: string;
      status: EUserStatus.INACTIVE;
      deactivatedAt: Date;
    };
  };
  message: string;
}
