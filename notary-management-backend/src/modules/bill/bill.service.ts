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
import { Book } from '../../shared/entities/book.entity';
import { Payment } from '../../shared/entities/payment.entity';
import { Refund } from '../../shared/entities/refund.entity';
import {
  CreateBillDto,
  NotaryServiceItemDto,
  SecretariatServiceItemDto,
} from './dto/create-bill.dto';
import { UpdateBillStatusDto } from './dto/update-bill-status.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import {
  RejectBillDto,
  RefundType,
  RejectionReason,
} from './dto/reject-bill.dto';
import { ServeBillDto } from './dto/serve-bill.dto';
import { ReportFiltersDto } from './dto/report-filters.dto';
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
    if (book.increments_volume_on_serve)
      tracker.records_in_current_volume += 1;
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
            if (catalogItem) {
              unit_price = catalogItem.base_price ?? unit_price;
              service_name = catalogItem.category?.name ?? service_name;
              sub_service_name = catalogItem.sub_service;
            }
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
          let { unit_price, service_name } = itemDto;
          if (itemDto.service_id) {
            const catalogItem = await this.secretariatServiceRepository.findOne(
              { where: { id: itemDto.service_id, business_id: businessId } },
            );
            if (catalogItem) unit_price = catalogItem.base_price ?? unit_price;
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
      notary_items: items
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
        })),
      secretariat_items: items
        .filter((i) => i.item_type === ItemType.SECRETARIAT)
        .map((i) => ({
          id: i.id,
          service_name: i.service_name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          subtotal: i.subtotal,
          total: i.total,
          notes: i.notes,
        })),
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
    filters: ReportFiltersDto,
  ): Promise<PaginatedResponseDto> {
    const query = this.billRepository
      .createQueryBuilder('bill')
      .where('bill.business_id = :businessId', { businessId });

    if (filters.status)
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
      query.andWhere('bill.created_at >= :startDate', {
        startDate: filters.start_date,
      });
    if (filters.end_date)
      query.andWhere('bill.created_at <= :endDate', {
        endDate: filters.end_date,
      });

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('bill.created_at', 'DESC')
      .getManyAndCount();

    const formattedData = await Promise.all(
      data.map(async (bill) => {
        const items = await this.billItemRepository.find({
          where: { bill_id: bill.id },
        });
        return {
          id: bill.id,
          bill_number: bill.bill_number,
          bill_type: bill.bill_type,
          client_name: bill.client_full_name,
          grand_total: bill.grand_total,
          amount_paid: bill.amount_paid,
          status: bill.status,
          created_at: bill.createdAt,
          item_count: items.length,
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

  // ==================== Rejection & Refund ====================

  async rejectBill(
    userId: string,
    businessId: string,
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
    bill.status = BillStatus.REJECTED;
    bill.rejected_by = userId;
    bill.rejected_at = new Date();
    bill.rejection_reason = dto.reason;
    bill.rejection_notes = dto.notes || '';
    await this.billRepository.save(bill);

    let refundAmount = 0;
    if (dto.refund_type !== RefundType.NONE && bill.amount_paid > 0) {
      switch (dto.refund_type) {
        case RefundType.FULL:
          refundAmount = bill.amount_paid;
          break;
        case RefundType.HALF:
          refundAmount = Math.round(bill.amount_paid / 2);
          break;
        case RefundType.CUSTOM:
          refundAmount = dto.custom_refund_amount || 0;
          if (refundAmount > bill.amount_paid)
            throw new BadRequestException(
              'Custom refund amount exceeds paid amount',
            );
          break;
      }
      if (refundAmount > 0) {
        const refund = this.refundRepository.create({
          id: bill.id,
          bill_number: bill.bill_number,
          client_name: bill.client_full_name,
          original_amount: bill.amount_paid,
          refund_amount: refundAmount,
          refund_reason: dto.reason,
          refund_type: dto.refund_type,
          processed_by: userId,
          processed_by_name: userInfo.name,
          processed_at: new Date(),
        });
        await this.refundRepository.save(refund);
        bill.status = BillStatus.REFUNDED;
        await this.billRepository.save(bill);
      }
    }

    return {
      message: 'Bill rejected successfully',
      bill: {
        id: bill.id,
        status: bill.status,
        refund_processed: refundAmount > 0,
        refund_amount: refundAmount,
      },
    };
  }

  // ==================== Serve Bill (Create Notary Record) ====================

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

    const bill = await this.billRepository.findOne({
      where: { id: dto.bill_id, business_id: businessId },
    });
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.status !== BillStatus.PAID)
      throw new BadRequestException('Only paid bills can be served');
    if (bill.notary_total === 0)
      throw new BadRequestException(
        'This bill has no notary services to serve',
      );

    const notaryItems = await this.billItemRepository.find({
      where: { bill_id: bill.id, item_type: ItemType.NOTARY },
    });
    if (notaryItems.length === 0)
      throw new BadRequestException('No notary items found on this bill');

    const book = await this.getBook(businessId, dto.book_id);

    let volume = dto.volume;
    let recordNumber = dto.record_number;
    let displayNumber: string;

    if (!recordNumber) {
      const tracker = await this.getBookTracker(businessId, book.id);
      recordNumber = tracker.current_number + 1;
      if (
        book.increments_volume_on_serve &&
        tracker.records_in_current_volume >= tracker.records_per_volume
      ) {
        volume = this.incrementRoman(tracker.current_volume || 'I');
        recordNumber = 1;
      } else {
        volume = tracker.current_volume || '';
      }
      displayNumber = volume ? `${recordNumber}/${volume}` : `${recordNumber}`;
      await this.updateBookTracker(businessId, book, volume, recordNumber);
    } else {
      displayNumber = volume ? `${recordNumber}/${volume}` : `${recordNumber}`;
    }

    if (book.requires_upi && !dto.upi && !bill.client_upi) {
      throw new BadRequestException(
        'UPI (Unique Parcel Identifier) is required for land records',
      );
    }

    const firstItem = notaryItems[0];
    const userInfo = await this.getUserInfo(userId, businessId);

    const notaryRecord = this.notaryRecordRepository.create({
      book_type: book.slug,
      book_id: book.id,
      bill_id: bill.id,
      client_id: bill.client_id,
      business_id: businessId,
      volume: volume || null,
      record_number: recordNumber.toString(),
      display_number: displayNumber,
      service_category: firstItem.service_name,
      sub_service: firstItem.sub_service_name,
      amount: firstItem.subtotal,
      vat_amount: firstItem.vat_amount,
      upi: dto.upi || bill.client_upi,
      notary_notes: dto.notary_notes,
      served_by: userId,
      served_date: new Date(),
      client_full_name: bill.client_full_name,
      client_id_number: bill.client_id_number,
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

  // ==================== Reports ====================

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
    const totalAmount = records.reduce(
      (sum, r) => sum + r.amount + r.vat_amount,
      0,
    );

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
        service_name: r.service_category,
        sub_service_name: r.sub_service,
        amount: r.amount + r.vat_amount,
      })),
      total_records: records.length,
      total_amount: totalAmount,
    };
  }

  async getFinancialReport(
    businessId: string,
    filters: ReportFiltersDto,
    type: 'notary' | 'secretariat' | 'combined',
  ): Promise<FinancialReportDto> {
    const billsQuery = this.billRepository
      .createQueryBuilder('bill')
      .where('bill.business_id = :businessId', { businessId })
      .andWhere('bill.status = :status', { status: BillStatus.PAID });

    if (filters.start_date)
      billsQuery.andWhere('bill.created_at >= :startDate', {
        startDate: filters.start_date,
      });
    if (filters.end_date)
      billsQuery.andWhere('bill.created_at <= :endDate', {
        endDate: filters.end_date,
      });

    const bills = await billsQuery.getMany();
    const refunds = await this.refundRepository.find({
      where: { id: In(bills.map((b) => b.id)) },
    });
    const totalRefunds = refunds.reduce((sum, r) => sum + r.refund_amount, 0);

    let totalNotary = 0,
      totalSecretariat = 0,
      totalVat = 0;
    for (const bill of bills) {
      totalNotary += bill.notary_total;
      totalSecretariat += bill.secretariat_total;
      totalVat += bill.notary_vat;
    }

    const summary = {
      total_bills: bills.length,
      total_notary_revenue: totalNotary,
      total_secretariat_revenue: totalSecretariat,
      total_vat_collected: totalVat,
      total_refunds: totalRefunds,
      net_revenue:
        (type === 'notary'
          ? totalNotary
          : type === 'secretariat'
            ? totalSecretariat
            : totalNotary + totalSecretariat) - totalRefunds,
    };

    // Define interface for the expected return type
    interface StatusBreakdownItem {
      status: BillStatus;
      count: string;
      amount: string | null;
    }

    // Remove the type assertion - TypeScript can infer this
    const statusBreakdownRaw = await this.billRepository
      .createQueryBuilder('bill')
      .select('bill.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(bill.grand_total)', 'amount')
      .where('bill.business_id = :businessId', { businessId })
      .groupBy('bill.status')
      .getRawMany();

    const statusBreakdown: Record<string, { count: number; amount: number }> =
      {};
    for (const stat of statusBreakdownRaw as StatusBreakdownItem[]) {
      statusBreakdown[stat.status] = {
        count: parseInt(stat.count, 10),
        amount: parseInt(stat.amount || '0', 10),
      };
    }

    interface PaymentBreakdownItem {
      method: PaymentMethod;
      amount: string | null;
      count: string;
    }

    const paymentBreakdownRaw = await this.paymentRepository
      .createQueryBuilder('payment')
      .innerJoin('payment.bill', 'bill')
      .select('payment.method', 'method')
      .addSelect('SUM(payment.amount)', 'amount')
      .addSelect('COUNT(DISTINCT payment.bill_id)', 'count')
      .where('bill.business_id = :businessId', { businessId })
      .groupBy('payment.method')
      .getRawMany();

    const paymentBreakdown: Record<string, { count: number; amount: number }> =
      {};
    for (const stat of paymentBreakdownRaw as PaymentBreakdownItem[]) {
      paymentBreakdown[stat.method] = {
        count: parseInt(stat.count, 10),
        amount: parseInt(stat.amount || '0', 10),
      };
    }

    return {
      period: {
        start_date: filters.start_date || 'all',
        end_date: filters.end_date || 'all',
      },
      summary,
      breakdown_by_status: statusBreakdown,
      breakdown_by_payment_method: paymentBreakdown,
    };
  }

  async getDailySalesReport(
    businessId: string,
    filters: ReportFiltersDto,
  ): Promise<DailySalesReportDto> {
    const query = this.billRepository
      .createQueryBuilder('bill')
      .where('bill.business_id = :businessId', { businessId })
      .andWhere('bill.status = :status', { status: BillStatus.PAID });

    if (filters.start_date)
      query.andWhere('bill.created_at >= :startDate', {
        startDate: filters.start_date,
      });
    if (filters.end_date)
      query.andWhere('bill.created_at <= :endDate', {
        endDate: filters.end_date,
      });

    const bills = await query.orderBy('bill.created_at', 'DESC').getMany();
    const totalRevenue = bills.reduce((sum, b) => sum + b.grand_total, 0);
    const totalVat = bills.reduce((sum, b) => sum + b.notary_vat, 0);

    interface PaymentBreakdownItem {
      method: PaymentMethod;
      amount: string | null;
      count: string;
    }

    const paymentBreakdownRaw = await this.paymentRepository
      .createQueryBuilder('payment')
      .innerJoin('payment.bill', 'bill')
      .select('payment.method', 'method')
      .addSelect('SUM(payment.amount)', 'amount')
      .addSelect('COUNT(DISTINCT payment.bill_id)', 'count')
      .where('bill.business_id = :businessId', { businessId })
      .groupBy('payment.method')
      .getRawMany();

    const paymentMethodBreakdown: Record<
      string,
      { amount: number; count: number }
    > = {};
    for (const stat of paymentBreakdownRaw as PaymentBreakdownItem[]) {
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
        total_revenue: totalRevenue,
        total_vat: totalVat,
        average_bill_value: bills.length ? totalRevenue / bills.length : 0,
      },
      payment_method_breakdown: paymentMethodBreakdown,
      transactions: bills.map((b) => ({
        id: b.id,
        bill_number: b.bill_number,
        client_name: b.client_full_name,
        amount: b.grand_total,
        vat: b.notary_vat,
        date: b.createdAt,
      })),
    };
  }
}
