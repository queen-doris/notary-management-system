/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prefer-const */
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/shared/entities/user.entity';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { ILoginResponse } from './responses/login-response.interface';
import { EUserStatus } from 'src/shared/enums/user-status.enum';
import { EUserRole } from 'src/shared/enums/user-role.enum';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';
import { JwtPayload } from 'src/common/types/jwt-payload.type';
import { JwtService } from '../jwt/jwt.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SecretUtils } from 'src/common/utils/secret.utils';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { Otp } from 'src/shared/entities/otp.entity';
import { Generators } from 'src/common/utils/generator.utils';
import { PhoneUtils } from 'src/common/utils/phone.utils';
import { EOtpType } from 'src/shared/enums/otp-type.enum';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { EEmploymentStatus } from 'src/shared/enums/employee-status.enum';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { BusinessUserService } from '../business-user/business-user.service';
import { StaffLoginDto } from './dto/staff-login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly logger: Logger,
    private readonly businessUserService: BusinessUserService,
  ) {}

  login = async (dto: LoginDto): Promise<ILoginResponse> => {
    const { phone, password } = dto;

    const normalizedPhone = PhoneUtils.normalize(phone);
    const user = await this.userRepository.findOne({
      where: { phone: normalizedPhone },
    });
    if (!user)
      throw new UnauthorizedException('Phone number or password is incorrect.');

    const isMatch = await SecretUtils.compare(password, user.password);
    if (!isMatch)
      throw new UnauthorizedException('Phone number or password is incorrect.');

    if (!user.isVerified) {
      // Send a new verification code automatically
      try {
        await this.resendVerificationCode(
          normalizedPhone,
          EOtpType.VERIFICATION,
        );
      } catch (e) {
        this.logger.warn(`Failed to resend verification code: ${e}`);
      }

      const response = {
        statusCode: 401,
        message:
          'Your account is not yet verified. A new verification code has been sent.',
        errorCode: 'ACCOUNT_NOT_VERIFIED',
        phone: normalizedPhone,
      };
      throw new UnauthorizedException(response);
    }

    switch (user.status) {
      case EUserStatus.INACTIVE:
        throw new UnauthorizedException(
          'Your account is not active, contact support for further information.',
        );
      case EUserStatus.SUSPENDED:
        throw new UnauthorizedException(
          'Your account is suspended, contact support for further information.',
        );
    }

    // Check if user has any owner memberships
    const memberships = await this.businessUserService.getUserMemberships(
      user.id,
    );
    const isBusinessRegistered = memberships.some((m) =>
      m.roles.includes(EBusinessRole.OWNER),
    );
    const membershipCount = memberships.length;
    const hasSingleMembership = membershipCount === 1;
    const primaryMembership = hasSingleMembership ? memberships[0] : undefined;
    const businessId = primaryMembership?.businessId;
    let businessRoles = primaryMembership?.roles ?? [];

    if (membershipCount === 0 && user.createdAsBusinessOwner) {
      businessRoles = [EBusinessRole.OWNER];
    }

    if (user.role !== EUserRole.SUPERADMIN) {
      // check the employee status - check all memberships for ON_LEAVE
      const allMemberships = await this.businessUserService.getUserMemberships(
        user.id,
      );
      const isOnLeave = allMemberships.some(
        (m) => m.employmentStatus === EEmploymentStatus.ON_LEAVE,
      );
      if (isOnLeave) {
        throw new UnauthorizedException('Employee is on leave.');
      }
    }

    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      phone: user.phone,
      fullNames: user.fullNames,
      isVerified: user.isVerified,
      businessId,
      businessRoles,
      membershipCount,
    };
    const accessToken = this.jwtService.sign(
      payload,
      process.env.JWT_EXPIRATION || '8h',
    );

    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: '/auth/login',
      data: {
        user: user,
        accessToken,
        isBusinessRegistered,
        businessRoles,
        businessId,
      },
      message: 'Logged in successfully',
    };
  };

  staffLogin = async (dto: StaffLoginDto): Promise<ILoginResponse> => {
    const membership = await this.businessUserService.findByStaffCode(
      dto.businessId,
      dto.staffCode,
    );

    if (!membership) {
      throw new UnauthorizedException('Staff code is incorrect.');
    }

    if (
      membership.employmentStatus === EEmploymentStatus.SUSPENDED ||
      membership.employmentStatus === EEmploymentStatus.TERMINATED
    ) {
      throw new UnauthorizedException('Employee is not active.');
    }

    const user = membership.user;
    if (!user) {
      throw new UnauthorizedException('User not found for staff code.');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Your account is not yet verified.');
    }

    if (
      user.status === EUserStatus.SUSPENDED ||
      user.status === EUserStatus.INACTIVE
    ) {
      throw new UnauthorizedException(
        'Your account is not active, contact support for further information.',
      );
    }

    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      phone: user.phone,
      fullNames: user.fullNames,
      isVerified: user.isVerified,
      businessId: membership.businessId,
      businessRoles: membership.roles,
      membershipCount: 1,
    };

    const accessToken = this.jwtService.sign(
      payload,
      process.env.JWT_EXPIRATION || '8h',
    );

    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: '/auth/staff-login',
      data: {
        user: user,
        accessToken,
        businessRoles: membership.roles,
        businessId: membership.businessId,
        business: {
          id: membership.businessId,
          roles: membership.roles,
          staffCode: membership.staffCode,
        },
      },
      message: 'Logged in successfully',
    };
  };

  selectBusiness = async (
    userId: string,
    businessId: string,
  ): Promise<ILoginResponse> => {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const businessRoles = await this.businessUserService.getMembershipRoles(
      user.id,
      businessId,
    );

    if (businessRoles.length === 0) {
      throw new UnauthorizedException('Business membership not found.');
    }

    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      phone: user.phone,
      fullNames: user.fullNames,
      isVerified: user.isVerified,
      businessId,
      businessRoles,
      membershipCount: 1,
    };
    const accessToken = this.jwtService.sign(
      payload,
      process.env.JWT_EXPIRATION || '8h',
    );

    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: '/auth/select-business',
      data: {
        user: user,
        accessToken,
        business: {
          id: businessId,
          roles: businessRoles,
        },
      },
      message: 'Active business set successfully',
    };
  };

  // getprofile
  getMe = async (session: {
    id: string;
    businessId?: string;
    businessRoles?: EBusinessRole[];
    membershipCount?: number;
  }): Promise<any> => {
    const user = await this.userRepository.findOne({
      where: { id: session.id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const mergedUser = {
      ...user,
      businessId: session.businessId,
      businessRoles: session.businessRoles,
      membershipCount: session.membershipCount,
    };

    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: '/auth/profile',
      data: {
        user: mergedUser,
      },
      message: 'Profile retrieved successfully',
    };
  };

  changePassword = async (
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<string> => {
    const user: User | null = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException(`User ${userId} not found.`);

    const isMatch: boolean = await SecretUtils.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isMatch)
      throw new UnauthorizedException('Current password is incorrect.');

    if (dto.confirmPassword !== dto.newPassword)
      throw new BadRequestException(
        "New password and confirm password doesn't match.",
      );

    const p: string = await SecretUtils.hash(dto.newPassword);
    user.password = p;
    await this.userRepository.save(user);
    return 'Password changed successfully.';
  };

  forgotPassword = async (
    dto: ForgotPasswordDto,
  ): Promise<string | undefined> => {
    const normalizedPhone = PhoneUtils.normalize(dto.phone);
    const user: User | null = await this.userRepository.findOne({
      where: { phone: normalizedPhone },
    });
    if (!user) throw new NotFoundException(`User ${dto.phone} not found.`);

    // Check if there's an existing unused OTP
    const existingOtp: Otp | null = await this.otpRepository.findOne({
      where: { userId: user.id, type: EOtpType.PASSWORD_RESET, isUsed: false },
    });

    if (existingOtp) {
      // Check if OTP is still valid (not expired)
      const now = new Date();
      const otpCreatedAt = new Date(existingOtp.createdAt);
      const otpExpirationTime = 15 * 60 * 1000; // 15 minutes

      if (now.getTime() - otpCreatedAt.getTime() < otpExpirationTime) {
        // throw new BadRequestException(
        //   `Password reset code already sent to ${user.email ? user.email : user.phone}. Please wait before requesting a new one.`,
        // );

        await this.resendVerificationCode(dto.phone, EOtpType.PASSWORD_RESET);
        return;
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
    otp.type = EOtpType.PASSWORD_RESET;
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
        .sendPasswordResetEmail(user.email, user.fullNames, code)
        .catch((error) => {
          this.logger.error(
            `Failed to send email OTP to ${user.email}: ${error.message}`,
          );
        });
    }

    return 'If the phone number exists, a reset code has been sent';
  };

  // Verify OTP for password reset or account verification
  verifyOtp = async (
    dto: VerifyOtpDto,
  ): Promise<{
    success: boolean;
    type: EOtpType;
    token?: string;
    message: string;
  }> => {
    const { phone, code } = dto;

    // Normalize phone to international format for lookup
    const normalizedPhone = PhoneUtils.normalize(phone);

    const user = await this.userRepository.findOne({
      where: { phone: normalizedPhone },
    });
    if (!user) {
      throw new NotFoundException(`User with phone ${phone} not found.`);
    }

    // Find valid OTP (not used and not expired)
    const otp = await this.otpRepository.findOne({
      where: {
        userId: user.id,
        isUsed: false,
      },
      order: { createdAt: 'DESC' }, // Get the most recent OTP
    });

    if (!otp) {
      throw new BadRequestException(
        'No valid verification code found. Please request a new one.',
      );
    }

    // Check if OTP is expired (15 minutes)
    const now = new Date();
    const otpCreatedAt = new Date(otp.createdAt);
    const otpExpirationTime = 15 * 60 * 1000; // 15 minutes

    if (now.getTime() - otpCreatedAt.getTime() > otpExpirationTime) {
      throw new BadRequestException(
        'Verification code has expired. Please request a new one.',
      );
    }

    // Verify OTP code
    const isOtpValid = await SecretUtils.compare(code, otp.code);
    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid verification code.');
    }

    // Mark OTP as used
    otp.isUsed = true;
    await this.otpRepository.save(otp);

    // Handle different OTP types
    if (otp.type === EOtpType.VERIFICATION) {
      // Verify user account
      user.isVerified = true;
      user.status = EUserStatus.ACTIVE;
      await this.userRepository.save(user);

      const memberships = await this.businessUserService.getUserMemberships(
        user.id,
      );
      const membershipCount = memberships.length;
      const hasSingleMembership = membershipCount === 1;
      const primaryMembership = hasSingleMembership
        ? memberships[0]
        : undefined;
      const businessId = primaryMembership?.businessId;
      let businessRoles = primaryMembership?.roles ?? [];

      if (membershipCount === 0 && user.createdAsBusinessOwner) {
        businessRoles = [EBusinessRole.OWNER];
      }

      // Generate login token for immediate access
      const payload: JwtPayload = {
        sub: user.id,
        role: user.role,
        phone: user.phone,
        fullNames: user.fullNames,
        isVerified: true,
        businessId,
        businessRoles,
        membershipCount,
      };
      const accessToken = this.jwtService.sign(
        payload,
        process.env.JWT_EXPIRATION || '8h',
      );

      return {
        success: true,
        type: EOtpType.VERIFICATION,
        token: accessToken,
        message: 'Account verified successfully. You can now login.',
      };
    } else if (otp.type === EOtpType.PASSWORD_RESET) {
      const resetTokenPayload: JwtPayload = {
        sub: user.id,
        phone: user.phone,
        fullNames: user.fullNames,
        isVerified: user.isVerified,
        role: user.role,
        purpose: 'password_reset',
      };
      const resetToken = this.jwtService.sign(resetTokenPayload, '15m');

      return {
        success: true,
        type: EOtpType.PASSWORD_RESET,
        token: resetToken,
        message: 'OTP verified successfully. You can now reset your password.',
      };
    }

    throw new BadRequestException('Unknown OTP type.');
  };

  // Reset password after OTP verification
  resetPassword = async (dto: ResetPasswordDto): Promise<string> => {
    const { resetToken, newPassword, confirmPassword } = dto;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException(
        "New password and confirm password don't match.",
      );
    }

    // Verify reset token
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(resetToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired reset token.');
    }

    // Check if token is for password reset
    if (payload.purpose !== 'password_reset') {
      throw new UnauthorizedException('Invalid reset token.');
    }

    // Find user
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, phone: payload.phone },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Update password
    const hashedPassword = await SecretUtils.hash(newPassword);
    user.password = hashedPassword;
    await this.userRepository.save(user);

    return 'Password reset successfully. You can now login with your new password.';
  };

  // Resend verification code
  resendVerificationCode = async (
    phone: string,
    type: EOtpType,
  ): Promise<string> => {
    const normalizedPhone = PhoneUtils.normalize(phone);
    const user = await this.userRepository.findOne({
      where: { phone: normalizedPhone },
    });
    if (!user) {
      throw new NotFoundException(`User with phone ${phone} not found.`);
    }

    // For account verification, check if already verified
    if (type === EOtpType.VERIFICATION && user.isVerified) {
      throw new BadRequestException('Account is already verified.');
    }

    // Delete any existing unused OTPs of the same type
    await this.otpRepository.delete({
      userId: user.id,
      type: type,
      isUsed: false,
    });

    // Generate and send new OTP
    const otp = new Otp();
    let code: string = Generators.generateOtpCode();
    otp.code = await SecretUtils.hash(code);
    otp.isUsed = false;
    otp.type = type;
    otp.user = user;
    otp.userId = user.id;
    await this.otpRepository.save(otp);

    // Send the code via appropriate channel
    if (type === EOtpType.VERIFICATION) {
      this.smsService.sendVerificationSms(user.phone, code).catch((error) => {
        this.logger.error(
          `Failed to send verification SMS to ${user.phone}: ${error.message}`,
        );
      });

      if (user.email) {
        this.emailService
          .sendVerificationEmail(user.email, user.fullNames, code)
          .catch((error) => {
            this.logger.error(
              `Failed to send verification email to ${user.email}: ${error.message}`,
            );
          });
      }
    } else if (type === EOtpType.PASSWORD_RESET) {
      this.smsService.sendPasswordResetSms(user.phone, code).catch((error) => {
        this.logger.error(
          `Failed to send password reset SMS to ${user.phone}: ${error.message}`,
        );
      });

      if (user.email) {
        this.emailService
          .sendPasswordResetEmail(user.email, user.fullNames, code)
          .catch((error) => {
            this.logger.error(
              `Failed to send password reset email to ${user.email}: ${error.message}`,
            );
          });
      }
    }

    return `Verification code sent successfully to ${user.phone}.`;
  };
}
