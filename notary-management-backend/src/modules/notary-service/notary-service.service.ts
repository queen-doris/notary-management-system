/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotaryService } from '../../shared/entities/notary-service.entity';
import { Business } from '../../shared/entities/business.entity';
import { DEFAULT_NOTARY_SERVICES } from './default-notary-services.data';
import {
  CreateNotarySubServiceDto,
  UpdateNotarySubServiceDto,
} from './dto/notary-service.dto';
import { EBusinessRole } from '../../shared/enums/business-role.enum';
import { EUserRole } from '../../shared/enums/user-role.enum';
import { NotaryServiceName } from '../../shared/enums/notary-service-name.enum';

@Injectable()
export class NotaryServiceService {
  constructor(
    @InjectRepository(NotaryService)
    private notaryServiceRepository: Repository<NotaryService>,
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
  ) {}

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

    const allServices: NotaryService[] = [];

    for (const serviceGroup of DEFAULT_NOTARY_SERVICES) {
      for (const subService of serviceGroup.sub_services) {
        const service = this.notaryServiceRepository.create({
          service_name: serviceGroup.service_name,
          sub_service: subService.sub_service,
          base_price: subService.base_price || 0,
          book_type: subService.book_type,
          has_vat: true,
          is_custom: false,
          is_active: true,
          business_id: businessId,
        });
        allServices.push(service);
      }
    }

    return this.notaryServiceRepository.save(allServices);
  }

  async getAllServices(businessId: string): Promise<NotaryService[]> {
    return this.notaryServiceRepository.find({
      where: { business_id: businessId, is_active: true },
      order: { service_name: 'ASC', sub_service: 'ASC' },
    });
  }

  async getServicesByServiceName(
    businessId: string,
    serviceName: NotaryServiceName,
  ): Promise<NotaryService[]> {
    return this.notaryServiceRepository.find({
      where: {
        business_id: businessId,
        service_name: serviceName,
        is_active: true,
      },
      order: { sub_service: 'ASC' },
    });
  }

  async getSubServiceById(
    id: string,
    businessId: string,
  ): Promise<NotaryService> {
    const service = await this.notaryServiceRepository.findOne({
      where: { id, business_id: businessId },
    });
    if (!service) throw new NotFoundException('Notary sub-service not found');
    return service;
  }

  async addSubService(
    businessId: string,
    userId: string,
    userRoles: EBusinessRole,
    serviceName: NotaryServiceName,
    dto: CreateNotarySubServiceDto,
  ): Promise<NotaryService> {
    const isOwner = userRoles === EBusinessRole.OWNER;
    if (!isOwner)
      throw new ForbiddenException(
        'Only business owner can create custom secretariat services',
      );

    const existing = await this.notaryServiceRepository.findOne({
      where: {
        business_id: businessId,
        service_name: serviceName,
        sub_service: dto.sub_service,
      },
    });
    if (existing) throw new ConflictException('Sub-service already exists');

    const service = this.notaryServiceRepository.create({
      service_name: serviceName,
      sub_service: dto.sub_service,
      base_price: dto.base_price || 0,
      book_type: dto.book_type,
      has_vat: true,
      is_custom: true,
      is_active: true,
      description: dto.description,
      business_id: businessId,
    });
    return this.notaryServiceRepository.save(service);
  }

  async updateSubService(
    id: string,
    businessId: string,
    userId: string,
    userRoles: EBusinessRole,
    dto: UpdateNotarySubServiceDto,
  ): Promise<NotaryService> {
    const isOwner = userRoles === EBusinessRole.OWNER;
    if (!isOwner)
      throw new ForbiddenException(
        'Only business owner can create custom secretariat services',
      );

    const service = await this.getSubServiceById(id, businessId);
    Object.assign(service, dto);
    return this.notaryServiceRepository.save(service);
  }

  async deleteSubService(
    id: string,
    businessId: string,
    userId: string,
    userRoles: EBusinessRole,
  ): Promise<{ message: string }> {
    const isOwner = userRoles === EBusinessRole.OWNER;
    if (!isOwner)
      throw new ForbiddenException(
        'Only business owner can create custom secretariat services',
      );
    const service = await this.getSubServiceById(id, businessId);
    service.is_active = false;
    await this.notaryServiceRepository.save(service);
    return {
      message: `Notary sub-service "${service.sub_service}" deactivated`,
    };
  }
}
