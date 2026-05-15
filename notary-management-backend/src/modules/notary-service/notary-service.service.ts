import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NotaryService } from '../../shared/entities/notary-service.entity';
import { NotaryServiceCategory } from '../../shared/entities/notary-service-category.entity';
import { Book } from '../../shared/entities/book.entity';
import { Business } from '../../shared/entities/business.entity';
import { DEFAULT_NOTARY_SERVICES } from './default-notary-services.data';
import {
  CreateNotarySubServiceDto,
  UpdateNotarySubServiceDto,
  CreateNotaryServiceCategoryDto,
  UpdateNotaryServiceCategoryDto,
  CreateNotaryServiceDto,
  CreateNotaryServiceBulkDto,
} from './dto/notary-service.dto';
import { EBusinessRole } from '../../shared/enums/business-role.enum';
import { Generators } from '../../common/utils/generator.utils';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class NotaryServiceService {
  constructor(
    @InjectRepository(NotaryService)
    private notaryServiceRepository: Repository<NotaryService>,
    @InjectRepository(NotaryServiceCategory)
    private categoryRepository: Repository<NotaryServiceCategory>,
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
    private dataSource: DataSource,
  ) {}

  private async resolveCategory(
    businessId: string,
    ref: string,
  ): Promise<NotaryServiceCategory> {
    const where = UUID_RE.test(ref)
      ? { id: ref, business_id: businessId }
      : { slug: ref, business_id: businessId };
    const category = await this.categoryRepository.findOne({ where });
    if (!category) {
      throw new NotFoundException(`Service category "${ref}" not found`);
    }
    return category;
  }

  private async resolveBookId(
    businessId: string,
    bookId?: string,
  ): Promise<string | null> {
    if (!bookId) return null;
    const book = await this.bookRepository.findOne({
      where: { id: bookId, business_id: businessId },
    });
    if (!book) {
      throw new NotFoundException(`Book "${bookId}" not found`);
    }
    return book.id;
  }

  /**
   * Seed default categories + their sub-services for a new business.
   * Books must already be initialized (slugs are resolved here).
   */
  async initializeDefaultServices(
    businessId: string,
  ): Promise<NotaryService[]> {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const existing = await this.notaryServiceRepository.count({
      where: { business_id: businessId },
    });
    if (existing > 0) return [];

    const books = await this.bookRepository.find({
      where: { business_id: businessId },
    });
    const bookBySlug = new Map(books.map((b) => [b.slug, b.id]));

    const allServices: NotaryService[] = [];

    for (const cat of DEFAULT_NOTARY_SERVICES) {
      const category = await this.categoryRepository.save(
        this.categoryRepository.create({
          name: cat.name,
          slug: cat.slug,
          is_active: true,
          is_custom: false,
          business_id: businessId,
        }),
      );

      for (const sub of cat.sub_services) {
        allServices.push(
          this.notaryServiceRepository.create({
            category_id: category.id,
            sub_service: sub.sub_service,
            base_price: sub.base_price ?? 0,
            book_id: bookBySlug.get(sub.book_slug) ?? null,
            has_vat: true,
            is_custom: false,
            is_active: true,
            business_id: businessId,
          }),
        );
      }
    }

    return this.notaryServiceRepository.save(allServices);
  }

  // ==================== Categories ====================

  async createCategory(
    businessId: string,
    userRole: EBusinessRole,
    dto: CreateNotaryServiceCategoryDto,
  ): Promise<NotaryServiceCategory> {
    if (userRole !== EBusinessRole.OWNER) {
      throw new ForbiddenException(
        'Only business owner can create service categories',
      );
    }
    const slug = Generators.slugify(dto.name);
    const existing = await this.categoryRepository.findOne({
      where: { business_id: businessId, slug },
    });
    if (existing) {
      throw new ConflictException(
        `A service category named "${dto.name}" already exists`,
      );
    }
    return this.categoryRepository.save(
      this.categoryRepository.create({
        name: dto.name,
        slug,
        description: dto.description,
        is_active: true,
        is_custom: true,
        business_id: businessId,
      }),
    );
  }

  async getCategories(businessId: string): Promise<NotaryServiceCategory[]> {
    return this.categoryRepository.find({
      where: { business_id: businessId, is_active: true },
      order: { name: 'ASC' },
    });
  }

  async updateCategory(
    businessId: string,
    userRole: EBusinessRole,
    categoryRef: string,
    dto: UpdateNotaryServiceCategoryDto,
  ): Promise<NotaryServiceCategory> {
    if (userRole !== EBusinessRole.OWNER) {
      throw new ForbiddenException(
        'Only business owner can update service categories',
      );
    }
    const category = await this.resolveCategory(businessId, categoryRef);

    if (dto.name && dto.name !== category.name) {
      const slug = Generators.slugify(dto.name);
      const clash = await this.categoryRepository.findOne({
        where: { business_id: businessId, slug },
      });
      if (clash && clash.id !== category.id) {
        throw new ConflictException(
          `A service category named "${dto.name}" already exists`,
        );
      }
      category.slug = slug;
    }

    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async deleteCategory(
    businessId: string,
    userRole: EBusinessRole,
    categoryRef: string,
  ): Promise<{ message: string }> {
    if (userRole !== EBusinessRole.OWNER) {
      throw new ForbiddenException(
        'Only business owner can delete service categories',
      );
    }
    const category = await this.resolveCategory(businessId, categoryRef);
    category.is_active = false;
    await this.categoryRepository.save(category);
    return { message: `Service category "${category.name}" deactivated` };
  }

  // ==================== Sub-services ====================

  async getAllServices(businessId: string): Promise<NotaryService[]> {
    return this.notaryServiceRepository.find({
      where: { business_id: businessId, is_active: true },
      relations: ['category', 'book'],
      order: { sub_service: 'ASC' },
    });
  }

  async getServicesByCategory(
    businessId: string,
    categoryRef: string,
  ): Promise<NotaryService[]> {
    const category = await this.resolveCategory(businessId, categoryRef);
    return this.notaryServiceRepository.find({
      where: {
        business_id: businessId,
        category_id: category.id,
        is_active: true,
      },
      relations: ['category', 'book'],
      order: { sub_service: 'ASC' },
    });
  }

  async getSubServiceById(
    id: string,
    businessId: string,
  ): Promise<NotaryService> {
    const service = await this.notaryServiceRepository.findOne({
      where: { id, business_id: businessId },
      relations: ['category', 'book'],
    });
    if (!service) throw new NotFoundException('Notary sub-service not found');
    return service;
  }

  private async assertSubServiceUnique(
    businessId: string,
    categoryId: string,
    subService: string,
  ): Promise<void> {
    const existing = await this.notaryServiceRepository.findOne({
      where: {
        business_id: businessId,
        category_id: categoryId,
        sub_service: subService,
      },
    });
    if (existing) throw new ConflictException('Sub-service already exists');
  }

  /**
   * Add a sub-service under an existing category (resolved by id or slug).
   */
  async addSubService(
    businessId: string,
    userId: string,
    userRole: EBusinessRole,
    categoryRef: string,
    dto: CreateNotarySubServiceDto,
  ): Promise<NotaryService> {
    if (userRole !== EBusinessRole.OWNER) {
      throw new ForbiddenException(
        'Only business owner can create custom services',
      );
    }
    const category = await this.resolveCategory(businessId, categoryRef);
    await this.assertSubServiceUnique(
      businessId,
      category.id,
      dto.sub_service,
    );
    const bookId = await this.resolveBookId(businessId, dto.book_id);

    return this.notaryServiceRepository.save(
      this.notaryServiceRepository.create({
        category_id: category.id,
        sub_service: dto.sub_service,
        base_price: dto.base_price ?? 0,
        book_id: bookId,
        has_vat: true,
        is_custom: true,
        is_active: true,
        description: dto.description,
        business_id: businessId,
      }),
    );
  }

  /**
   * Flat create: a sub-service against an existing category id.
   */
  async createService(
    businessId: string,
    userRole: EBusinessRole,
    dto: CreateNotaryServiceDto,
  ): Promise<NotaryService> {
    if (userRole !== EBusinessRole.OWNER) {
      throw new ForbiddenException(
        'Only business owner can create custom services',
      );
    }
    const category = await this.resolveCategory(businessId, dto.category_id);
    await this.assertSubServiceUnique(
      businessId,
      category.id,
      dto.sub_service,
    );
    const bookId = await this.resolveBookId(businessId, dto.book_id);

    return this.notaryServiceRepository.save(
      this.notaryServiceRepository.create({
        category_id: category.id,
        sub_service: dto.sub_service,
        base_price: dto.base_price ?? 0,
        book_id: bookId,
        has_vat: true,
        is_custom: true,
        is_active: true,
        description: dto.description,
        business_id: businessId,
      }),
    );
  }

  /**
   * Create a brand-new category together with its sub-services in one transaction.
   */
  async createServiceBulk(
    businessId: string,
    userRole: EBusinessRole,
    dto: CreateNotaryServiceBulkDto,
  ): Promise<{
    category: NotaryServiceCategory;
    sub_services: NotaryService[];
  }> {
    if (userRole !== EBusinessRole.OWNER) {
      throw new ForbiddenException(
        'Only business owner can create custom services',
      );
    }

    const slug = Generators.slugify(dto.category.name);
    const existing = await this.categoryRepository.findOne({
      where: { business_id: businessId, slug },
    });
    if (existing) {
      throw new ConflictException(
        `A service category named "${dto.category.name}" already exists`,
      );
    }

    // Validate book references up-front
    for (const sub of dto.sub_services) {
      await this.resolveBookId(businessId, sub.book_id);
    }

    return this.dataSource.transaction(async (manager) => {
      const category = await manager.save(
        manager.create(NotaryServiceCategory, {
          name: dto.category.name,
          slug,
          description: dto.category.description,
          is_active: true,
          is_custom: true,
          business_id: businessId,
        }),
      );

      const seen = new Set<string>();
      const subServices: NotaryService[] = [];
      for (const sub of dto.sub_services) {
        if (seen.has(sub.sub_service)) {
          throw new ConflictException(
            `Duplicate sub-service "${sub.sub_service}" in request`,
          );
        }
        seen.add(sub.sub_service);

        subServices.push(
          manager.create(NotaryService, {
            category_id: category.id,
            sub_service: sub.sub_service,
            base_price: sub.base_price ?? 0,
            book_id: sub.book_id ?? null,
            has_vat: true,
            is_custom: true,
            is_active: true,
            description: sub.description,
            business_id: businessId,
          }),
        );
      }

      const saved = await manager.save(subServices);
      return { category, sub_services: saved };
    });
  }

  async updateSubService(
    id: string,
    businessId: string,
    userId: string,
    userRole: EBusinessRole,
    dto: UpdateNotarySubServiceDto,
  ): Promise<NotaryService> {
    if (userRole !== EBusinessRole.OWNER) {
      throw new ForbiddenException(
        'Only business owner can update custom services',
      );
    }
    const service = await this.getSubServiceById(id, businessId);
    if (dto.book_id !== undefined) {
      service.book_id = await this.resolveBookId(businessId, dto.book_id);
    }
    const { book_id: _ignored, ...rest } = dto;
    Object.assign(service, rest);
    return this.notaryServiceRepository.save(service);
  }

  async deleteSubService(
    id: string,
    businessId: string,
    userId: string,
    userRole: EBusinessRole,
  ): Promise<{ message: string }> {
    if (userRole !== EBusinessRole.OWNER) {
      throw new ForbiddenException(
        'Only business owner can delete custom services',
      );
    }
    const service = await this.getSubServiceById(id, businessId);
    service.is_active = false;
    await this.notaryServiceRepository.save(service);
    return {
      message: `Notary sub-service "${service.sub_service}" deactivated`,
    };
  }
}
