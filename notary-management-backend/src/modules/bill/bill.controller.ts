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

@Controller('bills')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillController {
  constructor(private readonly billService: BillService) {}

  /**
   * Create a new bill (Notary, Secretariat, or Both)
   * Roles: receptionist, notary, secretariat, business_owner
   */
  @Post()
  async createBill(@Req() req: AuthenticatedRequest, @Body() dto: CreateBillDto) {
    return this.billService.createBill(
      req.user.id,
      req.user.business_id,
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
  async addItemsToBill(@Req() req: AuthenticatedRequest, @Body() dto: AddItemsToBillDto) {
    return this.billService.addItemsToBill(
      dto.bill_id,
      req.user.business_id,
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
    return this.billService.getAllBills(req.user.business_id, {
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
  async getPendingBills(@Req() req: AuthenticatedRequest) {
    return this.billService.getPendingBills(req.user.business_id);
  }

  /**
   * Get paid bills awaiting service (for notary)
   * Roles: notary, business_owner
   */
  @Get('paid-unserved')
  async getPaidUnservedBills(@Req() req: AuthenticatedRequest) {
    return this.billService.getPaidUnservedBills(req.user.business_id);
  }

  /**
   * Get bill by ID
   */
  @Get(':id')
  async getBillById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.billService.getBillById(id, req.user.business_id);
  }

  /**
   * Get bill by bill number
   */
  @Get('number/:billNumber')
  async getBillByNumber(@Req() req: AuthenticatedRequest, @Param('billNumber') billNumber: string) {
    return this.billService.getBillByNumber(billNumber, req.user.business_id);
  }

  /**
   * Update bill status (paid, served, rejected, refunded)
   */
@Patch(':id/status')
async updateBillStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateBillStatusDto,
) {
    return this.billService.updateBillStatus(
        id,                      // billId
        req.user.business_id,    // businessId
        req.user.id,             // userId
        req.user.role,           // userRole
        dto,                     // dto
    );
}

  /**
   * Get bill statistics for dashboard
   */
  @Get('stats/dashboard')
  async getBillStats(@Req() req: AuthenticatedRequest, @Query('date') date?: string) {
    return this.billService.getBillStats(req.user.business_id, date);
  }
}
