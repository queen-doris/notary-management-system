export interface ICreateBusinessOwnerResponse {
  status: string;
  timestamp: string;
  path: string;
  data: {
    businessOwner: {
      id: string;
      fullNames: string;
      email?: string;
      phone: string;
      isBusinessRegistered: boolean;
    };
    loginCredentials: {
      phone: string;
      password: string;
    };
  };
  message: string;
}
