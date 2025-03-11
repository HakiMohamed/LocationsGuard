import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
  } from 'class-validator';
  import { Transform, TransformFnParams } from 'class-transformer';
  import { Types } from 'mongoose';
  
  // Validator to check if the value is a valid MongoDB ObjectId
  @ValidatorConstraint({ name: 'IsObjectId', async: false })
  export class IsObjectIdConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
      return Types.ObjectId.isValid(value); // Check if the value is a valid ObjectId
    }
  
    defaultMessage(args: ValidationArguments) {
      return `${args.property} must be a valid MongoDB ObjectId`;
    }
  }
  
  // Decorator to register the validator
  export function IsObjectId(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
      registerDecorator({
        name: 'IsObjectId',
        target: object.constructor,
        propertyName: propertyName,
        options: validationOptions,
        validator: IsObjectIdConstraint,
      });
    };
  }
  
  // Transform decorator to convert the value to an ObjectId
  export function TransformObjectId() {
    return Transform(({ value }: TransformFnParams) => {
      if (Types.ObjectId.isValid(value)) {
        return new Types.ObjectId(value); // Convert to ObjectId
      }
      return value; // Return the original value if it's not valid
    });
  }