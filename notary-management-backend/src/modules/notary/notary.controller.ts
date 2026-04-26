/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NotaryService } from './notary.service';
import { ServeClientDto } from './dto/serve-client.dto';
import { RejectClientDto } from './dto/reject-client.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest } from 'src/shared/interfaces/request.interface';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';

@Controller('notary')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotaryController {
  constructor(private readonly notaryService: NotaryService) {}

  /**
   * Serve a client - create permanent record
   * Only OWNER can serve (notary is the owner)
   */
  @Post('serve')
  @Roles(EBusinessRole.OWNER) // Only business owner can serve clients
  async serveClient(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ServeClientDto,
  ) {
    return this.notaryService.serveClient(
      req.user.business_id,
      req.user.id,
      req.user.role,
      req.user.business_roles || [],
      dto,
    );
  }

  /**
   * Reject a client - no record created
   * Only OWNER can reject
   */
  @Post('reject')
  @Roles(EBusinessRole.OWNER) // Only business owner can reject clients
  async rejectClient(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RejectClientDto,
  ) {
    return this.notaryService.rejectClient(
      req.user.business_id,
      req.user.id,
      req.user.role,
      req.user.business_roles || [],
      dto,
    );
  }

  /**
   * Get all records (for reports)
   */
  @Get('records')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT) // Only business owner and secretariat can view all records
  async getAllRecords(
    @Req() req: AuthenticatedRequest,
    @Query('book_type') bookType?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('client_id') clientId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notaryService.getAllRecords(req.user.business_id, {
      book_type: bookType as any,
      start_date: startDate,
      end_date: endDate,
      client_id: clientId,
      page,
      limit,
    });
  }

  /**
   * Get record by ID
   */
  @Get('records/:id')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT) // Allow receptionist and secretariat to view individual records
  async getRecord(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.notaryService.getRecord(id, req.user.business_id);
  }

  /**
   * Get records for a specific client
   */
  @Get('clients/:clientId/records')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT) // Allow receptionist and secretariat to view client records
  async getClientRecords(
    @Req() req: AuthenticatedRequest,
    @Param('clientId') clientId: string,
  ) {
    return this.notaryService.getClientRecords(clientId, req.user.business_id);
  }
}
