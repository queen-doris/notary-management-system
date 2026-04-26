/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotaryRecord } from '../../shared/entities/notary-record.entity';
import { Bill } from '../../shared/entities/bill.entity';
import { Client } from '../../shared/entities/client.entity';
import { BillItem, ItemType } from '../../shared/entities/bill-item.entity';
import { BooksService } from '../books/books.service';
import { ServeClientDto } from './dto/serve-client.dto';
import { RejectClientDto } from './dto/reject-client.dto';
import { BookType } from '../../shared/enums/book-type.enum';
import { EBusinessRole } from '../../shared/enums/business-role.enum';
import { EUserRole } from '../../shared/enums/user-role.enum';
import { BillStatus } from '../../shared/enums/bill.enum';
import { RecordStatus } from '../../shared/enums/record-status.enum';
import {
  MaritalStatus,
  VerificationStatus,
} from '../../shared/enums/client.enum';

@Injectable()
export class NotaryService {
  constructor(
    @InjectRepository(NotaryRecord)
    private notaryRecordRepository: Repository<NotaryRecord>,
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(BillItem)
    private billItemRepository: Repository<BillItem>,
    private booksService: BooksService,
    private dataSource: DataSource,
  ) {}

  /**
   * Check if user has permission to serve/reject
   */
  private async checkNotaryPermission(
    userId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
    businessId: string,
  ): Promise<void> {
    const isOwner =
      userRole === EUserRole.SUPERADMIN ||
      (userRole === EUserRole.STAFF &&
        userBusinessRoles.includes(EBusinessRole.OWNER));

    if (!isOwner && !userBusinessRoles.includes(EBusinessRole.OWNER)) {
      throw new ForbiddenException(
        'Only business owner can serve or reject clients',
      );
    }
  }

  /**
   * Helper to safely get string value (null instead of undefined)
   */
  private safeString(value: string | null | undefined): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    return value;
  }

  /**
   * Helper to safely get date value
   */
  private safeDate(value: Date | null | undefined): Date | null {
    if (value === undefined || value === null) {
      return null;
    }
    return value;
  }

  /**
   * Helper to safely get enum value
   */
  private safeMaritalStatus(
    value: MaritalStatus | null | undefined,
  ): MaritalStatus {
    if (value === undefined || value === null) {
      return MaritalStatus.SINGLE;
    }
    return value;
  }

  private safeVerificationStatus(
    value: VerificationStatus | null | undefined,
  ): VerificationStatus {
    if (value === undefined || value === null) {
      return VerificationStatus.PENDING;
    }
    return value;
  }

  /**
   * Serve a client - create permanent record with full client information
   */
  async serveClient(
    businessId: string,
    userId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
    dto: ServeClientDto,
  ): Promise<NotaryRecord> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Check permission
      await this.checkNotaryPermission(
        userId,
        userRole,
        userBusinessRoles,
        businessId,
      );

      // 2. Get the bill with client information
      const bill = await this.billRepository.findOne({
        where: { id: dto.bill_id, business_id: businessId },
        relations: ['client'],
      });

      if (!bill) {
        throw new NotFoundException('Bill not found');
      }

      if (bill.status !== BillStatus.PAID) {
        throw new BadRequestException('Cannot serve a bill that is not paid');
      }

      // 3. Get the full client information
      const client = await this.clientRepository.findOne({
        where: { id: bill.client_id, business_id: businessId },
      });

      if (!client) {
        throw new NotFoundException('Client not found');
      }

      // 4. Get notary items from the bill
      const notaryItems = await this.billItemRepository.find({
        where: { bill_id: bill.id, item_type: ItemType.NOTARY },
      });

      if (notaryItems.length === 0) {
        throw new BadRequestException(
          'This bill has no notary services to serve',
        );
      }

      // 5. Get or generate record number
      let recordNumber: string;
      let volume: string | null = null;
      let displayNumber: string;
      let newRecordsInVolume: number = 0;

      if (dto.record_number && dto.volume) {
        // Manual override
        recordNumber = dto.record_number;
        volume = dto.volume;
        displayNumber = volume ? `${recordNumber}/${volume}` : recordNumber;
      } else {
        // Auto-generate
        const nextNumber = await this.booksService.getNextRecordNumber(
          businessId,
          dto.book_type,
        );
        recordNumber = String(nextNumber.number);
        volume = nextNumber.volume;
        displayNumber = nextNumber.displayNumber;
        newRecordsInVolume = nextNumber.newRecordsInVolume;
      }

      // 6. Validate UPI for land records
      const upiValue = dto.upi || client.upi;
      if (dto.book_type === BookType.LAND && !upiValue) {
        throw new BadRequestException(
          'UPI (Unique Parcel Identifier) is required for land records',
        );
      }

      // 7. Create the record with ALL client information (denormalized)
      const firstNotaryItem = notaryItems[0];

      const newRecord = new NotaryRecord();

      // Book Information
      newRecord.book_type = dto.book_type;
      newRecord.volume = volume;
      newRecord.record_number = recordNumber;
      newRecord.display_number = displayNumber;

      // Service Information
      newRecord.service_category = firstNotaryItem.service_name;
      newRecord.sub_service =
        firstNotaryItem.sub_service_name || firstNotaryItem.service_name;
      newRecord.amount = firstNotaryItem.subtotal;
      newRecord.vat_amount = firstNotaryItem.vat_amount;

      // Client Information (denormalized from client entity) - using safe helpers
      newRecord.client_id = client.id;
      newRecord.client_full_name = client.full_name || '';
      newRecord.client_id_number = client.id_number || '';
      newRecord.client_phone = this.safeString(client.phone) || '';
      newRecord.client_email = this.safeString(client.email) || '';
      newRecord.client_father_name = this.safeString(client.father_name) || '';
      newRecord.client_mother_name = this.safeString(client.mother_name) || '';
      newRecord.client_province = this.safeString(client.province) || '';
      newRecord.client_district = this.safeString(client.district) || '';
      newRecord.client_sector = this.safeString(client.sector) || '';
      newRecord.client_cell = this.safeString(client.cell) || '';
      newRecord.client_village = this.safeString(client.village) || '';
      newRecord.client_date_of_birth = this.safeDate(
        client.date_of_birth,
      ) as Date;
      newRecord.client_marital_status = this.safeMaritalStatus(
        client.marital_status,
      );
      newRecord.client_partner_name =
        this.safeString(client.partner_name) || '';
      newRecord.client_verification_status = this.safeVerificationStatus(
        client.verification_status,
      );

      // UPI (for land records)
      newRecord.upi = upiValue || '';

      // Additional Information
      newRecord.document_description = dto.document_description || '';
      newRecord.notary_notes = dto.notary_notes || '';

      // Status & Tracking
      newRecord.served_by = userId;
      newRecord.served_date = new Date();
      newRecord.has_documents = false;
      newRecord.status = RecordStatus.ACTIVE;

      // References
      newRecord.bill_id = bill.id;
      newRecord.business_id = businessId;

      const savedRecord = await queryRunner.manager.save(
        NotaryRecord,
        newRecord,
      );

      // 8. Update bill status to SERVED
      bill.status = BillStatus.SERVED;
      await queryRunner.manager.save(Bill, bill);

      // 9. Update book tracker (if not manual override)
      if (!dto.record_number) {
        await this.booksService.updateTrackerAfterRecord(
          businessId,
          dto.book_type,
          {
            volume: volume,
            number: parseInt(recordNumber, 10),
            recordsInVolume: newRecordsInVolume,
          },
        );
      }

      await queryRunner.commitTransaction();

      return savedRecord;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Reject a client - no record created
   */
  async rejectClient(
    businessId: string,
    userId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
    dto: RejectClientDto,
  ): Promise<{ message: string; bill_id: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Check permission
      await this.checkNotaryPermission(
        userId,
        userRole,
        userBusinessRoles,
        businessId,
      );

      // 2. Get the bill
      const bill = await this.billRepository.findOne({
        where: { id: dto.bill_id, business_id: businessId },
      });

      if (!bill) {
        throw new NotFoundException('Bill not found');
      }

      if (bill.status !== BillStatus.PAID) {
        throw new BadRequestException('Cannot reject a bill that is not paid');
      }

      // 3. Update bill status to REJECTED
      bill.status = BillStatus.REJECTED;
      bill.rejected_by = userId;
      bill.rejected_at = new Date();
      bill.rejection_reason = dto.rejection_reason;
      bill.rejection_notes = dto.rejection_notes || '';

      await queryRunner.manager.save(Bill, bill);

      await queryRunner.commitTransaction();

      return {
        message: 'Client rejected successfully. No record created.',
        bill_id: bill.id,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get all records (for reports) - includes client info already in the record
   */
  async getAllRecords(
    businessId: string,
    filters: {
      book_type?: BookType;
      start_date?: string;
      end_date?: string;
      client_id?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<any> {
    const query = this.notaryRecordRepository
      .createQueryBuilder('record')
      .where('record.business_id = :businessId', { businessId });

    if (filters.book_type) {
      query.andWhere('record.book_type = :bookType', {
        bookType: filters.book_type,
      });
    }

    if (filters.start_date) {
      query.andWhere('record.served_date >= :startDate', {
        startDate: filters.start_date,
      });
    }

    if (filters.end_date) {
      query.andWhere('record.served_date <= :endDate', {
        endDate: filters.end_date,
      });
    }

    if (filters.client_id) {
      query.andWhere('record.client_id = :clientId', {
        clientId: filters.client_id,
      });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    query.skip(skip).take(limit);
    query.orderBy('record.served_date', 'DESC');

    const [data, total] = await query.getManyAndCount();

    return {
      data: data.map((record) => ({
        id: record.id,
        record_number: record.display_number || record.record_number,
        volume: record.volume,
        book_type: record.book_type,
        // Client info is already in the record - no join needed!
        client: {
          full_name: record.client_full_name,
          id_number: record.client_id_number,
          phone: record.client_phone,
          father_name: record.client_father_name,
          mother_name: record.client_mother_name,
          province: record.client_province,
          district: record.client_district,
          sector: record.client_sector,
          cell: record.client_cell,
          village: record.client_village,
          verification_status: record.client_verification_status,
        },
        service: {
          category: record.service_category,
          sub_service: record.sub_service,
        },
        amount: record.amount,
        vat_amount: record.vat_amount,
        total: record.amount + record.vat_amount,
        upi: record.upi,
        served_date: record.served_date,
        notary_notes: record.notary_notes,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get record by ID
   */
  async getRecord(recordId: string, businessId: string): Promise<NotaryRecord> {
    const record = await this.notaryRecordRepository.findOne({
      where: { id: recordId, business_id: businessId },
    });

    if (!record) {
      throw new NotFoundException('Record not found');
    }

    return record;
  }

  /**
   * Get records for a specific client
   */
  async getClientRecords(
    clientId: string,
    businessId: string,
  ): Promise<NotaryRecord[]> {
    return this.notaryRecordRepository.find({
      where: { client_id: clientId, business_id: businessId },
      order: { served_date: 'DESC' },
    });
  }
}
