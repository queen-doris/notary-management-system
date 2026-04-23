export interface XentriPayCollectionRequest {
  email: string;
  cname: string;
  amount: number;
  cnumber: string;
  msisdn: string;
  currency: string;
  pmethod: string;
  chargesIncluded: string;
}

export interface XentriPayCollectionResponse {
  reply: string;
  url: string;
  success: number;
  authkey: string;
  tid: string;
  refid: string;
  retcode: number;
}

export interface XentriPayCollectionStatusResponse {
  refid: string;
  status: string;
  updatedAt: string;
}

export interface XentriPayWebhookPayload {
  event: string;
  data?: {
    id?: string;
    refid?: string;
    transactionId?: string;
    status?: string;
    amount?: number;
    currency?: string;
    customerReference?: string;
    message?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  refId?: string;
  status?: string;
  amount?: number;
  transactionId?: string;
  message?: string;
}

export enum EPaymentMethod {
  CASH = 'CASH',
  MOMO = 'MOMO',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  POS = 'POS',
}

export interface PaymentInitiationResult {
  success: boolean;
  refId: string;
  message: string;
  requiresCustomerAction: boolean;
  paymentMethod: EPaymentMethod;
  instructions?: string;
}
