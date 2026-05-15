import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BusinessUserService } from './business-user.service';
import { CreateBusinessUserDto } from './dto/create-business-user.dto';
import { CreateBusinessStaffDto } from './dto/create-business-staff.dto';
import { UpdateBusinessUserDto } from './dto/update-business-user.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { EUserRole } from 'src/shared/enums/user-role.enum';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@Controller('business-users')
export class BusinessUserController {
  constructor(private readonly businessUserService: BusinessUserService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EUserRole.SUPERADMIN)
  @Post()
  @ApiBearerAuth('access-token') // Add this
  @ApiOperation({
    summary: 'Create business membership (Super Admin only)',
    description: 'Adds an existing user to a business with specific roles',
  })
  @ApiBody({
    type: CreateBusinessUserDto,
    description: 'Business membership creation details',
    examples: {
      example1: {
        summary: 'Add user as manager',
        value: {
          userId: '123e4567-e89b-12d3-a456-426614174001',
          businessId: '123e4567-e89b-12d3-a456-426614174000',
          roles: ['MANAGER'],
          staffCode: '001234',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Business membership created successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiForbiddenResponse({
    description: 'Forbidden - Super Admin role required',
  })
  @ApiConflictResponse({ description: 'User already belongs to this business' })
  async create(@Body() dto: CreateBusinessUserDto) {
    const membership = await this.businessUserService.createMembership(dto);
    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: '/business-users',
      data: membership,
      message: 'Business membership created',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EBusinessRole.OWNER, EUserRole.SUPERADMIN)
  @Post('staff')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create business staff member',
    description:
      'Creates a new staff member and associates them with a business. Requires OWNER or SUPERADMIN role.',
  })
  @ApiBody({
    type: CreateBusinessStaffDto,
    description: 'Staff member creation details',
    examples: {
      secretariat: {
        summary: 'Create a secretariat',
        value: {
          businessId: 'd57082b6-3863-4dc2-a564-241637f38d7b',
          fullNames: 'John Doe',
          phone: '+250788123456',
          email: 'john.doe@example.com',
          password: 'SecurePass123!',
          roles: ['SECRETARIAT'],
        },
      },
      receptionist: {
        summary: 'Create a receptionist',
        value: {
          businessId: 'd57082b6-3863-4dc2-a564-241637f38d7b',
          fullNames: 'John Doe',
          phone: '+250788123456',
          email: 'john.doe@example.com',
          password: 'SecurePass123!',
          roles: ['RECEPTIONIST'],
        },
      },
      accountant: {
        summary: 'Create an accountant',
        value: {
          businessId: 'd57082b6-3863-4dc2-a564-241637f38d7b',
          fullNames: 'Jane Smith',
          phone: '+250788123457',
          email: 'jane.smith@example.com',
          password: 'ManagerPass123!',
          roles: ['ACCOUNTANT'],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Staff member created successfully',
    schema: {
      example: {
        status: 'SUCCESS',
        timestamp: '2024-01-15T10:30:00.000Z',
        path: '/business-users/staff',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          userId: '123e4567-e89b-12d3-a456-426614174002',
          businessId: '123e4567-e89b-12d3-a456-426614174000',
          roles: ['CASHIER'],
          staffCode: '001234',
          employmentStatus: 'ACTIVE',
          jobTitle: 'Senior Cashier',
          hireDate: '2024-01-15',
          salary: 350000,
        },
        message: 'Business staff created',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data (email format, phone format, etc.)',
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - User does not have OWNER or SUPERADMIN role',
  })
  @ApiConflictResponse({
    description:
      'Staff member already exists with this phone/email or staff code',
  })
  async createStaff(@Body() dto: CreateBusinessStaffDto) {
    const membership = await this.businessUserService.createStaffMember(dto);
    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: '/business-users/staff',
      data: membership,
      message: 'Business staff created',
    };
  }

  @Get('business/:businessId')
  async getBusinessUsers(@Param('businessId') businessId: string) {
    const users = await this.businessUserService.getBusinessUsers(businessId);
    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: `/business-users/business/${businessId}`,
      data: users,
      message: 'Business users retrieved',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Roles(EUserRole.SUPERADMIN, EBusinessRole.OWNER)
  @Get('user/:userId')
  async getUserMemberships(@Param('userId') userId: string) {
    const memberships =
      await this.businessUserService.getUserMemberships(userId);
    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: `/business-users/user/${userId}`,
      data: memberships,
      message: 'User memberships retrieved',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EUserRole.SUPERADMIN, EBusinessRole.OWNER)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateBusinessUserDto) {
    const membership = await this.businessUserService.updateMembership(id, dto);
    return {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: `/business-users/${id}`,
      data: membership,
      message: 'Business membership updated',
    };
  }
}
