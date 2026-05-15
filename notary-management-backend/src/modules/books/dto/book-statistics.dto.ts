export class BookTrackerStatsDto {
  current_volume: string | null;
  current_number: number;
  records_in_current_volume: number;
  records_per_volume: number;
  remaining_in_volume: number;
  percent_full: number;
}

export class BookStatisticsDto {
  book_id: string;
  book_name: string;
  book_slug: string;
  total_records: number;
  total_amount: number;
  tracker: BookTrackerStatsDto | null;
}

export class AllBooksStatisticsResponseDto {
  books: BookStatisticsDto[];
  grand_total: {
    total_records: number;
    total_amount: number;
  };
}
