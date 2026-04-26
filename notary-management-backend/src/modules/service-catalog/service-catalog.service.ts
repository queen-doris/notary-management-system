/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCatalog } from '../../shared/entities/service-catalog.entity';
import { BookType } from '../../shared/enums/book-type.enum';
import { Business } from '../../shared/entities/business.entity';
import {
  CreateServiceCatalogDto,
  UpdateServiceCatalogDto,
} from './dto/create-service-catalog.dto';
import { EBusinessRole } from '../../shared/enums/business-role.enum';
import { EUserRole } from '../../shared/enums/user-role.enum';
import { ServiceCategory } from '../../shared/enums/service-category.enum';

@Injectable()
export class ServiceCatalogService {
  constructor(
    @InjectRepository(ServiceCatalog)
    private serviceCatalogRepository: Repository<ServiceCatalog>,
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
  ) {}

  /**
   * Get default service catalog data for a new business
   */
  getDefaultServices(businessId: string): Partial<ServiceCatalog>[] {
    return [
      // ========== LAND (UBUTAKA) Services ==========
      {
        category: ServiceCategory.LAND,
        sub_service: 'Ubugure',
        base_price: 6500,
        has_vat: true,
        book_type: BookType.LAND,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.LAND,
        sub_service: 'Impano',
        base_price: 6500,
        has_vat: true,
        book_type: BookType.LAND,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.LAND,
        sub_service: 'Igarana',
        base_price: 6500,
        has_vat: true,
        book_type: BookType.LAND,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.LAND,
        sub_service: 'Gutiza ingwate',
        base_price: 9100,
        has_vat: true,
        book_type: BookType.LAND,
        business_id: businessId,
        is_custom: false,
      },

      // ========== LEGALISATION Services ==========
      {
        category: ServiceCategory.LEGALISATION,
        sub_service: 'Amasezerano',
        base_price: 2600,
        has_vat: true,
        book_type: BookType.LEGALISATION,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.LEGALISATION,
        sub_service: 'Procuration',
        base_price: 2600,
        has_vat: true,
        book_type: BookType.LEGALISATION,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.LEGALISATION,
        sub_service: 'Indahiro',
        base_price: 2600,
        has_vat: true,
        book_type: BookType.LEGALISATION,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.LEGALISATION,
        sub_service: 'Statuts',
        base_price: 6500,
        has_vat: true,
        book_type: BookType.LEGALISATION,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.LEGALISATION,
        sub_service: 'Inyandiko mvugo',
        base_price: 2600,
        has_vat: true,
        book_type: BookType.LEGALISATION,
        business_id: businessId,
        is_custom: false,
      },

      // ========== ACTES Services ==========
      {
        category: ServiceCategory.ACTES,
        sub_service: 'Inguzanyo',
        base_price: 6500,
        has_vat: true,
        book_type: BookType.ACTES,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.ACTES,
        sub_service: 'Inyandiko ikomatanyiye',
        base_price: 6500,
        has_vat: true,
        book_type: BookType.ACTES,
        business_id: businessId,
        is_custom: false,
      },

      // ========== NOTIFICATION Services ==========
      {
        category: ServiceCategory.NOTIFICATION,
        sub_service: 'Diplome',
        base_price: 1950,
        has_vat: true,
        book_type: BookType.NOTIFICATION,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.NOTIFICATION,
        sub_service: 'Result',
        base_price: 1950,
        has_vat: true,
        book_type: BookType.NOTIFICATION,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.NOTIFICATION,
        sub_service: 'Transcript',
        base_price: 1950,
        has_vat: true,
        book_type: BookType.NOTIFICATION,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.NOTIFICATION,
        sub_service: 'Report',
        base_price: 1950,
        has_vat: true,
        book_type: BookType.NOTIFICATION,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.NOTIFICATION,
        sub_service: 'Certificate',
        base_price: 1950,
        has_vat: true,
        book_type: BookType.NOTIFICATION,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.NOTIFICATION,
        sub_service: 'Driving Licence',
        base_price: 1950,
        has_vat: true,
        book_type: BookType.NOTIFICATION,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.NOTIFICATION,
        sub_service: 'Passport',
        base_price: 1950,
        has_vat: true,
        book_type: BookType.NOTIFICATION,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.NOTIFICATION,
        sub_service: 'Identity Card',
        base_price: 1950,
        has_vat: true,
        book_type: BookType.NOTIFICATION,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.NOTIFICATION,
        sub_service: 'E-titles',
        base_price: 2000,
        has_vat: true,
        book_type: BookType.NOTIFICATION,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.NOTIFICATION,
        sub_service: 'To Whom It May Concern',
        base_price: 1950,
        has_vat: true,
        book_type: BookType.NOTIFICATION,
        business_id: businessId,
        is_custom: false,
      },

      // ========== IMIRAGE Services ==========
      {
        category: ServiceCategory.IMIRAGE,
        sub_service: 'Umurage',
        base_price: undefined,
        has_vat: true,
        book_type: BookType.IMIRAGE,
        business_id: businessId,
        is_custom: false,
      },

      // ========== SECRETARIAT Services (NO VAT) ==========
      {
        category: ServiceCategory.SECRETARIAT,
        sub_service: 'Mutation',
        base_price: 500,
        has_vat: false,
        book_type: null,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.SECRETARIAT,
        sub_service: 'Inyandiko',
        base_price: 1500,
        has_vat: false,
        book_type: null,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.SECRETARIAT,
        sub_service: 'Imisoro',
        base_price: 500,
        has_vat: false,
        book_type: null,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.SECRETARIAT,
        sub_service: 'Attestations',
        base_price: 200,
        has_vat: false,
        book_type: null,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.SECRETARIAT,
        sub_service: 'Scans',
        base_price: 4000,
        has_vat: false,
        book_type: null,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.SECRETARIAT,
        sub_service: 'Etitles',
        base_price: 2000,
        has_vat: false,
        book_type: null,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.SECRETARIAT,
        sub_service: 'Photocopies',
        base_price: 100,
        has_vat: false,
        book_type: null,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.SECRETARIAT,
        sub_service: 'Prints & forms',
        base_price: 1000,
        has_vat: false,
        book_type: null,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.SECRETARIAT,
        sub_service: 'Files',
        base_price: 500,
        has_vat: false,
        book_type: null,
        business_id: businessId,
        is_custom: false,
      },
      {
        category: ServiceCategory.SECRETARIAT,
        sub_service: 'Extra people',
        base_price: 1000,
        has_vat: false,
        book_type: null,
        business_id: businessId,
        is_custom: false,
      },
    ];
  }

  /**
   * Initialize default service catalog for a new business
   */
  async initializeDefaultCatalog(
    businessId: string,
  ): Promise<ServiceCatalog[]> {
    // Check if business exists
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Check if services already exist for this business
    const existingServices = await this.serviceCatalogRepository.count({
      where: { business_id: businessId },
    });
    if (existingServices > 0) {
      // Services already initialized, skip
      return [];
    }

    const defaultServices = this.getDefaultServices(businessId);
    const services = this.serviceCatalogRepository.create(defaultServices);
    return this.serviceCatalogRepository.save(services);
  }

  /**
   * Get all services for a business
   */
  async getAllServices(
    businessId: string,
    filters?: {
      category?: ServiceCategory;
      is_active?: boolean;
    },
  ): Promise<ServiceCatalog[]> {
    const query = this.serviceCatalogRepository
      .createQueryBuilder('service')
      .where('service.business_id = :businessId', { businessId });

    if (filters?.category) {
      query.andWhere('service.category = :category', {
        category: filters.category,
      });
    }

    if (filters?.is_active !== undefined) {
      query.andWhere('service.is_active = :isActive', {
        isActive: filters.is_active,
      });
    }

    query
      .orderBy('service.category', 'ASC')
      .addOrderBy('service.sub_service', 'ASC');

    return query.getMany();
  }

  /**
   * Get services by category
   */
  async getServicesByCategory(
    businessId: string,
    category: ServiceCategory,
  ): Promise<ServiceCatalog[]> {
    return this.serviceCatalogRepository.find({
      where: { business_id: businessId, category, is_active: true },
      order: { sub_service: 'ASC' },
    });
  }

  /**
   * Get a single service by ID
   */
  async getServiceById(
    serviceId: string,
    businessId: string,
  ): Promise<ServiceCatalog> {
    const service = await this.serviceCatalogRepository.findOne({
      where: { id: serviceId, business_id: businessId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  /**
   * Create a custom service (only OWNER can do this)
   */
  async createCustomService(
    businessId: string,
    userId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
    dto: CreateServiceCatalogDto,
  ): Promise<ServiceCatalog> {
    // Check permission - only OWNER can create custom services
    const isOwner =
      userRole === EUserRole.SUPERADMIN ||
      (userRole === EUserRole.STAFF &&
        userBusinessRoles.includes(EBusinessRole.OWNER));

    if (!isOwner) {
      throw new ForbiddenException(
        'Only business owner can create custom services',
      );
    }

    // Check if service already exists
    const existing = await this.serviceCatalogRepository.findOne({
      where: {
        business_id: businessId,
        category: dto.category,
        sub_service: dto.sub_service,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Service "${dto.sub_service}" already exists in category "${dto.category}"`,
      );
    }

    const service = this.serviceCatalogRepository.create({
      ...dto,
      business_id: businessId,
      is_custom: true,
      is_active: true,
    });

    return this.serviceCatalogRepository.save(service);
  }

  /**
   * Update a service (only OWNER can do this)
   */
  async updateService(
    serviceId: string,
    businessId: string,
    userId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
    dto: UpdateServiceCatalogDto,
  ): Promise<ServiceCatalog> {
    // Check permission - only OWNER can update services
    const isOwner =
      userRole === EUserRole.SUPERADMIN ||
      (userRole === EUserRole.STAFF &&
        userBusinessRoles.includes(EBusinessRole.OWNER));

    if (!isOwner) {
      throw new ForbiddenException('Only business owner can update services');
    }

    const service = await this.getServiceById(serviceId, businessId);

    Object.assign(service, dto);
    return this.serviceCatalogRepository.save(service);
  }

  /**
   * Delete (deactivate) a service (only OWNER can do this)
   */
  async deleteService(
    serviceId: string,
    businessId: string,
    userId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
  ): Promise<{ message: string }> {
    // Check permission - only OWNER can delete services
    const isOwner =
      userRole === EUserRole.SUPERADMIN ||
      (userRole === EUserRole.STAFF &&
        userBusinessRoles.includes(EBusinessRole.OWNER));

    if (!isOwner) {
      throw new ForbiddenException('Only business owner can delete services');
    }

    const service = await this.getServiceById(serviceId, businessId);

    // Soft delete - just deactivate
    service.is_active = false;
    await this.serviceCatalogRepository.save(service);

    return { message: `Service "${service.sub_service}" has been deactivated` };
  }
}
