export interface PaginationDto {
  page: number;
  limit: number;
  skip: number;
  take: number;
  order: Record<string, 'ASC' | 'DESC'>;
}
