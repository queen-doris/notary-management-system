/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, Brackets, DataSource, IsNull } from 'typeorm';
import { Client } from '../../shared/entities/client.entity';
import { Business } from '../../shared/entities/business.entity';
import { User } from '../../shared/entities/user.entity';
import { Bill } from '../../shared/entities/bill.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { SearchClientDto } from './dto/search-client.dto';
import { ClientResponseDto, BillSummaryDto } from './dto/client-response.dto';
import { VerificationStatus } from '../../shared/enums/client.enum';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';
import { EUserRole } from 'src/shared/enums/user-role.enum';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    private dataSource: DataSource,
  ) {}

  /**
   * Create a new client
   */
  async createClient(
    businessId: string,
    userId: string,
    dto: CreateClientDto,
  ): Promise<ClientResponseDto> {
    // Check if business exists and is active
    const business = await this.businessRepository.findOne({
      where: { id: businessId, isActive: true },
    });
    if (!business) {
      throw new NotFoundException('Business not found or inactive');
    }

    // Check if client with same ID number already exists in this business
    const existingClient = await this.clientRepository.findOne({
      where: { id_number: dto.id_number, business: { id: businessId } },
    });
    if (existingClient) {
      throw new ConflictException(
        `Client with ID number ${dto.id_number} already exists`,
      );
    }

    // Check if client with same phone exists (if phone provided)
    if (dto.phone) {
      const existingPhone = await this.clientRepository.findOne({
        where: { phone: dto.phone, business: { id: businessId } },
      });
      if (existingPhone) {
        throw new ConflictException(
          `Client with phone number ${dto.phone} already exists`,
        );
      }
    }

    // Create new client
    const client = this.clientRepository.create({
      full_name: dto.full_name,
      id_number: dto.id_number,
      phone: dto.phone,
      email: dto.email,
      father_name: dto.father_name,
      mother_name: dto.mother_name,
      province: dto.province,
      district: dto.district,
      sector: dto.sector,
      cell: dto.cell,
      village: dto.village,
      date_of_birth: dto.date_of_birth
        ? new Date(dto.date_of_birth)
        : undefined,
      marital_status: dto.marital_status,
      partner_name: dto.partner_name,
      upi: dto.upi,
      notes: dto.notes,
      business: { id: businessId },
      is_active: true,
      verification_status: VerificationStatus.PENDING,
    });

    await this.clientRepository.save(client);

    return this.formatClientResponse(client);
  }

  /**
   * Search clients by various criteria
   * Everyone except accountant can search
   */
  async searchClients(
    businessId: string,
    searchDto: SearchClientDto,
  ): Promise<{
    data: ClientResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      q,
      id_number,
      phone,
      full_name,
      verification_status,
      is_active,
      page = 1,
      limit = 10,
    } = searchDto;

    const query = this.clientRepository
      .createQueryBuilder('client')
      .where('client.business_id = :businessId', { businessId })
      .andWhere('client.deleted_at IS NULL');

    // Global search (by name or ID number)
    if (q) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('client.full_name ILIKE :search')
            .orWhere('client.id_number ILIKE :search')
            .orWhere('client.phone ILIKE :search');
        }),
        { search: `%${q}%` },
      );
    }

    // Specific filters
    if (id_number) {
      query.andWhere('client.id_number = :id_number', { id_number });
    }
    if (phone) {
      query.andWhere('client.phone = :phone', { phone });
    }
    if (full_name) {
      query.andWhere('client.full_name ILIKE :full_name', {
        full_name: `%${full_name}%`,
      });
    }
    if (verification_status) {
      query.andWhere('client.verification_status = :verification_status', {
        verification_status,
      });
    }
    if (is_active !== undefined) {
      query.andWhere('client.is_active = :is_active', { is_active });
    }

    // Pagination
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);
    query.orderBy('client.createdAt', 'DESC');

    const [data, total] = await query.getManyAndCount();

    // Get bill statistics for each client
    const formattedData = await Promise.all(
      data.map(async (client) => {
        const stats = await this.getClientBillStats(client.id, businessId);
        return this.formatClientResponse(client, stats);
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
   * Get client by ID
   */
  async getClientById(
    clientId: string,
    businessId: string,
  ): Promise<ClientResponseDto> {
    const client = await this.clientRepository.findOne({
      where: {
        id: clientId,
        business: { id: businessId },
        deleted_at: IsNull(),
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const stats = await this.getClientBillStats(clientId, businessId);
    return this.formatClientResponse(client, stats);
  }

  /**
   * Get client by ID number
   */
  async getClientByIdNumber(
    idNumber: string,
    businessId: string,
  ): Promise<ClientResponseDto> {
    const client = await this.clientRepository.findOne({
      where: {
        id_number: idNumber,
        business: { id: businessId },
        deleted_at: IsNull(),
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const stats = await this.getClientBillStats(client.id, businessId);
    return this.formatClientResponse(client, stats);
  }

  /**
   * Get client by phone number
   */
  async getClientByPhone(
    phone: string,
    businessId: string,
  ): Promise<ClientResponseDto> {
    const client = await this.clientRepository.findOne({
      where: { phone, business: { id: businessId }, deleted_at: IsNull() },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const stats = await this.getClientBillStats(client.id, businessId);
    return this.formatClientResponse(client, stats);
  }

  /**
   * Update client information
   * Only business owner, receptionist, or notary can update
   */
  async updateClient(
    clientId: string,
    businessId: string,
    userId: string,
    userRole: EBusinessRole,
    dto: UpdateClientDto,
  ): Promise<ClientResponseDto> {
    const allowedRoles = [
      EBusinessRole.OWNER,
      EBusinessRole.RECEPTIONIST,
      EBusinessRole.SECRETARIAT,
    ];

    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('Only authorized staff can verify clients');
    }

    const client = await this.clientRepository.findOne({
      where: {
        id: clientId,
        business: { id: businessId },
        deleted_at: IsNull(),
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // If updating ID number, check for duplicates
    if (dto.id_number && dto.id_number !== client.id_number) {
      const existing = await this.clientRepository.findOne({
        where: {
          id_number: dto.id_number,
          business: { id: businessId },
          deleted_at: IsNull(),
        },
      });
      if (existing) {
        throw new ConflictException(
          `Client with ID number ${dto.id_number} already exists`,
        );
      }
    }

    // If updating phone, check for duplicates
    if (dto.phone && dto.phone !== client.phone) {
      const existing = await this.clientRepository.findOne({
        where: { phone: dto.phone, business: { id: businessId } },
      });
      if (existing) {
        throw new ConflictException(
          `Client with phone number ${dto.phone} already exists`,
        );
      }
    }

    // If verification status is being set to verified
    if (
      dto.verification_status === VerificationStatus.VERIFIED &&
      !client.verified_at
    ) {
      client.verified_at = new Date();
      client.verified_by = userId;
    }

    // then apply user updates
    Object.assign(client, dto);

    // Update client
    Object.assign(client, dto);
    await this.clientRepository.save(client);

    const stats = await this.getClientBillStats(clientId, businessId);
    return this.formatClientResponse(client, stats);
  }

  /**
   * Verify client (mark as verified)
   * Only notary or business owner can verify
   */
  async verifyClient(
    clientId: string,
    businessId: string,
    userId: string,
    userRole: EBusinessRole,
    notes?: string,
  ): Promise<ClientResponseDto> {
    // 3. Find client safely (with soft delete protection)
    const client = await this.clientRepository.findOne({
      where: {
        id: clientId,
        business: { id: businessId },
        deleted_at: IsNull(),
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // 4. Prevent unnecessary overwriting if already verified
    if (client.verification_status === VerificationStatus.VERIFIED) {
      throw new BadRequestException('Client is already verified');
    }

    // 5. Apply verification
    client.verification_status = VerificationStatus.VERIFIED;
    client.verified_at = new Date();
    client.verified_by = userId;

    if (notes?.trim()) {
      client.verification_notes = notes.trim();
    }

    // 6. Save
    await this.clientRepository.save(client);

    // 7. Return enriched response
    const stats = await this.getClientBillStats(clientId, businessId);
    return this.formatClientResponse(client, stats);
  }

  /**
   * Deactivate client (soft delete)
   */
  async deactivateClient(
    clientId: string,
    businessId: string,
    userRole: EBusinessRole,
  ): Promise<{ message: string }> {
    const client = await this.clientRepository.findOne({
      where: { id: clientId, business: { id: businessId } },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    client.is_active = false;
    client.deleted_at = new Date();
    await this.clientRepository.save(client);

    return { message: 'Client deactivated successfully' };
  }

  /**
   * Reactivate client
   */
  //   async reactivateClient(
  //     clientId: string,
  //     businessId: string,
  //     userRole: string,
  //   ): Promise<ClientResponseDto> {
  //     const allowedRoles = ['business_owner', 'notary'];
  //     if (!allowedRoles.includes(userRole)) {
  //       throw new ForbiddenException(
  //         'Only business owner or notary can reactivate clients',
  //       );
  //     }

  //     const client = await this.clientRepository.findOne({
  //       where: { id: clientId, business_id: businessId },
  //     });

  //     if (!client) {
  //       throw new NotFoundException('Client not found');
  //     }

  //     client.is_active = true;
  //     client.deleted_at = null;
  //     await this.clientRepository.save(client);

  //     const stats = await this.getClientBillStats(clientId, businessId);
  //     return this.formatClientResponse(client, stats);
  //   }

  /**
   * Get client's bill statistics
   */
  async getClientBillStats(
    clientId: string,
    businessId: string,
  ): Promise<{
    total_bills: number;
    total_spent: number;
    recent_bills: BillSummaryDto[];
  }> {
    const bills = await this.billRepository.find({
      where: { id: clientId, business: { id: businessId } },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const total_bills = bills.length;
    const total_spent = bills.reduce((sum, bill) => sum + bill.grand_total, 0);

    const recent_bills = bills.map((bill) => ({
      id: bill.id,
      bill_number: bill.bill_number,
      total_amount: bill.grand_total,
      status: bill.status,
      created_at: bill.createdAt,
    }));

    return { total_bills, total_spent, recent_bills };
  }

  /**
   * Format client response
   */
  private formatClientResponse(
    client: Client,
    stats?: {
      total_bills: number;
      total_spent: number;
      recent_bills: BillSummaryDto[];
    },
  ): ClientResponseDto {
    return {
      id: client.id,
      full_name: client.full_name,
      id_number: client.id_number,
      phone: client.phone,
      email: client.email,
      father_name: client.father_name,
      mother_name: client.mother_name,
      province: client.province,
      district: client.district,
      sector: client.sector,
      cell: client.cell,
      village: client.village,
      date_of_birth: client.date_of_birth,
      marital_status: client.marital_status,
      partner_name: client.partner_name,
      upi: client.upi,
      verification_status: client.verification_status,
      verification_notes: client.verification_notes,
      verified_at: client.verified_at,
      is_active: client.is_active,
      notes: client.notes,
      created_at: client.createdAt,
      updated_at: client.updatedAt,
      total_bills: stats?.total_bills || 0,
      total_spent: stats?.total_spent || 0,
      recent_bills: stats?.recent_bills || [],
    };
  }

  /**
   * Get client count by verification status
   */
  async getClientStats(businessId: string): Promise<{
    total: number;
    verified: number;
    pending: number;
    unverified: number;
    active: number;
    inactive: number;
  }> {
    const total = await this.clientRepository.count({
      where: { business: { id: businessId }, deleted_at: IsNull() },
    });

    const verified = await this.clientRepository.count({
      where: {
        business: { id: businessId },
        verification_status: VerificationStatus.VERIFIED,
        deleted_at: IsNull(),
      },
    });

    const pending = await this.clientRepository.count({
      where: {
        business: { id: businessId },
        verification_status: VerificationStatus.PENDING,
        deleted_at: IsNull(),
      },
    });

    const unverified = await this.clientRepository.count({
      where: {
        business: { id: businessId },
        verification_status: VerificationStatus.UNVERIFIED,
        deleted_at: IsNull(),
      },
    });

    const active = await this.clientRepository.count({
      where: {
        business: { id: businessId },
        is_active: true,
        deleted_at: IsNull(),
      },
    });

    const inactive = await this.clientRepository.count({
      where: {
        business: { id: businessId },
        is_active: false,
        deleted_at: IsNull(),
      },
    });

    return { total, verified, pending, unverified, active, inactive };
  }
}
