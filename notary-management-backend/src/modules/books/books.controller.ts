import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BooksService } from './books.service';
import {
  CreateBookDto,
  UpdateBookDto,
  UpdateBookTrackerDto,
} from './dto/create-book-tracker.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
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
   * Create a new book (+ its tracker). OWNER only.
   */
  @Post()
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  async createBook(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateBookDto,
  ) {
    return this.booksService.createBook(
      req.user.businessId,
      req.user.role,
      dto,
    );
  }

  /**
   * List all books for the business
   */
  @Get()
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  async getBooks(@Req() req: AuthenticatedRequest) {
    return this.booksService.getBooks(req.user.businessId);
  }

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
   * Get a specific book tracker (by book id or slug)
   */
  @Get('trackers/:bookRef')
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  async getBookTracker(
    @Req() req: AuthenticatedRequest,
    @Param('bookRef') bookRef: string,
  ) {
    return this.booksService.getBookTracker(req.user.businessId, bookRef);
  }

  /**
   * Update a book tracker (Only OWNER)
   */
  @Put('trackers/:bookRef')
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  async updateBookTracker(
    @Req() req: AuthenticatedRequest,
    @Param('bookRef') bookRef: string,
    @Body() dto: UpdateBookTrackerDto,
  ) {
    return this.booksService.updateBookTracker(
      req.user.businessId,
      req.user.id,
      req.user.role,
      bookRef,
      dto,
    );
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
    @Query('book_id') bookId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.booksService.searchRecords(req.user.businessId, {
      q,
      book_id: bookId,
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

  /**
   * Get a single book (by id or slug)
   */
  @Get(':bookRef')
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  async getBook(
    @Req() req: AuthenticatedRequest,
    @Param('bookRef') bookRef: string,
  ) {
    return this.booksService.getBookById(req.user.businessId, bookRef);
  }

  /**
   * Update a book (Only OWNER)
   */
  @Put(':bookRef')
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  async updateBook(
    @Req() req: AuthenticatedRequest,
    @Param('bookRef') bookRef: string,
    @Body() dto: UpdateBookDto,
  ) {
    return this.booksService.updateBook(
      req.user.businessId,
      req.user.role,
      bookRef,
      dto,
    );
  }

  /**
   * Soft-delete a book (Only OWNER)
   */
  @Delete(':bookRef')
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER)
  async deleteBook(
    @Req() req: AuthenticatedRequest,
    @Param('bookRef') bookRef: string,
  ) {
    return this.booksService.deleteBook(
      req.user.businessId,
      req.user.role,
      bookRef,
    );
  }

  /**
   * Get records for a specific book (by id or slug)
   */
  @Get(':bookRef/records')
  @ApiBearerAuth('access-token')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  async getBookRecords(
    @Req() req: AuthenticatedRequest,
    @Param('bookRef') bookRef: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('client_id') clientId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.booksService.getBookRecords(req.user.businessId, bookRef, {
      start_date: startDate,
      end_date: endDate,
      client_id: clientId,
      page,
      limit,
    });
  }
}
