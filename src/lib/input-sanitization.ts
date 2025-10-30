/**
 * Input Validation and Sanitization Utilities
 *
 * Provides comprehensive input validation and sanitization for all user inputs
 * to prevent XSS, injection attacks, and other security vulnerabilities.
 */

import DOMPurify from 'dompurify';
import { z } from 'zod';

// HTML sanitization configuration for different contexts
export const HTML_SANITIZATION_CONFIGS = {
  // Basic text with minimal formatting
  basic: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'button'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur']
  },

  // Rich content for emails and descriptions
  rich: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'button', 'style'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'style']
  },

  // Strict sanitization for usernames and display names
  strict: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'button'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur']
  }
};

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHTML = (html: string, config: keyof typeof HTML_SANITIZATION_CONFIGS = 'basic'): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const sanitizationConfig = HTML_SANITIZATION_CONFIGS[config];
  return DOMPurify.sanitize(html, sanitizationConfig);
};

/**
 * Sanitize user input for display purposes (no HTML allowed)
 */
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove all HTML tags and encode special characters
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

/**
 * Validate and sanitize email addresses
 */
export const validateAndSanitizeEmail = (email: string): { valid: boolean; sanitized: string } => {
  if (!email || typeof email !== 'string') {
    return { valid: false, sanitized: '' };
  }

  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return {
    valid: emailRegex.test(sanitized),
    sanitized
  };
};

/**
 * Validate and sanitize phone numbers (Polish format)
 */
export const validateAndSanitizePhone = (phone: string): { valid: boolean; sanitized: string } => {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, sanitized: '' };
  }

  // Remove all non-digit characters
  const sanitized = phone.replace(/\D/g, '');

  // Check if it's a valid Polish phone number (9 digits for mobile, 9 for landline with area code)
  const isValid = sanitized.length === 9 && sanitized.startsWith('5') ||
                  sanitized.length === 9 && sanitized.startsWith('6') ||
                  sanitized.length === 9 && sanitized.startsWith('7') ||
                  sanitized.length === 9 && sanitized.startsWith('2');

  return {
    valid: isValid,
    sanitized
  };
};

/**
 * Validate and sanitize URLs
 */
export const validateAndSanitizeURL = (url: string): { valid: boolean; sanitized: string } => {
  if (!url || typeof url !== 'string') {
    return { valid: false, sanitized: '' };
  }

  const sanitized = url.trim();

  try {
    const urlObj = new URL(sanitized);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, sanitized: '' };
    }

    return { valid: true, sanitized: urlObj.toString() };
  } catch {
    return { valid: false, sanitized: '' };
  }
};

/**
 * Sanitize file names to prevent path traversal attacks
 */
export const sanitizeFileName = (fileName: string): string => {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }

  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.\./g, '')
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .toLowerCase()
    .substring(0, 255);
};

/**
 * Validate and sanitize search queries
 */
export const sanitizeSearchQuery = (query: string): { sanitized: string; isSQLInjection: boolean } => {
  if (!query || typeof query !== 'string') {
    return { sanitized: '', isSQLInjection: false };
  }

  const sanitized = query.trim();

  // Common SQL injection patterns
  const sqlInjectionPatterns = [
    /drop\s+table/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+set/i,
    /union\s+select/i,
    /exec\s*\(/i,
    /script\s*>/i,
    /javascript:/i,
    /--/,
    /\/\*/,
    /\*\//
  ];

  const isSQLInjection = sqlInjectionPatterns.some(pattern => pattern.test(sanitized));

  return {
    sanitized: isSQLInjection ? '' : sanitized,
    isSQLInjection
  };
};

/**
 * Zod schemas for input validation
 */
export const UserInputSchemas = {
  // Email validation schema
  email: z.string().email('Invalid email address').max(254, 'Email too long'),

  // Name validation schema
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s\u0100-\u017F]+$/, 'Name can only contain letters and spaces'),

  // Phone validation schema (Polish format)
  phone: z.string()
    .regex(/^\d{9}$/, 'Phone number must be 9 digits'),

  // Message validation schema
  message: z.string()
    .min(1, 'Message is required')
    .max(2000, 'Message too long')
    .transform(val => sanitizeText(val)),

  // Service description validation
  serviceDescription: z.string()
    .min(10, 'Description too short')
    .max(2000, 'Description too long')
    .transform(val => sanitizeHTML(val, 'rich')),

  // User bio validation
  bio: z.string()
    .max(500, 'Bio too long')
    .transform(val => sanitizeHTML(val, 'basic'))
};

/**
 * Comprehensive input validation for booking forms
 */
export const validateBookingInput = (data: any): { valid: boolean; errors: string[]; sanitized: any } => {
  const errors: string[] = [];
  const sanitized: any = {};

  // Validate email
  const emailValidation = validateAndSanitizeEmail(data.email);
  if (!emailValidation.valid) {
    errors.push('Invalid email address');
  }
  sanitized.email = emailValidation.sanitized;

  // Validate phone
  if (data.phone) {
    const phoneValidation = validateAndSanitizePhone(data.phone);
    if (!phoneValidation.valid) {
      errors.push('Invalid phone number');
    }
    sanitized.phone = phoneValidation.sanitized;
  }

  // Validate name
  if (data.name) {
    const nameValidation = UserInputSchemas.name.safeParse(data.name);
    if (!nameValidation.success) {
      errors.push(nameValidation.error.issues[0].message);
    } else {
      sanitized.name = nameValidation.data;
    }
  }

  // Validate notes/message
  if (data.notes) {
    const notesValidation = UserInputSchemas.message.safeParse(data.notes);
    if (!notesValidation.success) {
      errors.push('Invalid notes format');
    } else {
      sanitized.notes = notesValidation.data;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
};

/**
 * Content Security Policy helper for dynamic content
 */
export const getCSPNonce = (): string => {
  // Generate or retrieve nonce from server-side context
  // This is a placeholder - actual implementation should come from server
  return typeof window !== 'undefined' ?
    window.crypto.getRandomValues(new Uint8Array(16)).join('') :
    'placeholder-nonce';
};

/**
 * Sanitize user-generated content for public display
 */
export const sanitizeUserContent = (content: string, contentType: 'comment' | 'review' | 'bio' = 'comment'): string => {
  const configs = {
    comment: 'basic',
    review: 'rich',
    bio: 'basic'
  };

  return sanitizeHTML(content, configs[contentType] as keyof typeof HTML_SANITIZATION_CONFIGS);
};

/**
 * Rate limiting helper for API requests
 */
export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (identifier: string): { allowed: boolean; remaining: number; resetTime: number } => {
    const now = Date.now();
    const key = identifier;
    const existing = requests.get(key);

    if (!existing || now > existing.resetTime) {
      const resetTime = now + windowMs;
      requests.set(key, { count: 1, resetTime });
      return { allowed: true, remaining: maxRequests - 1, resetTime };
    }

    if (existing.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: existing.resetTime };
    }

    existing.count++;
    return { allowed: true, remaining: maxRequests - existing.count, resetTime: existing.resetTime };
  };
};

/**
 * Input sanitization middleware for API endpoints
 */
export const sanitizeAPIInput = (reqBody: any): any => {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(reqBody)) {
    if (typeof value === 'string') {
      // Check if field should allow HTML
      const allowsHTML = ['content', 'description', 'message'].includes(key.toLowerCase());

      if (allowsHTML) {
        sanitized[key] = sanitizeHTML(value, 'rich');
      } else {
        sanitized[key] = sanitizeText(value);
      }
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeAPIInput(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};