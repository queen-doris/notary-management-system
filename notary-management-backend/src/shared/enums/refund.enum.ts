export enum RefundStatus {
  NONE = 'none',
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum RefundRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum RefundType {
  FULL = 'full',
  HALF = 'half',
  CUSTOM = 'custom',
}
