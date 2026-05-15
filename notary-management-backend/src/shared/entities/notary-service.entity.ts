import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Business } from './business.entity';
import { Book } from './book.entity';
import { NotaryServiceCategory } from './notary-service-category.entity';
import { ServiceType } from '../enums/service-type.enum';
import { BaseEntity } from './base.entity';

@Entity('notary_services')
@Index(['business_id', 'category_id', 'sub_service'], { unique: true })
export class NotaryService extends BaseEntity {
  @Column({ type: 'enum', enum: ServiceType, default: ServiceType.NOTARY })
  service_type: ServiceType;

  @Column({ type: 'uuid' })
  category_id: string;

  @Column({ type: 'varchar', length: 100 })
  sub_service: string;

  @Column({ type: 'integer', nullable: true })
  base_price: number;

  @Column({ type: 'boolean', default: true })
  has_vat: boolean;

  @Column({ type: 'uuid', nullable: true })
  book_id: string | null;

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

  @ManyToOne(() => NotaryServiceCategory)
  @JoinColumn({ name: 'category_id' })
  category: NotaryServiceCategory;

  @ManyToOne(() => Book)
  @JoinColumn({ name: 'book_id' })
  book: Book | null;
}
