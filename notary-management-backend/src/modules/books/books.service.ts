/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { BookTracker } from '../../shared/entities/book-tracker.entity';
import { NotaryRecord } from '../../shared/entities/notary-record.entity';
import { Business } from '../../shared/entities/business.entity';
import {
  CreateBookTrackerDto,
  UpdateBookTrackerDto,
} from './dto/create-book-tracker.dto';
import { BookType } from '../../shared/enums/book-type.enum';
import { EBusinessRole } from '../../shared/enums/business-role.enum';
import { EUserRole } from '../../shared/enums/user-role.enum';
import { RecordStatus } from 'src/shared/enums/record-status.enum';
import { AuthenticatedRequest } from '../../shared/interfaces/request.interface';

// Helper function for Roman numerals
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
    @InjectRepository(NotaryRecord)
    private notaryRecordRepository: Repository<NotaryRecord>,
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
  ) {}

  /**
   * Get default configuration for each book type
   */
  private getDefaultBookConfig(bookType: BookType): {
    hasVolume: boolean;
    volumeFormat: 'roman' | 'numeric' | null;
    recordsPerVolume: number;
    volumeSeparator: string;
  } {
    switch (bookType) {
      case BookType.LEGALISATION:
        return {
          hasVolume: false,
          volumeFormat: null,
          recordsPerVolume: 0,
          volumeSeparator: '',
        };
      case BookType.NOTIFICATION:
        return {
          hasVolume: false,
          volumeFormat: null,
          recordsPerVolume: 0,
          volumeSeparator: '',
        };
      case BookType.ACTES:
        return {
          hasVolume: true,
          volumeFormat: 'roman',
          recordsPerVolume: 50,
          volumeSeparator: '/',
        };
      case BookType.LAND:
        return {
          hasVolume: true,
          volumeFormat: 'roman',
          recordsPerVolume: 50,
          volumeSeparator: '/',
        };
      case BookType.IMIRAGE:
        return {
          hasVolume: true,
          volumeFormat: 'roman',
          recordsPerVolume: 50,
          volumeSeparator: '/',
        };
      default:
        return {
          hasVolume: false,
          volumeFormat: null,
          recordsPerVolume: 0,
          volumeSeparator: '',
        };
    }
  }

  /**
   * Initialize book trackers for a new business
   */
  async initializeBusinessBooks(businessId: string): Promise<BookTracker[]> {
    const bookTrackers: BookTracker[] = [];

    for (const bookType of Object.values(BookType)) {
      const config = this.getDefaultBookConfig(bookType);

      const tracker = this.bookTrackerRepository.create({
        book_type: bookType,
        current_volume: config.hasVolume
          ? config.volumeFormat === 'roman'
            ? 'I'
            : '1'
          : undefined,
        current_number: 0,
        records_per_volume: config.recordsPerVolume,
        records_in_current_volume: 0,
        is_active: true,
        business_id: businessId,
      });

      bookTrackers.push(tracker);
    }

    return this.bookTrackerRepository.save(bookTrackers);
  }

  /**
   * Get all book trackers for a business
   */
  async getBookTrackers(businessId: string): Promise<BookTracker[]> {
    return this.bookTrackerRepository.find({
      where: { business_id: businessId },
      order: { book_type: 'ASC' },
    });
  }

  /**
   * Get a specific book tracker
   */
  async getBookTracker(
    businessId: string,
    bookType: BookType,
  ): Promise<BookTracker> {
    const tracker = await this.bookTrackerRepository.findOne({
      where: { business_id: businessId, book_type: bookType },
    });

    if (!tracker) {
      throw new NotFoundException(`Book tracker for ${bookType} not found`);
    }

    return tracker;
  }

  /**
   * Update book tracker (Only OWNER can do this)
   */
  async updateBookTracker(
    businessId: string,
    userId: string,
    userBusinessRoles: EBusinessRole[],
    bookType: BookType,
    dto: UpdateBookTrackerDto,
  ): Promise<BookTracker> {
    // Only OWNER can update book trackers
    const isOwner = userBusinessRoles.includes(EBusinessRole.OWNER);

    if (!isOwner) {
      throw new ForbiddenException(
        'Only business owner can update book trackers',
      );
    }

    const tracker = await this.getBookTracker(businessId, bookType);
    const config = this.getDefaultBookConfig(bookType);

    // Validate updates
    if (dto.current_volume && !config.hasVolume) {
      throw new BadRequestException(
        `${bookType} book does not support volumes`,
      );
    }

    if (dto.records_per_volume !== undefined && config.recordsPerVolume === 0) {
      throw new BadRequestException(
        `${bookType} book does not have a volume record limit`,
      );
    }

    // Apply updates
    Object.assign(tracker, dto);
    await this.bookTrackerRepository.save(tracker);

    return tracker;
  }

  /**
   * Get next record number for a book (auto-increment logic)
   */
  /**
   * Get next record number for a book (auto-increment logic)
   */
  async getNextRecordNumber(
    businessId: string,
    bookType: BookType,
  ): Promise<{
    volume: string | null;
    number: number;
    displayNumber: string;
    newRecordsInVolume: number;
  }> {
    const tracker = await this.getBookTracker(businessId, bookType);
    const config = this.getDefaultBookConfig(bookType);

    let newVolume = tracker.current_volume;
    let newNumber = tracker.current_number + 1;
    let newRecordsInVolume = tracker.records_in_current_volume + 1;

    // Check if we need to increment volume (for books with volume limits)
    if (
      config.recordsPerVolume > 0 &&
      newRecordsInVolume > config.recordsPerVolume
    ) {
      // Start new volume
      if (config.volumeFormat === 'roman') {
        newVolume = incrementRoman(tracker.current_volume || 'I');
      } else if (config.volumeFormat === 'numeric') {
        newVolume = String(parseInt(tracker.current_volume || '0') + 1);
      }
      newNumber = 1;
      newRecordsInVolume = 1;
    }

    // Generate display number
    let displayNumber: string;
    if (config.hasVolume && newVolume) {
      displayNumber = `${newNumber}${config.volumeSeparator}${newVolume}`;
    } else {
      displayNumber = String(newNumber);
    }

    // IMPORTANT: Return null (not undefined) for books without volumes
    return {
      volume: config.hasVolume ? newVolume || null : null,
      number: newNumber,
      displayNumber,
      newRecordsInVolume,
    };
  }

  /**
   * Update tracker after record creation
   */
  async updateTrackerAfterRecord(
    businessId: string,
    bookType: BookType,
    record: {
      volume: string | null;
      number: number;
      recordsInVolume: number;
    },
  ): Promise<void> {
    const tracker = await this.getBookTracker(businessId, bookType);

    tracker.current_volume = record.volume || tracker.current_volume;
    tracker.current_number = record.number;
    tracker.records_in_current_volume = record.recordsInVolume;

    await this.bookTrackerRepository.save(tracker);
  }

  /**
   * Get all records for a specific book with pagination
   */
  async getBookRecords(
    businessId: string,
    bookType: BookType,
    filters: {
      start_date?: string;
      end_date?: string;
      client_id?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<any> {
    const query = this.notaryRecordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.client', 'client')
      .leftJoinAndSelect('record.bill', 'bill')
      .where('record.business_id = :businessId', { businessId })
      .andWhere('record.book_type = :bookType', { bookType });

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

  /**
   * Get a single record by ID
   */
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

  /**
   * Get records by client
   */
  async getRecordsByClient(
    clientId: string,
    businessId: string,
  ): Promise<NotaryRecord[]> {
    return this.notaryRecordRepository.find({
      where: { client_id: clientId, business_id: businessId },
      order: { served_date: 'DESC' },
    });
  }

  /**
   * Get records by UPI (for land records)
   */
  async getRecordsByUpi(
    upi: string,
    businessId: string,
  ): Promise<NotaryRecord[]> {
    return this.notaryRecordRepository.find({
      where: { upi, business_id: businessId, book_type: BookType.LAND },
      relations: ['client'],
    });
  }

  /**
   * Search records across all books
   */
  async searchRecords(
    businessId: string,
    searchParams: {
      q?: string;
      book_type?: BookType;
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

    if (searchParams.book_type) {
      query.andWhere('record.book_type = :bookType', {
        bookType: searchParams.book_type,
      });
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

  /**
   * Archive old records (move to archive)
   */
  async archiveRecords(
    businessId: string,
    userId: string,
    userBusinessRoles: EBusinessRole[],
    beforeDate: string,
    bookType?: BookType,
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

    if (bookType) {
      query.andWhere('book_type = :bookType', { bookType });
    }

    const result = await query.execute();

    return { archived_count: result.affected || 0 };
  }

  /**
   * Get book statistics
   */
  async getBookStatistics(businessId: string): Promise<
    Record<
      BookType,
      {
        total_records: number;
        total_amount: number;
        tracker: {
          current_volume?: string;
          current_number: number;
          records_in_volume: number;
          records_per_volume: number;
        } | null;
      }
    >
  > {
    const stats = await this.notaryRecordRepository
      .createQueryBuilder('record')
      .select('record.book_type', 'book_type')
      .addSelect('COUNT(*)', 'total_records')
      .addSelect('SUM(record.amount + record.vat_amount)', 'total_amount')
      .where('record.business_id = :businessId', { businessId })
      .andWhere('record.status = :status', { status: RecordStatus.ACTIVE })
      .groupBy('record.book_type')
      .getRawMany();

    const trackers = await this.getBookTrackers(businessId);

    // Create a properly typed map
    const trackerMap = new Map<
      BookType,
      {
        current_volume?: string;
        current_number: number;
        records_in_volume: number;
        records_per_volume: number;
      }
    >();

    trackers.forEach((tracker) => {
      trackerMap.set(tracker.book_type, {
        current_volume: tracker.current_volume,
        current_number: tracker.current_number,
        records_in_volume: tracker.records_in_current_volume,
        records_per_volume: tracker.records_per_volume,
      });
    });

    // Initialize result with all book types (ensures all keys exist)
    const result: Partial<Record<BookType, any>> = {};

    // Type-safe iteration
    for (const stat of stats as Array<{
      book_type: BookType;
      total_records: string;
      total_amount: string | null;
    }>) {
      const bookType = stat.book_type;
      result[bookType] = {
        total_records: parseInt(stat.total_records, 10),
        total_amount: parseInt(stat.total_amount || '0', 10),
        tracker: trackerMap.get(bookType) || null,
      };
    }

    // Ensure all book types are represented (even those with zero records)
    for (const bookType of Object.values(BookType)) {
      if (!result[bookType]) {
        result[bookType] = {
          total_records: 0,
          total_amount: 0,
          tracker: trackerMap.get(bookType) || null,
        };
      }
    }

    return result as Record<
      BookType,
      {
        total_records: number;
        total_amount: number;
        tracker: {
          current_volume?: string;
          current_number: number;
          records_in_volume: number;
          records_per_volume: number;
        } | null;
      }
    >;
  }
}
