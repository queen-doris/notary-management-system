/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  Between,
  IsNull,
  Not,
  Brackets,
  In,
} from 'typeorm';
import { Bill } from '../../shared/entities/bill.entity';
import { BillItem, ItemType } from '../../shared/entities/bill-item.entity';
import { Client } from '../../shared/entities/client.entity';
import { Business } from '../../shared/entities/business.entity';
import { User } from '../../shared/entities/user.entity';
import { BusinessUser } from '../../shared/entities/business-user.entity';
import { NotaryService } from '../../shared/entities/notary-service.entity';
import { SecretariatService } from '../../shared/entities/secretariat-service.entity';
import { NotaryRecord } from '../../shared/entities/notary-record.entity';
import { SecretariatRecord } from '../../shared/entities/secretariat-record.entity';
import { Document } from '../../shared/entities/document.entity';
import * as XLSX from 'xlsx';
import { Book } from '../../shared/entities/book.entity';
import { Payment } from '../../shared/entities/payment.entity';
import {
  CreateBillDto,
  NotaryServiceItemDto,
  SecretariatServiceItemDto,
} from './dto/create-bill.dto';
import { UpdateBillStatusDto } from './dto/update-bill-status.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { Refund } from '../../shared/entities/refund.entity';
import {
  RefundRequestStatus,
  RefundType,
  RefundStatus,
} from '../../shared/enums/refund.enum';
import { RefundOption, RejectBillDto } from './dto/reject-bill.dto';
import { ServeBillDto, ServePreviewResponseDto } from './dto/serve-bill.dto';
import { ReportFiltersDto, ReportGroupBy } from './dto/report-filters.dto';
import {
  BillResponseDto,
  PaginatedResponseDto,
  FinancialReportDto,
  MinijustReportDto,
  PaymentHistoryResponseDto,
  RecordPaymentResponseDto,
  RejectBillResponseDto,
  ServeBillResponseDto,
  DailySalesReportDto,
  FinancialReportSummaryDto,
  NotaryFinancialRecordDto,
  SecretariatFinancialRecordDto,
} from './dto/bill-response.dto';
import {
  BillStatus,
  BillType,
  PaymentMethod,
  PaymentStatus,
} from '../../shared/enums/bill-status.enum';
import { EBusinessRole } from '../../shared/enums/business-role.enum';
import { EUserRole } from '../../shared/enums/user-role.enum';
import { VerificationStatus } from '../../shared/enums/client.enum';
import { RecordStatus } from '../../shared/enums/record-status.enum';
import { BookTracker } from '../../shared/interfaces/book-tracker.interface';
import { ProcessRefundDto } from './dto/process-refund.dto';
import { AddItemsToBillDto } from './dto/add-items.dto';
import { BookType } from 'src/shared/enums/book-type.enum';

@Injectable()
export class BillService {
  private readonly logger = new Logger(BillService.name);
  private readonly VAT_RATE = 0.18;

  constructor(
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    @InjectRepository(BillItem)
    private billItemRepository: Repository<BillItem>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(BusinessUser)
    private businessUserRepository: Repository<BusinessUser>,
    @InjectRepository(NotaryService)
    private notaryServiceRepository: Repository<NotaryService>,
    @InjectRepository(SecretariatService)
    private secretariatServiceRepository: Repository<SecretariatService>,
    @InjectRepository(NotaryRecord)
    private notaryRecordRepository: Repository<NotaryRecord>,
    @InjectRepository(SecretariatRecord)
    private secretariatRecordRepository: Repository<SecretariatRecord>,
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Refund)
    private refundRepository: Repository<Refund>,
    private dataSource: DataSource,
  ) {}

  // ==================== Helper Methods ====================

  private async getUserBusinessRoles(
    userId: string,
    businessId: string,
  ): Promise<EBusinessRole[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return [];
    if (user.role === EUserRole.SUPERADMIN) {
      return [
        EBusinessRole.OWNER,
        EBusinessRole.ACCOUNTANT,
        EBusinessRole.RECEPTIONIST,
        EBusinessRole.SECRETARIAT,
      ];
    }
    const businessUser = await this.businessUserRepository.findOne({
      where: { userId: userId, businessId: businessId },
    });
    return businessUser?.roles || [];
  }

  private async checkPermission(
    userId: string,
    businessId: string,
    allowedRoles: EBusinessRole[],
    actionDescription: string,
  ): Promise<void> {
    const userRoles = await this.getUserBusinessRoles(userId, businessId);
    const hasPermission = allowedRoles.some((role) => userRoles.includes(role));
    if (!hasPermission) {
      throw new ForbiddenException(
        `You don't have permission to ${actionDescription}. Required roles: ${allowedRoles.join(', ')}`,
      );
    }
  }

  private async getUserInfo(
    userId: string,
    businessId: string,
  ): Promise<{ name: string; role: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return { name: 'Unknown', role: 'unknown' };
    }

    if (user.role === EUserRole.SUPERADMIN) {
      return { name: user.fullNames || user.phone, role: 'SUPERADMIN' };
    }

    const businessUser = await this.businessUserRepository.findOne({
      where: { userId: userId, businessId: businessId },
    });

    if (businessUser && businessUser.roles && businessUser.roles.length > 0) {
      const primaryRole = businessUser.roles[0];
      return {
        name: user.fullNames || user.phone,
        role: primaryRole,
      };
    }

    return { name: user.fullNames || user.phone, role: 'STAFF' };
  }

  private calculateItemTotals(
    unitPrice: number,
    quantity: number,
    isNotary: boolean,
  ): {
    subtotal: number;
    vatAmount: number;
    total: number;
  } {
    const subtotal = unitPrice * quantity;
    const vatAmount = isNotary ? Math.round(subtotal * this.VAT_RATE) : 0;
    const total = subtotal + vatAmount;
    return { subtotal, vatAmount, total };
  }

  private async generateBillNumber(
    businessId: string,
    billType: BillType,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefix =
      billType === BillType.NOTARY
        ? 'NOT'
        : billType === BillType.SECRETARIAT
          ? 'SEC'
          : 'BTH';

    const lastBill = await this.billRepository
      .createQueryBuilder('bill')
      .where('bill.business_id = :businessId', { businessId })
      .andWhere('bill.bill_number LIKE :pattern', {
        pattern: `${prefix}-${year}-%`,
      })
      .orderBy('bill.bill_number', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastBill) {
      const lastNumber = parseInt(lastBill.bill_number.split('-')[2]);
      sequence = lastNumber + 1;
    }
    return `${prefix}-${year}-${sequence.toString().padStart(4, '0')}`;
  }

  private async hasActiveNotaryBill(
    clientId: string,
    businessId: string,
    excludeBillId?: string,
  ): Promise<boolean> {
    const query = this.billRepository
      .createQueryBuilder('bill')
      .where('bill.client_id = :clientId', { clientId })
      .andWhere('bill.business_id = :businessId', { businessId })
      .andWhere('bill.status IN (:...statuses)', {
        statuses: [
          BillStatus.PENDING,
          BillStatus.PARTIALLY_PAID,
          BillStatus.PAID,
        ],
      })
      .andWhere('bill.bill_type IN (:...types)', {
        types: [BillType.NOTARY, BillType.BOTH],
      });
    if (excludeBillId)
      query.andWhere('bill.id != :excludeBillId', { excludeBillId });
    return !!(await query.getOne());
  }

  private createBillItem(
    type: ItemType,
    serviceId: string | null,
    serviceName: string,
    subServiceName: string | null,
    quantity: number,
    unitPrice: number,
    subtotal: number,
    vat: number,
    total: number,
    notes?: string,
  ): BillItem {
    const item = new BillItem();
    item.item_type = type;
    item.service_id = serviceId || '';
    item.service_name = serviceName;
    item.sub_service_name = subServiceName || '';
    item.quantity = quantity;
    item.unit_price = unitPrice;
    item.subtotal = subtotal;
    item.vat_amount = vat;
    item.total = total;
    item.notes = notes || '';
    return item;
  }

  private async getBook(businessId: string, bookId: string): Promise<Book> {
    const book = await this.bookRepository.findOne({
      where: { id: bookId, business_id: businessId },
    });
    if (!book) {
      throw new NotFoundException(`Book "${bookId}" not found`);
    }
    return book;
  }

  private async getBookTracker(
    businessId: string,
    bookId: string,
  ): Promise<BookTracker> {
    const tracker = (await this.dataSource
      .getRepository('book_trackers')
      .findOne({
        where: { business_id: businessId, book_id: bookId },
      })) as BookTracker | null;

    if (!tracker) {
      throw new NotFoundException(`Book tracker for ${bookId} not found`);
    }
    return tracker;
  }

  private async updateBookTracker(
    businessId: string,
    book: Book,
    volume: string | null,
    number: number,
  ): Promise<void> {
    const tracker = await this.getBookTracker(businessId, book.id);
    tracker.current_number = number;
    if (volume) tracker.current_volume = volume;
    if (book.increments_volume_on_serve) tracker.records_in_current_volume += 1;
    await this.dataSource.getRepository('book_trackers').save(tracker);
  }

  private incrementRoman(roman: string): string {
    const romanMap: [number, string][] = [
      [1000, 'M'],
      [900, 'CM'],
      [500, 'D'],
      [400, 'CD'],
      [100, 'C'],
      [90, 'XC'],
      [50, 'L'],
      [40, 'XL'],
      [10, 'X'],
      [9, 'IX'],
      [5, 'V'],
      [4, 'IV'],
      [1, 'I'],
    ];
    let num = 0;
    for (let i = 0; i < roman.length; i++) {
      const current = this.romanCharValue(roman[i]);
      const next = this.romanCharValue(roman[i + 1]);
      if (current < next) num -= current;
      else num += current;
    }
    let result = '';
    for (const [value, symbol] of romanMap) {
      while (num >= value) {
        result += symbol;
        num -= value;
      }
    }
    return result;
  }

  private romanCharValue(char: string): number {
    const values: Record<string, number> = {
      I: 1,
      V: 5,
      X: 10,
      L: 50,
      C: 100,
      D: 500,
      M: 1000,
    };
    return values[char] || 0;
  }

  // ==================== Bill CRUD ====================

  async createBill(
    userId: string,
    businessId: string,
    dto: CreateBillDto,
  ): Promise<BillResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const client = await this.clientRepository.findOne({
        where: { id: dto.client_id, business: { id: businessId } },
      });
      if (!client) throw new NotFoundException('Client not found');

      if (
        dto.bill_type === BillType.NOTARY ||
        dto.bill_type === BillType.BOTH
      ) {
        await this.checkPermission(
          userId,
          businessId,
          [EBusinessRole.OWNER, EBusinessRole.RECEPTIONIST],
          'create notary bills',
        );
      }
      if (dto.bill_type === BillType.SECRETARIAT) {
        await this.checkPermission(
          userId,
          businessId,
          [
            EBusinessRole.OWNER,
            EBusinessRole.RECEPTIONIST,
            EBusinessRole.SECRETARIAT,
          ],
          'create secretariat bills',
        );
      }

      if (
        dto.bill_type === BillType.NOTARY ||
        dto.bill_type === BillType.BOTH
      ) {
        const hasActive = await this.hasActiveNotaryBill(
          dto.client_id,
          businessId,
        );
        if (hasActive) {
          throw new ConflictException(
            'Client already has a pending or paid notary bill. Only one notary service allowed at a time.',
          );
        }
      }

      const business = await this.businessRepository.findOne({
        where: { id: businessId, isActive: true },
      });
      if (!business)
        throw new NotFoundException('Business not found or inactive');

      if (dto.secretariat_items?.length && !business.has_secretariat) {
        throw new ForbiddenException(
          'This business does not offer secretariat services',
        );
      }

      if ((dto.notary_items?.length ?? 0) > 1) {
        throw new BadRequestException(
          'A bill may carry at most one notary sub-service',
        );
      }

      let notarySubtotal = 0,
        notaryVat = 0,
        notaryTotal = 0;
      let secretariatSubtotal = 0,
        secretariatTotal = 0;
      const itemsToSave: BillItem[] = [];

      if (dto.notary_items?.length) {
        for (const itemDto of dto.notary_items) {
          let { unit_price, service_name, sub_service_name } = itemDto;
          if (itemDto.service_id) {
            const catalogItem = await this.notaryServiceRepository.findOne({
              where: { id: itemDto.service_id, business_id: businessId },
              relations: ['category'],
            });
            if (!catalogItem) {
              throw new NotFoundException(
                `Notary service "${itemDto.service_id}" not found`,
              );
            }
            // Catalog price is authoritative when set.
            unit_price = catalogItem.base_price ?? unit_price;
            service_name = catalogItem.category?.name ?? service_name;
            sub_service_name = catalogItem.sub_service;
          }
          if (unit_price == null || unit_price <= 0) {
            throw new BadRequestException(
              'unit_price is required: the selected service has no preset price, or no service_id was provided',
            );
          }
          const { subtotal, vatAmount, total } = this.calculateItemTotals(
            unit_price,
            itemDto.quantity,
            true,
          );
          notarySubtotal += subtotal;
          notaryVat += vatAmount;
          notaryTotal += total;
          itemsToSave.push(
            this.createBillItem(
              ItemType.NOTARY,
              itemDto.service_id || null,
              service_name,
              sub_service_name,
              itemDto.quantity,
              unit_price,
              subtotal,
              vatAmount,
              total,
              itemDto.notes,
            ),
          );
        }
      }

      if (dto.secretariat_items?.length) {
        for (const itemDto of dto.secretariat_items) {
          let { unit_price } = itemDto;
          const { service_name } = itemDto;
          if (itemDto.service_id) {
            const catalogItem = await this.secretariatServiceRepository.findOne(
              { where: { id: itemDto.service_id, business_id: businessId } },
            );
            if (!catalogItem) {
              throw new NotFoundException(
                `Secretariat service "${itemDto.service_id}" not found`,
              );
            }
            // Catalog price is authoritative when set.
            unit_price = catalogItem.base_price ?? unit_price;
          }
          if (unit_price == null || unit_price <= 0) {
            throw new BadRequestException(
              'unit_price is required: the selected service has no preset price, or no service_id was provided',
            );
          }
          const { subtotal, total } = this.calculateItemTotals(
            unit_price,
            itemDto.quantity,
            false,
          );
          secretariatSubtotal += subtotal;
          secretariatTotal += total;
          itemsToSave.push(
            this.createBillItem(
              ItemType.SECRETARIAT,
              itemDto.service_id || null,
              service_name,
              null,
              itemDto.quantity,
              unit_price,
              subtotal,
              0,
              total,
              itemDto.notes,
            ),
          );
        }
      }

      if (itemsToSave.length === 0)
        throw new BadRequestException('At least one service item is required');

      const hasNotary = notaryTotal > 0;
      const hasSecretariat = secretariatTotal > 0;
      const actualBillType =
        hasNotary && hasSecretariat
          ? BillType.BOTH
          : hasNotary
            ? BillType.NOTARY
            : BillType.SECRETARIAT;
      const billNumber = await this.generateBillNumber(
        businessId,
        actualBillType,
      );

      const bill = this.billRepository.create({
        bill_number: billNumber,
        bill_type: actualBillType,
        client_id: client.id,
        client_full_name: client.full_name,
        client_id_number: client.id_number,
        client_father_name: client.father_name,
        client_mother_name: client.mother_name,
        client_phone: client.phone,
        client_email: client.email,
        client_province: client.province,
        client_district: client.district,
        client_sector: client.sector,
        client_cell: client.cell,
        client_village: client.village,
        client_date_of_birth: client.date_of_birth,
        client_marital_status: client.marital_status,
        client_partner_name: client.partner_name,
        client_verification_status: client.verification_status,
        client_upi: client.upi,
        business_id: businessId,
        created_by: userId,
        is_created_by_staff: true,
        notary_subtotal: notarySubtotal,
        notary_vat: notaryVat,
        notary_total: notaryTotal,
        secretariat_subtotal: secretariatSubtotal,
        secretariat_total: secretariatTotal,
        grand_total: notaryTotal + secretariatTotal,
        amount_paid: 0,
        remaining_balance: notaryTotal + secretariatTotal,
        status: BillStatus.PENDING,
        notes: dto.notes,
      });

      await queryRunner.manager.save(bill);
      for (const item of itemsToSave) {
        item.bill_id = bill.id;
        await queryRunner.manager.save(item);
      }
      await queryRunner.commitTransaction();
      return this.getBillById(bill.id, businessId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getBillById(
    billId: string,
    businessId: string,
  ): Promise<BillResponseDto> {
    const bill = await this.billRepository.findOne({
      where: { id: billId, business_id: businessId },
    });
    if (!bill) throw new NotFoundException('Bill not found');

    const items = await this.billItemRepository.find({
      where: { bill_id: bill.id },
    });
    const payments = await this.paymentRepository.find({
      where: { bill_id: bill.id },
      order: { processed_at: 'DESC' },
    });
    const creatorInfo = await this.getUserInfo(bill.created_by, businessId);

    // Separate items by type
    const notaryItems = items
      .filter((i) => i.item_type === ItemType.NOTARY)
      .map((i) => ({
        id: i.id,
        service_name: i.service_name,
        sub_service_name: i.sub_service_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        subtotal: i.subtotal,
        vat_amount: i.vat_amount,
        total: i.total,
        notes: i.notes,
      }));

    const secretariatItems = items
      .filter((i) => i.item_type === ItemType.SECRETARIAT)
      .map((i) => ({
        id: i.id,
        service_name: i.service_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        subtotal: i.subtotal,
        total: i.total,
        notes: i.notes,
      }));

    return {
      id: bill.id,
      bill_number: bill.bill_number,
      bill_type: bill.bill_type,
      client: {
        id: bill.client_id,
        full_name: bill.client_full_name,
        id_number: bill.client_id_number,
        father_name: bill.client_father_name,
        mother_name: bill.client_mother_name,
        phone: bill.client_phone,
        email: bill.client_email,
        province: bill.client_province,
        district: bill.client_district,
        sector: bill.client_sector,
        cell: bill.client_cell,
        village: bill.client_village,
        date_of_birth: bill.client_date_of_birth,
        marital_status: bill.client_marital_status,
        partner_name: bill.client_partner_name,
        verification_status: bill.client_verification_status,
        upi: bill.client_upi,
      },
      notary_subtotal: bill.notary_subtotal,
      notary_vat: bill.notary_vat,
      notary_total: bill.notary_total,
      secretariat_subtotal: bill.secretariat_subtotal,
      secretariat_total: bill.secretariat_total,
      grand_total: bill.grand_total,
      amount_paid: bill.amount_paid,
      remaining_balance: bill.remaining_balance,
      status: bill.status,
      rejection_reason: bill.rejection_reason,
      rejection_notes: bill.rejection_notes,
      notary_items: notaryItems,
      secretariat_items: secretariatItems,
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        reference: p.reference,
        processed_by_name: p.processed_by_name,
        processed_at: p.processed_at,
      })),
      created_by_name: creatorInfo.name,
      created_by_role: creatorInfo.role,
      created_at: bill.createdAt,
      updated_at: bill.updatedAt,
    };
  }

  async getBills(
    businessId: string,
    filters: ReportFiltersDto & { statusIn?: BillStatus[] },
  ): Promise<PaginatedResponseDto> {
    const query = this.billRepository
      .createQueryBuilder('bill')
      .where('bill.business_id = :businessId', { businessId });

    if (filters.statusIn?.length)
      query.andWhere('bill.status IN (:...statusIn)', {
        statusIn: filters.statusIn,
      });
    else if (filters.status)
      query.andWhere('bill.status = :status', { status: filters.status });
    if (filters.bill_type)
      query.andWhere('bill.bill_type = :billType', {
        billType: filters.bill_type,
      });
    if (filters.client_id)
      query.andWhere('bill.client_id = :clientId', {
        clientId: filters.client_id,
      });
    if (filters.client_name)
      query.andWhere('bill.client_full_name ILIKE :clientName', {
        clientName: `%${filters.client_name}%`,
      });
    if (filters.start_date)
      query.andWhere('bill.createdAt >= :startDate', {
        startDate: filters.start_date,
      });
    if (filters.end_date)
      query.andWhere('bill.createdAt <= :endDate', {
        endDate: filters.end_date,
      });

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('bill.createdAt', 'DESC')
      .getManyAndCount();

    const formattedData = await Promise.all(
      data.map(async (bill) => {
        const items = await this.billItemRepository.find({
          where: { bill_id: bill.id },
        });
        const notaryItems = items.filter(
          (i) => i.item_type === ItemType.NOTARY,
        );
        const secretariatItems = items.filter(
          (i) => i.item_type === ItemType.SECRETARIAT,
        );

        return {
          id: bill.id,
          bill_number: bill.bill_number,
          bill_type: bill.bill_type,
          status: bill.status,
          client: {
            id: bill.client_id,
            full_name: bill.client_full_name,
            id_number: bill.client_id_number,
            phone: bill.client_phone,
          },
          notary_subtotal: bill.notary_subtotal,
          notary_vat: bill.notary_vat,
          notary_total: bill.notary_total,
          secretariat_total: bill.secretariat_total,
          grand_total: bill.grand_total,
          amount_paid: bill.amount_paid,
          remaining_balance: bill.remaining_balance,
          refund_status: bill.refund_status,
          amount_refunded: bill.amount_refunded || 0,
          profit_after_refund: bill.profit_after_refund,
          rejection_reason: bill.rejection_reason,
          rejection_notes: bill.rejection_notes,
          created_at: bill.createdAt,
          paid_at: bill.paid_at,
          notary_item_count: notaryItems.length,
          secretariat_item_count: secretariatItems.length,
          notary_items: notaryItems.map((i) => ({
            service_name: i.service_name,
            sub_service_name: i.sub_service_name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            subtotal: i.subtotal,
            vat_amount: i.vat_amount,
            total: i.total,
          })),
          secretariat_items: secretariatItems.map((i) => ({
            service_name: i.service_name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            subtotal: i.subtotal,
            total: i.total,
          })),
        };
      }),
    );

    return {
      data: formattedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  // ==================== Payment Processing ====================

  async recordPayment(
    userId: string,
    businessId: string,
    dto: RecordPaymentDto,
  ): Promise<RecordPaymentResponseDto> {
    await this.checkPermission(
      userId,
      businessId,
      [EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT],
      'record payments',
    );

    const bill = await this.billRepository.findOne({
      where: { id: dto.bill_id, business_id: businessId },
    });
    if (!bill) throw new NotFoundException('Bill not found');
    if (
      bill.status !== BillStatus.PENDING &&
      bill.status !== BillStatus.PARTIALLY_PAID
    ) {
      throw new BadRequestException('Cannot record payment for this bill');
    }
    if (dto.amount <= 0)
      throw new BadRequestException('Payment amount must be greater than 0');
    if (dto.amount > bill.remaining_balance) {
      throw new BadRequestException(
        `Payment amount exceeds remaining balance of ${bill.remaining_balance} RWF`,
      );
    }

    const userInfo = await this.getUserInfo(userId, businessId);
    const payment = this.paymentRepository.create({
      bill_id: bill.id,
      bill_number: bill.bill_number,
      client_name: bill.client_full_name,
      amount: dto.amount,
      method: dto.method,
      reference: dto.reference,
      status: PaymentStatus.COMPLETED,
      processed_by: userId,
      processed_by_name: userInfo.name,
      processed_by_role: userInfo.role,
      notes: dto.notes,
      processed_at: new Date(),
    });
    await this.paymentRepository.save(payment);

    bill.amount_paid += dto.amount;
    bill.remaining_balance = bill.grand_total - bill.amount_paid;
    bill.status =
      bill.remaining_balance <= 0 ? BillStatus.PAID : BillStatus.PARTIALLY_PAID;
    if (bill.status === BillStatus.PAID) {
      bill.paid_at = new Date();
      bill.paid_by = userId;
      bill.paid_by_name = userInfo.name;
    }
    await this.billRepository.save(bill);

    return {
      message: 'Payment recorded successfully',
      payment: {
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
      },
      bill: {
        id: bill.id,
        status: bill.status,
        amount_paid: bill.amount_paid,
        remaining_balance: bill.remaining_balance,
      },
    };
  }

  async getPaymentHistory(
    billId: string,
    businessId: string,
  ): Promise<PaymentHistoryResponseDto> {
    const bill = await this.billRepository.findOne({
      where: { id: billId, business_id: businessId },
    });
    if (!bill) throw new NotFoundException('Bill not found');
    const payments = await this.paymentRepository.find({
      where: { bill_id: billId },
      order: { processed_at: 'DESC' },
    });
    return {
      bill: {
        id: bill.id,
        bill_number: bill.bill_number,
        grand_total: bill.grand_total,
        amount_paid: bill.amount_paid,
        remaining_balance: bill.remaining_balance,
      },
      payments,
    };
  }

  // ==================== Add Items to Existing Bill ====================

  async addItemsToBill(
    userId: string,
    businessId: string,
    dto: AddItemsToBillDto,
  ): Promise<BillResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const bill = await this.billRepository.findOne({
        where: { id: dto.bill_id, business_id: businessId },
      });
      if (!bill) throw new NotFoundException('Bill not found');

      // Only PENDING (unpaid) bills can be modified. PARTIALLY_PAID /
      // PAID / SERVED / etc. are locked.
      if (bill.status !== BillStatus.PENDING) {
        throw new BadRequestException(
          'Items can only be added to a PENDING (not-yet-paid) bill',
        );
      }

      // A bill's single notary service is fixed at creation — it cannot
      // be added or changed afterwards. Create a new bill instead.
      if (dto.notary_items?.length) {
        throw new BadRequestException(
          'Notary services cannot be added to an existing bill. A bill carries at most one notary service, set when the bill is created.',
        );
      }

      if (dto.secretariat_items?.length) {
        await this.checkPermission(
          userId,
          businessId,
          [
            EBusinessRole.OWNER,
            EBusinessRole.RECEPTIONIST,
            EBusinessRole.SECRETARIAT,
          ],
          'add secretariat items to bill',
        );
        const business = await this.businessRepository.findOne({
          where: { id: businessId },
        });
        if (!business?.has_secretariat) {
          throw new ForbiddenException(
            'This business does not offer secretariat services',
          );
        }
      } else {
        throw new BadRequestException(
          'No secretariat items provided to add',
        );
      }

      let notarySubtotal = bill.notary_subtotal;
      let notaryVat = bill.notary_vat;
      let notaryTotal = bill.notary_total;
      let secretariatSubtotal = bill.secretariat_subtotal;
      let secretariatTotal = bill.secretariat_total;
      const newItems: BillItem[] = [];

      // Process new notary items
      if (dto.notary_items?.length) {
        for (const itemDto of dto.notary_items) {
          let { unit_price, service_name, sub_service_name } = itemDto;
          if (itemDto.service_id) {
            const catalogItem = await this.notaryServiceRepository.findOne({
              where: { id: itemDto.service_id, business_id: businessId },
              relations: ['category'],
            });
            if (!catalogItem) {
              throw new NotFoundException(
                `Notary service "${itemDto.service_id}" not found`,
              );
            }
            // Catalog price is authoritative when set.
            unit_price = catalogItem.base_price ?? unit_price;
            service_name = catalogItem.category?.name ?? service_name;
            sub_service_name = catalogItem.sub_service;
          }
          if (unit_price == null || unit_price <= 0) {
            throw new BadRequestException(
              'unit_price is required: the selected service has no preset price, or no service_id was provided',
            );
          }
          const { subtotal, vatAmount, total } = this.calculateItemTotals(
            unit_price,
            itemDto.quantity,
            true,
          );
          notarySubtotal += subtotal;
          notaryVat += vatAmount;
          notaryTotal += total;
          newItems.push(
            this.createBillItem(
              ItemType.NOTARY,
              itemDto.service_id || null,
              service_name,
              sub_service_name,
              itemDto.quantity,
              unit_price,
              subtotal,
              vatAmount,
              total,
              itemDto.notes,
            ),
          );
        }
      }

      // Process new secretariat items
      if (dto.secretariat_items?.length) {
        for (const itemDto of dto.secretariat_items) {
          let { unit_price } = itemDto;
          const { service_name } = itemDto;
          if (itemDto.service_id) {
            const catalogItem = await this.secretariatServiceRepository.findOne(
              { where: { id: itemDto.service_id, business_id: businessId } },
            );
            if (!catalogItem) {
              throw new NotFoundException(
                `Secretariat service "${itemDto.service_id}" not found`,
              );
            }
            // Catalog price is authoritative when set.
            unit_price = catalogItem.base_price ?? unit_price;
          }
          if (unit_price == null || unit_price <= 0) {
            throw new BadRequestException(
              'unit_price is required: the selected service has no preset price, or no service_id was provided',
            );
          }
          const { subtotal, total } = this.calculateItemTotals(
            unit_price,
            itemDto.quantity,
            false,
          );
          secretariatSubtotal += subtotal;
          secretariatTotal += total;
          newItems.push(
            this.createBillItem(
              ItemType.SECRETARIAT,
              itemDto.service_id || null,
              service_name,
              null,
              itemDto.quantity,
              unit_price,
              subtotal,
              0,
              total,
              itemDto.notes,
            ),
          );
        }
      }

      if (newItems.length === 0) {
        throw new BadRequestException('At least one service item is required');
      }

      // Update bill totals
      bill.notary_subtotal = notarySubtotal;
      bill.notary_vat = notaryVat;
      bill.notary_total = notaryTotal;
      bill.secretariat_subtotal = secretariatSubtotal;
      bill.secretariat_total = secretariatTotal;
      bill.grand_total = notaryTotal + secretariatTotal;
      bill.remaining_balance = bill.grand_total - bill.amount_paid;

      // Update bill type if needed
      if (
        notaryTotal > 0 &&
        secretariatTotal > 0 &&
        bill.bill_type !== BillType.BOTH
      ) {
        bill.bill_type = BillType.BOTH;
      } else if (notaryTotal > 0 && bill.bill_type === BillType.SECRETARIAT) {
        bill.bill_type = BillType.BOTH;
      } else if (secretariatTotal > 0 && bill.bill_type === BillType.NOTARY) {
        bill.bill_type = BillType.BOTH;
      }

      await queryRunner.manager.save(bill);

      for (const item of newItems) {
        item.bill_id = bill.id;
        await queryRunner.manager.save(item);
      }

      await queryRunner.commitTransaction();
      return this.getBillById(bill.id, businessId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== Rejection & Refund ====================

  async rejectBill(
    userId: string,
    businessId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
    dto: RejectBillDto,
  ): Promise<RejectBillResponseDto> {
    await this.checkPermission(
      userId,
      businessId,
      [EBusinessRole.OWNER],
      'reject bills',
    );

    const bill = await this.billRepository.findOne({
      where: { id: dto.bill_id, business_id: businessId },
    });
    if (!bill) throw new NotFoundException('Bill not found');

    if (
      bill.status !== BillStatus.PAID &&
      bill.status !== BillStatus.PENDING &&
      bill.status !== BillStatus.PARTIALLY_PAID
    ) {
      throw new BadRequestException(
        'Only pending or paid bills can be rejected',
      );
    }

    const userInfo = await this.getUserInfo(userId, businessId);

    // Update bill status to REJECTED
    bill.status = BillStatus.REJECTED;
    bill.rejected_by = userId;
    bill.rejected_at = new Date();
    bill.rejection_reason = dto.reason;
    bill.rejection_notes = dto.notes || '';

    let refundAmount = 0;
    let refundRecord: Refund | null = null;

    // Handle refund based on option
    if (dto.refund_option !== RefundOption.NONE && bill.amount_paid > 0) {
      switch (dto.refund_option) {
        case RefundOption.FULL:
          refundAmount = bill.amount_paid;
          break;
        case RefundOption.HALF:
          refundAmount = Math.round(bill.amount_paid / 2);
          break;
        case RefundOption.CUSTOM:
          refundAmount = dto.custom_refund_amount || 0;
          if (refundAmount > bill.amount_paid) {
            throw new BadRequestException(
              'Custom refund amount exceeds paid amount',
            );
          }
          break;
      }

      if (refundAmount > 0) {
        // Create refund record with PENDING status
        const newRefund = new Refund();
        newRefund.bill_id = bill.id;
        newRefund.bill_number = bill.bill_number;
        newRefund.client_name = bill.client_full_name;
        newRefund.client_phone = bill.client_phone;
        newRefund.original_amount_paid = bill.amount_paid;
        newRefund.requested_amount = refundAmount;
        newRefund.actual_refunded_amount = 0;
        newRefund.refund_type =
          dto.refund_option === RefundOption.FULL
            ? RefundType.FULL
            : dto.refund_option === RefundOption.HALF
              ? RefundType.HALF
              : RefundType.CUSTOM;
        newRefund.reason = dto.reason;
        newRefund.notes = dto.notes || '';
        newRefund.status = RefundRequestStatus.PENDING;
        newRefund.requested_by = userId;
        newRefund.requested_by_name = userInfo.name;
        newRefund.requested_at = new Date();

        refundRecord = await this.refundRepository.save(newRefund);

        // Update bill with refund pending status
        bill.refund_status = RefundStatus.PENDING;
        bill.refund_requested_amount = refundAmount;
        bill.refund_notes = `Refund requested: ${refundAmount} RWF. Reason: ${dto.reason}`;
      }
    }

    await this.billRepository.save(bill);

    return {
      message: refundRecord
        ? 'Bill rejected. Refund request created.'
        : 'Bill rejected successfully. No refund.',
      bill: {
        id: bill.id,
        status: bill.status,
        refund_status: bill.refund_status || RefundStatus.NONE,
        refund_requested_amount: bill.refund_requested_amount || 0,
        refund_processed: refundAmount > 0,
        refund_amount: refundAmount,
      },
      refund: refundRecord
        ? {
            id: refundRecord.id,
            status: refundRecord.status,
            requested_amount: refundRecord.requested_amount,
          }
        : null,
    };
  }

  async processRefund(
    userId: string,
    businessId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
    dto: ProcessRefundDto,
  ): Promise<any> {
    await this.checkPermission(
      userId,
      businessId,
      [EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT],
      'process refunds',
    );

    const refund = await this.refundRepository.findOne({
      where: { id: dto.refund_id },
    });
    if (!refund) {
      throw new NotFoundException('Refund request not found');
    }

    if (
      refund.status !== RefundRequestStatus.PENDING &&
      refund.status !== RefundRequestStatus.APPROVED
    ) {
      throw new BadRequestException(
        `Cannot process refund in ${refund.status} status (already finalized)`,
      );
    }

    const bill = await this.billRepository.findOne({
      where: { id: refund.bill_id, business_id: businessId },
    });
    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    const userInfo = await this.getUserInfo(userId, businessId);

    // Refunds can be processed incrementally. Accumulate against any
    // prior partial refunds and never exceed the requested amount.
    const priorActual = refund.actual_refunded_amount || 0;
    if (dto.amount <= 0) {
      throw new BadRequestException('Refund amount must be positive');
    }
    const newActual = priorActual + dto.amount;
    if (newActual > refund.requested_amount) {
      throw new BadRequestException(
        `Refund total ${newActual} would exceed requested ${refund.requested_amount}. Remaining to refund: ${
          refund.requested_amount - priorActual
        }`,
      );
    }
    const fullyRefunded = newActual >= refund.requested_amount;

    const businessUser = await this.businessUserRepository.findOne({
      where: {
        userId: userId,
        businessId: businessId,
      },
    });

    if (!businessUser) {
      throw new NotFoundException('Business user not found');
    }

    // Update refund record (accumulated)
    refund.actual_refunded_amount = newActual;
    refund.refund_method = dto.refund_method || refund.refund_method || '';
    refund.transaction_reference =
      dto.transaction_reference || refund.transaction_reference || '';
    refund.notes = dto.notes || refund.notes;
    refund.status = fullyRefunded
      ? RefundRequestStatus.COMPLETED
      : RefundRequestStatus.APPROVED; // APPROVED = partially refunded, more pending
    refund.approved_by = businessUser.id;
    refund.approved_by_name = userInfo.name;
    refund.approved_at = refund.approved_at || new Date();
    refund.processed_by = businessUser.id;
    refund.processed_by_name = userInfo.name;
    refund.processed_at = new Date();

    await this.refundRepository.save(refund);

    // Update bill. Stays in its current (REJECTED) status and the
    // refund_status stays PENDING until the full requested amount has
    // been refunded — only then is the bill marked REFUNDED.
    bill.refund_status = fullyRefunded
      ? RefundStatus.COMPLETED
      : RefundStatus.PENDING;
    bill.amount_refunded = newActual;
    bill.profit_after_refund = bill.amount_paid - newActual;
    bill.refund_processed_by = businessUser.id;
    bill.refund_processed_at = new Date();
    if (fullyRefunded) {
      bill.status = BillStatus.REFUNDED;
    }

    await this.billRepository.save(bill);

    const remaining = refund.requested_amount - newActual;
    return {
      message: fullyRefunded
        ? 'Refund fully processed'
        : `Partial refund recorded. Remaining to refund: ${remaining}`,
      refund: {
        id: refund.id,
        status: refund.status,
        requested_amount: refund.requested_amount,
        actual_refunded_amount: refund.actual_refunded_amount,
        remaining_to_refund: remaining,
        refund_method: refund.refund_method,
        transaction_reference: refund.transaction_reference,
        processed_at: refund.processed_at,
      },
      bill: {
        id: bill.id,
        status: bill.status,
        refund_status: bill.refund_status,
        amount_paid: bill.amount_paid,
        amount_refunded: bill.amount_refunded,
        profit_after_refund: bill.profit_after_refund,
      },
    };
  }

  async getPendingRefunds(
    businessId: string,
    userId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
  ): Promise<Refund[]> {
    await this.checkPermission(
      userId,
      businessId,
      [EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT],
      'view pending refunds',
    );

    const pendingRefunds = await this.refundRepository
      .createQueryBuilder('refund')
      .innerJoin('refund.bill', 'bill')
      .where('bill.business_id = :businessId', { businessId })
      .andWhere('refund.status = :status', {
        status: RefundRequestStatus.PENDING,
      })
      .orderBy('refund.requested_at', 'ASC')
      .getMany();

    return pendingRefunds;
  }

  async updateRefundRequest(
    refundId: string,
    businessId: string,
    userId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
    dto: Partial<Refund>,
  ): Promise<Refund> {
    await this.checkPermission(
      userId,
      businessId,
      [EBusinessRole.OWNER],
      'update refund requests',
    );

    const refund = await this.refundRepository.findOne({
      where: { id: refundId },
      relations: ['bill'],
    });
    if (!refund) {
      throw new NotFoundException('Refund request not found');
    }

    if (refund.bill?.business_id !== businessId) {
      throw new ForbiddenException('Access denied');
    }

    if (refund.status !== RefundRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot update refund in ${refund.status} status`,
      );
    }

    Object.assign(refund, dto);
    await this.refundRepository.save(refund);

    return refund;
  }

  async cancelRefundRequest(
    refundId: string,
    businessId: string,
    userId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
  ): Promise<any> {
    await this.checkPermission(
      userId,
      businessId,
      [EBusinessRole.OWNER],
      'cancel refund requests',
    );

    const refund = await this.refundRepository.findOne({
      where: { id: refundId },
      relations: ['bill'],
    });
    if (!refund) {
      throw new NotFoundException('Refund request not found');
    }

    if (refund.bill?.business_id !== businessId) {
      throw new ForbiddenException('Access denied');
    }

    if (refund.status !== RefundRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot cancel refund in ${refund.status} status`,
      );
    }

    refund.status = RefundRequestStatus.CANCELLED;
    await this.refundRepository.save(refund);

    const bill = refund.bill;
    if (bill) {
      bill.refund_status = RefundStatus.NONE;
      bill.refund_requested_amount = 0;
      bill.refund_notes = `Refund request cancelled: ${refund.reason}`;
      await this.billRepository.save(bill);
    }

    return {
      message: 'Refund request cancelled successfully',
      refund: {
        id: refund.id,
        status: refund.status,
      },
      bill: {
        id: bill?.id,
        refund_status: bill?.refund_status,
      },
    };
  }

  // ==================== Serve Bill (Create Notary Record) ====================

  /** Bills in these statuses may be served into a notary record. */
  private readonly SERVABLE_STATUSES = [BillStatus.PAID, BillStatus.REJECTED];

  /**
   * Compute the next volume/number for a book WITHOUT mutating the tracker.
   * Mirrors the roll-over rule used when actually serving.
   */
  private async previewNextNumber(
    businessId: string,
    book: Book,
  ): Promise<{ volume: string; recordNumber: number; displayNumber: string }> {
    const tracker = await this.getBookTracker(businessId, book.id);
    let recordNumber = tracker.current_number + 1;
    let volume = tracker.current_volume || '';
    if (
      book.increments_volume_on_serve &&
      tracker.records_per_volume > 0 &&
      tracker.records_in_current_volume >= tracker.records_per_volume
    ) {
      volume = this.incrementRoman(tracker.current_volume || 'I');
      recordNumber = 1;
    }
    const displayNumber = volume
      ? `${recordNumber}/${volume}`
      : `${recordNumber}`;
    return { volume, recordNumber, displayNumber };
  }

  private async loadServableBill(billId: string, businessId: string) {
    const bill = await this.billRepository.findOne({
      where: { id: billId, business_id: businessId },
    });
    if (!bill) throw new NotFoundException('Bill not found');
    if (!this.SERVABLE_STATUSES.includes(bill.status))
      throw new BadRequestException(
        'Only PAID or REJECTED bills can be served',
      );
    if (bill.notary_total === 0)
      throw new BadRequestException(
        'This bill has no notary services to serve',
      );
    const notaryItems = await this.billItemRepository.find({
      where: { bill_id: bill.id, item_type: ItemType.NOTARY },
    });
    if (notaryItems.length === 0)
      throw new BadRequestException('No notary items found on this bill');
    return { bill, notaryItem: notaryItems[0] };
  }

  /** Category/book slugs that are land-related and always need a UPI. */
  private readonly LAND_SLUGS = ['ubutaka', 'land'];

  /**
   * A serve is UPI-required if the target book is flagged requires_upi,
   * OR the book/notary service is land-related (Ubutaka/Land) regardless
   * of book config. Land records must always carry their own UPI.
   */
  private isUpiRequired(book: Book, notaryItem: BillItem): boolean {
    const bookSlug = (book.slug || '').toLowerCase();
    const serviceName = (notaryItem.service_name || '').toLowerCase();
    return (
      book.requires_upi ||
      this.LAND_SLUGS.includes(bookSlug) ||
      this.LAND_SLUGS.some((s) => serviceName.includes(s))
    );
  }

  /**
   * Step 1 of serving: returns the suggested book volume/number/UPI for
   * the owner to confirm or edit. Performs NO writes (tracker untouched).
   */
  async getServePreview(
    userId: string,
    businessId: string,
    billId: string,
    bookId: string,
  ): Promise<ServePreviewResponseDto> {
    await this.checkPermission(
      userId,
      businessId,
      [EBusinessRole.OWNER],
      'serve bills',
    );
    const { bill, notaryItem } = await this.loadServableBill(
      billId,
      businessId,
    );
    const existing = await this.notaryRecordRepository.findOne({
      where: { bill_id: bill.id },
    });
    if (existing)
      throw new ConflictException(
        'A notary record already exists for this bill',
      );

    const book = await this.getBook(businessId, bookId);
    const next = await this.previewNextNumber(businessId, book);

    return {
      bill_id: bill.id,
      book_id: book.id,
      book_name: book.name,
      suggested_volume: next.volume || null,
      suggested_record_number: next.recordNumber,
      suggested_display_number: next.displayNumber,
      suggested_upi: bill.client_upi || null,
      requires_upi: this.isUpiRequired(book, notaryItem),
      notary_item: {
        service_name: notaryItem.service_name,
        sub_service_name: notaryItem.sub_service_name,
        quantity: notaryItem.quantity,
        unit_price: notaryItem.unit_price,
        subtotal: notaryItem.subtotal,
        vat_amount: notaryItem.vat_amount,
        grand_total: notaryItem.total,
      },
    };
  }

  /**
   * Step 2 of serving: creates the notary record from the (optionally
   * edited) confirmed values. Idempotent — 409 if already served.
   */
  async serveBill(
    userId: string,
    businessId: string,
    dto: ServeBillDto,
  ): Promise<ServeBillResponseDto> {
    await this.checkPermission(
      userId,
      businessId,
      [EBusinessRole.OWNER],
      'serve bills',
    );

    const { bill, notaryItem } = await this.loadServableBill(
      dto.bill_id,
      businessId,
    );

    const existing = await this.notaryRecordRepository.findOne({
      where: { bill_id: bill.id },
    });
    if (existing)
      throw new ConflictException(
        'A notary record already exists for this bill',
      );

    const book = await this.getBook(businessId, dto.book_id);

    if (this.isUpiRequired(book, notaryItem) && !dto.upi) {
      throw new BadRequestException(
        'UPI (Unique Parcel Identifier) must be provided for land-related records, even if the client has a UPI on file',
      );
    }

    // Each of volume / record_number can be independently overridden by
    // the owner; whatever they don't confirm falls back to the suggested
    // (auto-computed) value.
    const next = await this.previewNextNumber(businessId, book);
    const recordNumber = dto.record_number ?? next.recordNumber;
    const volume = dto.volume ?? next.volume ?? '';
    const displayNumber = volume
      ? `${recordNumber}/${volume}`
      : `${recordNumber}`;
    await this.updateBookTracker(businessId, book, volume, recordNumber);

    const businessUser = await this.businessUserRepository.findOne({
      where: { userId: userId, businessId: businessId },
    });
    if (!businessUser) {
      throw new NotFoundException('Business user not found');
    }

    const notaryRecord = this.notaryRecordRepository.create({
      book_type: book.slug,
      book_id: book.id,
      bill_id: bill.id,
      client_id: bill.client_id,
      business_id: businessId,
      volume: volume || null,
      record_number: recordNumber.toString(),
      display_number: displayNumber,
      service_category: notaryItem.service_name,
      sub_service: notaryItem.sub_service_name,
      amount: notaryItem.subtotal,
      vat_amount: notaryItem.vat_amount,
      quantity: notaryItem.quantity,
      unit_price: notaryItem.unit_price,
      grand_total: notaryItem.total,
      upi: dto.upi || bill.client_upi,
      notary_notes: dto.notary_notes,
      served_by: businessUser.id,
      served_date: new Date(),
      client_full_name: bill.client_full_name,
      client_id_number: bill.client_id_number,
      client_email: bill.client_email,
      client_marital_status: bill.client_marital_status,
      client_partner_name: bill.client_partner_name,
      client_phone: bill.client_phone,
      client_father_name: bill.client_father_name,
      client_mother_name: bill.client_mother_name,
      client_province: bill.client_province,
      client_district: bill.client_district,
      client_sector: bill.client_sector,
      client_cell: bill.client_cell,
      client_village: bill.client_village,
      client_verification_status: bill.client_verification_status,
      status: RecordStatus.ACTIVE,
    });
    await this.notaryRecordRepository.save(notaryRecord);

    bill.status = BillStatus.SERVED;
    await this.billRepository.save(bill);

    return {
      message: 'Bill served successfully. Notary record created.',
      notary_record: {
        id: notaryRecord.id,
        display_number: notaryRecord.display_number,
        volume: notaryRecord.volume,
        record_number: notaryRecord.record_number,
        book_type: notaryRecord.book_type,
        book_id: notaryRecord.book_id,
        service: notaryRecord.sub_service,
        amount: notaryRecord.amount + notaryRecord.vat_amount,
        served_date: notaryRecord.served_date,
      },
      bill: { id: bill.id, status: bill.status },
    };
  }

  // ==================== Serve Secretariat Bill ====================

  /**
   * Serve the secretariat portion of a PAID/REJECTED bill: creates one
   * SecretariatRecord per secretariat item. Idempotent (409 if already
   * served). Mirrors the notary serve flow (no books/volumes/UPI).
   */
  async serveSecretariatBill(
    userId: string,
    businessId: string,
    dto: { bill_id: string; notes?: string },
  ): Promise<{ message: string; records: any[]; bill: any }> {
    await this.checkPermission(
      userId,
      businessId,
      [EBusinessRole.OWNER, EBusinessRole.SECRETARIAT],
      'serve secretariat bills',
    );

    const bill = await this.billRepository.findOne({
      where: { id: dto.bill_id, business_id: businessId },
    });
    if (!bill) throw new NotFoundException('Bill not found');
    if (![BillStatus.PAID, BillStatus.REJECTED].includes(bill.status)) {
      throw new BadRequestException(
        'Only PAID or REJECTED bills can be served',
      );
    }
    if (!bill.secretariat_total) {
      throw new BadRequestException(
        'This bill has no secretariat services to serve',
      );
    }

    const existing = await this.secretariatRecordRepository.count({
      where: { bill_id: bill.id },
    });
    if (existing > 0) {
      throw new ConflictException(
        'Secretariat records already exist for this bill',
      );
    }

    const items = await this.billItemRepository.find({
      where: { bill_id: bill.id, item_type: ItemType.SECRETARIAT },
    });
    if (items.length === 0) {
      throw new BadRequestException(
        'No secretariat items found on this bill',
      );
    }

    const businessUser = await this.businessUserRepository.findOne({
      where: { userId, businessId },
    });

    const created = await this.secretariatRecordRepository.save(
      items.map((i) =>
        this.secretariatRecordRepository.create({
          service_name: i.service_name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          subtotal: i.subtotal,
          total: i.total,
          client_id: bill.client_id,
          client_full_name: bill.client_full_name,
          client_id_number: bill.client_id_number,
          client_phone: bill.client_phone,
          client_email: bill.client_email,
          notes: dto.notes,
          status: RecordStatus.ACTIVE,
          served_by: businessUser?.id ?? null,
          served_date: new Date(),
          bill_id: bill.id,
          business_id: businessId,
        }),
      ),
    );

    bill.status = BillStatus.SERVED;
    await this.billRepository.save(bill);

    return {
      message: 'Secretariat bill served. Records created.',
      records: created.map((r) => ({
        id: r.id,
        service_name: r.service_name,
        quantity: r.quantity,
        total: r.total,
        served_date: r.served_date,
      })),
      bill: { id: bill.id, status: bill.status },
    };
  }

  async getSecretariatRecords(
    businessId: string,
    filters: {
      start_date?: string;
      end_date?: string;
      client_id?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedResponseDto> {
    const query = this.secretariatRecordRepository
      .createQueryBuilder('record')
      .where('record.business_id = :businessId', { businessId })
      .andWhere('record.status = :status', { status: RecordStatus.ACTIVE });
    if (filters.client_id)
      query.andWhere('record.client_id = :clientId', {
        clientId: filters.client_id,
      });
    if (filters.start_date)
      query.andWhere('record.served_date >= :sd', {
        sd: filters.start_date,
      });
    if (filters.end_date)
      query.andWhere('record.served_date <= :ed', {
        ed: filters.end_date,
      });

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('record.served_date', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==================== Get Pending Bills by Type ====================

  async getPendingNotaryBills(businessId: string): Promise<any[]> {
    const bills = await this.billRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.items', 'items')
      .where('bill.business_id = :businessId', { businessId })
      .andWhere('bill.status IN (:...statuses)', {
        statuses: [BillStatus.PAID],
      })
      .andWhere('bill.bill_type IN (:...types)', {
        types: [BillType.NOTARY, BillType.BOTH],
      })
      .andWhere('items.item_type = :itemType', { itemType: ItemType.NOTARY })
      .orderBy('bill.createdAt', 'ASC')
      .getMany();

    return Promise.all(bills.map((b) => this.formatPendingBill(b)));
  }

  /** Detailed pending-bill projection: full client + all requested items. */
  private async formatPendingBill(bill: Bill) {
    const items = await this.billItemRepository.find({
      where: { bill_id: bill.id },
    });
    return {
      id: bill.id,
      bill_number: bill.bill_number,
      bill_type: bill.bill_type,
      status: bill.status,
      client: {
        id: bill.client_id,
        full_name: bill.client_full_name,
        id_number: bill.client_id_number,
        phone: bill.client_phone,
        email: bill.client_email,
        upi: bill.client_upi,
      },
      notary_subtotal: bill.notary_subtotal,
      notary_vat: bill.notary_vat,
      notary_total: bill.notary_total,
      secretariat_total: bill.secretariat_total,
      grand_total: bill.grand_total,
      amount_paid: bill.amount_paid,
      paid_at: bill.paid_at,
      created_at: bill.createdAt,
      items: items.map((i) => ({
        item_type: i.item_type,
        service_name: i.service_name,
        sub_service_name: i.sub_service_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        subtotal: i.subtotal,
        vat_amount: i.vat_amount,
        total: i.total,
      })),
    };
  }

  async getPendingSecretariatBills(businessId: string): Promise<any[]> {
    const bills = await this.billRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.items', 'items')
      .where('bill.business_id = :businessId', { businessId })
      .andWhere('bill.status IN (:...statuses)', {
        statuses: [BillStatus.PAID],
      })
      .andWhere('bill.bill_type IN (:...types)', {
        types: [BillType.SECRETARIAT, BillType.BOTH],
      })
      .andWhere('items.item_type = :itemType', {
        itemType: ItemType.SECRETARIAT,
      })
      .orderBy('bill.createdAt', 'ASC')
      .getMany();

    return Promise.all(bills.map((b) => this.formatPendingBill(b)));
  }

  // ==================== Get Notary Records ====================

  async getNotaryRecords(
    UserId: string,
    businessId: string,
    filters: {
      book_type?: BookType;
      start_date?: string;
      end_date?: string;
      client_id?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedResponseDto> {
    await this.checkPermission(
      UserId,
      businessId,
      [EBusinessRole.OWNER],
      'view records',
    );
    const query = this.notaryRecordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.attachments', 'attachments')
      .where('record.business_id = :businessId', { businessId })
      .andWhere('record.status = :status', { status: RecordStatus.ACTIVE });

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
    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('record.served_date', 'DESC')
      .getManyAndCount();

    const formattedData = data.map((record) => ({
      id: record.id,
      bill_id: record.bill_id,
      book_id: record.book_id,
      book_type: record.book_type,
      volume: record.volume,
      record_number: record.record_number,
      display_number: record.display_number,
      client_name: record.client_full_name,
      client_full_name: record.client_full_name,
      client_id_number: record.client_id_number,
      client_phone: record.client_phone,
      service_name: record.service_category,
      service_category: record.service_category,
      sub_service: record.sub_service,
      sub_service_name: record.sub_service,
      quantity: record.quantity,
      unit_price: record.unit_price,
      subtotal: record.amount,
      vat_amount: record.vat_amount,
      grand_total: record.grand_total ?? record.amount + record.vat_amount,
      total: record.amount + record.vat_amount,
      upi: record.upi,
      status: record.status,
      served_by: record.served_by,
      served_date: record.served_date,
      has_documents: record.has_documents,
      attachments: ((record.attachments as Document[] | undefined) ?? []).map(
        (a: Document) => ({
          id: a.id,
          file_name: a.file_name,
          file_url: a.file_url,
          mime_type: a.mime_type,
          file_size: a.file_size,
          category: a.category,
          description: a.description,
          is_primary: a.is_primary,
          uploaded_by_name: a.uploaded_by_name,
          uploaded_at: a.uploaded_at,
        }),
      ),
    }));

    return {
      data: formattedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateNotaryRecord(
    recordId: string,
    businessId: string,
    userId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
    dto: Partial<NotaryRecord>,
  ): Promise<NotaryRecord> {
    await this.checkPermission(
      userId,
      businessId,
      [EBusinessRole.OWNER],
      'update notary records',
    );

    const record = await this.notaryRecordRepository.findOne({
      where: { id: recordId, business_id: businessId },
    });
    if (!record) {
      throw new NotFoundException('Notary record not found');
    }

    Object.assign(record, dto);
    await this.notaryRecordRepository.save(record);

    return record;
  }

  // ==================== Reports ====================

  /**
   * Bills that count toward revenue. A bill contributes its realized
   * payments; refunds are netted out separately so revenue is accurate.
   */
  private readonly REVENUE_STATUSES = [
    BillStatus.PARTIALLY_PAID,
    BillStatus.PAID,
    BillStatus.SERVED,
    BillStatus.REFUNDED,
  ];

  /** Total refund applied to a bill (0 unless a refund was processed). */
  private billRefundAmount(bill: Bill): number {
    return bill.amount_refunded || 0;
  }

  /**
   * Allocate a bill's refund proportionally to one segment
   * (notary or secretariat) by its share of grand_total.
   * Guards grand_total = 0.
   */
  private segmentRefund(bill: Bill, segmentTotal: number): number {
    const refund = this.billRefundAmount(bill);
    if (refund <= 0 || !bill.grand_total) return 0;
    return Math.round(refund * (segmentTotal / bill.grand_total));
  }

  /** Period bucket key for group_by aggregation. */
  private periodBucket(date: Date, groupBy?: ReportGroupBy): string {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const pad = (n: number) => String(n).padStart(2, '0');
    switch (groupBy) {
      case ReportGroupBy.YEAR:
        return `${y}`;
      case ReportGroupBy.QUARTER:
        return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
      case ReportGroupBy.MONTH:
        return `${y}-${pad(m)}`;
      case ReportGroupBy.DAY:
        return `${y}-${pad(m)}-${pad(d.getDate())}`;
      default:
        return 'all';
    }
  }

  /**
   * Shared filter application for item-level financial reports.
   * Statuses default to REVENUE_STATUSES (so SERVED/REFUNDED bills are
   * still counted and netted), or the explicit status filter if given.
   */
  private applyItemReportFilters(
    query: import('typeorm').SelectQueryBuilder<BillItem>,
    filters: ReportFiltersDto,
    itemType: ItemType,
  ) {
    query
      .andWhere('item.item_type = :itemType', { itemType })
      .andWhere('bill.status IN (:...statuses)', {
        statuses: filters.status ? [filters.status] : this.REVENUE_STATUSES,
      });
    if (filters.start_date)
      query.andWhere('bill.createdAt >= :startDate', {
        startDate: filters.start_date,
      });
    if (filters.end_date)
      query.andWhere('bill.createdAt <= :endDate', {
        endDate: filters.end_date,
      });
    if (filters.client_id)
      query.andWhere('bill.client_id = :clientId', {
        clientId: filters.client_id,
      });
    if (filters.client_name)
      query.andWhere('bill.client_full_name ILIKE :clientName', {
        clientName: `%${filters.client_name}%`,
      });
    if (filters.service_name)
      query.andWhere('item.service_name ILIKE :serviceName', {
        serviceName: `%${filters.service_name}%`,
      });
    if (filters.payment_method)
      query.andWhere(
        'EXISTS (SELECT 1 FROM payments p WHERE p.bill_id = bill.id AND p.method = :paymentMethod)',
        { paymentMethod: filters.payment_method },
      );
    return query;
  }

  async getNotaryFinancialReport(
    businessId: string,
    filters: ReportFiltersDto,
  ): Promise<{
    summary: FinancialReportSummaryDto;
    records: NotaryFinancialRecordDto[];
    breakdown_by_period: Record<string, { gross: number; net: number }>;
  }> {
    const query = this.billItemRepository
      .createQueryBuilder('item')
      .innerJoinAndSelect('item.bill', 'bill')
      .where('bill.business_id = :businessId', { businessId });
    this.applyItemReportFilters(query, filters, ItemType.NOTARY);

    const items = await query.getMany();

    const records: NotaryFinancialRecordDto[] = [];
    const periods: Record<string, { gross: number; net: number }> = {};
    const billIds = new Set<string>();
    let grossSubtotal = 0;
    let grossVat = 0;
    let grossTotal = 0;
    let totalRefunded = 0;

    for (const item of items) {
      const bill = item.bill;
      billIds.add(bill.id);
      const isRefunded = bill.status === BillStatus.REFUNDED;

      // Proportional refund for THIS item by its share of the bill.
      const itemRefund = bill.grand_total
        ? Math.round(
            this.billRefundAmount(bill) * (item.total / bill.grand_total),
          )
        : 0;
      const amountAfterRefund = item.total - itemRefund;

      grossSubtotal += item.subtotal;
      grossVat += item.vat_amount;
      grossTotal += item.total;
      totalRefunded += itemRefund;

      const bucket = this.periodBucket(bill.createdAt, filters.group_by);
      periods[bucket] = periods[bucket] || { gross: 0, net: 0 };
      periods[bucket].gross += item.total;
      periods[bucket].net += amountAfterRefund;

      records.push({
        date: bill.createdAt,
        client_name: bill.client_full_name,
        client_id_number: bill.client_id_number,
        service_name: item.service_name,
        sub_service_name: item.sub_service_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        vat: item.vat_amount,
        grand_total: item.total,
        is_refunded: isRefunded,
        amount_refunded: itemRefund,
        amount_after_refund: amountAfterRefund,
        bill_number: bill.bill_number,
        bill_status: bill.status,
      });
    }

    const summary: FinancialReportSummaryDto = {
      total_bills: billIds.size,
      total_notary_revenue: grossTotal,
      total_secretariat_revenue: 0,
      total_vat_collected: grossVat,
      gross_revenue: grossTotal,
      total_refunds: totalRefunded,
      net_revenue: grossTotal - totalRefunded,
    };

    return { summary, records, breakdown_by_period: periods };
  }

  async getSecretariatFinancialReport(
    businessId: string,
    filters: ReportFiltersDto,
  ): Promise<{
    summary: FinancialReportSummaryDto;
    records: SecretariatFinancialRecordDto[];
    breakdown_by_period: Record<string, { gross: number; net: number }>;
  }> {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
    });
    if (!business?.has_secretariat) {
      throw new ForbiddenException(
        'This business does not offer secretariat services',
      );
    }

    const query = this.billItemRepository
      .createQueryBuilder('item')
      .innerJoinAndSelect('item.bill', 'bill')
      .where('bill.business_id = :businessId', { businessId });
    this.applyItemReportFilters(query, filters, ItemType.SECRETARIAT);

    const items = await query.getMany();

    const records: SecretariatFinancialRecordDto[] = [];
    const periods: Record<string, { gross: number; net: number }> = {};
    const billIds = new Set<string>();
    let grossTotal = 0;
    let totalRefunded = 0;

    for (const item of items) {
      const bill = item.bill;
      billIds.add(bill.id);

      // Proportional refund for THIS secretariat item (fixes the prior
      // bug where refunded BOTH bills were dropped entirely).
      const itemRefund = bill.grand_total
        ? Math.round(
            this.billRefundAmount(bill) * (item.total / bill.grand_total),
          )
        : 0;
      grossTotal += item.total;
      totalRefunded += itemRefund;

      const bucket = this.periodBucket(bill.createdAt, filters.group_by);
      periods[bucket] = periods[bucket] || { gross: 0, net: 0 };
      periods[bucket].gross += item.total;
      periods[bucket].net += item.total - itemRefund;

      records.push({
        date: bill.createdAt,
        client_name: bill.client_full_name,
        client_id_number: bill.client_id_number,
        service_name: item.service_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        grand_total: item.total,
        bill_number: bill.bill_number,
        bill_status: bill.status,
      });
    }

    const summary: FinancialReportSummaryDto = {
      total_bills: billIds.size,
      total_notary_revenue: 0,
      total_secretariat_revenue: grossTotal,
      total_vat_collected: 0,
      gross_revenue: grossTotal,
      total_refunds: totalRefunded,
      net_revenue: grossTotal - totalRefunded,
    };

    return { summary, records, breakdown_by_period: periods };
  }

  async getMinijustReport(
    businessId: string,
    filters: ReportFiltersDto,
  ): Promise<MinijustReportDto> {
    const query = this.notaryRecordRepository
      .createQueryBuilder('record')
      .where('record.business_id = :businessId', { businessId })
      .andWhere('record.status = :status', { status: RecordStatus.ACTIVE });

    if (filters.start_date)
      query.andWhere('record.served_date >= :startDate', {
        startDate: filters.start_date,
      });
    if (filters.end_date)
      query.andWhere('record.served_date <= :endDate', {
        endDate: filters.end_date,
      });
    if (filters.book_id)
      query.andWhere('record.book_id = :bookId', {
        bookId: filters.book_id,
      });
    if (filters.client_id)
      query.andWhere('record.client_id = :clientId', {
        clientId: filters.client_id,
      });
    if (filters.client_name)
      query.andWhere('record.client_full_name ILIKE :clientName', {
        clientName: `%${filters.client_name}%`,
      });

    const records = await query.orderBy('record.served_date', 'ASC').getMany();

    return {
      period: {
        start_date: filters.start_date || 'all',
        end_date: filters.end_date || 'all',
      },
      records: records.map((r) => ({
        date: r.served_date,
        book_type: r.book_type,
        volume: r.volume || '-',
        number: r.display_number || r.record_number,
        client_full_name: r.client_full_name,
        client_id_number: r.client_id_number,
        sub_service_name: r.sub_service,
        service_name: r.service_category,
      })),
      total_records: records.length,
    };
  }

  /**
   * Status + payment-method breakdowns over revenue bills in scope.
   * Amounts are NET (grand_total − amount_refunded).
   */
  private async getBillBreakdowns(
    businessId: string,
    filters: ReportFiltersDto,
  ): Promise<{
    breakdown_by_status: Record<string, { count: number; amount: number }>;
    breakdown_by_payment_method: Record<
      string,
      { count: number; amount: number }
    >;
  }> {
    const q = this.billRepository
      .createQueryBuilder('bill')
      .where('bill.business_id = :businessId', { businessId })
      .andWhere('bill.status IN (:...statuses)', {
        statuses: filters.status ? [filters.status] : this.REVENUE_STATUSES,
      });
    if (filters.start_date)
      q.andWhere('bill.createdAt >= :sd', { sd: filters.start_date });
    if (filters.end_date)
      q.andWhere('bill.createdAt <= :ed', { ed: filters.end_date });
    const bills = await q.getMany();

    const byStatus: Record<string, { count: number; amount: number }> = {};
    for (const b of bills) {
      const net = b.grand_total - (b.amount_refunded || 0);
      byStatus[b.status] = byStatus[b.status] || { count: 0, amount: 0 };
      byStatus[b.status].count += 1;
      byStatus[b.status].amount += net;
    }

    const pmRaw = (await this.paymentRepository
      .createQueryBuilder('payment')
      .innerJoin('payment.bill', 'bill')
      .select('payment.method', 'method')
      .addSelect('SUM(payment.amount)', 'amount')
      .addSelect('COUNT(DISTINCT payment.bill_id)', 'count')
      .where('bill.business_id = :businessId', { businessId })
      .groupBy('payment.method')
      .getRawMany()) as Array<{
      method: string;
      amount: string | null;
      count: string;
    }>;
    const byPayment: Record<string, { count: number; amount: number }> = {};
    for (const r of pmRaw)
      byPayment[r.method] = {
        count: parseInt(r.count, 10),
        amount: parseInt(r.amount || '0', 10),
      };

    return {
      breakdown_by_status: byStatus,
      breakdown_by_payment_method: byPayment,
    };
  }

  async getFinancialReport(
    businessId: string,
    filters: ReportFiltersDto,
    bill_type: BillType,
  ): Promise<FinancialReportDto> {
    const period = {
      start_date: filters.start_date || 'all',
      end_date: filters.end_date || 'all',
    };
    const breakdowns = await this.getBillBreakdowns(businessId, filters);

    if (bill_type === BillType.NOTARY) {
      const { summary, records } = await this.getNotaryFinancialReport(
        businessId,
        filters,
      );
      return { period, type: BillType.NOTARY, summary, records, ...breakdowns };
    }

    if (bill_type === BillType.SECRETARIAT) {
      const { summary, records } = await this.getSecretariatFinancialReport(
        businessId,
        filters,
      );
      return {
        period,
        type: BillType.SECRETARIAT,
        summary,
        records,
        ...breakdowns,
      };
    }

    // BOTH — combined notary + secretariat, net of refunds.
    const notary = await this.getNotaryFinancialReport(businessId, filters);
    const secretariat = await this.getSecretariatFinancialReport(
      businessId,
      filters,
    );
    const summary: FinancialReportSummaryDto = {
      total_bills: notary.summary.total_bills + secretariat.summary.total_bills,
      total_notary_revenue: notary.summary.total_notary_revenue,
      total_secretariat_revenue: secretariat.summary.total_secretariat_revenue,
      total_vat_collected: notary.summary.total_vat_collected,
      gross_revenue:
        notary.summary.gross_revenue + secretariat.summary.gross_revenue,
      total_refunds:
        notary.summary.total_refunds + secretariat.summary.total_refunds,
      net_revenue: notary.summary.net_revenue + secretariat.summary.net_revenue,
    };
    return {
      period,
      type: BillType.BOTH,
      summary,
      records: [
        ...notary.records,
        ...secretariat.records,
      ] as NotaryFinancialRecordDto[],
      ...breakdowns,
    };
  }

  async getDailySalesReport(
    businessId: string,
    filters: ReportFiltersDto,
  ): Promise<DailySalesReportDto> {
    const query = this.billRepository
      .createQueryBuilder('bill')
      .where('bill.business_id = :businessId', { businessId })
      .andWhere('bill.status IN (:...statuses)', {
        statuses: filters.status ? [filters.status] : this.REVENUE_STATUSES,
      });

    if (filters.start_date)
      query.andWhere('bill.createdAt >= :startDate', {
        startDate: filters.start_date,
      });
    if (filters.end_date)
      query.andWhere('bill.createdAt <= :endDate', {
        endDate: filters.end_date,
      });

    const bills = await query.orderBy('bill.createdAt', 'DESC').getMany();

    let grossRevenue = 0;
    let totalRefunds = 0;
    let notaryRefundsTotal = 0;
    let secretariatRefundsTotal = 0;
    let grossNotary = 0;
    let grossSecretariat = 0;
    let netNotaryRevenue = 0;
    let netSecretariatRevenue = 0;
    let totalVat = 0;
    const periods: Record<
      string,
      { gross: number; refunds: number; net: number }
    > = {};

    for (const bill of bills) {
      const refund = this.billRefundAmount(bill);
      const notaryRefund = this.segmentRefund(bill, bill.notary_total);
      const secretariatRefund = this.segmentRefund(
        bill,
        bill.secretariat_total,
      );
      grossRevenue += bill.grand_total;
      totalRefunds += refund;
      notaryRefundsTotal += notaryRefund;
      secretariatRefundsTotal += secretariatRefund;
      grossNotary += bill.notary_total;
      grossSecretariat += bill.secretariat_total;
      netNotaryRevenue += bill.notary_total - notaryRefund;
      netSecretariatRevenue += bill.secretariat_total - secretariatRefund;
      totalVat += bill.notary_vat;

      const bucket = this.periodBucket(bill.createdAt, filters.group_by);
      periods[bucket] = periods[bucket] || { gross: 0, refunds: 0, net: 0 };
      periods[bucket].gross += bill.grand_total;
      periods[bucket].refunds += refund;
      periods[bucket].net += bill.grand_total - refund;
    }

    const netRevenue = grossRevenue - totalRefunds;

    interface PaymentBreakdownRaw {
      method: PaymentMethod;
      amount: string | null;
      count: string;
    }

    const paymentBreakdownRaw = (await this.paymentRepository
      .createQueryBuilder('payment')
      .innerJoin('payment.bill', 'bill')
      .select('payment.method', 'method')
      .addSelect('SUM(payment.amount)', 'amount')
      .addSelect('COUNT(DISTINCT payment.bill_id)', 'count')
      .where('bill.business_id = :businessId', { businessId })
      .groupBy('payment.method')
      .getRawMany()) as PaymentBreakdownRaw[];

    const paymentMethodBreakdown: Record<
      string,
      { amount: number; count: number }
    > = {};
    for (const stat of paymentBreakdownRaw) {
      paymentMethodBreakdown[stat.method] = {
        count: parseInt(stat.count, 10),
        amount: parseInt(stat.amount || '0', 10),
      };
    }

    return {
      period: {
        start_date: filters.start_date || 'all',
        end_date: filters.end_date || 'all',
      },
      summary: {
        total_bills: bills.length,
        gross_revenue: grossRevenue,
        gross_notary_revenue: grossNotary,
        gross_secretariat_revenue: grossSecretariat,
        total_refunds: totalRefunds,
        notary_refunds: notaryRefundsTotal,
        secretariat_refunds: secretariatRefundsTotal,
        total_revenue: netRevenue,
        total_notary_revenue: netNotaryRevenue,
        total_secretariat_revenue: netSecretariatRevenue,
        total_vat: totalVat,
        average_bill_value: bills.length ? netRevenue / bills.length : 0,
      },
      payment_method_breakdown: paymentMethodBreakdown,
      breakdown_by_period: periods,
      // Each transaction shows the ORIGINAL as-sold figures (never
      // retroactively mutated by later refunds) plus explicit, separated
      // notary/secretariat refund columns and the resulting net.
      transactions: bills.map((b) => {
        const notaryRefund = this.segmentRefund(b, b.notary_total);
        const secretariatRefund = this.segmentRefund(
          b,
          b.secretariat_total,
        );
        const totalRefund = this.billRefundAmount(b);
        return {
          id: b.id,
          bill_number: b.bill_number,
          client_name: b.client_full_name,
          status: b.status,
          // Original amounts as billed/paid (denormalized snapshot)
          notary_amount: b.notary_total,
          secretariat_amount: b.secretariat_total,
          total: b.grand_total,
          vat: b.notary_vat,
          // Refunds, separated by segment
          notary_refund: notaryRefund,
          secretariat_refund: secretariatRefund,
          total_refund: totalRefund,
          // Net after refunds
          net_total: b.grand_total - totalRefund,
          date: b.createdAt,
        };
      }),
    };
  }

  // ==================== Dashboard Statistics ====================

  async getDashboardStatistics(businessId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    // Today's stats
    const todayBills = await this.billRepository
      .createQueryBuilder('bill')
      .where('bill.business_id = :businessId', { businessId })
      .andWhere('bill.createdAt >= :today', { today })
      .getMany();

    const todayPayments = await this.paymentRepository
      .createQueryBuilder('payment')
      .innerJoin('payment.bill', 'bill')
      .where('bill.business_id = :businessId', { businessId })
      .andWhere('payment.processed_at >= :today', { today })
      .getMany();

    // Pending counts
    const pendingNotaryCount = await this.billRepository
      .createQueryBuilder('bill')
      .where('bill.business_id = :businessId', { businessId })
      .andWhere('bill.status = :status', { status: BillStatus.PAID })
      .andWhere('bill.bill_type IN (:...types)', {
        types: [BillType.NOTARY, BillType.BOTH],
      })
      .getCount();

    const pendingSecretariatCount = await this.billRepository
      .createQueryBuilder('bill')
      .where('bill.business_id = :businessId', { businessId })
      .andWhere('bill.status = :status', { status: BillStatus.PAID })
      .andWhere('bill.bill_type IN (:...types)', {
        types: [BillType.SECRETARIAT, BillType.BOTH],
      })
      .getCount();

    const pendingRefundsCount = await this.refundRepository
      .createQueryBuilder('refund')
      .innerJoin('refund.bill', 'bill')
      .where('bill.business_id = :businessId', { businessId })
      .andWhere('refund.status = :status', {
        status: RefundRequestStatus.PENDING,
      })
      .getCount();

    // Refunds processed today
    const todayRefunds = await this.refundRepository
      .createQueryBuilder('refund')
      .innerJoin('refund.bill', 'bill')
      .where('bill.business_id = :businessId', { businessId })
      .andWhere('refund.processed_at >= :today', { today })
      .getMany();
    const todayRefundTotal = todayRefunds.reduce(
      (s, r) => s + (r.actual_refunded_amount || 0),
      0,
    );
    const todayGross = todayPayments.reduce((sum, p) => sum + p.amount, 0);

    // Monthly revenue — all revenue-bearing bills created this month,
    // net of refunds (gross = amount_paid, refunds = amount_refunded).
    const monthlyBills = await this.billRepository
      .createQueryBuilder('bill')
      .where('bill.business_id = :businessId', { businessId })
      .andWhere('bill.status IN (:...statuses)', {
        statuses: this.REVENUE_STATUSES,
      })
      .andWhere('bill.createdAt >= :startOfMonth', { startOfMonth })
      .getMany();

    let monthlyGross = 0;
    let monthlyRefunds = 0;
    for (const bill of monthlyBills) {
      monthlyGross += bill.amount_paid || 0;
      monthlyRefunds += bill.amount_refunded || 0;
    }

    return {
      today: {
        bills_created: todayBills.length,
        gross_revenue: todayGross,
        refunds: todayRefundTotal,
        net_revenue: todayGross - todayRefundTotal,
        payments_count: todayPayments.length,
      },
      pending: {
        notary_bills: pendingNotaryCount,
        secretariat_bills: pendingSecretariatCount,
        refund_requests: pendingRefundsCount,
      },
      monthly: {
        gross_revenue: monthlyGross,
        refunds: monthlyRefunds,
        net_revenue: monthlyGross - monthlyRefunds,
        bills_count: monthlyBills.length,
        start_date: startOfMonth,
      },
    };
  }

  /**
   * Export a report as an .xlsx Buffer. kind: 'minijust' |
   * 'financial-notary' | 'financial-secretariat' | 'daily-sales'.
   */
  async exportReportExcel(
    businessId: string,
    kind: string,
    filters: ReportFiltersDto,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const wb = XLSX.utils.book_new();
    let rows: Record<string, unknown>[] = [];
    let summary: Record<string, unknown> | null = null;
    let filename = `${kind}-report.xlsx`;

    if (kind === 'minijust') {
      const rep = await this.getMinijustReport(businessId, filters);
      rows = rep.records as unknown as Record<string, unknown>[];
      filename = 'minijust-report.xlsx';
    } else if (kind === 'financial-notary') {
      const rep = await this.getNotaryFinancialReport(businessId, filters);
      rows = rep.records as unknown as Record<string, unknown>[];
      summary = rep.summary as unknown as Record<string, unknown>;
      filename = 'notary-financial-report.xlsx';
    } else if (kind === 'financial-secretariat') {
      const rep = await this.getSecretariatFinancialReport(
        businessId,
        filters,
      );
      rows = rep.records as unknown as Record<string, unknown>[];
      summary = rep.summary as unknown as Record<string, unknown>;
      filename = 'secretariat-financial-report.xlsx';
    } else if (kind === 'daily-sales') {
      const rep = await this.getDailySalesReport(businessId, filters);
      rows = rep.transactions as unknown as Record<string, unknown>[];
      summary = rep.summary as unknown as Record<string, unknown>;
      filename = 'daily-sales-report.xlsx';
    } else {
      throw new BadRequestException(
        'Unknown report kind. Use: minijust | financial-notary | financial-secretariat | daily-sales',
      );
    }

    if (summary) {
      const summarySheet = XLSX.utils.json_to_sheet([summary]);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
    }
    const dataSheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
    XLSX.utils.book_append_sheet(wb, dataSheet, 'Records');

    const buffer = XLSX.write(wb, {
      type: 'buffer',
      bookType: 'xlsx',
    }) as Buffer;
    return { buffer, filename };
  }

  async getAllRefunds(
    businessId: string,
    filters: {
      status?: RefundRequestStatus;
      start_date?: string;
      end_date?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedResponseDto> {
    const query = this.refundRepository
      .createQueryBuilder('refund')
      .innerJoin('refund.bill', 'bill')
      .where('bill.business_id = :businessId', { businessId });

    if (filters.status) {
      query.andWhere('refund.status = :status', { status: filters.status });
    }
    if (filters.start_date) {
      query.andWhere('refund.requested_at >= :startDate', {
        startDate: filters.start_date,
      });
    }
    if (filters.end_date) {
      query.andWhere('refund.requested_at <= :endDate', {
        endDate: filters.end_date,
      });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('refund.requested_at', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAllPayments(
    businessId: string,
    filters: {
      method?: PaymentMethod;
      start_date?: string;
      end_date?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedResponseDto> {
    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .innerJoin('payment.bill', 'bill')
      .where('bill.business_id = :businessId', { businessId });

    if (filters.method) {
      query.andWhere('payment.method = :method', { method: filters.method });
    }
    if (filters.start_date) {
      query.andWhere('payment.processed_at >= :startDate', {
        startDate: filters.start_date,
      });
    }
    if (filters.end_date) {
      query.andWhere('payment.processed_at <= :endDate', {
        endDate: filters.end_date,
      });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('payment.processed_at', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==================== Bill Status Updates ====================

  async updateBillStatus(
    userId: string,
    businessId: string,
    dto: UpdateBillStatusDto,
  ): Promise<BillResponseDto> {
    const bill = await this.billRepository.findOne({
      where: { id: dto.bill_id, business_id: businessId },
    });
    if (!bill) throw new NotFoundException('Bill not found');

    const validTransitions: Record<BillStatus, BillStatus[]> = {
      [BillStatus.PENDING]: [BillStatus.PAID, BillStatus.CANCELLED],
      [BillStatus.PARTIALLY_PAID]: [BillStatus.PAID, BillStatus.CANCELLED],
      [BillStatus.PAID]: [BillStatus.SERVED, BillStatus.REJECTED],
      [BillStatus.SERVED]: [],
      [BillStatus.REJECTED]: [BillStatus.REFUNDED, BillStatus.SERVED],
      [BillStatus.REFUNDED]: [],
      [BillStatus.CANCELLED]: [],
    };
    if (!validTransitions[bill.status]?.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${bill.status} to ${dto.status}`,
      );
    }

    if (dto.status === BillStatus.PAID) {
      await this.checkPermission(
        userId,
        businessId,
        [EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT],
        'mark bills as paid',
      );
    } else if (
      dto.status === BillStatus.SERVED ||
      dto.status === BillStatus.REJECTED
    ) {
      await this.checkPermission(
        userId,
        businessId,
        [EBusinessRole.OWNER],
        'serve or reject bills',
      );
    } else if (dto.status === BillStatus.REFUNDED) {
      await this.checkPermission(
        userId,
        businessId,
        [EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT],
        'process refunds',
      );
    }

    bill.status = dto.status;
    if (dto.reason) bill.rejection_reason = dto.reason;
    if (dto.notes) bill.rejection_notes = dto.notes;
    await this.billRepository.save(bill);
    return this.getBillById(bill.id, businessId);
  }
}
