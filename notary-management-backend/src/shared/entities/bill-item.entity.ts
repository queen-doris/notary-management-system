import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Bill } from './bill.entity';
import { BaseEntity } from './base.entity';

export enum ItemType {
  NOTARY = 'notary',
  SECRETARIAT = 'secretariat',
}

@Entity('bill_items')
export class BillItem extends BaseEntity {
  @Column({ type: 'uuid' })
  bill_id: string;

  @Column({ type: 'enum', enum: ItemType })
  item_type: ItemType;

  @Column({ type: 'uuid', nullable: true })
  service_id: string;

  @Column({ type: 'varchar', length: 100 })
  service_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sub_service_name: string;

  @Column({ type: 'integer', default: 1 })
  quantity: number;

  @Column({ type: 'integer' })
  unit_price: number;

  @Column({ type: 'integer' })
  subtotal: number;

  @Column({ type: 'integer', default: 0 })
  vat_amount: number;

  @Column({ type: 'integer' })
  total: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => Bill, (bill) => bill.items)
  @JoinColumn({ name: 'bill_id' })
  bill: Bill;
}
