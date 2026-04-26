import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ServiceCatalogService } from './service-catalog.service';
import {
  CreateServiceCatalogDto,
  UpdateServiceCatalogDto,
} from './dto/create-service-catalog.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../../shared/interfaces/request.interface';
import { ServiceCategory } from '../../shared/enums/service-category.enum';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';

@Controller('service-catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceCatalogController {
  constructor(private readonly serviceCatalogService: ServiceCatalogService) {}

  /**
   * Get all services for the business
   * Roles: business_owner, receptionist, notary, secretariat
   */
  @Get()
  @Roles(
    EBusinessRole.OWNER,
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
  )
  async getAllServices(
    @Req() req: AuthenticatedRequest,
    @Query('category') category?: ServiceCategory,
    @Query('is_active') isActive?: string,
  ) {
    return this.serviceCatalogService.getAllServices(req.user.business_id, {
      category,
      is_active:
        isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  /**
   * Get services by category
   * Roles: business_owner, receptionist, notary, secretariat
   */
  @Get('category/:category')
  @Roles(
    EBusinessRole.OWNER,
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
  )
  async getServicesByCategory(
    @Req() req: AuthenticatedRequest,
    @Param('category') category: ServiceCategory,
  ) {
    return this.serviceCatalogService.getServicesByCategory(
      req.user.business_id,
      category,
    );
  }

  /**
   * Get a single service by ID
   * Roles: business_owner, receptionist, notary, secretariat
   */
  @Get(':id')
  @Roles(
    EBusinessRole.OWNER,
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
  )
  async getServiceById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.serviceCatalogService.getServiceById(id, req.user.business_id);
  }

  /**
   * Create a custom service (only OWNER)
   * Roles: business_owner
   */
  @Post()
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT) // Allow secretariat to create custom services on behalf of the owner
  async createCustomService(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateServiceCatalogDto,
  ) {
    return this.serviceCatalogService.createCustomService(
      req.user.business_id,
      req.user.id,
      req.user.role,
      req.user.business_roles || [],
      dto,
    );
  }

  /**
   * Update a service (only OWNER)
   * Roles: business_owner
   */
  @Put(':id')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT) // Allow secretariat to update services on behalf of the owner
  async updateService(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateServiceCatalogDto,
  ) {
    return this.serviceCatalogService.updateService(
      id,
      req.user.business_id,
      req.user.id,
      req.user.role,
      req.user.business_roles || [],
      dto,
    );
  }

  /**
   * Delete (deactivate) a service (only OWNER)
   * Roles: business_owner
   */
  @Delete(':id')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT) // Allow secretariat to delete services on behalf of the owner
  async deleteService(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.serviceCatalogService.deleteService(
      id,
      req.user.business_id,
      req.user.id,
      req.user.role,
      req.user.business_roles || [],
    );
  }
}
