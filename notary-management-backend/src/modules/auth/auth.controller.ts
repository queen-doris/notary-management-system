/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/shared/entities/user.entity';
import { StaffLoginDto } from './dto/staff-login.dto';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';
import { SelectBusinessDto } from './dto/select-business.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with phone and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('staff-login')
  @ApiOperation({ summary: 'Login with business staff code' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async staffLogin(@Body() dto: StaffLoginDto) {
    return this.authService.staffLogin(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(
    @CurrentUser()
    user: User & {
      businessId?: string;
      businessRoles?: string[];
      membershipCount?: number;
    },
  ) {
    const businessRoles = Array.isArray(user.businessRoles)
      ? user.businessRoles.filter((role): role is EBusinessRole =>
          Object.values(EBusinessRole).includes(role as EBusinessRole),
        )
      : undefined;
    return this.authService.getMe({
      id: user.id,
      businessId: user.businessId,
      businessRoles,
      membershipCount: user.membershipCount,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('select-business')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Select active business for session' })
  @ApiResponse({ status: 200, description: 'Active business set' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async selectBusiness(
    @CurrentUser() user: User,
    @Body() dto: SelectBusinessDto,
  ) {
    return this.authService.selectBusiness(user.id, dto.businessId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change password (requires current password)' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or invalid current password',
  })
  @ApiResponse({ status: 400, description: 'Passwords do not match' })
  async changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ) {
    const result = await this.authService.changePassword(user.id, dto);
    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: '/auth/change-password',
      data: null,
      message: result,
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP' })
  @ApiResponse({ status: 200, description: 'Reset code sent if phone exists' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(dto);
    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: '/auth/forgot-password',
      data: null,
      message: result,
    };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP for password reset or account verification',
  })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password after OTP verification' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid token or passwords do not match',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(dto);
    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: '/auth/reset-password',
      data: null,
      message: result,
    };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification code' })
  @ApiResponse({ status: 200, description: 'Verification code sent' })
  @ApiResponse({ status: 400, description: 'Account already verified' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    const result = await this.authService.resendVerificationCode(
      dto.phone,
      dto.type,
    );
    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: '/auth/resend-verification',
      data: null,
      message: result,
    };
  }
}
