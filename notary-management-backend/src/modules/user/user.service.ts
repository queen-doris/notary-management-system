/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prefer-const */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IUserResponse } from './responses/user-response.interface';
import { RegisterDto } from './dto/register-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/shared/entities/user.entity';
import { Repository } from 'typeorm';
import { SecretUtils } from 'src/common/utils/secret.utils';
import { EUserRole } from 'src/shared/enums/user-role.enum';
import { EUserStatus } from 'src/shared/enums/user-status.enum';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { BusinessUser } from 'src/shared/entities/business-user.entity';
import { Otp } from 'src/shared/entities/otp.entity';
import { Generators } from 'src/common/utils/generator.utils';
import { EOtpType } from 'src/shared/enums/otp-type.enum';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { Business } from 'src/shared/entities/business.entity';
import { In } from 'typeorm';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    @InjectRepository(BusinessUser)
    private readonly businessUserRepository: Repository<BusinessUser>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
  ) {}

  register = async (dto: RegisterDto): Promise<IUserResponse> => {
    await this.checkExistingUser(dto);

    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const hashedPassword = await SecretUtils.hash(dto.password);

      // Create base user
      const user: User = this.userRepository.create({
        fullNames: dto.fullNames,
        email: dto.email,
        password: hashedPassword,
        role: EUserRole.CUSTOMER,
        status: EUserStatus.INACTIVE,
        isVerified: false,
        phone: dto.phone,
      });

      const savedUser = await queryRunner.manager.save(user);

      // Send notifications asynchronously
      this.sendWelcomeNotifications(dto, savedUser.id).catch((error) => {
        this.logger.error('Failed to send welcome notifications:', error);
      });

      // Check if there's an existing unused OTP
      const existingOtp: Otp | null = await this.otpRepository.findOne({
        where: {
          userId: user.id,
          type: EOtpType.VERIFICATION,
          isUsed: false,
        },
      });

      if (existingOtp) {
        // Check if OTP is still valid (not expired)
        const now = new Date();
        const otpCreatedAt = new Date(existingOtp.createdAt);
        const otpExpirationTime = 15 * 60 * 1000; // 15 minutes

        if (now.getTime() - otpCreatedAt.getTime() < otpExpirationTime) {
          throw new BadRequestException(
            `Password reset code already sent to ${user.email ? user.email : user.phone}. Please wait before requesting a new one.`,
          );
        } else {
          // Delete expired OTP
          await this.otpRepository.delete(existingOtp.id);
        }
      }

      // Generate and send new OTP
      const otp: Otp = new Otp();
      let code: string = Generators.generateOtpCode();
      otp.code = await SecretUtils.hash(code);
      otp.isUsed = false;
      otp.type = EOtpType.VERIFICATION;
      otp.user = user;
      otp.userId = user.id;
      await this.otpRepository.save(otp);

      // Send the code via SMS and email
      this.smsService.sendPasswordResetSms(user.phone, code).catch((error) => {
        this.logger.error(
          `Failed to send SMS OTP to ${user.phone}: ${error.message}`,
        );
      });

      if (user.email) {
        this.emailService
          .sendVerificationEmail(user.email, user.fullNames, code)
          .catch((error) => {
            this.logger.error(
              `Failed to send email OTP to ${user.email}: ${error.message}`,
            );
          });
      }

      return this.mapUserToResponse(savedUser);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error('Registration error:', error);
      throw new InternalServerErrorException('Failed to create user account');
    } finally {
      await queryRunner.release();
    }
  };

  private async checkExistingUser(dto: RegisterDto): Promise<void> {
    const existingUserConditions = [
      { phone: dto.phone },
      ...(dto.email ? [{ email: dto.email }] : []),
    ];

    const existingUser = await this.userRepository
      .createQueryBuilder('user')
      .where(existingUserConditions)
      .getOne();

    if (existingUser) {
      if (existingUser.phone === dto.phone) {
        throw new ConflictException('Phone number already registered');
      }
      if (dto.email && existingUser.email === dto.email) {
        throw new ConflictException('Email already registered');
      }
    }
  }

  private async sendWelcomeNotifications(
    dto: RegisterDto,
    userId: string,
  ): Promise<void> {
    try {
      await this.smsService.sendWelcomeSms(dto.phone, dto.fullNames);

      if (dto.email) {
        await this.emailService.sendWelcomeEmail(dto.email, dto.fullNames);
      }

      this.logger.log(`Welcome notifications sent for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome notifications for user ${userId}:`,
        error,
      );
    }
  }

  /**
   * Map user and profile to response format
   */
  private mapUserToResponse(user: User): IUserResponse {
    const baseResponse = {
      id: user.id,
      fullNames: user.fullNames,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };

    return {
      user: baseResponse,
    };
  }

  async getUserWithProfile(userId: string): Promise<IUserResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const memberships = await this.businessUserRepository.find({
      where: { userId: user.id },
      relations: ['business'],
    });

    user['profile'] = {
      memberships,
    };

    return { user };
  }

  async updateUserProfile(
    userId: string,
    updateData: any,
  ): Promise<IUserResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const allowedFields: Array<keyof User> = ['fullNames', 'email', 'phone'];

    const patch: Partial<User> = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        // Assign only provided fields
        patch[key] = updateData[key];
      }
    }

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException(
        'No updatable user fields were provided (fullNames, email, phone).',
      );
    }

    try {
      await this.userRepository.update(userId, patch);
      const updatedUser = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!updatedUser) {
        throw new NotFoundException(`User ${user.fullNames} not found.`);
      }

      return this.mapUserToResponse(updatedUser);
    } catch (error) {
      this.logger.error('Failed to update user profile', error);
      throw new InternalServerErrorException('Failed to update user profile');
    }
  }

  // ... (earlier parts of UserService)

  completeProfile = async (
    userId: string,
    dto: CompleteProfileDto,
  ): Promise<IResponse> => {
    const user: User | null = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException(`User ${userId} not found.`);

    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: '/complete-profile',
      message: 'Profile completed.',
      data: null,
    };
  };

  // ============================
  // Get all customers - class method
  // ============================
  async getAllCustomers(): Promise<User[]> {
    const customers = await this.userRepository.find({
      where: { role: EUserRole.CUSTOMER },
      order: { createdAt: 'DESC' },
    });

    if (!customers || customers.length === 0) {
      throw new NotFoundException('No customers found');
    }

    return customers;
  }

  getCountOfCustomers = async () => {
    return {
      count: await this.userRepository.count({
        where: { role: EUserRole.CUSTOMER },
      }),
    };
  };

  getUsersCountByRole = async (role: EUserRole) => {
    return {
      count: await this.userRepository.count({ where: { role } }),
    };
  };

  deleteAccount = async (userId: string): Promise<IResponse> => {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.otpRepository.delete({ userId });

    await this.userRepository.delete(userId);

    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: '/users/me',
      message: 'Account deleted successfully',
      data: null,
    };
  };

  getBusinessOwners = async (query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    isVerified?: boolean;
    isBusinessRegistered?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) => {
    // const page = query.page ?? 1;
    // const limit = query.limit ?? 10;
    // const skip = (page - 1) * limit;

    // // Include (a) users who have OWNER role in any BusinessUser membership, or (b) users created as business owner by super-admin (createdAsBusinessOwner) who have not yet registered a business.
    // const ownersSubquery = this.businessUserRepository
    //   .createQueryBuilder('bu')
    //   .select('bu.userId')
    //   .where(`'${EBusinessRole.OWNER}' = ANY(bu.roles)`)
    //   .getQuery();

    // const queryBuilder = this.userRepository
    //   .createQueryBuilder('user')
    //   .where(
    //     `(user.id IN (${ownersSubquery}) OR user.createdAsBusinessOwner = :createdAsOwner)`,
    //     {
    //       createdAsOwner: true,
    //     },
    //   );

    // if (query.search) {
    //   queryBuilder.andWhere('user.fullNames ILIKE :search', {
    //     search: `%${query.search}%`,
    //   });
    // }

    // if (query.status) {
    //   queryBuilder.andWhere('user.status = :status', { status: query.status });
    // }

    // if (query.isVerified !== undefined) {
    //   queryBuilder.andWhere('user.isVerified = :isVerified', {
    //     isVerified: query.isVerified,
    //   });
    // }

    // if (query.isBusinessRegistered !== undefined) {
    //   const businessExists = queryBuilder
    //     .subQuery()
    //     .select('1')
    //     .from(Business, 'business')
    //     .where('business.ownerUserId = user.id')
    //     .getQuery();

    //   if (query.isBusinessRegistered) {
    //     queryBuilder.andWhere(`EXISTS ${businessExists}`);
    //   } else {
    //     queryBuilder.andWhere(`NOT EXISTS ${businessExists}`);
    //   }
    // }

    // const sortBy =
    //   query.sortBy === 'fullNames' || query.sortBy === 'createdAt'
    //     ? query.sortBy
    //     : 'createdAt';
    // const sortOrder = query.sortOrder ?? 'DESC';

    // queryBuilder.orderBy(`user.${sortBy}`, sortOrder).skip(skip).take(limit);

    // const [owners, total] = await queryBuilder.getManyAndCount();

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.createdAsBusinessOwner = :flag', {
        flag: true,
      });

    if (query.search) {
      queryBuilder.andWhere(
        '(user.fullNames ILIKE :search OR user.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.status) {
      queryBuilder.andWhere('user.status = :status', {
        status: query.status,
      });
    }

    if (query.isVerified !== undefined) {
      queryBuilder.andWhere('user.isVerified = :isVerified', {
        isVerified: query.isVerified,
      });
    }

    const sortBy =
      query.sortBy === 'fullNames' || query.sortBy === 'createdAt'
        ? query.sortBy
        : 'createdAt';

    queryBuilder
      .orderBy(`user.${sortBy}`, query.sortOrder ?? 'DESC')
      .skip(skip)
      .take(limit);

    const [owners, total] = await queryBuilder.getManyAndCount();
    const ownerIds = owners.map((owner) => owner.id);

    const businesses = ownerIds.length
      ? await this.businessRepository.find({
          where: { ownerUserId: In(ownerIds) },
        })
      : [];

    const businessesByOwnerId = new Map<string, Business[]>();
    for (const business of businesses) {
      const ownerId = business.ownerUserId;
      if (!ownerId) continue;
      const list = businessesByOwnerId.get(ownerId) ?? [];
      list.push(business);
      businessesByOwnerId.set(ownerId, list);
    }

    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: '/business-owners',
      data: {
        businessOwners: owners.map((owner) => {
          const ownerBusinesses = businessesByOwnerId.get(owner.id) ?? [];
          return {
            id: owner.id,
            fullNames: owner.fullNames ?? '',
            email: owner.email ?? undefined,
            phone: owner.phone,
            role: owner.role,
            status: owner.status,
            isVerified: owner.isVerified,
            isBusinessRegistered: ownerBusinesses.length > 0,
            totalBusinesses: ownerBusinesses.length,
            ownershipSince: owner.createdAt,
            createdAt: owner.createdAt,
            updatedAt: owner.updatedAt,
            businesses: ownerBusinesses.map((business) => ({
              id: business.id,
              businessName: business.businessName,
              businessType: business.businessType,
              email: business.email,
              isActive: business.isActive,
              isVerified: business.isVerified,
            })),
          };
        }),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
      message: 'Business owners retrieved successfully',
    };
  };
} // end class
