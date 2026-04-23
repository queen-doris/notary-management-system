import { IResponse } from 'src/shared/interfaces/response.interface';

export interface ICreateSuperAdminData {
  superAdmin: {
    id: string;
    fullNames: string;
    email?: string;
    phone: string;
    role: string;
  };
  loginCredentials: {
    phone: string;
    password: string;
  };
}

export type ICreateSuperAdminResponse = IResponse<ICreateSuperAdminData>;
