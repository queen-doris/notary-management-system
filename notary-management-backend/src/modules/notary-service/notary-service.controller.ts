import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NotaryServiceService } from './notary-service.service';
import {
  CreateNotarySubServiceDto,
  UpdateNotarySubServiceDto,
  CreateNotaryServiceCategoryDto,
  UpdateNotaryServiceCategoryDto,
  CreateNotaryServiceDto,
  CreateNotaryServiceBulkDto,
} from './dto/notary-service.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../../shared/interfaces/request.interface';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';
import { ApiBearerAuth } from '@nestjs/swagger/dist/decorators/api-bearer.decorator';

@Controller('notary-services')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class NotaryServiceController {
  constructor(private readonly notaryServiceService: NotaryServiceService) {}

  // ==================== Categories ====================

  @Post('categories')
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  async createCategory(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateNotaryServiceCategoryDto,
  ) {
    return this.notaryServiceService.createCategory(
      req.user.businessId,
      req.user.role,
      dto,
    );
  }

  @Get('categories')
  @ApiBearerAuth('access-token')
  @Roles(
    EBusinessRole.OWNER,
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.ACCOUNTANT,
  )
  async getCategories(@Req() req: AuthenticatedRequest) {
    return this.notaryServiceService.getCategories(req.user.businessId);
  }

  @Put('categories/:categoryRef')
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  async updateCategory(
    @Req() req: AuthenticatedRequest,
    @Param('categoryRef') categoryRef: string,
    @Body() dto: UpdateNotaryServiceCategoryDto,
  ) {
    return this.notaryServiceService.updateCategory(
      req.user.businessId,
      req.user.role,
      categoryRef,
      dto,
    );
  }

  @Delete('categories/:categoryRef')
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  async deleteCategory(
    @Req() req: AuthenticatedRequest,
    @Param('categoryRef') categoryRef: string,
  ) {
    return this.notaryServiceService.deleteCategory(
      req.user.businessId,
      req.user.role,
      categoryRef,
    );
  }

  // ==================== Sub-services ====================

  /**
   * Create a brand-new category together with its sub-services.
   */
  @Post('bulk')
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  async createServiceBulk(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateNotaryServiceBulkDto,
  ) {
    return this.notaryServiceService.createServiceBulk(
      req.user.businessId,
      req.user.role,
      dto,
    );
  }

  /**
   * Flat create: a sub-service against an existing category id.
   */
  @Post()
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  async createService(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateNotaryServiceDto,
  ) {
    return this.notaryServiceService.createService(
      req.user.businessId,
      req.user.role,
      dto,
    );
  }

  @Get()
  @ApiBearerAuth('access-token')
  @Roles(
    EBusinessRole.OWNER,
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.ACCOUNTANT,
  )
  async getAllServices(@Req() req: AuthenticatedRequest) {
    return this.notaryServiceService.getAllServices(req.user.businessId);
  }

  @Get('sub-service/:id')
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER, EBusinessRole.RECEPTIONIST)
  async getSubServiceById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.notaryServiceService.getSubServiceById(
      id,
      req.user.businessId,
    );
  }

  /**
   * List sub-services for a category (resolved by id or slug).
   * Backward-compatible with the old /service/:serviceName route.
   */
  @Get('category/:categoryRef')
  @ApiBearerAuth('access-token')
  @Roles(
    EBusinessRole.OWNER,
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.ACCOUNTANT,
  )
  async getServicesByCategory(
    @Req() req: AuthenticatedRequest,
    @Param('categoryRef') categoryRef: string,
  ) {
    return this.notaryServiceService.getServicesByCategory(
      req.user.businessId,
      categoryRef,
    );
  }

  /**
   * Add a sub-service under an existing category (id or slug).
   * Backward-compatible with the old nested sub-service route.
   */
  @Post('category/:categoryRef/sub-service')
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  async addSubService(
    @Req() req: AuthenticatedRequest,
    @Param('categoryRef') categoryRef: string,
    @Body() dto: CreateNotarySubServiceDto,
  ) {
    return this.notaryServiceService.addSubService(
      req.user.businessId,
      req.user.id,
      req.user.role,
      categoryRef,
      dto,
    );
  }

  @Put('sub-service/:id')
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  async updateSubService(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateNotarySubServiceDto,
  ) {
    return this.notaryServiceService.updateSubService(
      id,
      req.user.businessId,
      req.user.id,
      req.user.role,
      dto,
    );
  }

  @Delete('sub-service/:id')
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  async deleteSubService(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.notaryServiceService.deleteSubService(
      id,
      req.user.businessId,
      req.user.id,
      req.user.role,
    );
  }
}
