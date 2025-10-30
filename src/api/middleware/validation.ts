/**
 * Request Validation Middleware
 * Input validation and sanitization using express-validator
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError as ExpressValidationError } from 'express-validator';
import { ValidationError } from './errorHandler';

export interface ValidationRule {
  field: string;
  rules: string[];
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

/**
 * Custom validation middleware
 */
export const validateRequest = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const validationErrors = errors.array().map((error: any) => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value,
      }));

      throw new ValidationError('Validation failed', validationErrors);
    }

    next();
  };
};

/**
 * Validate UUID format
 */
export const validateUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Polish phone number
 */
export const validatePolishPhone = (phone: string): boolean => {
  // Polish phone numbers: +48 XXX XXX XXX or 9 digits
  const polishPhoneRegex = /^(\+48\s?)?(\d{3}\s?\d{3}\s?\d{3}|\d{9})$/;
  return polishPhoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate Polish NIP (VAT number)
 */
export const validatePolishNIP = (nip: string): boolean => {
  // Remove spaces and dashes
  const cleanNip = nip.replace(/[\s-]/g, '');

  // Check if it's 10 digits
  if (!/^\d{10}$/.test(cleanNip)) {
    return false;
  }

  // Calculate checksum
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanNip[i]) * weights[i];
  }

  const checksum = sum % 11;
  const lastDigit = parseInt(cleanNip[9]);

  return checksum === lastDigit;
};

/**
 * Validate Polish postal code
 */
export const validatePolishPostalCode = (postalCode: string): boolean => {
  const postalCodeRegex = /^\d{2}-\d{3}$/;
  return postalCodeRegex.test(postalCode);
};

/**
 * Validate booking date (business days only)
 */
export const validateBookingDate = (date: Date): boolean => {
  const now = new Date();
  const bookingDate = new Date(date);

  // Check if date is in the future
  if (bookingDate <= now) {
    return false;
  }

  // Check if date is within 90 days
  const maxDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  if (bookingDate > maxDate) {
    return false;
  }

  // Check if it's a weekday (Monday-Saturday)
  const dayOfWeek = bookingDate.getDay();
  return dayOfWeek >= 1 && dayOfWeek <= 6;
};

/**
 * Validate booking time (business hours)
 */
export const validateBookingTime = (time: string): boolean => {
  const [hours, minutes] = time.split(':').map(Number);

  if (isNaN(hours) || isNaN(minutes)) {
    return false;
  }

  // Business hours: 9:00 - 21:00
  const totalMinutes = hours * 60 + minutes;
  const businessStart = 9 * 60; // 9:00
  const businessEnd = 21 * 60; // 21:00

  return totalMinutes >= businessStart && totalMinutes <= businessEnd;
};

/**
 * Validate service price
 */
export const validatePrice = (price: number, currency: string = 'PLN'): boolean => {
  if (typeof price !== 'number' || price < 0) {
    return false;
  }

  // For PLN, reasonable price range
  if (currency === 'PLN') {
    return price >= 50 && price <= 5000; // 50 PLN - 5000 PLN
  }

  // For other currencies, more lenient range
  return price >= 10 && price <= 10000;
};

/**
 * Validate file upload
 */
export const validateFile = (file: any, allowedTypes: string[], maxSize: number): boolean => {
  if (!file) {
    return false;
  }

  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    return false;
  }

  // Check file size
  if (file.size > maxSize) {
    return false;
  }

  return true;
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (page?: number, limit?: number): ValidationResult => {
  const errors: Array<{ field: string; message: string; value?: any }> = [];

  if (page !== undefined) {
    if (!Number.isInteger(page) || page < 1) {
      errors.push({
        field: 'page',
        message: 'Page must be a positive integer',
        value: page,
      });
    }
  }

  if (limit !== undefined) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      errors.push({
        field: 'limit',
        message: 'Limit must be between 1 and 100',
        value: limit,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate sort parameters
 */
export const validateSort = (
  sortBy: string,
  allowedFields: string[],
  sortOrder: string = 'asc'
): ValidationResult => {
  const errors: Array<{ field: string; message: string; value?: any }> = [];

  if (!allowedFields.includes(sortBy)) {
    errors.push({
      field: 'sortBy',
      message: `Sort field must be one of: ${allowedFields.join(', ')}`,
      value: sortBy,
    });
  }

  if (!['asc', 'desc'].includes(sortOrder.toLowerCase())) {
    errors.push({
      field: 'sortOrder',
      message: 'Sort order must be either "asc" or "desc"',
      value: sortOrder,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate date range
 */
export const validateDateRange = (
  startDate?: Date,
  endDate?: Date
): ValidationResult => {
  const errors: Array<{ field: string; message: string; value?: any }> = [];

  if (startDate && endDate) {
    if (startDate >= endDate) {
      errors.push({
        field: 'dateRange',
        message: 'Start date must be before end date',
        value: { startDate, endDate },
      });
    }

    // Check if range is not too large (max 1 year)
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > oneYear) {
      errors.push({
        field: 'dateRange',
        message: 'Date range cannot exceed 1 year',
        value: { startDate, endDate },
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize input string
 */
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .substring(0, 1000); // Limit length
};

/**
 * Validate and sanitize user input
 */
export const validateAndSanitize = (
  input: any,
  type: 'string' | 'number' | 'email' | 'phone' | 'uuid'
): { isValid: boolean; sanitized: any; error?: string } => {
  if (input === null || input === undefined) {
    return { isValid: false, sanitized: null, error: 'Value is required' };
  }

  switch (type) {
    case 'string':
      if (typeof input !== 'string') {
        return { isValid: false, sanitized: null, error: 'Must be a string' };
      }
      return { isValid: true, sanitized: sanitizeString(input) };

    case 'number':
      const num = Number(input);
      if (isNaN(num) || !isFinite(num)) {
        return { isValid: false, sanitized: null, error: 'Must be a valid number' };
      }
      return { isValid: true, sanitized: num };

    case 'email':
      if (typeof input !== 'string' || !validateEmail(input)) {
        return { isValid: false, sanitized: null, error: 'Must be a valid email address' };
      }
      return { isValid: true, sanitized: input.toLowerCase().trim() };

    case 'phone':
      if (typeof input !== 'string' || !validatePolishPhone(input)) {
        return { isValid: false, sanitized: null, error: 'Must be a valid Polish phone number' };
      }
      return { isValid: true, sanitized: input.replace(/\s/g, '') };

    case 'uuid':
      if (typeof input !== 'string' || !validateUUID(input)) {
        return { isValid: false, sanitized: null, error: 'Must be a valid UUID' };
      }
      return { isValid: true, sanitized: input };

    default:
      return { isValid: false, sanitized: null, error: 'Unknown validation type' };
  }
};

export default {
  validateRequest,
  validateUUID,
  validateEmail,
  validatePolishPhone,
  validatePolishNIP,
  validatePolishPostalCode,
  validateBookingDate,
  validateBookingTime,
  validatePrice,
  validateFile,
  validatePagination,
  validateSort,
  validateDateRange,
  sanitizeString,
  validateAndSanitize,
};