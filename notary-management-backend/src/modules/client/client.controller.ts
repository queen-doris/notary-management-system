import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { SearchClientDto } from './dto/search-client.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';
import { AuthenticatedRequest } from 'src/shared/interfaces/request.interface';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  /**
   * Create a new client
   * Roles: receptionist, notary, business_owner (everyone except accountant)
   */
  @Post()
  @Roles(
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
    EBusinessRole.OWNER,
  )
  async createClient(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateClientDto,
  ) {
    return this.clientService.createClient(
      req.user.business_id,
      req.user.id,
      dto,
    );
  }

  /**
   * Search clients
   * Roles: everyone except accountant
   */
  @Get('search')
  @Roles(
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
    EBusinessRole.OWNER,
  )
  async searchClients(
    @Req() req: AuthenticatedRequest,
    @Query() searchDto: SearchClientDto,
  ) {
    return this.clientService.searchClients(req.user.business_id, searchDto);
  }

  /**
   * Get client by ID
   * Roles: everyone except accountant
   */
  @Get(':id')
  @Roles(
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
    EBusinessRole.OWNER,
  )
  async getClientById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.clientService.getClientById(id, req.user.business_id);
  }

  /**
   * Get client by ID number
   * Roles: everyone except accountant
   */
  @Get('id-number/:idNumber')
  @Roles(
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
    EBusinessRole.OWNER,
  )
  async getClientByIdNumber(
    @Req() req: AuthenticatedRequest,
    @Param('idNumber') idNumber: string,
  ) {
    return this.clientService.getClientByIdNumber(
      idNumber,
      req.user.business_id,
    );
  }

  /**
   * Get client by phone
   * Roles: everyone except accountant
   */
  @Get('phone/:phone')
  @Roles(
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
    EBusinessRole.OWNER,
  )
  async getClientByPhone(
    @Req() req: AuthenticatedRequest,
    @Param('phone') phone: string,
  ) {
    return this.clientService.getClientByPhone(phone, req.user.business_id);
  }

  /**
   * Update client
   * Roles: receptionist, notary, business_owner
   */
  @Put(':id')
  @Roles(
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
    EBusinessRole.OWNER,
  )
  async updateClient(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientService.updateClient(
      id,
      req.user.business_id,
      req.user.id,
      req.user.role as EBusinessRole,
      dto,
    );
  }

  /**
   * Verify client
   * Roles: notary, business_owner
   */
  @Patch(':id/verify')
  @Roles(
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.OWNER,
    EBusinessRole.SECRETARIAT,
  )
  async verifyClient(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('notes') notes?: string,
  ) {
    return this.clientService.verifyClient(
      id,
      req.user.business_id,
      req.user.id,
      req.user.role as EBusinessRole,
      notes,
    );
  }

  /**
   * Deactivate client
   * Roles: notary, business_owner
   */
  @Delete(':id')
  @Roles(
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.OWNER,
    EBusinessRole.SECRETARIAT,
  )
  async deactivateClient(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.clientService.deactivateClient(
      id,
      req.user.business_id,
      req.user.role as EBusinessRole,
    );
  }

  /**
   * Get client statistics for dashboard
   * Roles: business_owner, notary
   */
  @Get('stats/dashboard')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  async getClientStats(@Req() req: AuthenticatedRequest) {
    return this.clientService.getClientStats(req.user.business_id);
  }
}
