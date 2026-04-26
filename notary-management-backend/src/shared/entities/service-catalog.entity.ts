import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { Business } from './business.entity';
import { BookType } from '../enums/book-type.enum';
import { ServiceCategory } from '../enums/service-category.enum';

@Entity('service_catalog')
@Index(['business_id', 'category', 'sub_service'], { unique: true })
export class ServiceCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ServiceCategory })
  category: ServiceCategory;

  @Column({ type: 'varchar', length: 100 })
  sub_service: string;

  @Column({ type: 'integer', nullable: true })
  base_price: number;

  @Column({ type: 'boolean', default: true })
  has_vat: boolean;

  @Column({ type: 'enum', enum: BookType, nullable: true })
  book_type: BookType | null;

  @Column({ type: 'boolean', default: false })
  is_custom: boolean;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  business_id: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;
}
