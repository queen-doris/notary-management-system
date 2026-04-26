/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecretariatService } from '../../shared/entities/secretariat-service.entity';
import { Business } from '../../shared/entities/business.entity';
import { DEFAULT_SECRETARIAT_SERVICES } from './default-secretariat-services.data';
import {
  CreateSecretariatServiceDto,
  UpdateSecretariatServiceDto,
} from './dto/secretariat-service.dto';
import { EBusinessRole } from '../../shared/enums/business-role.enum';
import { EUserRole } from '../../shared/enums/user-role.enum';
import { SecretariatServiceName } from '../../shared/enums/secretariat-service-name.enum';

@Injectable()
export class SecretariatServiceService {
  constructor(
    @InjectRepository(SecretariatService)
    private secretariatServiceRepository: Repository<SecretariatService>,
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
  ) {}

  async initializeDefaultServices(
    businessId: string,
  ): Promise<SecretariatService[]> {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const existing = await this.secretariatServiceRepository.count({
      where: { business_id: businessId },
    });
    if (existing > 0) return [];

    const services: SecretariatService[] = [];

    for (const serviceData of DEFAULT_SECRETARIAT_SERVICES) {
      const service = this.secretariatServiceRepository.create({
        service_name: serviceData.service_name,
        base_price: serviceData.base_price,
        has_vat: false,
        is_custom: false,
        is_active: true,
        business_id: businessId,
      });
      services.push(service);
    }

    return this.secretariatServiceRepository.save(services);
  }

  async getAllServices(businessId: string): Promise<SecretariatService[]> {
    return this.secretariatServiceRepository.find({
      where: { business_id: businessId, is_active: true },
      order: { service_name: 'ASC' },
    });
  }

  async getServiceById(
    id: string,
    businessId: string,
  ): Promise<SecretariatService> {
    const service = await this.secretariatServiceRepository.findOne({
      where: { id, business_id: businessId },
    });
    if (!service) throw new NotFoundException('Secretariat service not found');
    return service;
  }

  async getServiceByName(
    businessId: string,
    serviceName: SecretariatServiceName,
  ): Promise<SecretariatService> {
    const service = await this.secretariatServiceRepository.findOne({
      where: {
        business_id: businessId,
        service_name: serviceName,
        is_active: true,
      },
    });
    if (!service)
      throw new NotFoundException(
        `Secretariat service "${serviceName}" not found`,
      );
    return service;
  }

  async createCustomService(
    businessId: string,
    userId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
    dto: CreateSecretariatServiceDto,
  ): Promise<SecretariatService> {
    const isOwner =
      userRole === EUserRole.SUPERADMIN ||
      (userRole === EUserRole.STAFF &&
        userBusinessRoles.includes(
          EBusinessRole.OWNER || EBusinessRole.SECRETARIAT,
        ));
    if (!isOwner)
      throw new ForbiddenException(
        'Only business owner can create custom secretariat services',
      );

    const existing = await this.secretariatServiceRepository.findOne({
      where: { business_id: businessId, service_name: dto.service_name },
    });
    if (existing) throw new ConflictException('Service already exists');

    const service = this.secretariatServiceRepository.create({
      service_name: dto.service_name,
      base_price: dto.base_price,
      has_vat: false,
      is_custom: true,
      is_active: true,
      description: dto.description,
      business_id: businessId,
    });
    return this.secretariatServiceRepository.save(service);
  }

  async updateService(
    id: string,
    businessId: string,
    userId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
    dto: UpdateSecretariatServiceDto,
  ): Promise<SecretariatService> {
    const isOwner =
      userRole === EUserRole.SUPERADMIN ||
      (userRole === EUserRole.STAFF &&
        userBusinessRoles.includes(
          EBusinessRole.OWNER || EBusinessRole.SECRETARIAT,
        ));
    if (!isOwner)
      throw new ForbiddenException(
        'Only business owner can update secretariat services',
      );

    const service = await this.getServiceById(id, businessId);
    Object.assign(service, dto);
    return this.secretariatServiceRepository.save(service);
  }

  async deleteService(
    id: string,
    businessId: string,
    userId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
  ): Promise<{ message: string }> {
    const isOwner =
      userRole === EUserRole.SUPERADMIN ||
      (userRole === EUserRole.STAFF &&
        userBusinessRoles.includes(EBusinessRole.OWNER));
    if (!isOwner)
      throw new ForbiddenException(
        'Only business owner can delete secretariat services',
      );

    const service = await this.getServiceById(id, businessId);
    service.is_active = false;
    await this.secretariatServiceRepository.save(service);
    return {
      message: `Secretariat service "${service.service_name}" deactivated`,
    };
  }
}
