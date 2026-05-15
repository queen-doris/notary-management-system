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
} from '@nestjs/swagger';
import { SecretariatServiceService } from './secretariat-service.service';
import {
  CreateSecretariatServiceDto,
  UpdateSecretariatServiceDto,
} from './dto/secretariat-service.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../../shared/interfaces/request.interface';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';

@ApiTags('Secretariat Services')
@ApiBearerAuth('access-token')
@Controller('secretariat-services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SecretariatServiceController {
  constructor(
    private readonly secretariatServiceService: SecretariatServiceService,
  ) {}

  @Get()
  @Roles(
    EBusinessRole.OWNER,
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
  )
  @ApiOperation({
    summary: 'List secretariat services',
    description:
      'Returns all active secretariat services. Returns 403 if the business does not offer secretariat services.',
  })
  @ApiOkResponse({ description: 'Services retrieved' })
  @ApiForbiddenResponse({
    description: 'Business does not offer secretariat services',
  })
  async getAllServices(@Req() req: AuthenticatedRequest) {
    return this.secretariatServiceService.getAllServices(req.user.businessId);
  }

  @Get(':id')
  @Roles(
    EBusinessRole.OWNER,
    EBusinessRole.RECEPTIONIST,
    EBusinessRole.SECRETARIAT,
  )
  @ApiOperation({
    summary: 'Get a secretariat service',
    description: 'Returns one secretariat service by UUID.',
  })
  @ApiParam({ name: 'id', description: 'Secretariat service UUID' })
  @ApiOkResponse({ description: 'Service retrieved' })
  @ApiNotFoundResponse({ description: 'Service not found' })
  @ApiForbiddenResponse({
    description: 'Business does not offer secretariat services',
  })
  async getServiceById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.secretariatServiceService.getServiceById(
      id,
      req.user.businessId,
    );
  }

  @Post()
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  @ApiOperation({
    summary: 'Create a custom secretariat service',
    description:
      'Creates a custom secretariat service. Requires the business to offer secretariat services.',
  })
  @ApiBody({ type: CreateSecretariatServiceDto })
  @ApiCreatedResponse({ description: 'Service created' })
  @ApiForbiddenResponse({
    description:
      'Business does not offer secretariat services or insufficient role',
  })
  async createCustomService(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSecretariatServiceDto,
  ) {
    return this.secretariatServiceService.createCustomService(
      req.user.businessId,
      req.user.id,
      req.user.role,
      dto,
    );
  }

  @Put(':id')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  @ApiOperation({
    summary: 'Update a secretariat service',
    description: 'Updates a secretariat service by UUID.',
  })
  @ApiParam({ name: 'id', description: 'Secretariat service UUID' })
  @ApiBody({ type: UpdateSecretariatServiceDto })
  @ApiOkResponse({ description: 'Service updated' })
  @ApiForbiddenResponse({
    description: 'Business does not offer secretariat services',
  })
  async updateService(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateSecretariatServiceDto,
  ) {
    return this.secretariatServiceService.updateService(
      id,
      req.user.businessId,
      req.user.id,
      req.user.role,
      dto,
    );
  }

  @Delete(':id')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  @ApiOperation({
    summary: 'Deactivate a secretariat service',
    description: 'Soft-deletes a secretariat service by UUID.',
  })
  @ApiParam({ name: 'id', description: 'Secretariat service UUID' })
  @ApiOkResponse({ description: 'Service deactivated' })
  @ApiForbiddenResponse({
    description: 'Business does not offer secretariat services',
  })
  async deleteService(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.secretariatServiceService.deleteService(
      id,
      req.user.businessId,
      req.user.id,
      req.user.role,
    );
  }
}
