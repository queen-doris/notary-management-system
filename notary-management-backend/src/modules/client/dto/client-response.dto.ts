import {
  MaritalStatus,
  VerificationStatus,
} from '../../../shared/enums/client.enum';

export class BillSummaryDto {
  id: string;
  bill_number: string;
  total_amount: number;
  status: string;
  created_at: Date;
}

export class ClientResponseDto {
  id: string;
  full_name: string;
  id_number: string;
  phone?: string;
  email?: string;
  father_name?: string;
  mother_name?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  date_of_birth?: Date;
  marital_status: MaritalStatus;
  partner_name?: string;
  upi?: string;
  verification_status: VerificationStatus;
  verification_notes?: string;
  verified_at?: Date;
  is_active: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  total_bills?: number;
  total_spent?: number;
  recent_bills?: BillSummaryDto[];
}
