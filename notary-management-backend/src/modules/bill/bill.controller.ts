/* eslint-disable @typescript-eslint/no-unused-vars */
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
  Delete,
  Put,
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
import {
  ServeBillDto,
  ServePreviewResponseDto,
} from './dto/serve-bill.dto';
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
import { ProcessRefundDto } from './dto/process-refund.dto';
import { RejectBillResponseDto } from './dto/bill-response.dto';
import { AddItemsToBillDto } from './dto/add-items.dto';
import {
  NotaryFinancialRecordDto,
  SecretariatFinancialRecordDto,
} from './dto/bill-response.dto';
import { BookType } from '../../shared/enums/book-type.enum';
import { NotaryRecord } from '../../shared/entities/notary-record.entity';
import { Refund } from '../../shared/entities/refund.entity';

@ApiTags('Bills')
@Controller('bills')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
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
    summary: 'Create a new bill (Easy Swagger)',
    description: `
Create a bill for a client.

✔ Use NOTARY → only notary_items  
✔ Use SECRETARIAT → only secretariat_items  
✔ Use BOTH → include both arrays  

VAT is automatically calculated for NOTARY items.
  `,
  })
  @ApiBody({
    type: CreateBillDto,
    examples: {
      notaryBill: {
        summary: 'Notary Bill Example',
        value: {
          client_id: 'd242893a-fc84-4649-b7f8-80efd64a2c52',
          bill_type: 'NOTARY',
          notary_items: [
            {
              service_id: 'optional-uuid',
              service_name: 'Power of Attorney',
              sub_service_name: 'General POA',
              quantity: 1,
              unit_price: 5000,
              notes: 'Urgent',
            },
          ],
          notes: 'Notary bill example',
        },
      },
      secretariatBill: {
        summary: 'Secretariat Bill Example',
        value: {
          client_id: 'd242893a-fc84-4649-b7f8-80efd64a2c52',
          bill_type: 'SECRETARIAT',
          secretariat_items: [
            {
              service_id: 'optional-uuid',
              service_name: 'Document Printing',
              quantity: 10,
              unit_price: 100,
              notes: 'Color prints',
            },
          ],
          notes: 'Secretariat bill example',
        },
      },
      combinedBill: {
        summary: 'Combined Bill Example (NOTARY + SECRETARIAT)',
        value: {
          client_id: 'd242893a-fc84-4649-b7f8-80efd64a2c52',
          bill_type: 'BOTH',
          notary_items: [
            {
              service_id: 'optional-uuid',
              service_name: 'Affidavit',
              sub_service_name: 'Sworn Statement',
              quantity: 1,
              unit_price: 3000,
            },
          ],
          secretariat_items: [
            {
              service_id: 'optional-uuid',
              service_name: 'Typing',
              quantity: 5,
              unit_price: 200,
            },
          ],
          notes: 'Combined services',
        },
      },
    },
  })
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

  // ==================== Refund Management ====================

  @Post('reject')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Reject a bill',
    description:
      'Rejects a bill, optionally creates a refund request. No notary record is created.',
  })
  @ApiBody({ type: RejectBillDto })
  @ApiOkResponse({ description: 'Bill rejected successfully' })
  @ApiBadRequestResponse({ description: 'Invalid rejection data' })
  async rejectBill(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RejectBillDto,
  ): Promise<RejectBillResponseDto> {
    return this.billService.rejectBill(
      user.id,
      user.businessId,
      user.role,
      user.businessRoles || [],
      dto,
    );
  }

  @Post('refunds/process')
  @Roles(EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Process a refund',
    description:
      'Processes a pending refund request and updates the bill status to REFUNDED.',
  })
  @ApiBody({ type: ProcessRefundDto })
  @ApiOkResponse({ description: 'Refund processed successfully' })
  async processRefund(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ProcessRefundDto,
  ): Promise<any> {
    return this.billService.processRefund(
      user.id,
      user.businessId,
      user.role,
      user.businessRoles || [],
      dto,
    );
  }
  @Get('refunds/pending')
  @Roles(EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Get pending refund requests',
    description: 'Retrieves all pending refund requests awaiting processing.',
  })
  @ApiOkResponse({ description: 'Pending refunds retrieved successfully' })
  async getPendingRefunds(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.billService.getPendingRefunds(
      user.businessId,
      user.id,
      user.role,
      user.businessRoles || [],
    );
  }
  @Delete('refunds/:refundId/cancel')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Cancel a refund request',
    description: 'Cancels a pending refund request.',
  })
  @ApiParam({ name: 'refundId', description: 'Refund UUID', type: 'string' })
  @ApiOkResponse({ description: 'Refund request cancelled successfully' })
  async cancelRefundRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('refundId', ParseUUIDPipe) refundId: string,
  ): Promise<any> {
    return this.billService.cancelRefundRequest(
      refundId,
      user.businessId,
      user.id,
      user.role,
      user.businessRoles || [],
    );
  }

  // ==================== Serve Bill (Create Notary Record) ====================

  @Get('serve-preview/:billId')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Preview serving a bill (step 1 of 2)',
    description:
      'Returns the suggested book volume, next record number and UPI for the owner to confirm or edit before the notary record is created. Performs NO writes — the book tracker is not advanced. Bill must be PAID or REJECTED and carry exactly one notary sub-service.',
  })
  @ApiParam({ name: 'billId', description: 'Bill UUID', type: 'string' })
  @ApiQuery({
    name: 'bookId',
    description: 'Target book UUID the record will be written into',
    type: 'string',
  })
  @ApiOkResponse({ type: ServePreviewResponseDto })
  @ApiBadRequestResponse({
    description: 'Bill not servable or has no notary item',
  })
  @ApiConflictResponse({
    description: 'A notary record already exists for this bill',
  })
  async getServePreview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('billId', ParseUUIDPipe) billId: string,
    @Query('bookId', ParseUUIDPipe) bookId: string,
  ): Promise<ServePreviewResponseDto> {
    return this.billService.getServePreview(
      user.id,
      user.businessId,
      billId,
      bookId,
    );
  }

  @Post('serve')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Serve a bill (step 2 of 2)',
    description:
      'Creates the notary record from the confirmed (optionally edited) volume/number/UPI. Only the NOTARY part of the bill becomes a record. Bill must be PAID or REJECTED. Idempotent: returns 409 if the bill already has a notary record.',
  })
  @ApiBody({ type: ServeBillDto })
  @ApiCreatedResponse({
    description: 'Bill served successfully. Notary record created.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid serve data, bill not servable, or UPI required',
  })
  @ApiConflictResponse({
    description: 'A notary record already exists for this bill',
  })
  async serveBill(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ServeBillDto,
  ): Promise<{ message: string; notary_record: any; bill: any }> {
    return this.billService.serveBill(user.id, user.businessId, dto);
  }

  @Post('serve-secretariat')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  @ApiOperation({
    summary: 'Serve the secretariat part of a bill',
    description:
      'Creates one SecretariatRecord per secretariat item on a PAID/REJECTED bill. Idempotent: 409 if already served. Reject/refund use the standard /bills/reject and /bills/refunds/process endpoints.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['bill_id'],
      properties: {
        bill_id: { type: 'string', format: 'uuid' },
        notes: { type: 'string' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Secretariat records created' })
  @ApiConflictResponse({
    description: 'Secretariat records already exist for this bill',
  })
  async serveSecretariatBill(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: { bill_id: string; notes?: string },
  ) {
    return this.billService.serveSecretariatBill(
      user.id,
      user.businessId,
      dto,
    );
  }

  @Get('secretariat-records')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  @ApiOperation({
    summary: 'List secretariat records',
    description:
      'Paginated secretariat records with client/date filters.',
  })
  @ApiQuery({ name: 'start_date', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'end_date', required: false, example: '2026-12-31' })
  @ApiQuery({ name: 'client_id', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiOkResponse({ description: 'Secretariat records retrieved' })
  async getSecretariatRecords(
    @CurrentUser() user: AuthenticatedUser,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('client_id') clientId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.billService.getSecretariatRecords(user.businessId, {
      start_date: startDate,
      end_date: endDate,
      client_id: clientId,
      page,
      limit,
    });
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
    name: 'bill_type',
    enum: BillType,
    description: 'Report type',
  })
  @ApiOkResponse({
    description: 'Financial report generated successfully',
    type: FinancialReportDto,
  })
  async getFinancialReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filters: ReportFiltersDto,
  ): Promise<FinancialReportDto> {
    return this.billService.getFinancialReport(
      user.businessId,
      filters,
      filters.bill_type || BillType.BOTH,
    );
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
      statusIn: [BillStatus.PENDING, BillStatus.PARTIALLY_PAID],
      page: 1,
      limit: 100,
    });
  }

  // ==================== Add Items to Bill ====================

  @Post('add-items')
  @Roles(
    EBusinessRole.OWNER,
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
  )
  @ApiOperation({
    summary: 'Add items to existing bill',
    description: 'Adds notary and/or secretariat items to a pending bill.',
  })
  @ApiBody({ type: AddItemsToBillDto })
  @ApiOkResponse({
    description: 'Items added successfully',
    type: BillResponseDto,
  })
  async addItemsToBill(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddItemsToBillDto,
  ) {
    return this.billService.addItemsToBill(user.id, user.businessId, dto);
  }

  // ==================== Pending Bills by Type ====================

  @Get('pending/notary')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Get pending notary bills (owner only)',
    description:
      'Returns PAID notary/BOTH bills that are awaiting service. Only the notary (owner) can see these.',
  })
  @ApiOkResponse({ description: 'Pending notary bills retrieved' })
  @ApiForbiddenResponse({ description: 'Requires OWNER role' })
  async getPendingNotaryBills(@CurrentUser() user: AuthenticatedUser) {
    return this.billService.getPendingNotaryBills(user.businessId);
  }

  @Get('pending/secretariat')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  @ApiOperation({
    summary: 'Get pending secretariat bills',
    description: 'Returns paid bills awaiting secretariat service.',
  })
  async getPendingSecretariatBills(@CurrentUser() user: AuthenticatedUser) {
    return this.billService.getPendingSecretariatBills(user.businessId);
  }

  // ==================== Notary Records Management ====================

  @Get('notary-records')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Get notary records',
    description: 'Returns all notary records with filters.',
  })
  @ApiQuery({ name: 'book_type', required: false, enum: BookType })
  @ApiQuery({ name: 'start_date', required: false, type: 'string' })
  @ApiQuery({ name: 'end_date', required: false, type: 'string' })
  @ApiQuery({ name: 'client_id', required: false, type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  async getNotaryRecords(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: any,
  ) {
    return this.billService.getNotaryRecords(user.id, user.businessId, {
      book_type: query.book_type,
      start_date: query.start_date,
      end_date: query.end_date,
      client_id: query.client_id,
      page: query.page,
      limit: query.limit,
    });
  }

  @Put('notary-records/:recordId')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Update notary record',
    description: 'Updates an existing notary record.',
  })
  @ApiParam({ name: 'recordId', description: 'Notary Record UUID' })
  async updateNotaryRecord(
    @CurrentUser() user: AuthenticatedUser,
    @Param('recordId') recordId: string,
    @Body() dto: Partial<NotaryRecord>,
  ) {
    return this.billService.updateNotaryRecord(
      recordId,
      user.businessId,
      user.id,
      user.role,
      user.businessRoles || [],
      dto,
    );
  }

  // ==================== Financial Reports (Separated) ====================

  @Get('reports/financial/notary')
  @Roles(EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Generate notary financial report',
    description:
      'Returns detailed notary financial report with all transactions.',
  })
  async getNotaryFinancialReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filters: ReportFiltersDto,
  ) {
    return this.billService.getNotaryFinancialReport(user.businessId, filters);
  }

  @Get('reports/financial/secretariat')
  @Roles(EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Generate secretariat financial report',
    description:
      'Returns detailed secretariat financial report. All amounts are NET of refunds (gross/refunds/net reconcile). Supports date range, group_by (day/month/quarter/year), client, payment method and service name filters. Returns 403 if the business does not offer secretariat services.',
  })
  @ApiForbiddenResponse({
    description: 'Business does not offer secretariat services',
  })
  async getSecretariatFinancialReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filters: ReportFiltersDto,
  ) {
    return this.billService.getSecretariatFinancialReport(
      user.businessId,
      filters,
    );
  }

  // ==================== Dashboard Statistics ====================

  @Get('stats/dashboard')
  @Roles(EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      'Returns comprehensive dashboard statistics including today, pending, and monthly metrics.',
  })
  async getDashboardStatistics(@CurrentUser() user: AuthenticatedUser) {
    return this.billService.getDashboardStatistics(user.businessId);
  }

  // ==================== Refund Management ====================

  @Get('refunds/all')
  @Roles(EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Get all refunds',
    description: 'Returns all refunds with filters.',
  })
  async getAllRefunds(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: any,
  ) {
    return this.billService.getAllRefunds(user.businessId, {
      status: query.status,
      start_date: query.start_date,
      end_date: query.end_date,
      page: query.page,
      limit: query.limit,
    });
  }

  @Put('refunds/:refundId')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Update refund request',
    description: 'Updates a pending refund request.',
  })
  @ApiParam({ name: 'refundId', description: 'Refund UUID' })
  async updateRefundRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('refundId') refundId: string,
    @Body() dto: Partial<Refund>,
  ) {
    return this.billService.updateRefundRequest(
      refundId,
      user.businessId,
      user.id,
      user.role,
      user.businessRoles || [],
      dto,
    );
  }

  // ==================== Payment Management ====================

  @Get('payments/all')
  @Roles(EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Get all payments',
    description: 'Returns all payments with filters.',
  })
  async getAllPayments(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: any,
  ) {
    return this.billService.getAllPayments(user.businessId, {
      method: query.method,
      start_date: query.start_date,
      end_date: query.end_date,
      page: query.page,
      limit: query.limit,
    });
  }

  // ==================== Single Bill (catch-all :id routes, declared
  // LAST so static paths like /notary-records resolve first) ============

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
}
