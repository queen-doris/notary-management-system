/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EWorkingDays } from 'src/shared/enums/working-days.enum';
import { BusinessHoursUtil } from 'src/common/utils/business-hours.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Business } from 'src/shared/entities/business.entity';
import { Repository } from 'typeorm';
import { BusinessPaginationDto } from './dto/business-pagination.dto';
import { BusinessUserService } from '../business-user/business-user.service';
import { BusinessUser } from 'src/shared/entities/business-user.entity';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { User } from 'src/shared/entities/user.entity';
import { EUserStatus } from 'src/shared/enums/user-status.enum';
import { EEmploymentStatus } from 'src/shared/enums/employee-status.enum';
import { PutOnLeaveDTO } from './dto/put-on-leave.dto';
import { EmployeeLeave } from 'src/shared/entities/employee-leave.entity';
import { BusinessQueryDto } from './dto/business-query.dto';
import { BooksService } from '../books/books.service';
import { NotaryServiceService } from '../notary-service/notary-service.service';
import { SecretariatServiceService } from '../secretariat-service/secretariat-service.service';

type RegisterBusinessDto = Partial<Business> & {
  businessRegistrationNumber: string;
  tinNumber: string;
  workingDays?: EWorkingDays[];
  timezone?: string;
  healthPermitExpiry?: string | Date;
};

type UpdateBusinessDto = Partial<Business>;

@Injectable()
export class BusinessService {
  @InjectRepository(Business)
  businessRepository: Repository<Business>;
  @InjectRepository(User)
  userRepository: Repository<User>;
  @InjectRepository(EmployeeLeave)
  leaveRepository: Repository<EmployeeLeave>;
  @InjectRepository(BusinessUser)
  businessUserRepository: Repository<BusinessUser>;

  constructor(
    private readonly businessUserService: BusinessUserService,
    @Inject(forwardRef(() => BooksService))
    private readonly booksService: BooksService,
    @Inject(forwardRef(() => NotaryServiceService))
    private readonly notaryServiceService: NotaryServiceService,
    @Inject(forwardRef(() => SecretariatServiceService))
    private readonly secretariatServiceService: SecretariatServiceService,
  ) {}

  async registerBusiness(
    userId: string,
    dto: RegisterBusinessDto,
  ): Promise<IResponse> {
    const owner = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    // Check for duplicate business registration number or TIN
    const existingBusiness = await this.businessRepository.findOne({
      where: [
        { businessRegistrationNumber: dto.businessRegistrationNumber },
        { tinNumber: dto.tinNumber },
      ],
    });

    if (existingBusiness) {
      throw new ConflictException(
        'A business with this registration number or TIN already exists',
      );
    }

    // Create business
    const business = this.businessRepository.create({
      ...dto,
      ownerUserId: owner.id,
      ownerUser: owner,
      workingDays: dto.workingDays?.length
        ? dto.workingDays
        : Object.values(EWorkingDays),
      timezone: dto.timezone || 'Africa/Kigali',
      healthPermitExpiry: dto.healthPermitExpiry
        ? new Date(dto.healthPermitExpiry)
        : undefined,
      isActive: true,
      isVerified: false, // Will need admin verification
    });

    const savedBusiness = await this.businessRepository.save(business);

    await this.businessUserService.createMembership({
      userId: owner.id,
      businessId: savedBusiness.id,
      roles: [EBusinessRole.OWNER],
    });

    await this.booksService.initializeBusinessBooks(savedBusiness.id);
    // Initialize notary services (with all sub-services)
    await this.notaryServiceService.initializeDefaultServices(savedBusiness.id);
    // Initialize secretariat services only if this business offers them
    if (savedBusiness.has_secretariat) {
      await this.secretariatServiceService.initializeDefaultServices(
        savedBusiness.id,
      );
    }

    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: '/business/register-business',
      data: {
        business: {
          id: savedBusiness.id,
          businessName: savedBusiness.businessName,
          businessType: savedBusiness.businessType,
          businessRegistrationNumber: savedBusiness.businessRegistrationNumber,
          email: savedBusiness.email,
          isActive: savedBusiness.isActive,
          isVerified: savedBusiness.isVerified,
          has_secretariat: savedBusiness.has_secretariat,
        },
        businessOwner: {
          id: owner.id,
          isBusinessRegistered: true,
        },
      },
      message: 'Business registered successfully. Awaiting admin verification.',
    };
  }

  // Update business (only businesses owned by the authenticated owner)
  async updateBusiness(
    ownerId: string,
    businessId: string,
    dto: UpdateBusinessDto,
  ) {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ['ownerUser'],
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.ownerUserId !== ownerId) {
      throw new ForbiddenException('You can only update your own businesses');
    }

    // Check for conflicts if updating unique fields
    if (dto.email || dto.phone) {
      const conflictConditions: Array<{ email?: string; phone?: string }> = [];

      if (dto.email && dto.email !== business.email) {
        conflictConditions.push({ email: dto.email });
      }
      if (dto.phone && dto.phone !== business.phone) {
        conflictConditions.push({ phone: dto.phone });
      }

      if (conflictConditions.length > 0) {
        const existingBusiness = await this.businessRepository
          .createQueryBuilder('business')
          .where(conflictConditions)
          .andWhere('business.id != :businessId', { businessId })
          .getOne();

        if (existingBusiness) {
          throw new ConflictException(
            'Another business already exists with the provided email or phone',
          );
        }
      }
    }

    // Update business fields
    Object.assign(business, dto);

    const updatedBusiness = await this.businessRepository.save(business);

    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: `/business/my-businesses/${businessId}`,
      data: {
        business: {
          id: updatedBusiness.id,
          businessName: updatedBusiness.businessName,
          businessType: updatedBusiness.businessType,
          email: updatedBusiness.email,
          phone: updatedBusiness.phone,
          address: updatedBusiness.address,
          website: updatedBusiness.website,
          isActive: updatedBusiness.isActive,
          isVerified: updatedBusiness.isVerified,
          updatedAt: updatedBusiness.updatedAt,
        },
      },
      message: 'Business updated successfully',
    };
  }

  // Get business statistics for the authenticated owner
  async getMyBusinessStatistics(ownerId: string) {
    const businesses = await this.businessRepository.find({
      where: { ownerUserId: ownerId },
    });

    if (!businesses || businesses.length === 0) {
      throw new NotFoundException('Business owner not found');
    }

    const totalBusinesses = businesses.length;
    const activeBusinesses = businesses.filter((b) => b.isActive).length;
    const verifiedBusinesses = businesses.filter((b) => b.isVerified).length;
    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: '/business/my-statistics',
      data: {
        statistics: {
          totalBusinesses,
          activeBusinesses,
          verifiedBusinesses,
          inactiveBusinesses: totalBusinesses - activeBusinesses,
          unverifiedBusinesses: totalBusinesses - verifiedBusinesses,
        },
        businessBreakdown: await Promise.all(
          businesses.map(async (business) => {
            return {
              id: business.id,
              businessName: business.businessName,
              businessType: business.businessType,
              isActive: business.isActive,
              isVerified: business.isVerified,
            };
          }),
        ),
      },
      message: 'Business statistics retrieved successfully',
    };
  }

  async getBusinessById(ownerId: string, businessId: string) {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ['ownerUser', 'paymentMethods', 'subscriptions'],
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.ownerUserId !== ownerId) {
      throw new ForbiddenException('You can only view your own businesses');
    }

    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: `/business/my-businesses/${businessId}`,
      data: { business },
      message: 'Business retrieved successfully',
    };
  }

  async byId(businessId: string) {
    const business: Business | null = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ['ownerUser', 'paymentMethods', 'subscriptions'],
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const owner = business.ownerUser ? { user: business.ownerUser } : undefined;

    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: `/by-id/${businessId}`,
      data: { business, owner },
      message: 'Business retrieved successfully',
    };
  }

  /**
   * Soft delete business (deactivate)
   */
  async deactivateBusiness(ownerId: string, businessId: string) {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ['ownerUser'],
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    business.isActive = false;
    if (business.ownerUser) {
      business.ownerUser.status = EUserStatus.SUSPENDED;
      await this.userRepository.save(business.ownerUser);
    }
    await this.businessRepository.save(business);

    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: `/business/my-businesses/${businessId}/deactivate`,
      data: { businessId, isActive: false },
      message: 'Business deactivated successfully',
    };
  }

  /**
   * Reactivate business
   */
  async reactivateBusiness(ownerId: string, businessId: string) {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ['ownerUser'],
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    business.isActive = true;
    if (business.ownerUser) {
      business.ownerUser.status = EUserStatus.ACTIVE;
      await this.userRepository.save(business.ownerUser);
    }
    await this.businessRepository.save(business);

    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: `/business/my-businesses/${businessId}/reactivate`,
      data: { businessId, isActive: true },
      message: 'Business reactivated successfully',
    };
  }

  // ==================== BUSINESS HOURS & SCHEDULE ====================

  /**
   * Update business hours and working days
   */
  async updateBusinessHours(
    ownerId: string,
    businessId: string,
    hoursData: {
      openingTime?: string;
      closingTime?: string;
      workingDays?: EWorkingDays[];
      is24Hours?: boolean;
      timezone?: string;
    },
  ) {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ['ownerUser'],
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.ownerUserId !== ownerId) {
      throw new ForbiddenException(
        'You can only update your own business hours',
      );
    }

    Object.assign(business, {
      ...hoursData,
      workingDays: hoursData.workingDays?.length
        ? hoursData.workingDays
        : business.workingDays,
      timezone: hoursData?.timezone || business.timezone || 'Africa/Kigali',
    });
    await this.businessRepository.save(business);

    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: `/business/my-businesses/${businessId}/hours`,
      data: {
        openingTime: business.openingTime,
        closingTime: business.closingTime,
        is24Hours: business.is24Hours,
      },
      message: 'Business hours updated successfully',
    };
  }

  /**
   * Check if business is currently open
   */
  async isBusinessOpen(businessId: string) {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const status = BusinessHoursUtil.evaluateStatus(business);

    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: `/business/${businessId}/status`,
      data: {
        isOpen: status.isOpen && business.isActive,
        effectiveDay: status.effectiveDay,
        nextOpenAt: status.nextOpenAt,
        currentTime: status.nowLocal.toISOString(),
        workingDays: business.workingDays,
        openingTime: business.openingTime,
        closingTime: business.closingTime,
        is24Hours: business.is24Hours,
        timezone: business.timezone,
      },
      message: 'Business status retrieved successfully',
    };
  }

  // ==================== BUSINESS SEARCH & FILTERING ====================

  /**
   * Search businesses by various criteria (public endpoint)
   */
  async getAllBusinesses(filters: BusinessQueryDto) {
    const queryBuilder = this.businessRepository
      .createQueryBuilder('business')
      .leftJoinAndSelect('business.ownerUser', 'ownerUser');

    // isActive filter: default to true for public, allow false/null for admin
    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('business.isActive = :isActive', {
        isActive: filters.isActive,
      });
    } else {
      // Default to active businesses for public search
      queryBuilder.andWhere('business.isActive = :isActive', {
        isActive: true,
      });
    }

    if (filters.businessName) {
      queryBuilder.andWhere('business.businessName ILIKE :businessName', {
        businessName: `%${filters.businessName}%`,
      });
    }

    if (filters.businessType) {
      queryBuilder.andWhere('business.businessType = :businessType', {
        businessType: filters.businessType,
      });
    }

    if (filters.province) {
      queryBuilder.andWhere('business.province = :province', {
        province: filters.province,
      });
    }

    if (filters.district) {
      queryBuilder.andWhere('business.district = :district', {
        district: filters.district,
      });
    }

    if (filters.sector) {
      queryBuilder.andWhere('business.sector = :sector', {
        sector: filters.sector,
      });
    }

    if (filters.isVerified !== undefined) {
      queryBuilder.andWhere('business.isVerified = :isVerified', {
        isVerified: filters.isVerified,
      });
    }

    if (filters.services && filters.services.length > 0) {
      queryBuilder.andWhere('business.services && :services', {
        services: filters.services,
      });
    }

    // Support both page/limit and offset/limit pagination
    let limit: number;
    let offset: number;
    let currentPage: number;

    if (filters.page !== undefined) {
      // Use page/limit pagination
      limit = filters.limit || 10;
      currentPage = filters.page;
      offset = (currentPage - 1) * limit;
    } else {
      // Use offset/limit pagination (backward compatibility)
      limit = filters.limit || 20;
      offset = filters.offset || 0;
      currentPage = Math.floor(offset / limit) + 1;
    }

    const [businesses, total] = await queryBuilder
      .orderBy('business.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    const hasNext = currentPage < totalPages;
    const hasPrev = currentPage > 1;

    // Return full objects if includeRelations, otherwise simplified
    const businessData = filters.includeRelations
      ? businesses
      : businesses.map((business) => ({
          id: business.id,
          businessName: business.businessName,
          businessType: business.businessType,
          province: business.province,
          district: business.district,
          sector: business.sector,
          email: business.email,
          phone: business.phone,
          website: business.website,
          logoUrl: business.logoUrl,
          description: business.description,
          services: business.services,
          openingTime: business.openingTime,
          closingTime: business.closingTime,
          is24Hours: business.is24Hours,
          isVerified: business.isVerified,
        }));

    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: '/business/search',
      data: {
        businesses: businessData,
        pagination: {
          total,
          limit,
          offset,
          page: currentPage,
          totalPages,
          currentPage,
          hasNext,
          hasPrev,
          nextPage: hasNext ? currentPage + 1 : null,
          prevPage: hasPrev ? currentPage - 1 : null,
        },
      },
      message: 'Businesses retrieved successfully',
    };
  }

  // ==================== LOCATION & CONTACT ====================

  /**
   * Update business location
   */
  async updateBusinessLocation(
    ownerId: string,
    businessId: string,
    locationData: {
      province?: string;
      district?: string;
      sector?: string;
      cell?: string;
      village?: string;
      address?: string;
    },
  ) {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ['ownerUser'],
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.ownerUserId !== ownerId) {
      throw new ForbiddenException(
        'You can only update your own business location',
      );
    }

    Object.assign(business, locationData);
    await this.businessRepository.save(business);

    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: `/business/my-businesses/${businessId}/location`,
      data: {
        province: business.province,
        district: business.district,
        sector: business.sector,
        cell: business.cell,
        village: business.village,
        address: business.address,
      },
      message: 'Business location updated successfully',
    };
  }

  async getBusinessAnalytics(
    ownerId: string,
    businessId: string,
    dateRange?: {
      startDate: Date;
      endDate: Date;
    },
  ) {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ['ownerUser', 'subscriptions'],
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.ownerUserId !== ownerId) {
      throw new ForbiddenException(
        'You can only view analytics for your own businesses',
      );
    }

    // Calculate various metric
    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: `/business/my-businesses/${businessId}/analytics`,
      data: {
        businessOverview: {
          businessName: business.businessName,
          businessType: business.businessType,
          isActive: business.isActive,
          isVerified: business.isVerified,
          createdAt: business.createdAt,
          daysActive: Math.floor(
            (new Date().getTime() - business.createdAt.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        },
        staffMetrics: {
          totalEmployees: business.numberOfEmployees || 0,
        },
      },
      message: 'Business analytics retrieved successfully',
    };
  }

  // Get business statistics for admin dashboard
  getBusinessStatistics = async (): Promise<any> => {
    try {
      const [
        totalBusinesses,
        activeBusinesses,
        inactiveBusinesses,
        verifiedBusinesses,
        unverifiedBusinesses,
      ] = await Promise.all([
        this.businessRepository.count(),
        this.businessRepository.count({ where: { isActive: true } }),
        this.businessRepository.count({ where: { isActive: false } }),
        this.businessRepository.count({ where: { isVerified: true } }),
        this.businessRepository.count({ where: { isVerified: false } }),
      ]);

      return {
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
        path: '/business/statistics',
        data: {
          statistics: {
            totalBusinesses,
            activeBusinesses,
            inactiveBusinesses,
            verifiedBusinesses,
            unverifiedBusinesses,
          },
        },
        message: 'Business statistics retrieved successfully',
      };
    } catch (error) {
      return {
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        path: '/business/statistics',
        data: null,
        message: error.message || 'Failed to retrieve business statistics',
      };
    }
  };

  // Get all businesses for admin with full access to status fields
  getAdminBusinesses = async (
    paginationDto: BusinessPaginationDto,
  ): Promise<any> => {
    try {
      const { page, limit } = paginationDto;
      const skip = (page! - 1) * limit!;

      // Get businesses with pagination and owner information
      const [businesses, total] = await this.businessRepository.findAndCount({
        relations: ['ownerUser', 'paymentMethods', 'stock'],
        skip,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      // Return admin-safe businesses with status information
      const adminSafeBusinesses = businesses.map((business) => ({
        id: business.id,
        businessName: business.businessName,
        businessType: business.businessType,
        email: business.email,
        phone: business.phone,
        website: business.website,
        logoUrl: business.logoUrl,
        province: business.province,
        district: business.district,
        sector: business.sector,
        cell: business.cell,
        address: business.address,
        description: business.description,
        services: business.services,
        openingTime: business.openingTime,
        closingTime: business.closingTime,
        is24Hours: business.is24Hours,
        // Admin-specific status fields
        isActive: business.isActive,
        isVerified: business.isVerified,
        // Owner information
        owner: business.ownerUser
          ? {
              id: business.ownerUser.id,
              fullNames: business.ownerUser.fullNames,
              email: business.ownerUser.email,
              phone: business.ownerUser.phone,
              isVerified: business.ownerUser.isVerified,
              status: business.ownerUser.status,
            }
          : null,
        createdAt: business.createdAt,
        updatedAt: business.updatedAt,
      }));

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit!);
      const hasNext = page! < totalPages;
      const hasPrev = page! > 1;

      return {
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
        path: '/business/admin/businesses',
        data: {
          businesses: adminSafeBusinesses,
          pagination: {
            currentPage: page,
            itemsPerPage: limit,
            totalItems: total,
            totalPages,
            hasNext,
            hasPrev,
            nextPage: hasNext ? page! + 1 : null,
            prevPage: hasPrev ? page! - 1 : null,
          },
        },
        message: 'Admin businesses retrieved successfully',
      };
    } catch (error) {
      return {
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        path: '/business/admin/businesses',
        data: null,
        message: error.message || 'Failed to retrieve admin businesses',
      };
    }
  };

  getBusinessWorkersP = async (
    userId: string,
    page: number = 1,
    limit: number = 10,
    role?: string,
  ): Promise<IResponse> => {
    try {
      return await this.getBusinessWorkersPInner(userId, page, limit, role);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      const e = err as Error;
      throw new InternalServerErrorException(
        `Failed to retrieve business workers: ${e?.message ?? 'unknown error'}`,
      );
    }
  };

  private getBusinessWorkersPInner = async (
    userId: string,
    page: number = 1,
    limit: number = 10,
    role?: string,
  ): Promise<IResponse> => {
    const business = await this.resolvePrimaryBusiness(userId);
    const skip = (page - 1) * limit;

    const roleMap: Array<{ key: string; role: EBusinessRole }> = [
      { key: 'secretariats', role: EBusinessRole.SECRETARIAT },
      { key: 'Accountants', role: EBusinessRole.ACCOUNTANT },
      { key: 'Receptionists', role: EBusinessRole.RECEPTIONIST },
    ];

    const filteredRoles = role
      ? roleMap.filter(
          (r) => r.role === role || r.key === role.replace(' ', '_'),
        )
      : roleMap;

    // Load all members for the business once, then group/paginate in
    // memory. Staff lists are small, and this avoids fragile raw
    // `= ANY(enum[])` SQL that errors on enum-array columns.
    const allMembers = await this.businessUserRepository.find({
      where: { businessId: business.id },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    const results = filteredRoles.map(({ key, role }) => {
      const matching = allMembers.filter((m) => (m.roles || []).includes(role));
      const total = matching.length;
      const data = matching
        .slice(skip, skip + limit)
        .map((m) => this.sanitizeMember(m));
      return {
        key,
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      };
    });

    const result = results.reduce<Record<string, unknown>>((acc, entry) => {
      acc[entry.key] = {
        data: entry.data,
        pagination: entry.pagination,
      };
      return acc;
    }, {});

    return {
      status: 'SUCCESS',
      data: result,
      path: '',
      timestamp: new Date().toISOString(),
    };
  };

  getBusinessWorkers = async (userId): Promise<IResponse> => {
    const business = await this.resolvePrimaryBusiness(userId);
    const members = await this.businessUserService.getBusinessUsers(
      business.id,
    );

    const groupByRole = (role: EBusinessRole) =>
      members
        .filter((m) => m.roles.includes(role))
        .map((m) => this.sanitizeMember(m));

    const ob: Record<string, unknown> = {};
    ob['secretariat'] = groupByRole(EBusinessRole.SECRETARIAT);
    const accountants = groupByRole(EBusinessRole.ACCOUNTANT);
    ob['accountants'] = accountants.length > 0 ? accountants[0] : null;
    ob['receptionists'] = groupByRole(EBusinessRole.RECEPTIONIST);

    return {
      status: 'SUCCESS',
      data: ob,
      path: '',
      timestamp: new Date().toISOString(),
    };
  };

  fire = async (userId: string, workerId: string): Promise<IResponse> => {
    return this.updateEmploymentStatus(
      userId,
      workerId,
      EEmploymentStatus.TERMINATED,
      'terminated',
    );
  };

  putOnLeave = async (
    userId: string,
    workerId: string,
    dto: PutOnLeaveDTO,
  ): Promise<IResponse> => {
    // Get workers to find the target worker and check for self-leave
    const workers = (await this.getBusinessWorkers(userId)).data;

    // Search for the worker in all categories
    let foundWorker: any = null;
    let workerType: string = '';

    // Check each worker category
    const categories = [
      'waiters',
      'general_managers',
      'chefs',
      'accountants',
      'stock_managers',
      'bartenders',
    ];

    for (const category of categories) {
      const workerList = workers[category];
      if (Array.isArray(workerList)) {
        foundWorker = workerList.find(
          (worker) => worker.id === workerId || worker.user?.id === workerId,
        );
      } else if (
        workerList &&
        (workerList.id === workerId || workerList.user?.id === workerId)
      ) {
        foundWorker = workerList;
      }

      if (foundWorker) {
        workerType = category;
        break;
      }
    }

    if (!foundWorker) {
      throw new NotFoundException(
        `Worker with ID ${workerId} not found in your business.`,
      );
    }

    // Prevent self-leave - check if the worker's user ID matches the current user's ID
    const workerUserId =
      foundWorker.userId || foundWorker.user?.id || dto.userId;
    if (workerUserId === userId) {
      throw new BadRequestException('You cannot give yourself leave');
    }

    // create a leave
    const leave: EmployeeLeave = new EmployeeLeave();
    const user: User | null = await this.userRepository.findOne({
      where: { id: dto.userId },
      relations: ['leaves'],
    });

    if (!user) throw new NotFoundException(`User ${dto.userId} not found.`);
    leave.user = user;
    leave.leaveEndDate = dto.leaveEndDate!;
    leave.leaveStartDate = dto.leaveStartDate!;
    leave.reason = dto.reason;
    const sl = await this.leaveRepository.save(leave);
    if (!user.leaves) {
      user.leaves = [];
    }
    user.leaves.push(leave);
    await this.userRepository.save(user);
    return this.updateEmploymentStatus(
      userId,
      workerId,
      EEmploymentStatus.ON_LEAVE,
      'put on leave',
      dto,
    );
  };

  getUsersLeaves = async (userId: string) => {
    return await this.leaveRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  };

  private updateEmploymentStatus = async (
    userId: string,
    workerId: string,
    newStatus: EEmploymentStatus,
    action: string,
    dto?: PutOnLeaveDTO,
  ): Promise<IResponse> => {
    const business = await this.resolvePrimaryBusiness(userId);
    const foundWorker = await this.businessUserRepository.findOne({
      where: [
        { id: workerId, businessId: business.id },
        { userId: workerId, businessId: business.id },
      ],
      relations: ['user'],
    });

    if (!foundWorker) {
      throw new NotFoundException(
        `Worker with ID ${workerId} not found in your business.`,
      );
    }

    // Check if worker is already in the target status
    if (foundWorker.employmentStatus === newStatus) {
      throw new BadRequestException(`Worker ${workerId} is already ${action}.`);
    }

    // Validate status transitions
    if (
      newStatus === EEmploymentStatus.TERMINATED &&
      foundWorker.employmentStatus !== EEmploymentStatus.ACTIVE
    ) {
      throw new BadRequestException(
        `Only active workers can be terminated. Current status: ${foundWorker.employmentStatus}`,
      );
    }

    if (
      newStatus === EEmploymentStatus.ON_LEAVE &&
      foundWorker.employmentStatus !== EEmploymentStatus.ACTIVE
    ) {
      throw new BadRequestException(
        `Only active workers can be put on leave. Current status: ${foundWorker.employmentStatus}`,
      );
    }

    // Update employment status
    foundWorker.employmentStatus = newStatus;

    const f = await this.businessUserRepository.save(foundWorker);
    const user: User | null = await this.userRepository.findOne({
      where: { id: f.userId },
    });

    if (!user) throw new NotFoundException(`User ${f.userId} not found.`);

    if (
      newStatus == EEmploymentStatus.ACTIVE ||
      newStatus == EEmploymentStatus.ON_LEAVE
    ) {
      user.status = EUserStatus.ACTIVE;
    } else {
      user.status = EUserStatus.SUSPENDED;
    }
    const nu = await this.userRepository.save(user);

    const actionMessage =
      newStatus === EEmploymentStatus.TERMINATED
        ? 'terminated'
        : 'put on leave';
    f.user = nu;

    return {
      status: 'SUCCESS',
      message: `Worker ${workerId} has been successfully ${actionMessage}.`,
      data: f,
      path: '',
      timestamp: new Date().toISOString(),
    };
  };

  reactivate = async (userId: string, workerId: string): Promise<IResponse> => {
    return this.updateEmploymentStatus(
      userId,
      workerId,
      EEmploymentStatus.ACTIVE,
      'reactivated',
    );
  };

  suspend = async (userId: string, workerId: string): Promise<IResponse> => {
    return this.updateEmploymentStatus(
      userId,
      workerId,
      EEmploymentStatus.SUSPENDED,
      'suspended',
    );
  };

  deactivate = async (userId: string, workerId: string): Promise<IResponse> => {
    const business = await this.resolvePrimaryBusiness(userId);
    const foundWorker = await this.businessUserRepository.findOne({
      where: [
        { id: workerId, businessId: business.id },
        { userId: workerId, businessId: business.id },
      ],
      relations: ['user'],
    });

    if (!foundWorker) {
      throw new NotFoundException(
        `Worker with ID ${workerId} not found in your business.`,
      );
    }

    const workerUserId = foundWorker.userId || foundWorker.user?.id;
    if (workerUserId === userId) {
      throw new BadRequestException('You cannot deactivate yourself');
    }

    foundWorker.employmentStatus = EEmploymentStatus.TERMINATED;

    const savedWorker = await this.businessUserRepository.save(foundWorker);

    const user: User | null = await this.userRepository.findOne({
      where: { id: savedWorker.userId },
    });

    if (!user) {
      throw new NotFoundException(`User ${savedWorker.userId} not found.`);
    }

    user.status = EUserStatus.INACTIVE;
    const savedUser = await this.userRepository.save(user);

    savedWorker.user = savedUser;

    return {
      status: 'SUCCESS',
      message: `Worker ${workerId} has been successfully deactivated. They will no longer be able to access the system.`,
      data: savedWorker,
      path: '',
      timestamp: new Date().toISOString(),
    };
  };

  getWorkerById = async (userId: string): Promise<IResponse> => {
    const user: User | null = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException(`User ${userId} not found.`);
    const membership = await this.businessUserRepository.findOne({
      where: { userId: userId },
      relations: ['user', 'business'],
    });

    if (!membership) {
      throw new NotFoundException(
        `Worker with user ID ${userId} not found in your business.`,
      );
    }

    return {
      status: 'SUCCESS',
      data: this.sanitizeMember(membership),
      path: '',
      timestamp: new Date().toISOString(),
    };
  };

  /**
   * Get subscription summary (admin only)
   * Returns total revenue, active subscriptions count, and recent transactions
   */

  /**
   * Strip sensitive fields (notably user.password) from a BusinessUser
   * before it leaves the service. Keeps `userId`/`user.id` so callers that
   * resolve workers by id (e.g. putOnLeave) keep working.
   */
  private sanitizeMember(m: BusinessUser | null | undefined) {
    if (!m) return m;
    const u = m.user;
    return {
      id: m.id,
      userId: m.userId,
      businessId: m.businessId,
      roles: m.roles,
      staffCode: m.staffCode,
      employmentStatus: m.employmentStatus,
      hireDate: m.hireDate,
      jobTitle: m.jobTitle,
      salary: m.salary,
      isClockedIn: m.isClockedIn,
      lastClockInAt: m.lastClockInAt,
      lastClockOutAt: m.lastClockOutAt,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      user: u
        ? {
            id: u.id,
            fullNames: u.fullNames,
            email: u.email,
            phone: u.phone,
            isVerified: u.isVerified,
            role: u.role,
            status: u.status,
          }
        : u,
    };
  }

  private async resolvePrimaryBusiness(userId: string): Promise<Business> {
    const user: User | null = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException(`User ${userId} not found.`);

    const memberships = await this.businessUserRepository.find({
      where: { userId },
      relations: ['business'],
      order: { createdAt: 'ASC' },
    });

    const membership = memberships.find((m) =>
      m.roles.includes(EBusinessRole.OWNER),
    );

    if (!membership || !membership.business) {
      throw new UnauthorizedException(
        'You are not authorized to access this resource.',
      );
    }

    return membership.business;
  }
}
