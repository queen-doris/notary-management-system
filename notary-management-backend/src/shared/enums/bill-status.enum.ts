export enum BillStatus {
  /** Bill created, awaiting payment */
  PENDING = 'pending',
  /** Partially paid */
  PARTIALLY_PAID = 'partially_paid',
  /** Fully paid, awaiting service */
  PAID = 'paid',
  /** Service provided, record created */
  SERVED = 'served',
  /** Client rejected, no record created */
  REJECTED = 'rejected',
  /** Payment refunded */
  REFUNDED = 'refunded',
  /** Bill cancelled/voided */
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK = 'bank',
  MOMO = 'momo',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum BillType {
  NOTARY = 'notary',
  SECRETARIAT = 'secretariat',
  BOTH = 'both',
}
