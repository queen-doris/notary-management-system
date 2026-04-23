import { User } from '../entities/user.entity';
import { BusinessUser } from '../entities/business-user.entity';

export type Employee = BusinessUser;
export type EmployeeWithUser = BusinessUser & { user: User };
