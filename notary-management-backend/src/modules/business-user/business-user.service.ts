import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessUser } from 'src/shared/entities/business-user.entity';
import { User } from 'src/shared/entities/user.entity';
import { Business } from 'src/shared/entities/business.entity';
import { CreateBusinessUserDto } from './dto/create-business-user.dto';
import { UpdateBusinessUserDto } from './dto/update-business-user.dto';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';
import { CreateBusinessStaffDto } from './dto/create-business-staff.dto';
import { EUserRole } from 'src/shared/enums/user-role.enum';
import { EUserStatus } from 'src/shared/enums/user-status.enum';
import { SecretUtils } from 'src/common/utils/secret.utils';
import { PhoneUtils } from 'src/common/utils/phone.utils';
import { EEmploymentStatus } from 'src/shared/enums/employee-status.enum';

@Injectable()
export class BusinessUserService {
  constructor(
    @InjectRepository(BusinessUser)
    private readonly businessUserRepository: Repository<BusinessUser>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async getBusinessUsers(businessId: string): Promise<BusinessUser[]> {
    return this.businessUserRepository.find({
      where: { businessId },
      relations: ['user', 'business'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserMemberships(userId: string): Promise<BusinessUser[]> {
    return this.businessUserRepository.find({
      where: { userId },
      relations: ['business'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStaffCode(
    businessId: string,
    staffCode: string,
  ): Promise<BusinessUser | null> {
    return this.businessUserRepository.findOne({
      where: { businessId, staffCode },
      relations: ['user', 'business'],
    });
  }

  async getMembership(
    userId: string,
    businessId: string,
  ): Promise<BusinessUser | null> {
    return this.businessUserRepository.findOne({
      where: { userId, businessId },
      relations: ['user', 'business'],
    });
  }

  async getMembershipRoles(
    userId: string,
    businessId: string,
  ): Promise<EBusinessRole[]> {
    const membership = await this.businessUserRepository.findOne({
      where: { userId, businessId },
      select: ['id', 'roles'],
    });
    return membership?.roles ?? [];
  }

  async ensureRoles(
    userId: string,
    businessId: string,
    roles: EBusinessRole[],
  ): Promise<BusinessUser> {
    const membership = await this.getMembership(userId, businessId);
    if (!membership) {
      throw new NotFoundException('Business membership not found');
    }

    const hasRole = roles.some((role) => membership.roles.includes(role));
    if (!hasRole) {
      throw new BadRequestException('User does not have required role');
    }

    return membership;
  }

  async createMembership(dto: CreateBusinessUserDto): Promise<BusinessUser> {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException(`User ${dto.userId} not found`);
    }

    const business = await this.businessRepository.findOne({
      where: { id: dto.businessId },
    });
    if (!business) {
      throw new NotFoundException(`Business ${dto.businessId} not found`);
    }

    const existing = await this.businessUserRepository.findOne({
      where: { userId: dto.userId, businessId: dto.businessId },
    });
    if (existing) {
      throw new ConflictException('Business membership already exists');
    }

    if (user.role !== EUserRole.SUPERADMIN && user.role !== EUserRole.STAFF) {
      user.role = EUserRole.STAFF;
      user.status = EUserStatus.ACTIVE;
      user.isVerified = true;
      await this.userRepository.save(user);
    }

    if (dto.staffCode) {
      const existingCode = await this.businessUserRepository.findOne({
        where: { businessId: dto.businessId, staffCode: dto.staffCode },
      });
      if (existingCode) {
        throw new ConflictException(
          'Staff code already in use for this business',
        );
      }
    }

    const membership = this.businessUserRepository.create({
      userId: dto.userId,
      businessId: dto.businessId,
      roles: dto.roles,
      staffCode: dto.staffCode,
    });
    return this.businessUserRepository.save(membership);
  }

  async createStaffMember(dto: CreateBusinessStaffDto): Promise<BusinessUser> {
    const business = await this.businessRepository.findOne({
      where: { id: dto.businessId },
    });
    if (!business) {
      throw new NotFoundException(`Business ${dto.businessId} not found`);
    }

    const normalizedPhone = PhoneUtils.normalize(dto.phone);
    const existingByPhone = await this.userRepository.findOne({
      where: { phone: normalizedPhone },
    });
    const existingByEmail = dto.email
      ? await this.userRepository.findOne({ where: { email: dto.email } })
      : null;

    if (
      existingByPhone &&
      existingByEmail &&
      existingByPhone.id !== existingByEmail.id
    ) {
      throw new ConflictException('Phone and email belong to different users');
    }

    const user = existingByPhone ?? existingByEmail;
    if (user && user.phone !== normalizedPhone) {
      throw new ConflictException('Phone number already in use');
    }

    let staffUser: User;
    if (user) {
      staffUser = user;
      if (
        staffUser.role !== EUserRole.SUPERADMIN &&
        staffUser.role !== EUserRole.STAFF
      ) {
        staffUser.role = EUserRole.STAFF;
        staffUser.status = EUserStatus.ACTIVE;
        staffUser.isVerified = true;
      }
      if (!staffUser.fullNames && dto.fullNames) {
        staffUser.fullNames = dto.fullNames;
      }
      if (!staffUser.email && dto.email) {
        staffUser.email = dto.email;
      }
      if (!staffUser.isVerified) {
        staffUser.isVerified = true;
      }
      if (staffUser.status !== EUserStatus.ACTIVE) {
        staffUser.status = EUserStatus.ACTIVE;
      }
      await this.userRepository.save(staffUser);
    } else {
      const hashedPassword = await SecretUtils.hash(
        dto.password ? dto.password : normalizedPhone,
      );
      staffUser = this.userRepository.create({
        fullNames: dto.fullNames,
        email: dto.email,
        phone: normalizedPhone,
        password: hashedPassword,
        role: EUserRole.STAFF,
        status: EUserStatus.ACTIVE,
        isVerified: true,
      });
      staffUser = await this.userRepository.save(staffUser);
    }

    const existingMembership = await this.businessUserRepository.findOne({
      where: { userId: staffUser.id, businessId: dto.businessId },
    });
    if (existingMembership) {
      throw new ConflictException('Business membership already exists');
    }

    if (dto.staffCode) {
      const existingCode = await this.businessUserRepository.findOne({
        where: { businessId: dto.businessId, staffCode: dto.staffCode },
      });
      if (existingCode) {
        throw new ConflictException(
          'Staff code already in use for this business',
        );
      }
    }

    const membership = this.businessUserRepository.create({
      userId: staffUser.id,
      businessId: dto.businessId,
      roles: dto.roles,
      staffCode: dto.staffCode,
      employmentStatus: dto.employmentStatus ?? EEmploymentStatus.ACTIVE,
      jobTitle: dto.jobTitle,
      hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
      salary: dto.salary,
    });
    return this.businessUserRepository.save(membership);
  }

  async updateMembership(
    id: string,
    dto: UpdateBusinessUserDto,
  ): Promise<BusinessUser> {
    const membership = await this.businessUserRepository.findOne({
      where: { id },
    });
    if (!membership) {
      throw new NotFoundException('Business membership not found');
    }

    if (dto.staffCode) {
      const existingCode = await this.businessUserRepository.findOne({
        where: {
          businessId: membership.businessId,
          staffCode: dto.staffCode,
        },
      });
      if (existingCode && existingCode.id !== membership.id) {
        throw new ConflictException(
          'Staff code already in use for this business',
        );
      }
    }

    Object.assign(membership, dto);
    return this.businessUserRepository.save(membership);
  }

  async upsertMembership(params: {
    userId: string;
    businessId: string;
    role: EBusinessRole;
    staffCode?: string;
  }): Promise<BusinessUser> {
    const membership = await this.businessUserRepository.findOne({
      where: { userId: params.userId, businessId: params.businessId },
    });

    const user = await this.userRepository.findOne({
      where: { id: params.userId },
    });
    if (
      user &&
      user.role !== EUserRole.SUPERADMIN &&
      user.role !== EUserRole.STAFF
    ) {
      user.role = EUserRole.STAFF;
      user.status = EUserStatus.ACTIVE;
      user.isVerified = true;
      await this.userRepository.save(user);
    }

    if (!membership) {
      const created = this.businessUserRepository.create({
        userId: params.userId,
        businessId: params.businessId,
        roles: [params.role],
        staffCode: params.staffCode,
      });
      return this.businessUserRepository.save(created);
    }

    if (!membership.roles.includes(params.role)) {
      membership.roles = [...membership.roles, params.role];
    }

    if (!membership.staffCode && params.staffCode) {
      membership.staffCode = params.staffCode;
    }

    return this.businessUserRepository.save(membership);
  }
}
