export interface BookTracker {
  id: string;
  book_id: string;
  current_volume: string | null;
  current_number: number;
  records_per_volume: number;
  records_in_current_volume: number;
  is_active: boolean;
  business_id: string;
  updated_at: Date;
}
