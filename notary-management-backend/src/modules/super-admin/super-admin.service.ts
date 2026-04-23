import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/shared/entities/user.entity';
import { Business } from 'src/shared/entities/business.entity';
import { Repository, DataSource } from 'typeorm';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';
import { ICreateSuperAdminResponse } from './responses/create-super-admin-response.interface';
import * as bcrypt from 'bcrypt';
import { EUserStatus } from 'src/shared/enums/user-status.enum';
import { EUserRole } from 'src/shared/enums/user-role.enum';
import { CreateBusinessOwnerDto } from './dto/create-business-owner.dto';
import { IResponse } from 'src/shared/interfaces/response.interface';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly dataSource: DataSource,
  ) {}

  createSuperAdmin = async (
    dto: CreateSuperAdminDto,
  ): Promise<ICreateSuperAdminResponse> => {
    const { fullNames, email, phone, password } = dto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ phone }, ...(email ? [{ email }] : [])],
    });

    if (existingUser) {
      throw new ConflictException(
        'A user with this phone number or email already exists.',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with SUPERADMIN role
    const user = this.userRepository.create({
      fullNames,
      email,
      phone,
      password: hashedPassword,
      isVerified: true, // Auto-verified
      role: EUserRole.SUPERADMIN,
      status: EUserStatus.ACTIVE,
    });

    const savedUser = await this.userRepository.save(user);

    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: '/super-admin/create-super-admin',
      data: {
        superAdmin: {
          id: savedUser.id,
          fullNames: savedUser.fullNames,
          email: savedUser.email,
          phone: savedUser.phone,
          role: savedUser.role,
        },
        loginCredentials: {
          phone: savedUser.phone,
          password: password, // Return the provided password
        },
      },
      message: 'Super admin created successfully',
    };
  };

  createBusinessOwner = async (
    dto: CreateBusinessOwnerDto,
  ): Promise<IResponse> => {
    const { fullNames, email, phone, password } = dto;

    const existingUser = await this.userRepository.findOne({
      where: [{ phone }, ...(email ? [{ email }] : [])],
    });

    if (existingUser) {
      throw new ConflictException(
        'A user with this phone number or email already exists.',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const owner = this.userRepository.create({
      fullNames,
      email,
      phone,
      password: hashedPassword,
      isVerified: true,
      role: EUserRole.STAFF,
      status: EUserStatus.ACTIVE,
      createdAsBusinessOwner: true,
    });

    const savedOwner = await this.userRepository.save(owner);

    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: '/super-admin/create-business-owner',
      data: {
        owner: {
          id: savedOwner.id,
          fullNames: savedOwner.fullNames,
          email: savedOwner.email,
          phone: savedOwner.phone,
          role: savedOwner.role,
          isVerified: savedOwner.isVerified,
          isBusinessRegistered: false,
        },
        loginCredentials: {
          phone: savedOwner.phone,
          password: password,
        },
      },
      message: 'Business owner created successfully',
    };
  };

  // COMMENTED OUT: Password generation method (for easy reversal)
  /*
  private generateSecurePassword(): string {
    // Ensure password meets strong password requirements:
    // At least 8 characters, uppercase, lowercase, number, special character
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specials = '@$!%*?&.#';
    const allChars = uppercase + lowercase + numbers + specials;
    
    let password = '';
    
    // Ensure at least one character from each required category
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += specials.charAt(Math.floor(Math.random() * specials.length));
    
    // Fill remaining positions with random characters from all categories
    for (let i = 4; i < 12; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
  */
}
