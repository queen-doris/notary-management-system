/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Bill } from '../../shared/entities/bill.entity';
import { BillItem, ItemType } from '../../shared/entities/bill-item.entity';
import { Client } from '../../shared/entities/client.entity';
import { Business } from '../../shared/entities/business.entity';
import { User } from '../../shared/entities/user.entity';
import { BusinessUser } from '../../shared/entities/business-user.entity';
import {
  CreateBillDto,
  NotaryServiceItemDto,
  SecretariatServiceItemDto,
} from './dto/create-bill.dto';
import { UpdateBillStatusDto } from './dto/update-bill-status.dto';
import { BillStatus, BillType } from '../../shared/enums/bill.enum';
import { EBusinessRole } from '../../shared/enums/business-role.enum';
import { EUserRole } from '../../shared/enums/user-role.enum';
import { NotaryService } from '../../shared/entities/notary-service.entity';
import { SecretariatService } from '../../shared/entities/secretariat-service.entity';
import { Payment } from '../../shared/entities/payment.entity';
// import { PaymentMethod } from 'src/shared/enums/payment-method.enum';
import { PaymentStatus } from 'src/shared/enums/payment-status.enum';
import { RecordPaymentDto, RefundPaymentDto } from './dto/record-payment.dto';

@Injectable()
export class BillService {
  private readonly VAT_RATE = 0.18; // 18%

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
    private dataSource: DataSource,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  /**
   * Get creator information (name and role)
   * For SUPERADMIN: gets from User table
   * For STAFF: gets from User + BusinessUser tables
   */
  private async getCreatorInfo(
    userId: string,
    businessId: string,
  ): Promise<{ name: string; role: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return { name: 'Unknown', role: 'unknown' };
    }

    // SUPERADMIN
    if (user.role === EUserRole.SUPERADMIN) {
      return { name: user.fullNames || user.phone, role: 'SUPERADMIN' };
    }

    // STAFF - get their business role
    const businessUser = await this.businessUserRepository.findOne({
      where: { userId: userId, businessId: businessId },
    });

    if (businessUser && businessUser.roles && businessUser.roles.length > 0) {
      // Get the primary role (first one)
      const primaryRole = businessUser.roles[0];
      return {
        name: user.fullNames || user.phone,
        role: primaryRole,
      };
    }

    return { name: user.fullNames || user.phone, role: 'STAFF' };
  }

  /**
   * Check if user has a specific business role
   */
  private async userHasRole(
    userId: string,
    businessId: string,
    requiredRoles: EBusinessRole[],
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) return false;

    // SUPERADMIN has all permissions
    if (user.role === EUserRole.SUPERADMIN) {
      return true;
    }

    // Check STAFF's business roles
    const businessUser = await this.businessUserRepository.findOne({
      where: { userId: userId, businessId: businessId },
    });

    if (!businessUser) return false;

    return requiredRoles.some((role) => businessUser.roles.includes(role));
  }

  /**
   * Check if user has any of the allowed roles for an action
   */
  private async checkPermission(
    userId: string,
    businessId: string,
    allowedRoles: EBusinessRole[],
    actionDescription: string,
  ): Promise<void> {
    const hasPermission = await this.userHasRole(
      userId,
      businessId,
      allowedRoles,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        `You don't have permission to ${actionDescription}. Required roles: ${allowedRoles.join(', ')}`,
      );
    }
  }

  /**
   * Generate unique bill number
   * Format: NOT-YYYY-XXXX or SEC-YYYY-XXXX
   */
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

    const paddedSequence = sequence.toString().padStart(4, '0');
    return `${prefix}-${year}-${paddedSequence}`;
  }

  /**
   * Calculate totals for a service item
   */
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

  /**
   * Check if client has active notary bill
   */
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
        statuses: [BillStatus.PENDING, BillStatus.PAID],
      })
      .andWhere('bill.bill_type IN (:...types)', {
        types: [BillType.NOTARY, BillType.BOTH],
      });

    if (excludeBillId) {
      query.andWhere('bill.id != :excludeBillId', { excludeBillId });
    }

    const existingBill = await query.getOne();
    return !!existingBill;
  }

  /**
   * Create a new bill (Notary, Secretariat, or Both)
   */
  async createBill(
    userId: string,
    businessId: string,
    isStaff: boolean,
    userRole: string,
    dto: CreateBillDto,
  ): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verify client exists and get FULL client info
      const client = await this.clientRepository.findOne({
        where: { id: dto.client_id, business_id: businessId },
      });
      if (!client) {
        throw new NotFoundException('Client not found');
      }

      // 2. Check permissions based on bill type
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

      // 3. Check if client already has active notary bill (for notary bills only)
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

      // 4. Verify business is active
      const business = await this.businessRepository.findOne({
        where: { id: businessId, isActive: true },
      });
      if (!business) {
        throw new NotFoundException('Business not found or inactive');
      }

      // 5. Calculate totals
      let notarySubtotal = 0;
      let notaryVat = 0;
      let notaryTotal = 0;
      let secretariatSubtotal = 0;
      let secretariatTotal = 0;

      const itemsToSave: BillItem[] = [];

      // Process notary items
      if (dto.notary_items && dto.notary_items.length > 0) {
        for (const itemDto of dto.notary_items) {
          let unitPrice = itemDto.unit_price;
          let serviceName = itemDto.service_name;
          let subServiceName = itemDto.sub_service_name;

          // Get price from NotaryService repository if service_id is provided
          if (itemDto.service_id) {
            const catalogItem = await this.notaryServiceRepository.findOne({
              where: { id: itemDto.service_id, business_id: businessId },
            });
            if (catalogItem) {
              unitPrice = catalogItem.base_price ?? unitPrice;
              serviceName = catalogItem.service_name;
              subServiceName = catalogItem.sub_service;
            }
          }

          const { subtotal, vatAmount, total } = this.calculateItemTotals(
            unitPrice,
            itemDto.quantity,
            true,
          );

          notarySubtotal += subtotal;
          notaryVat += vatAmount;
          notaryTotal += total;

          const billItem = new BillItem();
          billItem.item_type = ItemType.NOTARY;
          billItem.service_id = itemDto.service_id || '';
          billItem.service_name = serviceName;
          billItem.sub_service_name = subServiceName;
          billItem.quantity = itemDto.quantity;
          billItem.unit_price = unitPrice;
          billItem.subtotal = subtotal;
          billItem.vat_amount = vatAmount;
          billItem.total = total;
          billItem.notes = itemDto.notes || '';

          itemsToSave.push(billItem);
        }
      }

      // Process secretariat items
      if (dto.secretariat_items && dto.secretariat_items.length > 0) {
        for (const itemDto of dto.secretariat_items) {
          let unitPrice = itemDto.unit_price;
          let serviceName = itemDto.service_name;

          // Get price from SecretariatService repository if service_id is provided
          if (itemDto.service_id) {
            const catalogItem = await this.secretariatServiceRepository.findOne(
              {
                where: { id: itemDto.service_id, business_id: businessId },
              },
            );
            if (catalogItem) {
              unitPrice = catalogItem.base_price ?? unitPrice;
              serviceName = catalogItem.service_name;
            }
          }

          const { subtotal, total } = this.calculateItemTotals(
            unitPrice,
            itemDto.quantity,
            false,
          );

          secretariatSubtotal += subtotal;
          secretariatTotal += total;

          const billItem = new BillItem();
          billItem.item_type = ItemType.SECRETARIAT;
          billItem.service_id = itemDto.service_id || '';
          billItem.service_name = serviceName;
          billItem.sub_service_name = '';
          billItem.quantity = itemDto.quantity;
          billItem.unit_price = unitPrice;
          billItem.subtotal = subtotal;
          billItem.vat_amount = 0;
          billItem.total = total;
          billItem.notes = itemDto.notes || '';

          itemsToSave.push(billItem);
        }
      }

      if (itemsToSave.length === 0) {
        throw new BadRequestException('At least one service item is required');
      }

      // Determine actual bill type
      const hasNotary = notaryTotal > 0;
      const hasSecretariat = secretariatTotal > 0;
      let actualBillType: BillType;
      if (hasNotary && hasSecretariat) {
        actualBillType = BillType.BOTH;
      } else if (hasNotary) {
        actualBillType = BillType.NOTARY;
      } else {
        actualBillType = BillType.SECRETARIAT;
      }

      // 6. Generate bill number
      const billNumber = await this.generateBillNumber(
        businessId,
        actualBillType,
      );

      // 7. Create bill with denormalized client data
      const bill = this.billRepository.create({
        bill_number: billNumber,
        bill_type: actualBillType,

        // Client information (denormalized from client entity)
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

        // Business info
        business_id: businessId,
        created_by: userId,
        is_created_by_staff: true,

        // Financial totals
        notary_subtotal: notarySubtotal,
        notary_vat: notaryVat,
        notary_total: notaryTotal,
        secretariat_subtotal: secretariatSubtotal,
        secretariat_total: secretariatTotal,
        grand_total: notaryTotal + secretariatTotal,

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

  /**
   * Record a payment for a bill
   */
  async recordPayment(
    billId: string,
    businessId: string,
    userId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
    dto: RecordPaymentDto,
  ): Promise<any> {
    // Check permission (only accountant or owner)
    await this.checkPermission(
      userId,
      businessId,
      [EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT],
      'record payments',
    );

    const bill = await this.billRepository.findOne({
      where: { id: billId, business_id: businessId },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    if (
      bill.status !== BillStatus.PENDING &&
      bill.status !== BillStatus.PARTIALLY_PAID
    ) {
      throw new BadRequestException('Cannot record payment for this bill');
    }

    // Get user info for denormalization
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    // Create payment record
    const payment = this.paymentRepository.create({
      bill_id: billId,
      bill_number: bill.bill_number,
      client_name: bill.client_full_name,
      amount: dto.amount,
      method: dto.method,
      reference: dto.reference,
      status: PaymentStatus.COMPLETED,
      processed_by: userId,
      processed_by_name: user?.fullNames || user?.phone || 'Unknown',
      processed_by_role: userRole,
      notes: dto.notes,
      processed_at: new Date(),
    });

    await this.paymentRepository.save(payment);

    // Update bill payment amounts
    const newAmountPaid = bill.amount_paid + dto.amount;
    const newRemainingBalance = bill.grand_total - newAmountPaid;

    bill.amount_paid = newAmountPaid;
    bill.remaining_balance = newRemainingBalance;

    // Update bill status based on payment
    if (newRemainingBalance <= 0) {
      bill.status = BillStatus.PAID;
      bill.paid_at = new Date();
      bill.paid_by = userId;
      bill.paid_by_name = user?.fullNames || user?.phone || 'Unknown';
    } else {
      bill.status = BillStatus.PARTIALLY_PAID;
    }

    await this.billRepository.save(bill);

    return {
      payment,
      bill: {
        id: bill.id,
        status: bill.status,
        amount_paid: bill.amount_paid,
        remaining_balance: bill.remaining_balance,
      },
    };
  }

  /**
   * Get payment history for a bill
   */
  async getPaymentHistory(
    billId: string,
    businessId: string,
  ): Promise<Payment[]> {
    const bill = await this.billRepository.findOne({
      where: { id: billId, business_id: businessId },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    return this.paymentRepository.find({
      where: { bill_id: billId },
      order: { processed_at: 'DESC' },
    });
  }

  /**
   * Process refund for a payment
   */
  async refundPayment(
    paymentId: string,
    businessId: string,
    userId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
    dto: RefundPaymentDto,
  ): Promise<any> {
    await this.checkPermission(
      userId,
      businessId,
      [EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT],
      'process refunds',
    );

    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['bill'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      throw new BadRequestException('Payment already refunded');
    }

    // Update payment status
    payment.status = PaymentStatus.REFUNDED;
    await this.paymentRepository.save(payment);

    // Update bill (reduce amount_paid)
    const bill = payment.bill;
    const newAmountPaid = bill.amount_paid - payment.amount;
    bill.amount_paid = newAmountPaid;
    bill.remaining_balance = bill.grand_total - newAmountPaid;

    if (newAmountPaid <= 0) {
      bill.status = BillStatus.PENDING;
    } else {
      bill.status = BillStatus.PARTIALLY_PAID;
    }

    await this.billRepository.save(bill);

    return {
      message: 'Payment refunded successfully',
      payment: { id: payment.id, status: payment.status },
      bill: {
        id: bill.id,
        status: bill.status,
        amount_paid: bill.amount_paid,
        remaining_balance: bill.remaining_balance,
      },
    };
  }

  /**
   * Get bill by ID with full details (uses denormalized client data)
   */
  async getBillById(billId: string, businessId: string): Promise<any> {
    const bill = await this.billRepository.findOne({
      where: { id: billId, business_id: businessId },
      // No need to join client - data is denormalized in the bill!
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    // Get bill items
    const items = await this.billItemRepository.find({
      where: { bill_id: bill.id },
    });

    // Get creator info using your entity structure
    const creatorInfo = await this.getCreatorInfo(bill.created_by, businessId);

    // Separate items by type
    const notaryItems = items
      .filter((item) => item.item_type === ItemType.NOTARY)
      .map((item) => ({
        id: item.id,
        item_type: item.item_type,
        service_name: item.service_name,
        sub_service_name: item.sub_service_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        vat_amount: item.vat_amount,
        total: item.total,
        notes: item.notes,
      }));

    const secretariatItems = items
      .filter((item) => item.item_type === ItemType.SECRETARIAT)
      .map((item) => ({
        id: item.id,
        item_type: item.item_type,
        service_name: item.service_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        total: item.total,
        notes: item.notes,
      }));

    return {
      id: bill.id,
      bill_number: bill.bill_number,
      bill_type: bill.bill_type,
      // Client info directly from bill (no JOIN needed!)
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
      notary: {
        subtotal: bill.notary_subtotal,
        vat: bill.notary_vat,
        total: bill.notary_total,
        items: notaryItems,
      },
      secretariat: {
        subtotal: bill.secretariat_subtotal,
        total: bill.secretariat_total,
        items: secretariatItems,
      },
      grand_total: bill.grand_total,
      status: bill.status,
      notes: bill.notes,
      rejection_reason: bill.rejection_reason,
      rejection_notes: bill.rejection_notes,
      created_by_name: creatorInfo.name,
      created_by_role: creatorInfo.role,
      created_at: bill.createdAt,
      updated_at: bill.updatedAt,
    };
  }

  /**
   * Get bill by bill number
   */
  async getBillByNumber(billNumber: string, businessId: string): Promise<any> {
    const bill = await this.billRepository.findOne({
      where: { bill_number: billNumber, business_id: businessId },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    return this.getBillById(bill.id, businessId);
  }

  /**
   * Get all bills for a business with filters
   */
  async getAllBills(
    businessId: string,
    filters: {
      status?: BillStatus;
      bill_type?: BillType;
      client_id?: string;
      start_date?: string;
      end_date?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<any> {
    const query = this.billRepository
      .createQueryBuilder('bill')
      .where('bill.business_id = :businessId', { businessId });

    if (filters.status) {
      query.andWhere('bill.status = :status', { status: filters.status });
    }

    if (filters.bill_type) {
      query.andWhere('bill.bill_type = :billType', {
        billType: filters.bill_type,
      });
    }

    if (filters.client_id) {
      query.andWhere('bill.client_id = :clientId', {
        clientId: filters.client_id,
      });
    }

    if (filters.start_date) {
      query.andWhere('bill.created_at >= :startDate', {
        startDate: filters.start_date,
      });
    }

    if (filters.end_date) {
      query.andWhere('bill.created_at <= :endDate', {
        endDate: filters.end_date,
      });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    query.skip(skip).take(limit);
    query.orderBy('bill.created_at', 'DESC');

    const [data, total] = await query.getManyAndCount();

    const formattedData = await Promise.all(
      data.map(async (bill) => {
        const items = await this.billItemRepository.find({
          where: { bill_id: bill.id },
        });
        const creatorInfo = await this.getCreatorInfo(
          bill.created_by,
          businessId,
        );

        return {
          id: bill.id,
          bill_number: bill.bill_number,
          bill_type: bill.bill_type,
          client_name: bill.client_full_name,
          client_id_number: bill.client_id_number,
          client_phone: bill.client_phone,
          grand_total: bill.grand_total,
          status: bill.status,
          created_by_name: creatorInfo.name,
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

  /**
   * Get pending bills (for accountant)
   */
  async getPendingBills(businessId: string): Promise<any> {
    const bills = await this.billRepository
      .createQueryBuilder('bill')
      .where('bill.business_id = :businessId', { businessId })
      .andWhere('bill.status = :status', { status: BillStatus.PENDING })
      .orderBy('bill.created_at', 'ASC')
      .getMany();

    return Promise.all(
      bills.map(async (bill) => {
        const items = await this.billItemRepository.find({
          where: { bill_id: bill.id },
        });
        return {
          id: bill.id,
          bill_number: bill.bill_number,
          bill_type: bill.bill_type,
          client_name: bill.client_full_name,
          client_phone: bill.client_phone,
          grand_total: bill.grand_total,
          created_at: bill.createdAt,
          has_notary: items.some((i) => i.item_type === ItemType.NOTARY),
          has_secretariat: items.some(
            (i) => i.item_type === ItemType.SECRETARIAT,
          ),
        };
      }),
    );
  }

  /**
   * Get paid bills awaiting service (for notary - only notary bills)
   */
  async getPaidUnservedBills(businessId: string): Promise<any> {
    const bills = await this.billRepository
      .createQueryBuilder('bill')
      .where('bill.business_id = :businessId', { businessId })
      .andWhere('bill.status = :status', { status: BillStatus.PAID })
      .andWhere('bill.bill_type IN (:...types)', {
        types: [BillType.NOTARY, BillType.BOTH],
      })
      .orderBy('bill.updated_at', 'ASC')
      .getMany();

    return Promise.all(
      bills.map(async (bill) => {
        const items = await this.billItemRepository.find({
          where: { bill_id: bill.id, item_type: ItemType.NOTARY },
        });
        return {
          id: bill.id,
          bill_number: bill.bill_number,
          client: {
            id: bill.client_id,
            full_name: bill.client_full_name,
            id_number: bill.client_id_number,
            phone: bill.client_phone,
          },
          notary_items: items.map((item) => ({
            service_name: item.service_name,
            sub_service_name: item.sub_service_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
          })),
          notary_total: bill.notary_total,
          created_at: bill.createdAt,
          paid_at: bill.updatedAt,
        };
      }),
    );
  }

  /**
   * Add items to existing bill
   */
  async addItemsToBill(
    billId: string,
    businessId: string,
    userId: string,
    userRole: string,
    notaryItems?: NotaryServiceItemDto[],
    secretariatItems?: SecretariatServiceItemDto[],
  ): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Get the existing bill
      const bill = await this.billRepository.findOne({
        where: { id: billId, business_id: businessId },
      });

      if (!bill) {
        throw new NotFoundException('Bill not found');
      }

      if (bill.status !== BillStatus.PENDING) {
        throw new BadRequestException(
          'Cannot add items to a bill that is not pending',
        );
      }

      // 2. Check permissions based on what we're adding
      if (notaryItems && notaryItems.length > 0) {
        await this.checkPermission(
          userId,
          businessId,
          [EBusinessRole.OWNER, EBusinessRole.RECEPTIONIST],
          'add notary items to bill',
        );
      }

      if (secretariatItems && secretariatItems.length > 0) {
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
      }

      // 3. Check if client already has active notary bill (for adding notary items)
      if (notaryItems && notaryItems.length > 0) {
        const hasActive = await this.hasActiveNotaryBill(
          bill.client_id,
          businessId,
          billId,
        );
        if (hasActive) {
          throw new ConflictException(
            'Client already has a pending or paid notary bill. Only one notary service allowed at a time.',
          );
        }
      }

      let notarySubtotal = bill.notary_subtotal;
      let notaryVat = bill.notary_vat;
      let notaryTotal = bill.notary_total;
      let secretariatSubtotal = bill.secretariat_subtotal;
      let secretariatTotal = bill.secretariat_total;
      const newItems: BillItem[] = [];

      // 4. Process new notary items
      if (notaryItems && notaryItems.length > 0) {
        for (const itemDto of notaryItems) {
          let unitPrice = itemDto.unit_price;
          let serviceName = itemDto.service_name;
          let subServiceName = itemDto.sub_service_name;

          if (itemDto.service_id) {
            const catalogItem = await this.notaryServiceRepository.findOne({
              where: { id: itemDto.service_id, business_id: businessId },
            });
            if (catalogItem) {
              unitPrice = catalogItem.base_price ?? unitPrice;
              serviceName = catalogItem.service_name;
              subServiceName = catalogItem.sub_service;
            }
          }

          const { subtotal, vatAmount, total } = this.calculateItemTotals(
            unitPrice,
            itemDto.quantity,
            true,
          );

          notarySubtotal += subtotal;
          notaryVat += vatAmount;
          notaryTotal += total;

          const billItem = new BillItem();
          billItem.item_type = ItemType.NOTARY;
          billItem.service_id = itemDto.service_id || '';
          billItem.service_name = serviceName;
          billItem.sub_service_name = subServiceName || '';
          billItem.quantity = itemDto.quantity;
          billItem.unit_price = unitPrice;
          billItem.subtotal = subtotal;
          billItem.vat_amount = vatAmount;
          billItem.total = total;
          billItem.notes = itemDto.notes || '';

          newItems.push(billItem);
        }
      }

      // 5. Process new secretariat items
      if (secretariatItems && secretariatItems.length > 0) {
        for (const itemDto of secretariatItems) {
          let unitPrice = itemDto.unit_price;
          let serviceName = itemDto.service_name;

          if (itemDto.service_id) {
            const catalogItem = await this.secretariatServiceRepository.findOne(
              {
                where: { id: itemDto.service_id, business_id: businessId },
              },
            );
            if (catalogItem) {
              unitPrice = catalogItem.base_price ?? unitPrice;
              serviceName = catalogItem.service_name;
            }
          }

          const { subtotal, total } = this.calculateItemTotals(
            unitPrice,
            itemDto.quantity,
            false,
          );

          secretariatSubtotal += subtotal;
          secretariatTotal += total;

          const billItem = new BillItem();
          billItem.item_type = ItemType.SECRETARIAT;
          billItem.service_id = itemDto.service_id || '';
          billItem.service_name = serviceName;
          billItem.sub_service_name = '';
          billItem.quantity = itemDto.quantity;
          billItem.unit_price = unitPrice;
          billItem.subtotal = subtotal;
          billItem.vat_amount = 0;
          billItem.total = total;
          billItem.notes = itemDto.notes || '';

          newItems.push(billItem);
        }
      }

      if (newItems.length === 0) {
        throw new BadRequestException('At least one service item is required');
      }

      // 6. Update bill totals
      bill.notary_subtotal = notarySubtotal;
      bill.notary_vat = notaryVat;
      bill.notary_total = notaryTotal;
      bill.secretariat_subtotal = secretariatSubtotal;
      bill.secretariat_total = secretariatTotal;
      bill.grand_total = notaryTotal + secretariatTotal;

      // 7. Update bill type if needed
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

      // 8. Save new items
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

  /**
   * Update bill status
   */
  async updateBillStatus(
    billId: string,
    businessId: string,
    userId: string,
    userRole: string,
    dto: UpdateBillStatusDto,
  ): Promise<any> {
    const bill = await this.billRepository.findOne({
      where: { id: billId, business_id: businessId },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    // Permission checks based on target status
    if (dto.status === BillStatus.PAID) {
      await this.checkPermission(
        userId,
        businessId,
        [EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT],
        'mark bills as paid',
      );
    }

    if (
      dto.status === BillStatus.SERVED ||
      dto.status === BillStatus.REJECTED
    ) {
      await this.checkPermission(
        userId,
        businessId,
        [EBusinessRole.OWNER],
        'serve or reject bills',
      );
    }

    if (dto.status === BillStatus.REFUNDED) {
      await this.checkPermission(
        userId,
        businessId,
        [EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT],
        'process refunds',
      );
    }

    // Validate status transition
    const validTransitions: Record<BillStatus, BillStatus[]> = {
      [BillStatus.PENDING]: [BillStatus.PAID, BillStatus.CANCELLED],
      [BillStatus.PAID]: [BillStatus.SERVED, BillStatus.REJECTED],
      [BillStatus.SERVED]: [],
      [BillStatus.REJECTED]: [BillStatus.REFUNDED],
      [BillStatus.REFUNDED]: [],
      [BillStatus.CANCELLED]: [],
      [BillStatus.PARTIALLY_PAID]: [
        BillStatus.PAID,
        BillStatus.SERVED,
        BillStatus.REJECTED,
      ],
    };

    if (!validTransitions[bill.status].includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${bill.status} to ${dto.status}`,
      );
    }

    bill.status = dto.status;

    if (dto.status === BillStatus.REJECTED) {
      bill.rejected_by = userId;
      bill.rejected_at = new Date();
      bill.rejection_reason = dto.rejection_reason || '';
      bill.rejection_notes = dto.rejection_notes || '';
    }

    await this.billRepository.save(bill);

    return this.getBillById(billId, businessId);
  }

  /**
   * Get bill statistics for dashboard
   */
  async getBillStats(businessId: string, date?: string): Promise<any> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Define interfaces for raw query results
    interface StatsRawResult {
      status: BillStatus;
      count: string;
      total_amount: string | null;
    }

    interface TypeStatsRawResult {
      bill_type: BillType;
      total: string | null;
    }

    interface VatStatsRawResult {
      vat: string | null;
    }

    const stats: StatsRawResult[] = await this.billRepository
      .createQueryBuilder('bill')
      .select('bill.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(bill.grand_total)', 'total_amount')
      .where('bill.business_id = :businessId', { businessId })
      .andWhere('DATE(bill.created_at) = :targetDate', { targetDate })
      .groupBy('bill.status')
      .getRawMany();

    const result = {
      date: targetDate,
      total: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      served: { count: 0, amount: 0 },
      rejected: { count: 0, amount: 0 },
      refunded: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 },
      notary_total: 0,
      secretariat_total: 0,
      vat_collected: 0,
    };

    const typeStats: TypeStatsRawResult[] = await this.billRepository
      .createQueryBuilder('bill')
      .select('bill.bill_type', 'bill_type')
      .addSelect('SUM(bill.grand_total)', 'total')
      .where('bill.business_id = :businessId', { businessId })
      .andWhere('DATE(bill.created_at) = :targetDate', { targetDate })
      .andWhere('bill.status = :status', { status: BillStatus.PAID })
      .groupBy('bill.bill_type')
      .getRawMany();

    for (const stat of typeStats) {
      const totalValue = parseInt(stat.total || '0', 10);
      if (stat.bill_type === BillType.NOTARY) {
        result.notary_total += totalValue;
      } else if (stat.bill_type === BillType.SECRETARIAT) {
        result.secretariat_total += totalValue;
      } else if (stat.bill_type === BillType.BOTH) {
        result.notary_total += totalValue;
        result.secretariat_total += totalValue;
      }
    }

    const vatStats = (await this.billRepository
      .createQueryBuilder('bill')
      .select('SUM(bill.notary_vat)', 'vat')
      .where('bill.business_id = :businessId', { businessId })
      .andWhere('DATE(bill.created_at) = :targetDate', { targetDate })
      .andWhere('bill.status = :status', { status: BillStatus.PAID })
      .getRawOne()) as VatStatsRawResult;

    result.vat_collected = parseInt(vatStats?.vat || '0', 10);

    for (const stat of stats) {
      const count = parseInt(stat.count, 10);
      const amount = parseInt(stat.total_amount || '0', 10);

      result.total.count += count;
      result.total.amount += amount;

      switch (stat.status) {
        case BillStatus.PENDING:
          result.pending = { count, amount };
          break;
        case BillStatus.PAID:
          result.paid = { count, amount };
          break;
        case BillStatus.SERVED:
          result.served = { count, amount };
          break;
        case BillStatus.REJECTED:
          result.rejected = { count, amount };
          break;
        case BillStatus.REFUNDED:
          result.refunded = { count, amount };
          break;
        case BillStatus.CANCELLED:
          result.cancelled = { count, amount };
          break;
        default:
          break;
      }
    }

    return result;
  }
}
