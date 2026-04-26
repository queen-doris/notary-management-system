import { ServiceCategory } from '../../../shared/enums/service-category.enum';
import { BookType } from '../../../shared/enums/book-type.enum';

export class ServiceCatalogResponseDto {
  id: string;
  category: ServiceCategory;
  sub_service: string;
  base_price: number | null;
  has_vat: boolean;
  book_type: BookType | null;
  is_custom: boolean;
  is_active: boolean;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}
