import { SetMetadata } from '@nestjs/common';
import { EUserRole } from 'src/shared/enums/user-role.enum';
import { EBusinessRole } from 'src/shared/enums/business-role.enum';

export const Roles = (...roles: Array<EUserRole | EBusinessRole>) =>
  SetMetadata('roles', roles);
