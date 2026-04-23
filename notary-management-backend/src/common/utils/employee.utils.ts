/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { EEmploymentStatus } from 'src/shared/enums/employee-status.enum';
import { EUserStatus } from 'src/shared/enums/user-status.enum';
import { EmployeeWithUser, Employee } from 'src/shared/types/employee.type';

export class EmployeeUtils {
  // Get common employee info regardless of type
  static getEmployeeInfo(employee: EmployeeWithUser) {
    return {
      id: employee.id,
      userId: employee.userId,
      user: employee.user,
      businessId: this.getBusinessId(employee),
      staffCode: this.getStaffCode(employee),
      salary: this.getSalary(employee),
      employmentStatus: this.getEmploymentStatus(employee),
      hireDate: this.getHireDate(employee),
      role: employee.user.role,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  }

  static getBusinessId(employee: Employee): string {
    if ('businessId' in employee) return employee.businessId;
    return '';
  }

  static getStaffCode(employee: Employee): string {
    if ('staffCode' in employee) return employee.staffCode || '';
    return '';
  }

  static getSalary(employee: Employee): number {
    if (typeof employee['salary'] === 'number') return employee['salary'];
    return 0;
  }

  static getEmploymentStatus(
    employee: Employee,
  ): EEmploymentStatus | EUserStatus {
    if ('employmentStatus' in employee) return employee.employmentStatus;
    if ('employmentStatus' in employee)
      return (employee as any).employmentStatus;
    if ('status' in employee) return (employee as any).status;
    return EEmploymentStatus.ACTIVE;
  }

  static getHireDate(employee: Employee): Date | string | null {
    if ('hireDate' in employee) return employee.hireDate || null;
    return null;
  }

  // Check if employee is active
  static isActive(employee: Employee): boolean {
    const status = this.getEmploymentStatus(employee);
    return status === EEmploymentStatus.ACTIVE || status === EUserStatus.ACTIVE;
  }

  // Get termination date
  static getTerminationDate(employee: Employee): Date | null {
    return null;
  }
}
