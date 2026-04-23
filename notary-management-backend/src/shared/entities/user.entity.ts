import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { EUserRole } from '../enums/user-role.enum';
import { EUserStatus } from '../enums/user-status.enum';
import { EmployeeLeave } from './employee-leave.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ nullable: true })
  fullNames: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ unique: true })
  phone: string;

  @Column()
  password: string;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'enum', enum: EUserRole })
  role: EUserRole;

  @Column({ type: 'enum', enum: EUserStatus })
  status: EUserStatus;

  /** Set when super-admin creates a business owner; ensures they appear in GET /business-owners before they register a business. */
  @Column({ type: 'boolean', default: false })
  createdAsBusinessOwner: boolean;

  @OneToMany(() => EmployeeLeave, (leave) => leave.user)
  leaves: EmployeeLeave[];
}
