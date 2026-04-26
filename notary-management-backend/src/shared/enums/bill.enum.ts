export enum BillStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SERVED = 'served',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
  PARTIALLY_PAID = 'partially_paid',
}

export enum BillType {
  NOTARY = 'notary',
  SECRETARIAT = 'secretariat',
  BOTH = 'both',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK = 'bank',
  MOMO = 'momo',
}
