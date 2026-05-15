import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';
import { CreateBusinessOwnerDto } from './dto/create-business-owner.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { EUserRole } from 'src/shared/enums/user-role.enum';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Super Admin')
@ApiBearerAuth('access-token')
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Post('create-super-admin')
  @ApiOperation({
    summary: 'Create a new super admin',
    description:
      'Creates a new super admin account with provided credentials. Requires superadmin secret key.',
  })
  @ApiResponse({ status: 201, description: 'Super admin created successfully' })
  @ApiResponse({ status: 401, description: 'Invalid superadmin credentials' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createSuperAdmin(@Body() dto: CreateSuperAdminDto) {
    return this.superAdminService.createSuperAdmin(dto);
  }

  @Post('create-business-owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(EUserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Create a new business owner',
    description:
      'Creates a new business owner account for onboarding. The owner will register their own business.',
  })
  @ApiResponse({
    status: 201,
    description: 'Business owner created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createBusinessOwner(@Body() dto: CreateBusinessOwnerDto) {
    return this.superAdminService.createBusinessOwner(dto);
  }
}
