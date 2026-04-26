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
} from './dto/notary-service.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../../shared/interfaces/request.interface';
import { NotaryServiceName } from '../../shared/enums/notary-service-name.enum';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';

@Controller('notary-services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotaryServiceController {
  constructor(private readonly notaryServiceService: NotaryServiceService) {}

  @Get()
  @Roles(EBusinessRole.OWNER, EBusinessRole.RECEPTIONIST, EBusinessRole.OWNER)
  async getAllServices(@Req() req: AuthenticatedRequest) {
    return this.notaryServiceService.getAllServices(req.user.business_id);
  }

  @Get('service/:serviceName')
  @Roles(EBusinessRole.OWNER, EBusinessRole.RECEPTIONIST, EBusinessRole.OWNER)
  async getServicesByServiceName(
    @Req() req: AuthenticatedRequest,
    @Param('serviceName') serviceName: NotaryServiceName,
  ) {
    return this.notaryServiceService.getServicesByServiceName(
      req.user.business_id,
      serviceName,
    );
  }

  @Get('sub-service/:id')
  @Roles(EBusinessRole.OWNER, EBusinessRole.RECEPTIONIST)
  async getSubServiceById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.notaryServiceService.getSubServiceById(
      id,
      req.user.business_id,
    );
  }

  @Post('service/:serviceName/sub-service')
  @Roles(EBusinessRole.OWNER)
  async addSubService(
    @Req() req: AuthenticatedRequest,
    @Param('serviceName') serviceName: NotaryServiceName,
    @Body() dto: CreateNotarySubServiceDto,
  ) {
    return this.notaryServiceService.addSubService(
      req.user.business_id,
      req.user.id,
      req.user.role,
      req.user.business_roles || [],
      serviceName,
      dto,
    );
  }

  @Put('sub-service/:id')
  @Roles(EBusinessRole.OWNER)
  async updateSubService(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateNotarySubServiceDto,
  ) {
    return this.notaryServiceService.updateSubService(
      id,
      req.user.business_id,
      req.user.id,
      req.user.role,
      req.user.business_roles || [],
      dto,
    );
  }

  @Delete('sub-service/:id')
  @Roles(EBusinessRole.OWNER)
  async deleteSubService(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.notaryServiceService.deleteSubService(
      id,
      req.user.business_id,
      req.user.id,
      req.user.role,
      req.user.business_roles || [],
    );
  }
}
