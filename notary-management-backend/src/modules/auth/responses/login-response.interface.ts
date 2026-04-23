import { IResponse } from 'src/shared/interfaces/response.interface';

export interface ILoginData {
  user: {
    id: string;
    fullNames: string;
    email?: string;
    phone: string;
    role: string;
  };
  accessToken: string;
  isBusinessRegistered?: boolean;
  businessRoles?: string[];
  businessId?: string;
  business?: {
    id: string;
    roles: string[];
    staffCode?: string;
  };
}

export type ILoginResponse = IResponse<ILoginData>;
