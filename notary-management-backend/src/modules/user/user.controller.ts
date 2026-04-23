/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { RegisterDto } from './dto/register-user.dto';
import { IUserResponse } from './responses/user-response.interface';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { User } from 'src/shared/entities/user.entity';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { EUserRole } from 'src/shared/enums/user-role.enum';

@ApiTags('Users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new customer user account.',
  })
  @ApiBody({
    type: RegisterDto,
    description: 'User registration data',
  })
  @ApiCreatedResponse({
    description: 'User successfully registered',
    type: Object, // You might want to create a proper response DTO
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  @ApiConflictResponse({
    description: 'User already exists with provided credentials',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async register(@Body() registerDto: RegisterDto): Promise<IUserResponse> {
    return this.userService.register(registerDto);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete current user account',
    description: 'Soft deletes the authenticated user account.',
  })
  @ApiOkResponse({
    description: 'Account deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async deleteAccount(@CurrentUser() user: User) {
    return this.userService.deleteAccount(user.id);
  }

  @Get('customers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all customers',
    description: 'Retrieves all users with role CUSTOMER',
  })
  @ApiOkResponse({
    description: 'List of all customers retrieved successfully',
    type: [User],
  })
  @ApiNotFoundResponse({
    description: 'No customers found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async getAllCustomers(): Promise<User[]> {
    return this.userService.getAllCustomers();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieves a user with their complete profile information.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
    type: Object,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async getUserProfile(@Param('id') userId: string): Promise<IUserResponse> {
    return this.userService.getUserWithProfile(userId);
  }

  @Patch(':id/profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Updates the profile information for a specific user.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({
    description: 'Profile update data',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            fullNames: { type: 'string', example: 'John Doe Updated' },
            email: { type: 'string', example: 'updated.email@example.com' },
            phone: { type: 'string', example: '+250788123456' },
          },
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'User profile updated successfully',
    type: Object, // You might want to create a proper response DTO
  })
  @ApiBadRequestResponse({
    description: 'Invalid update data',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update user profile',
  })
  async updateUserProfile(
    @Param('id') userId: string,
    @Body() updateData: any,
  ): Promise<IUserResponse> {
    return this.userService.updateUserProfile(userId, updateData);
  }

  @Patch('/complete-profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Complete profile',
  })
  @ApiResponse({
    status: 200,
    description: ' profile completed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot complete profile',
  })
  async completeProfile(
    @CurrentUser() user: User,
    @Body() dto: CompleteProfileDto,
  ) {
    return this.userService.completeProfile(user.id, dto);
  }

  @Get('/count/customers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all customers',
    description: 'Retrieves all users with role CUSTOMER',
  })
  @ApiOkResponse({
    description: 'List of all customers retrieved successfully',
    type: [User], // or a custom DTO if you want
  })
  @ApiNotFoundResponse({
    description: 'No customers found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async getAllCustomersCount() {
    return this.userService.getCountOfCustomers();
  }

  @Get('/count/users/:role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all customers',
    description: 'Retrieves all users with role CUSTOMER',
  })
  @ApiOkResponse({
    description: 'List of all customers retrieved successfully',
    type: [User], // or a custom DTO if you want
  })
  @ApiNotFoundResponse({
    description: 'No customers found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async getAllUsersCount(@Param('role') role: EUserRole) {
    return this.userService.getUsersCountByRole(role);
  }
}
