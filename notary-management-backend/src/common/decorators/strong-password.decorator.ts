import { registerDecorator, ValidationOptions } from 'class-validator';
import { StrongPassword } from '../validators/password.validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: StrongPassword,
    });
  };
}
