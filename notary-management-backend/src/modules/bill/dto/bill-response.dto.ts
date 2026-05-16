/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { IsOptional } from 'class-validator';

export class ClientInfoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  full_name!: string;

  @ApiProperty()
  id_number!: string;

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
  id!: string;

  @ApiProperty()
  service_name!: string;

  @ApiProperty()
  sub_service_name!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  unit_price!: number;

  @ApiProperty()
  subtotal!: number;

  @ApiProperty()
  vat_amount!: number;

  @ApiProperty()
  total!: number;

  @ApiPropertyOptional()
  notes?: string;
}

export class SecretariatItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  service_name!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  unit_price!: number;

  @ApiProperty()
  subtotal!: number;

  @ApiProperty()
  total!: number;

  @ApiPropertyOptional()
  notes?: string;
}

export class PaymentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty({ enum: PaymentMethod })
  method: PaymentMethod = PaymentMethod.CASH;

  @ApiPropertyOptional()
  reference?: string;

  @ApiProperty()
  processed_by_name!: string;

  @ApiProperty()
  processed_at!: Date;
}

export class BillResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  bill_number!: string;

  @ApiProperty({ enum: BillType })
  bill_type: BillType = BillType.NOTARY;

  @ApiProperty()
  client: ClientInfoDto = new ClientInfoDto();

  @ApiProperty()
  notary_subtotal!: number;

  @ApiProperty()
  notary_vat!: number;

  @ApiProperty()
  notary_total!: number;

  @ApiProperty()
  secretariat_subtotal!: number;

  @ApiProperty()
  secretariat_total!: number;

  @ApiProperty()
  grand_total!: number;

  @ApiProperty()
  amount_paid!: number;

  @ApiProperty()
  remaining_balance!: number;

  @ApiProperty({ enum: BillStatus })
  status: BillStatus;

  @ApiPropertyOptional()
  rejection_reason?: string;

  @ApiPropertyOptional()
  rejection_notes?: string;

  @ApiPropertyOptional()
  paid_at?: Date;

  @ApiPropertyOptional()
  refund_status?: string;

  @ApiPropertyOptional()
  refund_requested_amount?: number;

  @ApiPropertyOptional({ description: 'Total refunded so far' })
  amount_refunded?: number;

  @ApiPropertyOptional()
  profit_after_refund?: number;

  @ApiProperty({ type: [NotaryItemDto] })
  notary_items: NotaryItemDto[] = [];

  @ApiProperty({ type: [SecretariatItemDto] })
  secretariat_items: SecretariatItemDto[] = [];

  @ApiProperty({ type: [PaymentDto] })
  payments: PaymentDto[] = [];

  @ApiPropertyOptional({
    description: 'Refund records for this bill',
    type: 'array',
  })
  refunds?: Array<Record<string, unknown>>;

  @ApiProperty()
  created_by_name!: string;

  @ApiProperty()
  created_by_role!: string;

  @ApiProperty()
  created_at!: Date;

  @ApiProperty()
  updated_at!: Date;
}

export class PaginatedResponseDto {
  @ApiProperty()
  data: any[] = [];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class RecordPaymentResponseDto {
  @ApiProperty()
  message!: string;

  @ApiProperty()
  payment!: {
    id: string;
    amount: number;
    method: PaymentMethod;
  };

  @ApiProperty()
  bill!: {
    id: string;
    status: BillStatus;
    amount_paid: number;
    remaining_balance: number;
  };
}

// export class RejectBillResponseDto {
//   @ApiProperty()
//   message: string;

//   @ApiProperty()
//   bill: {
//     id: string;
//     status: BillStatus;
//     refund_processed: boolean;
//     refund_amount: number;
//   };
// }

export class ServeBillResponseDto {
  @ApiProperty()
  message!: string;

  @ApiProperty()
  notary_record!: {
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
  bill!: {
    id: string;
    status: BillStatus;
  };
}

export class PaymentHistoryResponseDto {
  @ApiProperty()
  bill!: {
    id: string;
    bill_number: string;
    grand_total: number;
    amount_paid: number;
    remaining_balance: number;
  };

  @ApiProperty({ type: [PaymentDto] })
  payments: PaymentDto[] = [];
}

/**
 * Minijust (Ministry of Justice) report row.
 * Field order is fixed by the official format:
 * date, book type, volume, number, client full name, client id,
 * sub-service, service name.
 */
export class MinijustReportRecordDto {
  @ApiProperty({ description: 'Served date' })
  date!: Date;

  @ApiProperty({ description: 'Book type (slug)' })
  book_type!: string;

  @ApiProperty({ description: 'Book volume', nullable: true })
  volume!: string;

  @ApiProperty({ description: 'Record number (display_number or number)' })
  number!: string;

  @ApiProperty({ description: 'Client full name' })
  client_full_name!: string;

  @ApiProperty({ description: 'Client national ID number' })
  client_id_number!: string;

  @ApiProperty({ description: 'Sub-service' })
  sub_service_name!: string;

  @ApiProperty({ description: 'Service (category) name' })
  service_name!: string;
}

export class MinijustReportDto {
  @ApiProperty()
  period!: {
    start_date: string;
    end_date: string;
  };

  @ApiProperty({ type: [MinijustReportRecordDto] })
  records: MinijustReportRecordDto[] = [];

  @ApiProperty()
  total_records!: number;

  //   @ApiProperty()
  //   total_amount: number;
}

export class FinancialReportSummaryDto {
  @ApiProperty({ description: 'Number of bills in scope' })
  total_bills!: number;

  @ApiProperty({
    description: 'Gross notary revenue before refunds',
  })
  total_notary_revenue!: number;

  @ApiProperty({
    description: 'Gross secretariat revenue before refunds',
  })
  total_secretariat_revenue!: number;

  @ApiProperty({ description: 'VAT collected (notary only)' })
  total_vat_collected!: number;

  @ApiProperty({
    description:
      'Gross revenue before refunds (notary + secretariat, VAT-inclusive)',
  })
  gross_revenue!: number;

  @ApiProperty({
    description: 'Total refunds applied within scope',
  })
  total_refunds!: number;

  @ApiProperty({
    description: 'Net revenue = gross_revenue − total_refunds',
  })
  net_revenue!: number;
}

export class NotaryFinancialRecordDto {
  @ApiProperty()
  date!: Date;

  @ApiProperty()
  client_name!: string;

  @ApiProperty()
  client_id_number!: string;

  @ApiProperty()
  service_name!: string;

  @ApiProperty()
  sub_service_name!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  unit_price!: number;

  @ApiProperty()
  subtotal!: number;

  @ApiProperty()
  vat!: number;

  @ApiProperty()
  grand_total!: number;

  @ApiProperty()
  is_refunded: boolean = false;

  @ApiProperty()
  amount_refunded!: number;

  @ApiProperty()
  amount_after_refund!: number;

  @ApiProperty()
  bill_number!: string;

  @ApiProperty()
  bill_status: BillStatus;
}

export class SecretariatFinancialRecordDto {
  @ApiProperty()
  date!: Date;

  @ApiProperty()
  client_name!: string;

  @ApiProperty()
  client_id_number!: string;

  @ApiProperty()
  service_name!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  unit_price!: number;

  @ApiProperty()
  subtotal!: number;

  @ApiProperty()
  grand_total!: number;

  @ApiProperty()
  bill_number!: string;

  @ApiProperty()
  bill_status: BillStatus;
}
export class FinancialReportDto {
  @ApiProperty()
  period!: {
    start_date: string;
    end_date: string;
  };

  @ApiProperty({ enum: BillType })
  type: BillType = BillType.NOTARY;

  @ApiProperty()
  summary: FinancialReportSummaryDto = new FinancialReportSummaryDto();

  @ApiProperty({ type: [Object] })
  records?: NotaryFinancialRecordDto[] | SecretariatFinancialRecordDto[];

  @ApiProperty()
  breakdown_by_status!: Record<string, { count: number; amount: number }>;

  @ApiProperty()
  breakdown_by_payment_method!: Record<
    string,
    { count: number; amount: number }
  >;

  @ApiPropertyOptional({
    description:
      'Per-period buckets (keyed by group_by) with gross/net revenue.',
  })
  breakdown_by_period?: Record<string, { gross: number; net: number }>;
}

export class RejectBillResponseDto {
  @ApiProperty()
  message!: string;

  @ApiProperty()
  bill!: {
    id: string;
    status: BillStatus;
    refund_status?: string;
    refund_requested_amount?: number;
    refund_processed: boolean;
    refund_amount: number;
  };

  @ApiPropertyOptional()
  refund?: {
    id: string;
    status: string;
    requested_amount: number;
  } | null;
}
export class DailySalesReportDto {
  @ApiProperty()
  period!: {
    start_date: string;
    end_date: string;
  };

  @ApiProperty({
    description:
      'All revenue figures are NET of refunds. gross/refunds/net reconcile: net = gross − refunds.',
  })
  summary!: {
    total_bills: number;
    gross_revenue: number;
    gross_notary_revenue: number;
    gross_secretariat_revenue: number;
    total_refunds: number;
    notary_refunds: number;
    secretariat_refunds: number;
    total_revenue: number; // net (= gross − refunds)
    total_notary_revenue: number; // net
    total_secretariat_revenue: number; // net
    total_vat: number;
    average_bill_value: number;
  };

  @ApiProperty()
  payment_method_breakdown!: Record<string, { amount: number; count: number; }>;

  @ApiPropertyOptional({
    description:
      'Per-period buckets (keyed by group_by) with gross/refunds/net.',
  })
  breakdown_by_period?: Record<
    string,
    { gross: number; refunds: number; net: number }
  >;

  @ApiProperty()
  transactions: Array<{
    id: string;
    bill_number: string;
    client_name: string;
    notary_amount: number;
    secretariat_amount: number;
    total: number;
    vat: number;
    date: Date;
  }> = [];
}

export class RecordAttachmentDto {
  @ApiProperty() id: string;
  @ApiProperty() file_name: string;
  @ApiProperty() file_url: string;
  @ApiProperty() mime_type: string;
  @ApiProperty() file_size: number;
  @ApiProperty() category: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() is_primary: boolean;
  @ApiProperty() uploaded_by_name: string;
  @ApiProperty() uploaded_at: Date;
}

export class NotaryRecordResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() bill_id: string;
  @ApiProperty() book_id: string | null;
  @ApiProperty() book_type: string;
  @ApiProperty({ nullable: true }) volume: string | null;
  @ApiProperty() record_number: string;
  @ApiProperty() display_number: string;

  @ApiProperty({ description: 'Service category (parent) name' })
  service_category: string;

  @ApiProperty({ description: 'Sub-service name' })
  sub_service: string;

  @ApiProperty({ description: 'Quantity recorded', nullable: true })
  quantity: number | null;

  @ApiProperty({ description: 'Unit price (RWF)', nullable: true })
  unit_price: number | null;

  @ApiProperty({ description: 'Line subtotal (pre-VAT)' })
  subtotal: number;

  @ApiProperty({ description: 'VAT amount' })
  vat_amount: number;

  @ApiProperty({ description: 'Grand total (subtotal + VAT)', nullable: true })
  grand_total: number | null;

  @ApiPropertyOptional() upi?: string;

  @ApiProperty() client_full_name: string;
  @ApiProperty() client_id_number: string;
  @ApiPropertyOptional() client_phone?: string;

  @ApiProperty({ enum: BillStatus, required: false })
  status: string;

  @ApiProperty() served_by: string;
  @ApiProperty() served_date: Date;
  @ApiProperty() has_documents: boolean;

  @ApiProperty({ type: [RecordAttachmentDto] })
  attachments: RecordAttachmentDto[] = [];
}
