export interface IDeleteBusinessOwnerResponse {
  status: string;
  timestamp: string;
  path: string;
  data: {
    deletedBusinessOwner: {
      id: string;
      fullNames: string;
      phone: string;
      deletedAt: Date;
    };
  };
  message: string;
}
