/* eslint-disable @typescript-eslint/no-unsafe-return */
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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
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

@ApiTags('Books')
@ApiBearerAuth('access-token')
@Controller('books')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Create a book',
    description:
      'Creates a new book and its tracker for the business. OWNER only. Configure volume format, records-per-volume, requires_upi, etc.',
  })
  @ApiBody({ type: CreateBookDto })
  @ApiCreatedResponse({ description: 'Book and tracker created' })
  @ApiForbiddenResponse({ description: 'Requires OWNER role' })
  async createBook(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateBookDto,
  ) {
    return this.booksService.createBook(
      req.user.businessId,
      req.user.businessRoles,
      dto,
    );
  }

  @Post('import/notary-records')
  @Roles(EBusinessRole.OWNER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Import past notary records from Excel',
    description:
      'Upload an .xlsx of historical notary records (Kinyarwanda columns: ITARIKI, IGITABO, NUMERO, VOLUME, AMAZINA, ID, TEL, INYANDIKO, SERVICE, IGICIRO, UMUBARE). Books are auto-assigned/created by name and each book tracker is advanced to the highest imported number so new records continue the sequence. OWNER only.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiQuery({
    name: 'dryRun',
    required: false,
    type: Boolean,
    description:
      'When true, validate & preview (counts, errors, first 5 mapped rows) WITHOUT saving anything.',
  })
  @ApiCreatedResponse({
    description: 'Import summary (imported / skipped / books / errors)',
  })
  @ApiForbiddenResponse({ description: 'Requires OWNER role' })
  async importNotaryRecords(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Query('dryRun') dryRun?: string,
  ) {
    return this.booksService.importNotaryRecordsFromExcel(
      req.user.businessId,
      req.user.businessRoles,
      file?.buffer,
      dryRun === 'true' || dryRun === '1',
    );
  }

  @Get()
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  @ApiOperation({
    summary: 'List books',
    description: 'Returns all active books for the business.',
  })
  @ApiOkResponse({ description: 'Books retrieved' })
  async getBooks(@Req() req: AuthenticatedRequest) {
    return this.booksService.getBooks(req.user.businessId);
  }

  @Get('trackers')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  @ApiOperation({
    summary: 'List book trackers',
    description:
      'Returns the current volume/number counter for every book in the business.',
  })
  @ApiOkResponse({ description: 'Book trackers retrieved' })
  async getBookTrackers(@Req() req: AuthenticatedRequest) {
    return this.booksService.getBookTrackers(req.user.businessId);
  }

  @Get('trackers/:bookRef')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  @ApiOperation({
    summary: 'Get a book tracker',
    description: 'Returns one book tracker, resolved by book UUID or slug.',
  })
  @ApiParam({
    name: 'bookRef',
    description: 'Book UUID or slug (e.g. "land")',
  })
  @ApiOkResponse({ description: 'Book tracker retrieved' })
  @ApiNotFoundResponse({ description: 'Book not found' })
  async getBookTracker(
    @Req() req: AuthenticatedRequest,
    @Param('bookRef') bookRef: string,
  ) {
    return this.booksService.getBookTracker(req.user.businessId, bookRef);
  }

  @Put('trackers/:bookRef')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Update a book tracker',
    description:
      'Manually adjust a book tracker (current volume/number, records per volume). OWNER only.',
  })
  @ApiParam({ name: 'bookRef', description: 'Book UUID or slug' })
  @ApiBody({ type: UpdateBookTrackerDto })
  @ApiOkResponse({ description: 'Tracker updated' })
  @ApiForbiddenResponse({ description: 'Requires OWNER role' })
  async updateBookTracker(
    @Req() req: AuthenticatedRequest,
    @Param('bookRef') bookRef: string,
    @Body() dto: UpdateBookTrackerDto,
  ) {
    return this.booksService.updateBookTracker(
      req.user.businessId,
      req.user.id,
      req.user.businessRoles,
      bookRef,
      dto,
    );
  }

  @Get('records/search')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  @ApiOperation({
    summary: 'Search notary records',
    description:
      'Searches notary records across books by free text, book, client and date range.',
  })
  @ApiQuery({ name: 'q', required: false, description: 'Free-text search' })
  @ApiQuery({
    name: 'book_id',
    required: false,
    description: 'Filter by book UUID or slug',
  })
  @ApiQuery({ name: 'start_date', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'end_date', required: false, example: '2026-12-31' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiOkResponse({ description: 'Paginated matching records' })
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

  @Get('stats/summary')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  @ApiOperation({
    summary: 'Book statistics',
    description:
      'Per-book totals (record count, amounts) plus tracker state and grand totals.',
  })
  @ApiOkResponse({ description: 'Statistics retrieved' })
  async getBookStatistics(@Req() req: AuthenticatedRequest) {
    return this.booksService.getBookStatistics(req.user.businessId);
  }

  @Get(':bookRef')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  @ApiOperation({
    summary: 'Get a book',
    description: 'Returns one book, resolved by UUID or slug.',
  })
  @ApiParam({ name: 'bookRef', description: 'Book UUID or slug' })
  @ApiOkResponse({ description: 'Book retrieved' })
  @ApiNotFoundResponse({ description: 'Book not found' })
  async getBook(
    @Req() req: AuthenticatedRequest,
    @Param('bookRef') bookRef: string,
  ) {
    return this.booksService.getBookById(req.user.businessId, bookRef);
  }

  @Put(':bookRef')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Update a book',
    description: 'Updates a book configuration. OWNER only.',
  })
  @ApiParam({ name: 'bookRef', description: 'Book UUID or slug' })
  @ApiBody({ type: UpdateBookDto })
  @ApiOkResponse({ description: 'Book updated' })
  @ApiForbiddenResponse({ description: 'Requires OWNER role' })
  async updateBook(
    @Req() req: AuthenticatedRequest,
    @Param('bookRef') bookRef: string,
    @Body() dto: UpdateBookDto,
  ) {
    return this.booksService.updateBook(
      req.user.businessId,
      req.user.businessRoles,
      bookRef,
      dto,
    );
  }

  @Delete(':bookRef')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({
    summary: 'Deactivate a book',
    description: 'Soft-deletes (deactivates) a book. OWNER only.',
  })
  @ApiParam({ name: 'bookRef', description: 'Book UUID or slug' })
  @ApiOkResponse({ description: 'Book deactivated' })
  @ApiForbiddenResponse({ description: 'Requires OWNER role' })
  async deleteBook(
    @Req() req: AuthenticatedRequest,
    @Param('bookRef') bookRef: string,
  ) {
    return this.booksService.deleteBook(
      req.user.businessId,
      req.user.businessRoles,
      bookRef,
    );
  }

  @Get(':bookRef/records')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  @ApiOperation({
    summary: 'List a book’s records',
    description:
      'Paginated notary records written into a specific book, with optional date and client filters.',
  })
  @ApiParam({ name: 'bookRef', description: 'Book UUID or slug' })
  @ApiQuery({ name: 'start_date', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'end_date', required: false, example: '2026-12-31' })
  @ApiQuery({ name: 'client_id', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiOkResponse({ description: 'Paginated records for the book' })
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
