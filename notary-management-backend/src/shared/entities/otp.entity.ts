import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from './base.entity';
import { EOtpType } from '../enums/otp-type.enum';

@Entity('otps')
export class Otp extends BaseEntity {
  @Column({ type: 'varchar' })
  code: string;

  @Column({ type: 'enum', enum: EOtpType })
  type: EOtpType;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'boolean', default: false })
  isUsed: boolean;
}
