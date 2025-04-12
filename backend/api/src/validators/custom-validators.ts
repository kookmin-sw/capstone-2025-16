import {
  ValidationOptions,
  registerDecorator,
  ValidationArguments,
  buildMessage,
} from "class-validator";

/**
 * Custom validator to handle NumberWithOperator type (number | Operator<number>)
 * Validates that a value is either a valid number or a valid NumberOperator object
 */
export function IsNumberWithOperator(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isNumberWithOperator",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          // Valid if it's undefined (for optional fields)
          if (value === undefined) return true;

          // Valid if it's a number
          if (typeof value === "number") return true;

          // Valid if it's an operator object with valid number properties
          if (typeof value === "object" && value !== null) {
            // Check each operator field
            const operatorFields = ["neq", "eq", "gt", "gte", "lt", "lte"];

            // At least one operator field should exist
            const hasOperatorField = operatorFields.some(
              (field) => field in value
            );
            if (!hasOperatorField) return false;

            // All present operator fields should have valid values
            return operatorFields.every((field) => {
              if (!(field in value)) return true;

              const fieldValue = (value as Record<string, unknown>)[field];

              // Check single number
              if (typeof fieldValue === "number") return true;

              // Check array of numbers
              if (Array.isArray(fieldValue)) {
                return fieldValue.every((item) => typeof item === "number");
              }

              return false;
            });
          }

          return false;
        },
        defaultMessage: buildMessage(
          (eachPrefix) =>
            `${eachPrefix}$property must be a number or a valid number operator object`,
          validationOptions
        ),
      },
    });
  };
}

/**
 * Custom validator to handle DateWithOperator type (string | Operator<string>)
 * Validates that a value is either a valid date string or a valid DateOperator object
 */
export function IsDateWithOperator(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isDateWithOperator",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          // Valid if it's undefined (for optional fields)
          if (value === undefined) return true;

          // Valid if it's a string (date)
          if (typeof value === "string") return true;

          // Valid if it's an operator object with valid string properties
          if (typeof value === "object" && value !== null) {
            // Check each operator field
            const operatorFields = ["neq", "eq", "gt", "gte", "lt", "lte"];

            // At least one operator field should exist
            const hasOperatorField = operatorFields.some(
              (field) => field in value
            );
            if (!hasOperatorField) return false;

            // All present operator fields should have valid values
            return operatorFields.every((field) => {
              if (!(field in value)) return true;

              const fieldValue = (value as Record<string, unknown>)[field];

              // Check single string
              if (typeof fieldValue === "string") return true;

              // Check array of strings
              if (Array.isArray(fieldValue)) {
                return fieldValue.every((item) => typeof item === "string");
              }

              return false;
            });
          }

          return false;
        },
        defaultMessage: buildMessage(
          (eachPrefix) =>
            `${eachPrefix}$property must be a date string or a valid date operator object`,
          validationOptions
        ),
      },
    });
  };
}

/**
 * Custom validator to handle IdentifierWithOperator type (string | IdentifierOperator)
 * Validates that a value is either a valid identifier string or a valid IdentifierOperator object
 */
export function IsIdentifierWithOperator(
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isIdentifierWithOperator",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          // Valid if it's undefined (for optional fields)
          if (value === undefined) return true;

          // Valid if it's a string (identifier)
          if (typeof value === "string") return true;

          // Valid if it's an operator object with valid string properties
          if (typeof value === "object" && value !== null) {
            // Check each operator field
            const operatorFields = ["neq", "eq"];

            // At least one operator field should exist
            const hasOperatorField = operatorFields.some(
              (field) => field in value
            );
            if (!hasOperatorField) return false;

            // All present operator fields should have valid values
            return operatorFields.every((field) => {
              if (!(field in value)) return true;

              const fieldValue = (value as Record<string, unknown>)[field];

              // Check single string
              if (typeof fieldValue === "string") return true;

              // Check array of strings
              if (Array.isArray(fieldValue)) {
                return fieldValue.every((item) => typeof item === "string");
              }

              return false;
            });
          }

          return false;
        },
        defaultMessage: buildMessage(
          (eachPrefix) =>
            `${eachPrefix}$property must be an identifier string or a valid identifier operator object`,
          validationOptions
        ),
      },
    });
  };
}

/**
 * Custom validator to handle StringWithOperator type (string | StringOperator)
 * Validates that a value is either a valid string or a valid StringOperator object
 */
export function IsStringWithOperator(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isStringWithOperator",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          // Valid if it's undefined (for optional fields)
          if (value === undefined) return true;

          // Valid if it's a string
          if (typeof value === "string") return true;

          // Valid if it's an operator object with valid string properties
          if (typeof value === "object" && value !== null) {
            // Check each operator field
            const operatorFields = [
              "neq",
              "eq",
              "startsWith",
              "endsWith",
              "contains",
            ];

            // At least one operator field should exist
            const hasOperatorField = operatorFields.some(
              (field) => field in value
            );
            if (!hasOperatorField) return false;

            // All present operator fields should have valid values
            return operatorFields.every((field) => {
              if (!(field in value)) return true;

              const fieldValue = (value as Record<string, unknown>)[field];

              // Check single string
              if (typeof fieldValue === "string") return true;

              // Check array of strings
              if (Array.isArray(fieldValue)) {
                return fieldValue.every((item) => typeof item === "string");
              }

              return false;
            });
          }

          return false;
        },
        defaultMessage: buildMessage(
          (eachPrefix) =>
            `${eachPrefix}$property must be a string or a valid string operator object`,
          validationOptions
        ),
      },
    });
  };
}
