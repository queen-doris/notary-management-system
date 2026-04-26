import { BookType } from '../../../shared/enums/book-type.enum';

export class BookTrackerStatsDto {
  current_volume: string | null;
  current_number: number;
  records_in_current_volume: number;
  records_per_volume: number;
  remaining_in_volume: number;
  percent_full: number;
}

export class BookStatisticsDto {
  book_type: BookType;
  total_records: number;
  total_amount: number;
  tracker: BookTrackerStatsDto | null;
}

export class AllBooksStatisticsResponseDto {
  [BookType.LEGALISATION]?: BookStatisticsDto;
  [BookType.NOTIFICATION]?: BookStatisticsDto;
  [BookType.ACTES]?: BookStatisticsDto;
  [BookType.LAND]?: BookStatisticsDto;
  [BookType.IMIRAGE]?: BookStatisticsDto;
  grand_total: {
    total_records: number;
    total_amount: number;
  };
}
