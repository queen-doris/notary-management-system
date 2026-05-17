/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
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

@ApiTags('Notary Services')
@ApiBearerAuth('access-token')
@Controller('notary-services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotaryServiceController {
  constructor(private readonly notaryServiceService: NotaryServiceService) {}

  // ==================== Categories ====================

  @Post('categories')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Create a service category',
    description:
      'Creates a new top-level notary service category (parent). OWNER only.',
  })
  @ApiBody({ type: CreateNotaryServiceCategoryDto })
  @ApiCreatedResponse({ description: 'Category created' })
  @ApiConflictResponse({ description: 'Category name already exists' })
  @ApiForbiddenResponse({ description: 'Requires OWNER role' })
  async createCategory(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateNotaryServiceCategoryDto,
  ) {
    return this.notaryServiceService.createCategory(
      req.user.businessId,
      req.user.businessRoles,
      dto,
    );
  }

  @Get('categories')
  @Roles(
    EBusinessRole.OWNER,
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.ACCOUNTANT,
  )
  @ApiOperation({
    summary: 'List service categories',
    description: 'Returns all active notary service categories.',
  })
  @ApiOkResponse({ description: 'Categories retrieved' })
  async getCategories(@Req() req: AuthenticatedRequest) {
    return this.notaryServiceService.getCategories(req.user.businessId);
  }

  @Put('categories/:categoryRef')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Update a service category',
    description: 'Updates a category, resolved by UUID or slug. OWNER only.',
  })
  @ApiParam({ name: 'categoryRef', description: 'Category UUID or slug' })
  @ApiBody({ type: UpdateNotaryServiceCategoryDto })
  @ApiOkResponse({ description: 'Category updated' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  async updateCategory(
    @Req() req: AuthenticatedRequest,
    @Param('categoryRef') categoryRef: string,
    @Body() dto: UpdateNotaryServiceCategoryDto,
  ) {
    return this.notaryServiceService.updateCategory(
      req.user.businessId,
      req.user.businessRoles,
      categoryRef,
      dto,
    );
  }

  @Delete('categories/:categoryRef')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Deactivate a service category',
    description: 'Soft-deletes a category. OWNER only.',
  })
  @ApiParam({ name: 'categoryRef', description: 'Category UUID or slug' })
  @ApiOkResponse({ description: 'Category deactivated' })
  async deleteCategory(
    @Req() req: AuthenticatedRequest,
    @Param('categoryRef') categoryRef: string,
  ) {
    return this.notaryServiceService.deleteCategory(
      req.user.businessId,
      req.user.businessRoles,
      categoryRef,
    );
  }

  // ==================== Sub-services ====================

  @Post('bulk')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Create a category with sub-services (bulk)',
    description:
      'Creates a brand-new category together with all its sub-services in one transaction. OWNER only.',
  })
  @ApiBody({ type: CreateNotaryServiceBulkDto })
  @ApiCreatedResponse({ description: 'Category and sub-services created' })
  @ApiConflictResponse({ description: 'Category name already exists' })
  async createServiceBulk(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateNotaryServiceBulkDto,
  ) {
    return this.notaryServiceService.createServiceBulk(
      req.user.businessId,
      req.user.businessRoles,
      dto,
    );
  }

  @Post()
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Create a sub-service (flat)',
    description:
      'Adds a single sub-service (with price and linked book) under an existing category id. OWNER only.',
  })
  @ApiBody({ type: CreateNotaryServiceDto })
  @ApiCreatedResponse({ description: 'Sub-service created' })
  @ApiConflictResponse({ description: 'Sub-service already exists' })
  async createService(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateNotaryServiceDto,
  ) {
    return this.notaryServiceService.createService(
      req.user.businessId,
      req.user.businessRoles,
      dto,
    );
  }

  @Get()
  @Roles(
    EBusinessRole.OWNER,
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.ACCOUNTANT,
  )
  @ApiOperation({
    summary: 'List all sub-services',
    description:
      'Returns all active notary sub-services with their category and linked book.',
  })
  @ApiOkResponse({ description: 'Sub-services retrieved' })
  async getAllServices(@Req() req: AuthenticatedRequest) {
    return this.notaryServiceService.getAllServices(req.user.businessId);
  }

  @Get('sub-service/:id')
  @Roles(EBusinessRole.OWNER, EBusinessRole.RECEPTIONIST)
  @ApiOperation({
    summary: 'Get a sub-service',
    description: 'Returns one sub-service by its UUID.',
  })
  @ApiParam({ name: 'id', description: 'Sub-service UUID' })
  @ApiOkResponse({ description: 'Sub-service retrieved' })
  @ApiNotFoundResponse({ description: 'Sub-service not found' })
  async getSubServiceById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.notaryServiceService.getSubServiceById(id, req.user.businessId);
  }

  @Get('category/:categoryRef')
  @Roles(
    EBusinessRole.OWNER,
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.ACCOUNTANT,
  )
  @ApiOperation({
    summary: 'List sub-services by category',
    description:
      'Returns sub-services for a category (UUID or slug). Backward-compatible with the old /service/:serviceName route.',
  })
  @ApiParam({ name: 'categoryRef', description: 'Category UUID or slug' })
  @ApiOkResponse({ description: 'Sub-services retrieved' })
  async getServicesByCategory(
    @Req() req: AuthenticatedRequest,
    @Param('categoryRef') categoryRef: string,
  ) {
    return this.notaryServiceService.getServicesByCategory(
      req.user.businessId,
      categoryRef,
    );
  }

  @Post('category/:categoryRef/sub-service')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Add a sub-service to a category (nested)',
    description:
      'Adds a sub-service under an existing category (UUID or slug). Backward-compatible nested route. OWNER only.',
  })
  @ApiParam({ name: 'categoryRef', description: 'Category UUID or slug' })
  @ApiBody({ type: CreateNotarySubServiceDto })
  @ApiCreatedResponse({ description: 'Sub-service created' })
  async addSubService(
    @Req() req: AuthenticatedRequest,
    @Param('categoryRef') categoryRef: string,
    @Body() dto: CreateNotarySubServiceDto,
  ) {
    return this.notaryServiceService.addSubService(
      req.user.businessId,
      req.user.id,
      req.user.businessRoles,
      categoryRef,
      dto,
    );
  }

  @Put('sub-service/:id')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Update a sub-service',
    description:
      'Updates a sub-service (price, name, linked book). OWNER only.',
  })
  @ApiParam({ name: 'id', description: 'Sub-service UUID' })
  @ApiBody({ type: UpdateNotarySubServiceDto })
  @ApiOkResponse({ description: 'Sub-service updated' })
  async updateSubService(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateNotarySubServiceDto,
  ) {
    return this.notaryServiceService.updateSubService(
      id,
      req.user.businessId,
      req.user.id,
      req.user.businessRoles,
      dto,
    );
  }

  @Delete('sub-service/:id')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Deactivate a sub-service',
    description: 'Soft-deletes a sub-service. OWNER only.',
  })
  @ApiParam({ name: 'id', description: 'Sub-service UUID' })
  @ApiOkResponse({ description: 'Sub-service deactivated' })
  async deleteSubService(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.notaryServiceService.deleteSubService(
      id,
      req.user.businessId,
      req.user.id,
      req.user.businessRoles,
    );
  }
}
