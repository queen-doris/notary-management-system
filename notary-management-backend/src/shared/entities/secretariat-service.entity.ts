import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Business } from './business.entity';
import { SecretariatServiceName } from '../enums/secretariat-service-name.enum';
import { ServiceType } from '../enums/service-type.enum';
import { BaseEntity } from './base.entity';

@Entity('secretariat_services')
@Index(['business_id', 'service_name'], { unique: true })
export class SecretariatService extends BaseEntity {
  @Column({ type: 'enum', enum: ServiceType, default: ServiceType.SECRETARIAT })
  service_type: ServiceType;

  @Column({ type: 'enum', enum: SecretariatServiceName })
  service_name: SecretariatServiceName;

  @Column({ type: 'integer', nullable: true })
  base_price: number;

  @Column({ type: 'boolean', default: false })
  has_vat: boolean;

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
