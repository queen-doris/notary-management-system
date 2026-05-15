import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BillStatus,
  BillType,
  PaymentMethod,
} from '../../../shared/enums/bill-status.enum';
import {
  MaritalStatus,
  VerificationStatus,
} from 'src/shared/enums/client.enum';

export class ClientInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  full_name: string;

  @ApiProperty()
  id_number: string;

  @ApiPropertyOptional()
  father_name?: string;

  @ApiPropertyOptional()
  mother_name?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  province?: string;

  @ApiPropertyOptional()
  district?: string;

  @ApiPropertyOptional()
  sector?: string;

  @ApiPropertyOptional()
  cell?: string;

  @ApiPropertyOptional()
  village?: string;

  @ApiPropertyOptional()
  date_of_birth?: Date;

  @ApiPropertyOptional({ enum: MaritalStatus })
  marital_status?: MaritalStatus;

  @ApiPropertyOptional()
  partner_name?: string;

  @ApiPropertyOptional({ enum: VerificationStatus })
  verification_status?: VerificationStatus;

  @ApiPropertyOptional()
  upi?: string;
}

export class NotaryItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  service_name: string;

  @ApiProperty()
  sub_service_name: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unit_price: number;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  vat_amount: number;

  @ApiProperty()
  total: number;

  @ApiPropertyOptional()
  notes?: string;
}

export class SecretariatItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  service_name: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unit_price: number;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  total: number;

  @ApiPropertyOptional()
  notes?: string;
}

export class PaymentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: PaymentMethod })
  method: PaymentMethod;

  @ApiPropertyOptional()
  reference?: string;

  @ApiProperty()
  processed_by_name: string;

  @ApiProperty()
  processed_at: Date;
}

export class BillResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  bill_number: string;

  @ApiProperty({ enum: BillType })
  bill_type: BillType;

  @ApiProperty()
  client: ClientInfoDto;

  @ApiProperty()
  notary_subtotal: number;

  @ApiProperty()
  notary_vat: number;

  @ApiProperty()
  notary_total: number;

  @ApiProperty()
  secretariat_subtotal: number;

  @ApiProperty()
  secretariat_total: number;

  @ApiProperty()
  grand_total: number;

  @ApiProperty()
  amount_paid: number;

  @ApiProperty()
  remaining_balance: number;

  @ApiProperty({ enum: BillStatus })
  status: BillStatus;

  @ApiPropertyOptional()
  rejection_reason?: string;

  @ApiPropertyOptional()
  rejection_notes?: string;

  @ApiProperty({ type: [NotaryItemDto] })
  notary_items: NotaryItemDto[];

  @ApiProperty({ type: [SecretariatItemDto] })
  secretariat_items: SecretariatItemDto[];

  @ApiProperty({ type: [PaymentDto] })
  payments: PaymentDto[];

  @ApiProperty()
  created_by_name: string;

  @ApiProperty()
  created_by_role: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class PaginatedResponseDto {
  @ApiProperty()
  data: any[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class RecordPaymentResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  payment: {
    id: string;
    amount: number;
    method: PaymentMethod;
  };

  @ApiProperty()
  bill: {
    id: string;
    status: BillStatus;
    amount_paid: number;
    remaining_balance: number;
  };
}

export class RejectBillResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  bill: {
    id: string;
    status: BillStatus;
    refund_processed: boolean;
    refund_amount: number;
  };
}

export class ServeBillResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  notary_record: {
    id: string;
    display_number: string;
    volume: string | null;
    record_number: string;
    book_type: string;
    book_id: string | null;
    service: string;
    amount: number;
    served_date: Date;
  };

  @ApiProperty()
  bill: {
    id: string;
    status: BillStatus;
  };
}

export class PaymentHistoryResponseDto {
  @ApiProperty()
  bill: {
    id: string;
    bill_number: string;
    grand_total: number;
    amount_paid: number;
    remaining_balance: number;
  };

  @ApiProperty({ type: [PaymentDto] })
  payments: PaymentDto[];
}

export class MinijustReportRecordDto {
  @ApiProperty()
  date: Date;

  @ApiProperty()
  book_type: string;

  @ApiProperty()
  volume: string;

  @ApiProperty()
  number: string;

  @ApiProperty()
  client_full_name: string;

  @ApiProperty()
  client_id_number: string;

  @ApiProperty()
  service_name: string;

  @ApiProperty()
  sub_service_name: string;

  @ApiProperty()
  amount: number;
}

export class MinijustReportDto {
  @ApiProperty()
  period: {
    start_date: string;
    end_date: string;
  };

  @ApiProperty({ type: [MinijustReportRecordDto] })
  records: MinijustReportRecordDto[];

  @ApiProperty()
  total_records: number;

  @ApiProperty()
  total_amount: number;
}

export class FinancialReportSummaryDto {
  @ApiProperty()
  total_bills: number;

  @ApiProperty()
  total_notary_revenue: number;

  @ApiProperty()
  total_secretariat_revenue: number;

  @ApiProperty()
  total_vat_collected: number;

  @ApiProperty()
  total_refunds: number;

  @ApiProperty()
  net_revenue: number;
}

export class FinancialReportDto {
  @ApiProperty()
  period: {
    start_date: string;
    end_date: string;
  };

  @ApiProperty()
  summary: FinancialReportSummaryDto;

  @ApiProperty()
  breakdown_by_status: Record<string, { count: number; amount: number }>;

  @ApiProperty()
  breakdown_by_payment_method: Record<
    string,
    { count: number; amount: number }
  >;
}

export class DailySalesReportDto {
  @ApiProperty()
  period: {
    start_date: string;
    end_date: string;
  };

  @ApiProperty()
  summary: {
    total_bills: number;
    total_revenue: number;
    total_vat: number;
    average_bill_value: number;
  };

  @ApiProperty()
  payment_method_breakdown: Record<string, { amount: number; count: number }>;

  @ApiProperty()
  transactions: Array<{
    id: string;
    bill_number: string;
    client_name: string;
    amount: number;
    vat: number;
    date: Date;
  }>;
}
