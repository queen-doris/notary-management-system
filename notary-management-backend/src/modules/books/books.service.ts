/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BookTracker } from '../../shared/entities/book-tracker.entity';
import { Book } from '../../shared/entities/book.entity';
import { NotaryRecord } from '../../shared/entities/notary-record.entity';
import { Business } from '../../shared/entities/business.entity';
import {
  CreateBookDto,
  UpdateBookDto,
  UpdateBookTrackerDto,
} from './dto/create-book-tracker.dto';
import { VolumeFormat } from '../../shared/enums/volume-format.enum';
import { EBusinessRole } from '../../shared/enums/business-role.enum';
import { RecordStatus } from '../../shared/enums/record-status.enum';
import { DEFAULT_BOOKS } from '../notary-service/default-notary-services.data';
import { Generators } from '../../common/utils/generator.utils';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function intToRoman(num: number): string {
  const romanMap: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let result = '';
  let remaining = num;
  for (const [value, symbol] of romanMap) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }
  return result;
}

function romanToInt(roman: string): number {
  const romanCharMap: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };
  let total = 0;
  let prev = 0;
  for (let i = roman.length - 1; i >= 0; i--) {
    const curr = romanCharMap[roman[i]];
    if (curr < prev) {
      total -= curr;
    } else {
      total += curr;
    }
    prev = curr;
  }
  return total;
}

function incrementRoman(roman: string): string {
  return intToRoman(romanToInt(roman) + 1);
}

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(BookTracker)
    private bookTrackerRepository: Repository<BookTracker>,
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
    @InjectRepository(NotaryRecord)
    private notaryRecordRepository: Repository<NotaryRecord>,
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
    private dataSource: DataSource,
  ) {}

  /**
   * Resolve a Book by id or slug within a business.
   */
  async resolveBook(businessId: string, ref: string): Promise<Book> {
    const where = UUID_RE.test(ref)
      ? { id: ref, business_id: businessId }
      : { slug: ref, business_id: businessId };
    const book = await this.bookRepository.findOne({ where });
    if (!book) {
      throw new NotFoundException(`Book "${ref}" not found`);
    }
    return book;
  }

  /**
   * Seed default books + their trackers for a newly created business.
   */
  async initializeBusinessBooks(businessId: string): Promise<Book[]> {
    const existing = await this.bookRepository.count({
      where: { business_id: businessId },
    });
    if (existing > 0) return [];

    const createdBooks: Book[] = [];

    for (const def of DEFAULT_BOOKS) {
      const book = await this.bookRepository.save(
        this.bookRepository.create({
          name: def.name,
          slug: def.slug,
          has_volume: def.has_volume,
          volume_format: def.volume_format,
          records_per_volume: def.records_per_volume,
          volume_separator: def.volume_separator,
          requires_upi: def.requires_upi,
          increments_volume_on_serve: def.increments_volume_on_serve,
          is_active: true,
          is_custom: false,
          business_id: businessId,
        }),
      );

      await this.bookTrackerRepository.save(
        this.bookTrackerRepository.create({
          book_id: book.id,
          current_volume: def.has_volume
            ? def.volume_format === VolumeFormat.ROMAN
              ? 'I'
              : '1'
            : undefined,
          current_number: 0,
          records_per_volume: def.records_per_volume,
          records_in_current_volume: 0,
          is_active: true,
          business_id: businessId,
        }),
      );

      createdBooks.push(book);
    }

    return createdBooks;
  }

  // ==================== Book CRUD ====================

  async createBook(
    businessId: string,
    userRole: EBusinessRole,
    dto: CreateBookDto,
  ): Promise<{ book: Book; tracker: BookTracker }> {
    if (userRole !== EBusinessRole.OWNER) {
      throw new ForbiddenException('Only business owner can create books');
    }

    const slug = Generators.slugify(dto.name);
    const existing = await this.bookRepository.findOne({
      where: { business_id: businessId, slug },
    });
    if (existing) {
      throw new ConflictException(
        `A book with the name "${dto.name}" already exists`,
      );
    }

    const hasVolume = dto.has_volume ?? false;
    const volumeFormat = dto.volume_format ?? VolumeFormat.NONE;

    return this.dataSource.transaction(async (manager) => {
      const book = await manager.save(
        manager.create(Book, {
          name: dto.name,
          slug,
          description: dto.description,
          has_volume: hasVolume,
          volume_format: volumeFormat,
          records_per_volume: dto.records_per_volume ?? 0,
          volume_separator: dto.volume_separator ?? '/',
          requires_upi: dto.requires_upi ?? false,
          increments_volume_on_serve: dto.increments_volume_on_serve ?? false,
          is_active: true,
          is_custom: true,
          business_id: businessId,
        }),
      );

      const tracker = await manager.save(
        manager.create(BookTracker, {
          book_id: book.id,
          current_volume: hasVolume
            ? dto.current_volume ??
              (volumeFormat === VolumeFormat.ROMAN ? 'I' : '1')
            : undefined,
          current_number: dto.current_number ?? 0,
          records_per_volume: dto.records_per_volume ?? 0,
          records_in_current_volume: dto.records_in_current_volume ?? 0,
          is_active: true,
          business_id: businessId,
        }),
      );

      return { book, tracker };
    });
  }

  async getBooks(businessId: string): Promise<Book[]> {
    return this.bookRepository.find({
      where: { business_id: businessId, is_active: true },
      order: { name: 'ASC' },
    });
  }

  async getBookById(businessId: string, bookRef: string): Promise<Book> {
    return this.resolveBook(businessId, bookRef);
  }

  async updateBook(
    businessId: string,
    userRole: EBusinessRole,
    bookRef: string,
    dto: UpdateBookDto,
  ): Promise<Book> {
    if (userRole !== EBusinessRole.OWNER) {
      throw new ForbiddenException('Only business owner can update books');
    }
    const book = await this.resolveBook(businessId, bookRef);

    if (dto.name && dto.name !== book.name) {
      const slug = Generators.slugify(dto.name);
      const clash = await this.bookRepository.findOne({
        where: { business_id: businessId, slug },
      });
      if (clash && clash.id !== book.id) {
        throw new ConflictException(
          `A book with the name "${dto.name}" already exists`,
        );
      }
      book.slug = slug;
    }

    Object.assign(book, dto);
    return this.bookRepository.save(book);
  }

  async deleteBook(
    businessId: string,
    userRole: EBusinessRole,
    bookRef: string,
  ): Promise<{ message: string }> {
    if (userRole !== EBusinessRole.OWNER) {
      throw new ForbiddenException('Only business owner can delete books');
    }
    const book = await this.resolveBook(businessId, bookRef);
    book.is_active = false;
    await this.bookRepository.save(book);
    return { message: `Book "${book.name}" deactivated` };
  }

  // ==================== Book Trackers ====================

  async getBookTrackers(businessId: string): Promise<BookTracker[]> {
    return this.bookTrackerRepository.find({
      where: { business_id: businessId },
      relations: ['book'],
      order: { createdAt: 'ASC' },
    });
  }

  async getBookTracker(
    businessId: string,
    bookRef: string,
  ): Promise<BookTracker> {
    const book = await this.resolveBook(businessId, bookRef);
    const tracker = await this.bookTrackerRepository.findOne({
      where: { business_id: businessId, book_id: book.id },
      relations: ['book'],
    });
    if (!tracker) {
      throw new NotFoundException(
        `Book tracker for "${book.name}" not found`,
      );
    }
    return tracker;
  }

  async updateBookTracker(
    businessId: string,
    userId: string,
    userRole: EBusinessRole,
    bookRef: string,
    dto: UpdateBookTrackerDto,
  ): Promise<BookTracker> {
    if (userRole !== EBusinessRole.OWNER) {
      throw new ForbiddenException(
        'Only business owner can update book trackers',
      );
    }

    const tracker = await this.getBookTracker(businessId, bookRef);
    const book = tracker.book;

    if (dto.current_volume && !book.has_volume) {
      throw new BadRequestException(
        `Book "${book.name}" does not support volumes`,
      );
    }

    if (dto.records_per_volume !== undefined && book.records_per_volume === 0) {
      throw new BadRequestException(
        `Book "${book.name}" does not have a volume record limit`,
      );
    }

    Object.assign(tracker, dto);
    await this.bookTrackerRepository.save(tracker);

    return tracker;
  }

  /**
   * Get next record number for a book (auto-increment logic).
   */
  async getNextRecordNumber(
    businessId: string,
    bookRef: string,
  ): Promise<{
    volume: string | null;
    number: number;
    displayNumber: string;
    newRecordsInVolume: number;
  }> {
    const tracker = await this.getBookTracker(businessId, bookRef);
    const book = tracker.book;

    let newVolume = tracker.current_volume ?? null;
    let newNumber = tracker.current_number + 1;
    let newRecordsInVolume = tracker.records_in_current_volume + 1;

    if (
      book.records_per_volume > 0 &&
      newRecordsInVolume > book.records_per_volume
    ) {
      if (book.volume_format === VolumeFormat.ROMAN) {
        newVolume = incrementRoman(tracker.current_volume || 'I');
      } else if (book.volume_format === VolumeFormat.NUMERIC) {
        newVolume = String(parseInt(tracker.current_volume || '0') + 1);
      }
      newNumber = 1;
      newRecordsInVolume = 1;
    }

    let displayNumber: string;
    if (book.has_volume && newVolume) {
      displayNumber = `${newNumber}${book.volume_separator}${newVolume}`;
    } else {
      displayNumber = String(newNumber);
    }

    return {
      volume: book.has_volume ? newVolume || null : null,
      number: newNumber,
      displayNumber,
      newRecordsInVolume,
    };
  }

  async updateTrackerAfterRecord(
    businessId: string,
    bookRef: string,
    record: {
      volume: string | null;
      number: number;
      recordsInVolume: number;
    },
  ): Promise<void> {
    const tracker = await this.getBookTracker(businessId, bookRef);

    tracker.current_volume = record.volume || tracker.current_volume;
    tracker.current_number = record.number;
    tracker.records_in_current_volume = record.recordsInVolume;

    await this.bookTrackerRepository.save(tracker);
  }

  // ==================== Records ====================

  async getBookRecords(
    businessId: string,
    bookRef: string,
    filters: {
      start_date?: string;
      end_date?: string;
      client_id?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<any> {
    const book = await this.resolveBook(businessId, bookRef);

    const query = this.notaryRecordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.client', 'client')
      .leftJoinAndSelect('record.bill', 'bill')
      .where('record.business_id = :businessId', { businessId })
      .andWhere('record.book_id = :bookId', { bookId: book.id });

    if (filters.start_date) {
      query.andWhere('record.served_date >= :startDate', {
        startDate: filters.start_date,
      });
    }

    if (filters.end_date) {
      query.andWhere('record.served_date <= :endDate', {
        endDate: filters.end_date,
      });
    }

    if (filters.client_id) {
      query.andWhere('record.client_id = :clientId', {
        clientId: filters.client_id,
      });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    query.skip(skip).take(limit);
    query.orderBy('record.served_date', 'DESC');

    const [data, total] = await query.getManyAndCount();

    const formattedData = data.map((record) => ({
      id: record.id,
      record_number: record.display_number,
      volume: record.volume,
      number: record.record_number,
      client_name: record.client?.full_name,
      client_id_number: record.client?.id_number,
      service: record.sub_service,
      amount: record.amount + record.vat_amount,
      served_date: record.served_date,
      has_documents: record.has_documents,
    }));

    return {
      data: formattedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRecordById(
    recordId: string,
    businessId: string,
  ): Promise<NotaryRecord> {
    const record = await this.notaryRecordRepository.findOne({
      where: { id: recordId, business_id: businessId },
      relations: ['client', 'bill', 'server'],
    });

    if (!record) {
      throw new NotFoundException('Record not found');
    }

    return record;
  }

  async getRecordsByClient(
    clientId: string,
    businessId: string,
  ): Promise<NotaryRecord[]> {
    return this.notaryRecordRepository.find({
      where: { client_id: clientId, business_id: businessId },
      order: { served_date: 'DESC' },
    });
  }

  async getRecordsByUpi(
    upi: string,
    businessId: string,
  ): Promise<NotaryRecord[]> {
    return this.notaryRecordRepository.find({
      where: { upi, business_id: businessId },
      relations: ['client'],
    });
  }

  async searchRecords(
    businessId: string,
    searchParams: {
      q?: string;
      book_id?: string;
      start_date?: string;
      end_date?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<any> {
    const query = this.notaryRecordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.client', 'client')
      .where('record.business_id = :businessId', { businessId });

    if (searchParams.book_id) {
      const book = await this.resolveBook(businessId, searchParams.book_id);
      query.andWhere('record.book_id = :bookId', { bookId: book.id });
    }

    if (searchParams.q) {
      query.andWhere(
        '(record.display_number ILIKE :search OR record.upi ILIKE :search OR client.full_name ILIKE :search OR client.id_number ILIKE :search)',
        { search: `%${searchParams.q}%` },
      );
    }

    if (searchParams.start_date) {
      query.andWhere('record.served_date >= :startDate', {
        startDate: searchParams.start_date,
      });
    }

    if (searchParams.end_date) {
      query.andWhere('record.served_date <= :endDate', {
        endDate: searchParams.end_date,
      });
    }

    const page = searchParams.page || 1;
    const limit = searchParams.limit || 20;
    const skip = (page - 1) * limit;

    query.skip(skip).take(limit);
    query.orderBy('record.served_date', 'DESC');

    const [data, total] = await query.getManyAndCount();

    return {
      data: data.map((record) => ({
        id: record.id,
        record_number: record.display_number,
        book_type: record.book_type,
        book_id: record.book_id,
        client_name: record.client?.full_name,
        service: record.sub_service,
        amount: record.amount + record.vat_amount,
        served_date: record.served_date,
        upi: record.upi,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async archiveRecords(
    businessId: string,
    userId: string,
    userBusinessRoles: EBusinessRole[],
    beforeDate: string,
    bookRef?: string,
  ): Promise<{ archived_count: number }> {
    const isOwner = userBusinessRoles.includes(EBusinessRole.OWNER);
    if (!isOwner) {
      throw new ForbiddenException('Only business owner can archive records');
    }

    const query = this.notaryRecordRepository
      .createQueryBuilder()
      .update()
      .set({ status: RecordStatus.ARCHIVED })
      .where('business_id = :businessId', { businessId })
      .andWhere('served_date < :beforeDate', { beforeDate });

    if (bookRef) {
      const book = await this.resolveBook(businessId, bookRef);
      query.andWhere('book_id = :bookId', { bookId: book.id });
    }

    const result = await query.execute();

    return { archived_count: result.affected || 0 };
  }

  async getBookStatistics(businessId: string): Promise<{
    books: Array<{
      book_id: string;
      book_name: string;
      book_slug: string;
      total_records: number;
      total_amount: number;
      tracker: {
        current_volume?: string;
        current_number: number;
        records_in_volume: number;
        records_per_volume: number;
      } | null;
    }>;
    grand_total: { total_records: number; total_amount: number };
  }> {
    const books = await this.getBooks(businessId);

    const stats = (await this.notaryRecordRepository
      .createQueryBuilder('record')
      .select('record.book_id', 'book_id')
      .addSelect('COUNT(*)', 'total_records')
      .addSelect('SUM(record.amount + record.vat_amount)', 'total_amount')
      .where('record.business_id = :businessId', { businessId })
      .andWhere('record.status = :status', { status: RecordStatus.ACTIVE })
      .groupBy('record.book_id')
      .getRawMany()) as Array<{
      book_id: string | null;
      total_records: string;
      total_amount: string | null;
    }>;

    const statByBook = new Map<
      string,
      { total_records: number; total_amount: number }
    >();
    for (const s of stats) {
      if (!s.book_id) continue;
      statByBook.set(s.book_id, {
        total_records: parseInt(s.total_records, 10),
        total_amount: parseInt(s.total_amount || '0', 10),
      });
    }

    const trackers = await this.getBookTrackers(businessId);
    const trackerByBook = new Map<string, BookTracker>();
    trackers.forEach((t) => trackerByBook.set(t.book_id, t));

    let grandRecords = 0;
    let grandAmount = 0;

    const result = books.map((book) => {
      const s = statByBook.get(book.id) || {
        total_records: 0,
        total_amount: 0,
      };
      grandRecords += s.total_records;
      grandAmount += s.total_amount;

      const tracker = trackerByBook.get(book.id);
      return {
        book_id: book.id,
        book_name: book.name,
        book_slug: book.slug,
        total_records: s.total_records,
        total_amount: s.total_amount,
        tracker: tracker
          ? {
              current_volume: tracker.current_volume,
              current_number: tracker.current_number,
              records_in_volume: tracker.records_in_current_volume,
              records_per_volume: tracker.records_per_volume,
            }
          : null,
      };
    });

    return {
      books: result,
      grand_total: { total_records: grandRecords, total_amount: grandAmount },
    };
  }
}
