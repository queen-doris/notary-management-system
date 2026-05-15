import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Business } from './business.entity';
import { BaseEntity } from './base.entity';

@Entity('notary_service_categories')
@Index(['business_id', 'slug'], { unique: true })
export class NotaryServiceCategory extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

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
