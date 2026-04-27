/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { UpdateBookTrackerDto } from './dto/create-book-tracker.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BookType } from '../../shared/enums/book-type.enum';
import { AuthenticatedRequest } from '../../shared/interfaces/request.interface';
import { Roles } from 'src/common/decorators/roles.decorator';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';
import { ApiBearerAuth } from '@nestjs/swagger/dist/decorators/api-bearer.decorator';

@Controller('books')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  /**
   * Get all book trackers for the business
   */
  @Get('trackers')
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  async getBookTrackers(@Req() req: AuthenticatedRequest) {
    return this.booksService.getBookTrackers(req.user.businessId);
  }

  /**
   * Get a specific book tracker
   */
  @Get('trackers/:bookType')
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  async getBookTracker(
    @Req() req: AuthenticatedRequest,
    @Param('bookType') bookType: BookType,
  ) {
    return this.booksService.getBookTracker(req.user.businessId, bookType);
  }

  /**
   * Update a book tracker (Only OWNER)
   */
  @Put('trackers/:bookType')
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  async updateBookTracker(
    @Req() req: AuthenticatedRequest,
    @Param('bookType') bookType: BookType,
    @Body() dto: UpdateBookTrackerDto,
  ) {
    return this.booksService.updateBookTracker(
      req.user.businessId,
      req.user.id,
      req.user.role,
      bookType,
      dto,
    );
  }

  /**
   * Get records for a specific book
   */
  @Get(':bookType/records')
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  async getBookRecords(
    @Req() req: AuthenticatedRequest,
    @Param('bookType') bookType: BookType,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('client_id') clientId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.booksService.getBookRecords(req.user.businessId, bookType, {
      start_date: startDate,
      end_date: endDate,
      client_id: clientId,
      page,
      limit,
    });
  }

  /**
   * Search records across all books
   */
  @Get('records/search')
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  async searchRecords(
    @Req() req: AuthenticatedRequest,
    @Query('q') q?: string,
    @Query('book_type') bookType?: BookType,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.booksService.searchRecords(req.user.businessId, {
      q,
      book_type: bookType,
      start_date: startDate,
      end_date: endDate,
      page,
      limit,
    });
  }

  /**
   * Get book statistics
   */
  @Get('stats/summary')
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  async getBookStatistics(@Req() req: AuthenticatedRequest) {
    return this.booksService.getBookStatistics(req.user.businessId);
  }
}
