/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { SearchClientDto } from './dto/search-client.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';
import { AuthenticatedRequest } from 'src/shared/interfaces/request.interface';

@ApiTags('Clients')
@ApiBearerAuth('access-token')
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @Roles(
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
    EBusinessRole.OWNER,
  )
  @ApiOperation({
    summary: 'Create a client',
    description:
      'Registers a new client for the business. Allowed for receptionist, secretariat and owner.',
  })
  @ApiBody({ type: CreateClientDto })
  @ApiCreatedResponse({ description: 'Client created' })
  async createClient(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateClientDto,
  ) {
    return this.clientService.createClient(
      req.user.businessId,
      req.user.id,
      dto,
    );
  }

  @Get('search')
  @Roles(
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
    EBusinessRole.OWNER,
  )
  @ApiOperation({
    summary: 'Search clients',
    description:
      'Paginated client search by free text, ID number, phone, name, verification status and active flag.',
  })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'id_number', required: false })
  @ApiQuery({ name: 'phone', required: false })
  @ApiQuery({ name: 'full_name', required: false })
  @ApiQuery({ name: 'verification_status', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiOkResponse({ description: 'Paginated clients' })
  async searchClients(
    @Req() req: AuthenticatedRequest,
    @Query() searchDto: SearchClientDto,
  ) {
    return this.clientService.searchClients(req.user.businessId, searchDto);
  }

  @Get('stats/dashboard')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  @ApiOperation({
    summary: 'Client dashboard statistics',
    description: 'Aggregate client counts/metrics for the dashboard.',
  })
  @ApiOkResponse({ description: 'Statistics retrieved' })
  async getClientStats(@Req() req: AuthenticatedRequest) {
    return this.clientService.getClientStats(req.user.businessId);
  }

  @Get('id-number/:idNumber')
  @Roles(
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
    EBusinessRole.OWNER,
  )
  @ApiOperation({
    summary: 'Get client by national ID number',
  })
  @ApiParam({ name: 'idNumber', description: 'Client national ID number' })
  @ApiOkResponse({ description: 'Client retrieved' })
  @ApiNotFoundResponse({ description: 'Client not found' })
  async getClientByIdNumber(
    @Req() req: AuthenticatedRequest,
    @Param('idNumber') idNumber: string,
  ) {
    return this.clientService.getClientByIdNumber(
      idNumber,
      req.user.businessId,
    );
  }

  @Get('phone/:phone')
  @Roles(
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
    EBusinessRole.OWNER,
  )
  @ApiOperation({ summary: 'Get client by phone number' })
  @ApiParam({ name: 'phone', description: 'Client phone number' })
  @ApiOkResponse({ description: 'Client retrieved' })
  @ApiNotFoundResponse({ description: 'Client not found' })
  async getClientByPhone(
    @Req() req: AuthenticatedRequest,
    @Param('phone') phone: string,
  ) {
    return this.clientService.getClientByPhone(phone, req.user.businessId);
  }

  @Get(':id/bill-stats')
  @Roles(
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
    EBusinessRole.OWNER,
  )
  @ApiOperation({
    summary: 'Client bill statistics',
    description: 'Billing totals/history summary for a single client.',
  })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiOkResponse({ description: 'Bill stats retrieved' })
  async getClientBillStats(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.clientService.getClientBillStats(id, req.user.businessId);
  }

  @Get(':id')
  @Roles(
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
    EBusinessRole.OWNER,
  )
  @ApiOperation({ summary: 'Get client by ID' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiOkResponse({ description: 'Client retrieved' })
  @ApiNotFoundResponse({ description: 'Client not found' })
  async getClientById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.clientService.getClientById(id, req.user.businessId);
  }

  @Put(':id')
  @Roles(
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
    EBusinessRole.OWNER,
  )
  @ApiOperation({ summary: 'Update a client' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiBody({ type: UpdateClientDto })
  @ApiOkResponse({ description: 'Client updated' })
  async updateClient(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientService.updateClient(
      id,
      req.user.businessId,
      req.user.id,
      req.user.businessRoles,
      dto,
    );
  }

  @Patch(':id/verify')
  @Roles(
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.OWNER,
    EBusinessRole.SECRETARIAT,
  )
  @ApiOperation({
    summary: 'Verify a client',
    description: 'Marks a client as verified, with optional notes.',
  })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { notes: { type: 'string' } },
    },
    required: false,
  })
  @ApiOkResponse({ description: 'Client verified' })
  async verifyClient(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('notes') notes?: string,
  ) {
    return this.clientService.verifyClient(
      id,
      req.user.businessId,
      req.user.id,
      req.user.businessRoles,
      notes,
    );
  }

  @Delete(':id')
  @Roles(
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.OWNER,
    EBusinessRole.SECRETARIAT,
  )
  @ApiOperation({
    summary: 'Deactivate a client',
    description: 'Soft-deletes (deactivates) a client.',
  })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiOkResponse({ description: 'Client deactivated' })
  async deactivateClient(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.clientService.deactivateClient(
      id,
      req.user.businessId,
      req.user.businessRoles,
    );
  }
}
