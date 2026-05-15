import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { NotaryRecord } from './notary-record.entity';
import {
  DocumentStatus,
  DocumentCategory,
} from '../enums/document-status.enum';

@Entity('documents')
@Index(['record_id'])
@Index(['upi'])
@Index(['uploaded_by'])
@Index(['client_name'])
@Index(['record_display_number'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  record_id: string;

  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ type: 'varchar', length: 500 })
  file_url: string;

  @Column({ type: 'varchar', length: 255 })
  public_id: string;

  @Column({ type: 'integer' })
  file_size: number;

  @Column({ type: 'varchar', length: 100 })
  mime_type: string;

  @Column({
    type: 'enum',
    enum: DocumentCategory,
    default: DocumentCategory.OTHER,
  })
  category: DocumentCategory;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  upi: string;

  @Column({ type: 'boolean', default: false })
  is_primary: boolean;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.UPLOADED,
  })
  status: DocumentStatus;

  // Denormalized fields for quick searching
  @Column({ type: 'varchar', length: 100 })
  client_name: string;

  @Column({ type: 'varchar', length: 50 })
  client_id_number: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  record_display_number: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  book_type: string;

  // Uploader info
  @Column({ type: 'uuid' })
  uploaded_by: string;

  @Column({ type: 'varchar', length: 100 })
  uploaded_by_name: string;

  @Column({ type: 'varchar', length: 50 })
  uploaded_by_role: string;

  @CreateDateColumn()
  uploaded_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => NotaryRecord, (record) => record.attachments)
  @JoinColumn({ name: 'record_id' })
  record: NotaryRecord;
}
