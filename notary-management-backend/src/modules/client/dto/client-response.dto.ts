import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MaritalStatus,
  VerificationStatus,
} from '../../../shared/enums/client.enum';

export class BillSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() bill_number: string;
  @ApiProperty() total_amount: number;
  @ApiProperty() status: string;
  @ApiProperty() created_at: Date;
}

export class ClientResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() full_name: string;
  @ApiProperty() id_number: string;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() email?: string;
  @ApiPropertyOptional() father_name?: string;
  @ApiPropertyOptional() mother_name?: string;
  @ApiPropertyOptional() province?: string;
  @ApiPropertyOptional() district?: string;
  @ApiPropertyOptional() sector?: string;
  @ApiPropertyOptional() cell?: string;
  @ApiPropertyOptional() village?: string;
  @ApiPropertyOptional() date_of_birth?: Date;
  @ApiProperty({ enum: MaritalStatus }) marital_status: MaritalStatus;
  @ApiPropertyOptional() partner_name?: string;
  @ApiPropertyOptional() upi?: string;
  @ApiProperty({ enum: VerificationStatus })
  verification_status: VerificationStatus;
  @ApiPropertyOptional() verification_notes?: string;
  @ApiPropertyOptional() verified_at?: Date;
  @ApiProperty() is_active: boolean;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
  @ApiPropertyOptional() total_bills?: number;
  @ApiPropertyOptional() total_spent?: number;
  @ApiPropertyOptional({ type: [BillSummaryDto] })
  recent_bills?: BillSummaryDto[];
}
