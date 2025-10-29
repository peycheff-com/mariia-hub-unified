import { Context, Next } from 'hono';

import { ApiError } from '../api/base.service';

export interface ValidationSchema {
  body?: any;
  query?: any;
  params?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export class ValidationMiddleware {
  /**
   * Validate request data against schema
   */
  static validate(schema: ValidationSchema) {
    return async (c: Context, next: Next) => {
      const errors: ValidationError[] = [];

      try {
        // Validate request body
        if (schema.body) {
          const body = await c.req.json().catch(() => null);
          if (body) {
            const bodyErrors = this.validateObject(body, schema.body, 'body');
            errors.push(...bodyErrors);
          } else if (schema.body.required) {
            errors.push({
              field: 'body',
              message: 'Request body is required',
              code: 'REQUIRED_BODY'
            });
          }
        }

        // Validate query parameters
        if (schema.query) {
          const query = c.req.query();
          const queryErrors = this.validateObject(query, schema.query, 'query');
          errors.push(...queryErrors);
        }

        // Validate route parameters
        if (schema.params) {
          const params = c.req.param();
          const paramErrors = this.validateObject(params, schema.params, 'param');
          errors.push(...paramErrors);
        }

        // If validation errors exist, return 400 response
        if (errors.length > 0) {
          const apiError: ApiError = {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: { errors },
            timestamp: new Date().toISOString()
          };

          c.status(400);
          return c.json(apiError);
        }

        // Continue with request if validation passes
        await next();
      } catch (error) {
        const apiError: ApiError = {
          message: 'Validation processing error',
          code: 'VALIDATION_PROCESSING_ERROR',
          details: { originalError: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date().toISOString()
        };

        c.status(500);
        return c.json(apiError);
      }
    };
  }

  /**
   * Validate an object against a schema
   */
  private static validateObject(
    obj: any,
    schema: any,
    context: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!schema || typeof schema !== 'object') {
      return errors;
    }

    for (const [field, rules] of Object.entries(schema)) {
      const value = obj[field];

      // Check required fields
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: `${context}.${field}`,
          message: rules.requiredMessage || `${field} is required`,
          code: 'REQUIRED_FIELD'
        });
        continue;
      }

      // Skip validation if field is not provided and not required
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Type validation
      if (rules.type && !this.validateType(value, rules.type)) {
        errors.push({
          field: `${context}.${field}`,
          message: rules.typeMessage || `${field} must be of type ${rules.type}`,
          code: 'INVALID_TYPE'
        });
        continue;
      }

      // String validations
      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push({
            field: `${context}.${field}`,
            message: rules.minLengthMessage || `${field} must be at least ${rules.minLength} characters`,
            code: 'MIN_LENGTH'
          });
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push({
            field: `${context}.${field}`,
            message: rules.maxLengthMessage || `${field} must be no more than ${rules.maxLength} characters`,
            code: 'MAX_LENGTH'
          });
        }

        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push({
            field: `${context}.${field}`,
            message: rules.patternMessage || `${field} format is invalid`,
            code: 'INVALID_PATTERN'
          });
        }
      }

      // Number validations
      if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push({
            field: `${context}.${field}`,
            message: rules.minMessage || `${field} must be at least ${rules.min}`,
            code: 'MIN_VALUE'
          });
        }

        if (rules.max !== undefined && value > rules.max) {
          errors.push({
            field: `${context}.${field}`,
            message: rules.maxMessage || `${field} must be no more than ${rules.max}`,
            code: 'MAX_VALUE'
          });
        }
      }

      // Array validations
      if (Array.isArray(value)) {
        if (rules.minItems && value.length < rules.minItems) {
          errors.push({
            field: `${context}.${field}`,
            message: rules.minItemsMessage || `${field} must have at least ${rules.minItems} items`,
            code: 'MIN_ITEMS'
          });
        }

        if (rules.maxItems && value.length > rules.maxItems) {
          errors.push({
            field: `${context}.${field}`,
            message: rules.maxItemsMessage || `${field} must have no more than ${rules.maxItems} items`,
            code: 'MAX_ITEMS'
          });
        }

        if (rules.uniqueItems && new Set(value).size !== value.length) {
          errors.push({
            field: `${context}.${field}`,
            message: `${field} must contain unique items`,
            code: 'DUPLICATE_ITEMS'
          });
        }

        // Validate array items if schema provided
        if (rules.items) {
          value.forEach((item, index) => {
            const itemErrors = this.validateObject(
              { item },
              { item: rules.items },
              `${context}.${field}[${index}]`
            );
            errors.push(...itemErrors);
          });
        }
      }

      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({
          field: `${context}.${field}`,
          message: rules.enumMessage || `${field} must be one of: ${rules.enum.join(', ')}`,
          code: 'INVALID_ENUM'
        });
      }

      // Email validation
      if (rules.format === 'email' && !this.isValidEmail(value)) {
        errors.push({
          field: `${context}.${field}`,
          message: `${field} must be a valid email address`,
          code: 'INVALID_EMAIL'
        });
      }

      // Phone validation
      if (rules.format === 'phone' && !this.isValidPhone(value)) {
        errors.push({
          field: `${context}.${field}`,
          message: `${field} must be a valid phone number`,
          code: 'INVALID_PHONE'
        });
      }

      // Date validation
      if (rules.format === 'date') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors.push({
            field: `${context}.${field}`,
            message: `${field} must be a valid date`,
            code: 'INVALID_DATE'
          });
        }
      }

      // Custom validation
      if (rules.custom && typeof rules.custom === 'function') {
        try {
          const customResult = rules.custom(value);
          if (customResult !== true) {
            errors.push({
              field: `${context}.${field}`,
              message: typeof customResult === 'string' ? customResult : `${field} is invalid`,
              code: 'CUSTOM_VALIDATION'
            });
          }
        } catch (error) {
          errors.push({
            field: `${context}.${field}`,
            message: 'Validation error occurred',
            code: 'CUSTOM_VALIDATION_ERROR'
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate data type
   */
  private static validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'integer':
        return Number.isInteger(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number (Polish format)
   */
  private static isValidPhone(phone: string): boolean {
    // Remove spaces, dashes, and parentheses
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Polish phone number validation
    const phoneRegex = /^(\+48|48)?[5-9]\d{8}$/;
    return phoneRegex.test(cleanPhone);
  }
}

// Common validation schemas
export const CommonSchemas = {
  // Booking validation schemas
  createBooking: {
    body: {
      service_id: {
        type: 'string',
        required: true,
        pattern: /^[0-9a-f-]{36}$/,
        patternMessage: 'Invalid service ID format'
      },
      booking_date: {
        type: 'string',
        format: 'date',
        required: true
      },
      booking_time: {
        type: 'string',
        required: true,
        pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        patternMessage: 'Time must be in HH:MM format'
      },
      client_name: {
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 100,
        patternMessage: 'Name must be between 2 and 100 characters'
      },
      client_email: {
        type: 'string',
        format: 'email',
        required: true
      },
      client_phone: {
        type: 'string',
        format: 'phone',
        required: true
      },
      notes: {
        type: 'string',
        maxLength: 500,
        required: false
      },
      consent_terms: {
        type: 'boolean',
        required: true,
        custom: (value: boolean) => value === true || 'You must accept the terms and conditions'
      }
    }
  },

  // Service query validation
  serviceQuery: {
    query: {
      type: {
        type: 'string',
        enum: ['beauty', 'fitness', 'lifestyle'],
        required: false
      },
      category: {
        type: 'string',
        maxLength: 50,
        required: false
      },
      active: {
        type: 'boolean',
        required: false
      },
      limit: {
        type: 'number',
        min: 1,
        max: 100,
        required: false
      },
      offset: {
        type: 'number',
        min: 0,
        required: false
      }
    }
  },

  // Pagination validation
  pagination: {
    query: {
      page: {
        type: 'number',
        min: 1,
        required: false
      },
      limit: {
        type: 'number',
        min: 1,
        max: 100,
        required: false
      }
    }
  },

  // ID parameter validation
  idParam: {
    params: {
      id: {
        type: 'string',
        required: true,
        pattern: /^[0-9a-f-]{36}$/,
        patternMessage: 'Invalid ID format'
      }
    }
  }
};