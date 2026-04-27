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
  async getAllServices(@Req() req: AuthenticatedRequest) {
    return this.secretariatServiceService.getAllServices(req.user.businessId);
  }

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
    return this.secretariatServiceService.getServiceById(
      id,
      req.user.businessId,
    );
  }

  @Post()
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
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
