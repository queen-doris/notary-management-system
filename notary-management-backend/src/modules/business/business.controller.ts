/* eslint-disable prettier/prettier */
 /* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */

/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Patch,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  ParseBoolPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiParam,
  ApiForbiddenResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { EUserRole } from 'src/shared/enums/user-role.enum';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/shared/entities/user.entity';
import { BusinessService } from './business.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AddPaymentMethodDto } from './dto/add-payment-method.dto';
import { UpdateBusinessHoursDto } from './dto/update-business-hours.dto';
import { UpdateBusinessLocationDto } from './dto/update-business-location.dto';
import { PutOnLeaveDTO } from './dto/put-on-leave.dto';
import { BusinessQueryDto } from './dto/business-query.dto';
import { UpdateNotaryProfileDto } from './dto/update-notary-profile.dto';
import { Business } from 'src/shared/entities/business.entity';
import { EWorkingDays } from 'src/shared/enums/working-days.enum';

type RegisterBusinessDto = Partial<Business> & {
  businessRegistrationNumber: string;
  tinNumber: string;
  workingDays?: EWorkingDays[];
  timezone?: string;
  healthPermitExpiry?: string | Date;
};

type UpdateBusinessDto = Partial<Business>;

@ApiTags('Business Management')
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  // ==================== BUSINESS REGISTRATION & BASIC CRUD ====================

  @Post('register-business')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Register a new business',
    description: 'Allows a business owner to register their business details',
  })
  @ApiBody({
    description: 'Business registration details',
    examples: {
      example1: {
        summary: 'Complete business registration',
        value: {
          businessName: 'Tech Solutions Rwanda Ltd',
          businessType: 'TECHNOLOGY',
          businessRegistrationNumber: 'REG-2024-00123',
          tinNumber: 'TIN-123456789',
          province: 'Kigali',
          district: 'Gasabo',
          sector: 'Kimihurura',
          cell: 'Urugano',
          email: 'info@techsolutions.rw',
          phone: '+250788123456',
          workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          openingTime: '08:00:00',
          closingTime: '18:00:00',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Business registered successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Not a business owner' })
  @ApiNotFoundResponse({ description: 'Business owner not found' })
  @ApiConflictResponse({
    description:
      'Business already registered or duplicate registration number/TIN',
  })
  async registerBusiness(
    @CurrentUser() user: User,
    @Body() dto: RegisterBusinessDto,
  ) {
    return this.businessService.registerBusiness(user.id, dto);
  }

  @Get('my-businesses/:businessId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Get single business by ID',
    description: 'Retrieves detailed information about a specific business',
  })
  @ApiParam({ name: 'businessId', description: 'Business ID', type: 'string' })
  @ApiOkResponse({ description: 'Business retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Business not found' })
  @ApiForbiddenResponse({
    description: 'You can only view your own businesses',
  })
  async getBusinessById(
    @CurrentUser() user: User,
    @Param('businessId', ParseUUIDPipe) businessId: string,
  ) {
    return this.businessService.getBusinessById(user.id, businessId);
  }

  @Get('/by-id/:businessId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get single business by ID',
    description: 'Retrieves detailed information about a specific business',
  })
  @ApiParam({ name: 'businessId', description: 'Business ID', type: 'string' })
  @ApiOkResponse({ description: 'Business retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Business not found' })
  @ApiForbiddenResponse({
    description: 'You can only view your own businesses',
  })
  async byId(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return this.businessService.byId(businessId);
  }

  @Put('my-businesses/:businessId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Update business details',
    description: 'Updates business information for the authenticated owner',
  })
  @ApiParam({ name: 'businessId', description: 'Business ID', type: 'string' })
  @ApiOkResponse({ description: 'Business updated successfully' })
  @ApiNotFoundResponse({ description: 'Business not found' })
  @ApiForbiddenResponse({
    description: 'You can only update your own businesses',
  })
  @ApiConflictResponse({ description: 'Email or phone already exists' })
  async updateBusiness(
    @CurrentUser() user: User,
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body() dto: UpdateBusinessDto,
  ) {
    return this.businessService.updateBusiness(user.id, businessId, dto);
  }

  @Patch('my-businesses/:businessId/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(EUserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Deactivate business',
    description: 'Deactivates a business (soft delete)',
  })
  @ApiParam({ name: 'businessId', description: 'Business ID', type: 'string' })
  @ApiOkResponse({ description: 'Business deactivated successfully' })
  @ApiNotFoundResponse({ description: 'Business not found' })
  @ApiForbiddenResponse({
    description: 'You can only deactivate your own businesses',
  })
  async deactivateBusiness(
    @CurrentUser() user: User,
    @Param('businessId', ParseUUIDPipe) businessId: string,
  ) {
    return this.businessService.deactivateBusiness(user.id, businessId);
  }

  @Patch('my-businesses/:businessId/reactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(EUserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Reactivate business',
    description: 'Reactivates a previously deactivated business',
  })
  @ApiParam({ name: 'businessId', description: 'Business ID', type: 'string' })
  @ApiOkResponse({ description: 'Business reactivated successfully' })
  @ApiNotFoundResponse({ description: 'Business not found' })
  @ApiForbiddenResponse({
    description: 'You can only reactivate your own businesses',
  })
  async reactivateBusiness(
    @CurrentUser() user: User,
    @Param('businessId', ParseUUIDPipe) businessId: string,
  ) {
    return this.businessService.reactivateBusiness(user.id, businessId);
  }

  @Get('my-statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Get business statistics',
    description: 'Retrieves business statistics for the authenticated owner',
  })
  @ApiOkResponse({ description: 'Statistics retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Business owner not found' })
  async getMyBusinessStatistics(@CurrentUser() user: User) {
    return this.businessService.getMyBusinessStatistics(user.id);
  }

  // ==================== BUSINESS HOURS & SCHEDULE ====================

  @Put('my-businesses/:businessId/hours')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Update business hours',
    description: 'Updates business opening hours and working days',
  })
  @ApiParam({ name: 'businessId', description: 'Business ID', type: 'string' })
  @ApiOkResponse({ description: 'Business hours updated successfully' })
  @ApiNotFoundResponse({ description: 'Business not found' })
  @ApiForbiddenResponse({
    description: 'You can only update your own business hours',
  })
  @ApiBadRequestResponse({
    description: 'Invalid time format or opening time after closing time',
  })
  async updateBusinessHours(
    @CurrentUser() user: User,
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body() dto: UpdateBusinessHoursDto,
  ) {
    return this.businessService.updateBusinessHours(user.id, businessId, dto);
  }

  @Get(':businessId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Check if business is currently open',
    description:
      'Checks if a business is currently open based on working hours and days',
  })
  @ApiParam({ name: 'businessId', description: 'Business ID', type: 'string' })
  @ApiOkResponse({ description: 'Business status retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Business not found' })
  async isBusinessOpen(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return this.businessService.isBusinessOpen(businessId);
  }

  // ==================== PUBLIC ENDPOINTS (No Auth Required) ====================

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get all businesses',
    description: 'Search businesses by various criteria (public endpoint)',
  })
  @ApiOkResponse({ description: 'Businesses retrieved successfully' })
  async searchBusinesses(@Query() queryDto: BusinessQueryDto) {
    return this.businessService.getAllBusinesses(queryDto);
  }

  // ==================== LOCATION MANAGEMENT ====================

  @Put('my-businesses/:businessId/location')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Update business location',
    description: 'Updates the location details of a business',
  })
  @ApiParam({ name: 'businessId', description: 'Business ID', type: 'string' })
  @ApiOkResponse({ description: 'Business location updated successfully' })
  @ApiNotFoundResponse({ description: 'Business not found' })
  @ApiForbiddenResponse({
    description: 'You can only update your own business location',
  })
  async updateBusinessLocation(
    @CurrentUser() user: User,
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body() dto: UpdateBusinessLocationDto,
  ) {
    return this.businessService.updateBusinessLocation(
      user.id,
      businessId,
      dto,
    );
  }

  // ==================== ANALYTICS & REPORTING ====================

  @Get('my-businesses/:businessId/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Get business analytics',
    description: 'Retrieves detailed analytics for a business',
  })
  @ApiParam({ name: 'businessId', description: 'Business ID', type: 'string' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for analytics (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for analytics (ISO string)',
  })
  @ApiOkResponse({ description: 'Business analytics retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Business not found' })
  @ApiForbiddenResponse({
    description: 'You can only view analytics for your own businesses',
  })
  async getBusinessAnalytics(
    @CurrentUser() user: User,
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dateRange =
      startDate && endDate
        ? {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          }
        : undefined;

    return this.businessService.getBusinessAnalytics(
      user.id,
      businessId,
      dateRange,
    );
  }

  @Get('/statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(EUserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Get business statistics (Superadmin only)',
    description:
      'Retrieves comprehensive business statistics for admin dashboard',
  })
  @ApiOkResponse({ description: 'Business statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not a superadmin' })
  async getBusinessStatistics() {
    return this.businessService.getBusinessStatistics();
  }

  @Get('/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(EUserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Get system analytics (Superadmin only)',
    description:
      'System-wide analytics for the superadmin dashboard: business ' +
      'counts (active/verified/secretariat/recent), user counts (by ' +
      'status, system role, verification, membership, recent), membership ' +
      'breakdown (by business role and employment status, clocked-in), ' +
      'leave totals, and aggregates (avg members/business, top businesses ' +
      'by staff, recent businesses).',
  })
  @ApiOkResponse({ description: 'System analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not a superadmin' })
  async getSystemAnalytics() {
    return this.businessService.getSystemAnalytics();
  }

  @Get('/notary-profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Get Minijust cover-letter profile',
    description:
      'Returns the notary identity used on the Minijust report letter (name, title, oath date, recipient) plus the district/sector/phone/email reused from the business.',
  })
  @ApiOkResponse({ description: 'Notary profile retrieved' })
  async getNotaryProfile(@CurrentUser() user: User) {
    return this.businessService.getNotaryProfile(user.id);
  }

  @Put('/notary-profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Update Minijust cover-letter profile',
    description:
      'Set the notary name, title, oath date ("Itariki yo Kurahira") and letter recipient once; every Minijust export reuses them.',
  })
  @ApiBody({ type: UpdateNotaryProfileDto })
  @ApiOkResponse({ description: 'Notary profile updated' })
  async updateNotaryProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateNotaryProfileDto,
  ) {
    return this.businessService.updateNotaryProfile(user.id, dto);
  }

  @Post('/notary-profile/signature')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload the notary signature image',
    description:
      'Upload a signature image file (png/jpg). It is stored and embedded above the closing block on every Minijust letter.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ description: 'Signature uploaded' })
  async uploadNotarySignature(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.businessService.uploadNotarySignature(user.id, file);
  }

  @Get('/workers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Get business workers',
    description:
      'Returns members grouped into per-role buckets: `owners`, ' +
      '`accountants`, `secretariats`, `receptionists`. Each bucket is an ' +
      'array with its own `pagination`. A member with multiple roles ' +
      'appears in each matching bucket. Pass `role` to return only one ' +
      'bucket. Sensitive fields (e.g. password) are stripped.',
  })
  @ApiOkResponse({ description: 'Business workers retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Unknown role filter value' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: EBusinessRole,
    description:
      'Optional. Return only one role bucket (case-insensitive, e.g. ' +
      'ACCOUNTANT). Omit to get all buckets.',
  })
  async getWorkers(
    @CurrentUser() user: User,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('role') role?: EBusinessRole,
  ) {
    const validatedPage = Math.max(1, parseInt(page as any) || 1);
    const validatedLimit = Math.min(
      Math.max(1, parseInt(limit as any) || 10),
      100,
    );

    return this.businessService.getBusinessWorkersP(
      user.id,
      validatedPage,
      validatedLimit,
      role,
    );
  }

  @Get('/worker/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get business worker',
    description: 'Retrieves worker',
  })
  @ApiOkResponse({ description: 'Business worker retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getWorker(@Param('id') id: string) {
    return this.businessService.getWorkerById(id);
  }

  @Put('/fire/:workerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Fire business worker',
  })
  @ApiOkResponse({ description: 'Business worker fired successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async fire(@CurrentUser() user: User, @Param('workerId') workerId: string) {
    return this.businessService.fire(user.id, workerId);
  }

  @Put('/leave/:workerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Put business worker on leave',
  })
  @ApiOkResponse({ description: 'Business worker put on leave successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async putOnLeave(
    @CurrentUser() user: User,
    @Param('workerId') workerId: string,
    @Body() putOnLeaveDto: PutOnLeaveDTO,
  ) {
    return this.businessService.putOnLeave(user.id, workerId, putOnLeaveDto);
  }

  @Put('/suspend/:workerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Suspend business worker',
  })
  @ApiOkResponse({ description: 'Business worker suspended successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async suspend(
    @CurrentUser() user: User,
    @Param('workerId') workerId: string,
  ) {
    return this.businessService.suspend(user.id, workerId);
  }

  @Put('/reactivate/:workerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Reactivate business worker',
  })
  @ApiOkResponse({ description: 'Business worker reactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async reactivate(
    @CurrentUser() user: User,
    @Param('workerId') workerId: string,
  ) {
    return this.businessService.reactivate(user.id, workerId);
  }

  @Put('/deactivate/:workerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Deactivate business worker',
    description:
      'Deactivates a worker, preventing them from logging in or using the system. Users cannot deactivate themselves.',
  })
  @ApiOkResponse({ description: 'Business worker deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 400, description: 'Cannot deactivate yourself' })
  async deactivate(
    @CurrentUser() user: User,
    @Param('workerId') workerId: string,
  ) {
    return this.businessService.deactivate(user.id, workerId);
  }

  @Get('/worker/:userId/leaves')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get all Leaves',
  })
  @ApiOkResponse({ description: 'Leaves retrieved successfully' })
  async getLeaves(@Param('userId') userId: string) {
    return this.businessService.getUsersLeaves(userId);
  }
}
