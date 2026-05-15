import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Query } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { EUserRole } from 'src/shared/enums/user-role.enum';
import { BusinessOwnerQueryDto } from './dto/business-owner-query.dto';

@ApiTags('Business owners')
@ApiBearerAuth('access-token')
@Controller('business-owners')
export class BusinessOwnersController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(EUserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Get all business owners',
    description:
      'Retrieves business owners with optional filters and pagination.',
  })
  @ApiOkResponse({
    description: 'Business owners retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getBusinessOwners(@Query() query: BusinessOwnerQueryDto) {
    return this.userService.getBusinessOwners(query);
  }
}
