import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from './business.entity';
import { BookType } from '../enums/book-type.enum';
import { BaseEntity } from './base.entity';

@Entity('book_trackers')
export class BookTracker extends BaseEntity {
  @Column({ type: 'enum', enum: BookType })
  book_type: BookType;

  @Column({ type: 'varchar', length: 20, nullable: true })
  current_volume?: string; // NULL for legalisation/notification

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
}
