import { BillStatus, BillType } from '../../../shared/enums/bill.enum';

export class BillItemResponseDto {
  id: string;
  item_type: string;
  service_name: string;
  sub_service_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  vat_amount: number;
  total: number;
  notes?: string;
}

export class NotarySummaryDto {
  subtotal: number;
  vat: number;
  total: number;
  items: BillItemResponseDto[];
}

export class SecretariatSummaryDto {
  subtotal: number;
  total: number;
  items: BillItemResponseDto[];
}

export class ClientInfoDto {
  id: string;
  full_name: string;
  id_number: string;
  phone?: string;
  father_name?: string;
  mother_name?: string;
  verification_status: string;
}

export class BillResponseDto {
  id: string;
  bill_number: string;
  bill_type: BillType;
  client: ClientInfoDto;
  notary: NotarySummaryDto;
  secretariat: SecretariatSummaryDto;
  grand_total: number;
  status: BillStatus;
  notes?: string;
  created_by_name: string;
  created_by_role: string;
  created_at: Date;
  updated_at: Date;
}
