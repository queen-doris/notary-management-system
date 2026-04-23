import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('leaves')
export class EmployeeLeave extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  leaveStartDate: string;

  @Column({ type: 'varchar', nullable: true })
  leaveEndDate: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ nullable: true, type: 'varchar' })
  reason?: string;
}
