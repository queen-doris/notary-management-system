import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Business } from './business.entity';
import { BaseEntity } from './base.entity';
import { VolumeFormat } from '../enums/volume-format.enum';

@Entity('books')
@Index(['business_id', 'slug'], { unique: true })
export class Book extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  has_volume: boolean;

  @Column({ type: 'enum', enum: VolumeFormat, default: VolumeFormat.NONE })
  volume_format: VolumeFormat;

  @Column({ type: 'integer', default: 0 })
  records_per_volume: number;

  @Column({ type: 'varchar', length: 5, default: '/' })
  volume_separator: string;

  @Column({ type: 'boolean', default: false })
  requires_upi: boolean;

  @Column({ type: 'boolean', default: false })
  increments_volume_on_serve: boolean;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_custom: boolean;

  @Column({ type: 'uuid' })
  business_id: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;
}
