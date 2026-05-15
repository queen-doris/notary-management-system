import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Business } from './business.entity';
import { Book } from './book.entity';
import { BaseEntity } from './base.entity';

@Entity('book_trackers')
@Index(['business_id', 'book_id'], { unique: true })
export class BookTracker extends BaseEntity {
  @Column({ type: 'uuid' })
  book_id: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  current_volume?: string; // NULL for books without volumes

  @Column({ type: 'integer', default: 0 })
  current_number: number;

  @Column({ type: 'integer', default: 0 })
  records_per_volume: number; // 0 means no limit

  @Column({ type: 'integer', default: 0 })
  records_in_current_volume: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'uuid' })
  business_id: string;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ManyToOne(() => Book)
  @JoinColumn({ name: 'book_id' })
  book: Book;
}
