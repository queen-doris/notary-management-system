import { ApiProperty } from '@nestjs/swagger';

export class BookTrackerStatsDto {
  @ApiProperty({ nullable: true }) current_volume: string | null;
  @ApiProperty() current_number: number;
  @ApiProperty() records_in_current_volume: number;
  @ApiProperty() records_per_volume: number;
  @ApiProperty() remaining_in_volume: number;
  @ApiProperty() percent_full: number;
}

export class BookStatisticsDto {
  @ApiProperty() book_id: string;
  @ApiProperty() book_name: string;
  @ApiProperty() book_slug: string;
  @ApiProperty() total_records: number;
  @ApiProperty() total_amount: number;
  @ApiProperty({ type: BookTrackerStatsDto, nullable: true })
  tracker: BookTrackerStatsDto | null;
}

export class AllBooksStatisticsResponseDto {
  @ApiProperty({ type: [BookStatisticsDto] })
  books: BookStatisticsDto[];

  @ApiProperty({
    description: 'Totals across all books',
    example: { total_records: 1280, total_amount: 4500000 },
  })
  grand_total: {
    total_records: number;
    total_amount: number;
  };
}
