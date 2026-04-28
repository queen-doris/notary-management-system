import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { BillService } from './bill.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillStatusDto } from './dto/update-bill-status.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { RejectBillDto } from './dto/reject-bill.dto';
import { ServeBillDto } from './dto/serve-bill.dto';
import { ReportFiltersDto } from './dto/report-filters.dto';
import {
  BillResponseDto,
  PaginatedResponseDto,
  FinancialReportDto,
  MinijustReportDto,
} from './dto/bill-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EBusinessRole } from '../../shared/enums/business-role.enum';
import { BillStatus, BillType } from '../../shared/enums/bill-status.enum';
import { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';

@ApiTags('Bills')
@Controller('bills')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BillController {
  constructor(private readonly billService: BillService) {}

  // ==================== Bill CRUD ====================

  @Post()
  @Roles(
    EBusinessRole.OWNER,
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
  )
  @ApiOperation({
    summary: 'Create a new bill',
    description:
      'Creates a bill for a client with notary and/or secretariat services. VAT is auto-calculated for notary services.',
  })
  @ApiBody({ type: CreateBillDto })
  @ApiCreatedResponse({
    description: 'Bill created successfully',
    type: BillResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'Client or business not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiConflictResponse({
    description: 'Client already has an active notary bill',
  })
  async createBill(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBillDto,
  ): Promise<BillResponseDto> {
    return this.billService.createBill(user.id, user.businessId, dto);
  }

  @Get()
  @Roles(
    EBusinessRole.OWNER,
    EBusinessRole.ACCOUNTANT,
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
  )
  @ApiOperation({
    summary: 'Get all bills',
    description: 'Retrieves bills with pagination and filters',
  })
  @ApiOkResponse({
    description: 'Bills retrieved successfully',
    type: PaginatedResponseDto,
  })
  async getAllBills(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filters: ReportFiltersDto,
  ): Promise<PaginatedResponseDto> {
    return this.billService.getBills(user.businessId, filters);
  }

  @Get(':id')
  @Roles(
    EBusinessRole.OWNER,
    EBusinessRole.ACCOUNTANT,
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
  )
  @ApiOperation({
    summary: 'Get bill by ID',
    description: 'Retrieves a single bill with all details',
  })
  @ApiParam({ name: 'id', description: 'Bill UUID', type: 'string' })
  @ApiOkResponse({
    description: 'Bill retrieved successfully',
    type: BillResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Bill not found' })
  async getBillById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BillResponseDto> {
    return this.billService.getBillById(id, user.businessId);
  }

  // ==================== Payment Management ====================

  @Post('payments')
  @Roles(EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Record a payment',
    description: 'Records a payment for a bill (full or partial)',
  })
  @ApiBody({ type: RecordPaymentDto })
  @ApiOkResponse({ description: 'Payment recorded successfully' })
  @ApiBadRequestResponse({
    description: 'Invalid payment amount or bill status',
  })
  @ApiNotFoundResponse({ description: 'Bill not found' })
  async recordPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RecordPaymentDto,
  ): Promise<{ message: string; payment: any; bill: any }> {
    return this.billService.recordPayment(user.id, user.businessId, dto);
  }

  @Get(':id/payments')
  @Roles(EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Get payment history',
    description: 'Retrieves all payments for a bill',
  })
  @ApiParam({ name: 'id', description: 'Bill UUID', type: 'string' })
  @ApiOkResponse({ description: 'Payment history retrieved successfully' })
  async getPaymentHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ bill: any; payments: any[] }> {
    return this.billService.getPaymentHistory(id, user.businessId);
  }

  // ==================== Status Management ====================

  @Patch('status')
  @Roles(EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Update bill status',
    description: 'Updates the status of a bill (paid, cancelled, etc.)',
  })
  @ApiBody({ type: UpdateBillStatusDto })
  @ApiOkResponse({
    description: 'Bill status updated successfully',
    type: BillResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid status transition' })
  async updateBillStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateBillStatusDto,
  ): Promise<BillResponseDto> {
    return this.billService.updateBillStatus(user.id, user.businessId, dto);
  }

  // ==================== Rejection & Refund ====================

  @Post('reject')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Reject a bill',
    description:
      'Rejects a bill, optionally processes a refund (full, half, or custom). No notary record is created.',
  })
  @ApiBody({ type: RejectBillDto })
  @ApiOkResponse({ description: 'Bill rejected successfully' })
  @ApiBadRequestResponse({ description: 'Invalid rejection data' })
  async rejectBill(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RejectBillDto,
  ): Promise<{ message: string; bill: any }> {
    return this.billService.rejectBill(user.id, user.businessId, dto);
  }

  // ==================== Serve Bill (Create Notary Record) ====================

  @Post('serve')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Serve a bill',
    description:
      'Marks a bill as served and creates a notary record. Only notary bills can be served.',
  })
  @ApiBody({ type: ServeBillDto })
  @ApiOkResponse({
    description: 'Bill served successfully. Notary record created.',
  })
  @ApiBadRequestResponse({ description: 'Invalid serve data or bill not paid' })
  async serveBill(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ServeBillDto,
  ): Promise<{ message: string; notary_record: any; bill: any }> {
    return this.billService.serveBill(user.id, user.businessId, dto);
  }

  // ==================== Reports ====================

  @Get('reports/minijust')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Generate Minijust report',
    description:
      'Generates the quarterly report for the Ministry of Justice with all required fields.',
  })
  @ApiOkResponse({
    description: 'Minijust report generated successfully',
    type: MinijustReportDto,
  })
  async getMinijustReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filters: ReportFiltersDto,
  ): Promise<MinijustReportDto> {
    return this.billService.getMinijustReport(user.businessId, filters);
  }

  @Get('reports/financial')
  @Roles(EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Generate financial report',
    description:
      'Generates a financial report for notary, secretariat, or combined services.',
  })
  @ApiQuery({
    name: 'type',
    enum: ['notary', 'secretariat', 'combined'],
    description: 'Report type',
  })
  @ApiOkResponse({
    description: 'Financial report generated successfully',
    type: FinancialReportDto,
  })
  async getFinancialReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filters: ReportFiltersDto,
    @Query('type') type: 'notary' | 'secretariat' | 'combined' = 'combined',
  ): Promise<FinancialReportDto> {
    return this.billService.getFinancialReport(user.businessId, filters, type);
  }

  @Get('reports/daily-sales')
  @Roles(EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Generate daily sales report',
    description:
      'Generates a daily sales report with payment method breakdown.',
  })
  @ApiOkResponse({ description: 'Daily sales report generated successfully' })
  async getDailySalesReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filters: ReportFiltersDto,
  ): Promise<any> {
    return this.billService.getDailySalesReport(user.businessId, filters);
  }

  // ==================== Pending Bills (For Specific Roles) ====================

  @Get('pending/accountant')
  @Roles(EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Get pending bills for accountant',
    description:
      'Retrieves all bills pending payment (PENDING and PARTIALLY_PAID)',
  })
  @ApiOkResponse({ description: 'Pending bills retrieved successfully' })
  async getPendingBillsForAccountant(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedResponseDto> {
    return this.billService.getBills(user.businessId, {
      status: BillStatus.PENDING,
      page: 1,
      limit: 100,
    });
  }

  @Get('pending/notary')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Get paid bills for notary',
    description: 'Retrieves all paid notary bills awaiting service',
  })
  @ApiOkResponse({ description: 'Paid bills retrieved successfully' })
  async getPaidBillsForNotary(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedResponseDto> {
    return this.billService.getBills(user.businessId, {
      status: BillStatus.PAID,
      bill_type: BillType.NOTARY,
      page: 1,
      limit: 100,
    });
  }
}
