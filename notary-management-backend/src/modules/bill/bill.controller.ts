/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BillService } from './bill.service';
import { CreateBillDto } from './dto/create-bill.dto';
import {
  UpdateBillStatusDto,
    MarkBillPaidDto,
} from './dto/update-bill-status.dto';
import { AddItemsToBillDto } from './dto/add-items.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthenticatedRequest } from 'src/shared/interfaces/request.interface';
import { ApiBearerAuth } from '@nestjs/swagger/dist/decorators/api-bearer.decorator';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';

@Controller('bills')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class BillController {
  constructor(private readonly billService: BillService) {}

  /**
   * Create a new bill (Notary, Secretariat, or Both)
   * Roles: receptionist, notary, secretariat, business_owner
   */
  @Post()
    @Roles( EBusinessRole.RECEPTIONIST, EBusinessRole.SECRETARIAT, EBusinessRole.OWNER)
  async createBill(@Req() req: AuthenticatedRequest, @Body() dto: CreateBillDto) {
    return this.billService.createBill(
      req.user.id,
      req.user.businessId,
      req.user.is_staff || false,
      req.user.role,
      dto,
    );
  }

  /**
   * Add items to existing bill
   * Roles: receptionist, notary, secretariat, business_owner
   */
  @Post('add-items')
  @Roles(EBusinessRole.RECEPTIONIST, EBusinessRole.SECRETARIAT, EBusinessRole.OWNER)
  async addItemsToBill(@Req() req: AuthenticatedRequest, @Body() dto: AddItemsToBillDto) {
    return this.billService.addItemsToBill(
      dto.bill_id,
      req.user.businessId,
      req.user.id,
      req.user.role,
      dto.notary_items,
      dto.secretariat_items,
    );
  }

  /**
   * Get all bills (with filters)
   * Roles: business_owner, notary, accountant, secretariat
   */
  @Get()
  @Roles(EBusinessRole.RECEPTIONIST, EBusinessRole.SECRETARIAT, EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT)
  async getAllBills(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('bill_type') billType?: string,
    @Query('client_id') clientId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.billService.getAllBills(req.user.businessId, {
      status: status as any,
      bill_type: billType as any,
      client_id: clientId,
      start_date: startDate,
      end_date: endDate,
      page,
      limit,
    });
  }

  /**
   * Get pending bills (for accountant)
   * Roles: accountant, business_owner
   */
  @Get('pending')
    @Roles(EBusinessRole.ACCOUNTANT, EBusinessRole.OWNER, EBusinessRole.SECRETARIAT, EBusinessRole.RECEPTIONIST)
  async getPendingBills(@Req() req: AuthenticatedRequest) {
    return this.billService.getPendingBills(req.user.businessId);
  }

  /**
   * Get paid bills awaiting service (for notary)
   * Roles: notary, business_owner
   */
  @Get('paid-unserved')
  async getPaidUnservedBills(@Req() req: AuthenticatedRequest) {
    return this.billService.getPaidUnservedBills(req.user.businessId);
  }

  /**
   * Get bill by ID
   */
  @Get(':id')
      @Roles(EBusinessRole.ACCOUNTANT, EBusinessRole.OWNER, EBusinessRole.SECRETARIAT, EBusinessRole.RECEPTIONIST)
  async getBillById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.billService.getBillById(id, req.user.businessId);
  }

  /**
   * Get bill by bill number
   */
  @Get('number/:billNumber')
      @Roles(EBusinessRole.ACCOUNTANT, EBusinessRole.OWNER, EBusinessRole.SECRETARIAT, EBusinessRole.RECEPTIONIST)

  async getBillByNumber(@Req() req: AuthenticatedRequest, @Param('billNumber') billNumber: string) {
    return this.billService.getBillByNumber(billNumber, req.user.businessId);
  }

  /**
   * Update bill status (paid, served, rejected, refunded)
   */
@Patch(':id/status')
    @Roles(EBusinessRole.ACCOUNTANT, EBusinessRole.OWNER, EBusinessRole.SECRETARIAT, EBusinessRole.RECEPTIONIST)

async updateBillStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateBillStatusDto,
) {
    return this.billService.updateBillStatus(
        id,                      // billId
        req.user.businessId,    // businessId
        req.user.id,             // userId
        req.user.role,           // userRole
        dto,                     // dto
    );
}

  /**
   * Get bill statistics for dashboard
   */
  @Get('stats/dashboard')
      @Roles(EBusinessRole.ACCOUNTANT, EBusinessRole.OWNER, EBusinessRole.SECRETARIAT, EBusinessRole.RECEPTIONIST)
  async getBillStats(@Req() req: AuthenticatedRequest, @Query('date') date?: string) {
    return this.billService.getBillStats(req.user.businessId, date);
  }
}
