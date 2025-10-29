import { expect } from 'vitest';
import { MatcherFunction } from '@vitest/expect';

// ==================== CUSTOM MATCHERS ====================

const toBeInDOM: MatcherFunction = function (received) {
  const pass = received && received.ownerDocument === document;

  if (pass) {
    return {
      message: () => `expected element not to be in the DOM`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected element to be in the DOM`,
      pass: false,
    };
  }
};

const toHaveValidURL: MatcherFunction<[options?: { protocol?: string; domain?: string }]> =
  function (received, options = {}) {
    const { protocol = 'https', domain } = options;

    try {
      const url = new URL(received);

      let isValid = true;

      if (protocol && url.protocol !== `${protocol}:`) {
        isValid = false;
      }

      if (domain && !url.hostname.includes(domain)) {
        isValid = false;
      }

      if (isValid) {
        return {
          message: () => `expected ${received} not to be a valid URL`,
          pass: true,
        };
      } else {
        return {
          message: () => `expected ${received} to be a valid URL${protocol ? ` with protocol ${protocol}` : ''}${domain ? ` and domain ${domain}` : ''}`,
          pass: false,
        };
      }
    } catch {
      return {
        message: () => `expected ${received} to be a valid URL`,
        pass: false,
      };
    }
  };

const toBeValidEmail: MatcherFunction = function (received) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const pass = emailRegex.test(received);

  if (pass) {
    return {
      message: () => `expected ${received} not to be a valid email`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected ${received} to be a valid email`,
      pass: false,
    };
  }
};

const toBeValidPhoneNumber: MatcherFunction<[countryCode?: string]> =
  function (received, countryCode = 'PL') {
    const patterns = {
      PL: /^(\+48|0048)?\s?[1-9]\d{2}\s?\d{3}\s?\d{3}$/,
      US: /^(\+1)?\s?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
      UK: /^(\+44|0044)?\s?([1-9]\d{1,4})\s?\d{4}\s?\d{4}$/,
    };

    const pattern = patterns[countryCode as keyof typeof patterns] || patterns.PL;
    const pass = pattern.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ${countryCode} phone number`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ${countryCode} phone number`,
        pass: false,
      };
    }
  };

const toBeValidCurrency: MatcherFunction = function (received) {
  const validCurrencies = ['PLN', 'EUR', 'USD', 'GBP', 'CHF'];
  const pass = validCurrencies.includes(received);

  if (pass) {
    return {
      message: () => `expected ${received} not to be a valid currency code`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected ${received} to be a valid currency code (one of: ${validCurrencies.join(', ')})`,
      pass: false,
    };
  }
};

const toBeValidISODate: MatcherFunction = function (received) {
  if (typeof received !== 'string') {
    return {
      message: () => `expected ${received} to be a string`,
      pass: false,
    };
  }

  const date = new Date(received);
  const pass = !isNaN(date.getTime()) && received === date.toISOString();

  if (pass) {
    return {
      message: () => `expected ${received} not to be a valid ISO date string`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected ${received} to be a valid ISO date string`,
      pass: false,
    };
  }
};

const toBeInFuture: MatcherFunction = function (received) {
  const date = new Date(received);
  const now = new Date();
  const pass = !isNaN(date.getTime()) && date > now;

  if (pass) {
    return {
      message: () => `expected ${received} not to be in the future`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected ${received} to be in the future`,
      pass: false,
    };
  }
};

const toBeInPast: MatcherFunction = function (received) {
  const date = new Date(received);
  const now = new Date();
  const pass = !isNaN(date.getTime()) && date < now;

  if (pass) {
    return {
      message: () => `expected ${received} not to be in the past`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected ${received} to be in the past`,
      pass: false,
    };
  }
};

const toBeWithinRange: MatcherFunction<[min: number, max: number]> =
  function (received, [min, max]) {
    const pass = typeof received === 'number' && received >= min && received <= max;

    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${min} - ${max}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${min} - ${max}`,
        pass: false,
      };
    }
  };

const toHaveValidDuration: MatcherFunction = function (received) {
  const validDurations = [15, 30, 45, 60, 90, 120, 150, 180];
  const pass = validDurations.includes(received);

  if (pass) {
    return {
      message: () => `expected ${received} not to be a valid service duration`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected ${received} to be a valid service duration (one of: ${validDurations.join(', ')} minutes)`,
      pass: false,
    };
  }
};

const toHaveValidBookingStatus: MatcherFunction = function (received) {
  const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
  const pass = validStatuses.includes(received);

  if (pass) {
    return {
      message: () => `expected ${received} not to be a valid booking status`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected ${received} to be a valid booking status (one of: ${validStatuses.join(', ')})`,
      pass: false,
    };
  }
};

const toHaveValidPaymentStatus: MatcherFunction = function (received) {
  const validStatuses = ['pending', 'paid', 'failed', 'refunded', 'partially_refunded', 'not_required'];
  const pass = validStatuses.includes(received);

  if (pass) {
    return {
      message: () => `expected ${received} not to be a valid payment status`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected ${received} to be a valid payment status (one of: ${validStatuses.join(', ')})`,
      pass: false,
    };
  }
};

const toHaveProperPriceFormat: MatcherFunction<[currency?: string]> =
  function (received, currency = 'PLN') {
    const patterns = {
      PLN: /^[0-9]+([,.][0-9]{1,2})?\s?(zł|PLN)?$/,
      EUR: /^[0-9]+([,.][0-9]{1,2})?\s?€$/,
      USD: /^\$[0-9]+([,.][0-9]{1,2})?$/,
    };

    const pattern = patterns[currency as keyof typeof patterns] || patterns.PLN;
    const pass = pattern.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to have proper ${currency} price format`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to have proper ${currency} price format`,
        pass: false,
      };
    }
  };

const toContainRequiredFields: MatcherFunction<[requiredFields: string[]]> =
  function (received, requiredFields) {
    if (!received || typeof received !== 'object') {
      return {
        message: () => `expected ${received} to be an object`,
        pass: false,
      };
    }

    const missingFields = requiredFields.filter(field => !(field in received));
    const pass = missingFields.length === 0;

    if (pass) {
      return {
        message: () => `expected object not to contain all required fields`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected object to contain all required fields. Missing: ${missingFields.join(', ')}`,
        pass: false,
      };
    }
  };

const toHaveValidSlug: MatcherFunction = function (received) {
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const pass = slugRegex.test(received);

  if (pass) {
    return {
      message: () => `expected ${received} not to be a valid slug`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected ${received} to be a valid slug (lowercase, alphanumeric with hyphens)`,
      pass: false,
    };
  }
};

const toBeValidUUID: MatcherFunction = function (received) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const pass = uuidRegex.test(received);

  if (pass) {
    return {
      message: () => `expected ${received} not to be a valid UUID`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected ${received} to be a valid UUID`,
      pass: false,
    };
  }
};

const toHaveBeenCalledWithValidData: MatcherFunction<[schema: any]> =
  function (received, schema) {
    if (!received.mock || typeof received.mock.calls !== 'object') {
      return {
        message: () => `expected ${received} to be a mock function`,
        pass: false,
      };
    }

    const calls = received.mock.calls;
    if (calls.length === 0) {
      return {
        message: () => `expected mock function to have been called`,
        pass: false,
      };
    }

    // Basic schema validation
    const lastCall = calls[calls.length - 1][0];
    let isValid = true;
    const errors: string[] = [];

    for (const [key, value] of Object.entries(schema)) {
      if (key in lastCall) {
        const expectedType = value as string;
        const actualValue = lastCall[key];

        if (expectedType === 'email' && !actualValue.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          isValid = false;
          errors.push(`${key} should be a valid email`);
        } else if (expectedType === 'uuid' && !actualValue.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
          isValid = false;
          errors.push(`${key} should be a valid UUID`);
        } else if (expectedType === 'date' && isNaN(new Date(actualValue).getTime())) {
          isValid = false;
          errors.push(`${key} should be a valid date`);
        }
      } else {
        isValid = false;
        errors.push(`missing required field: ${key}`);
      }
    }

    if (isValid) {
      return {
        message: () => `expected mock function not to have been called with valid data`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected mock function to have been called with valid data. Errors: ${errors.join(', ')}`,
        pass: false,
      };
    }
  };

// ==================== EXTEND EXPECT ====================

expect.extend({
  toBeInDOM,
  toHaveValidURL,
  toBeValidEmail,
  toBeValidPhoneNumber,
  toBeValidCurrency,
  toBeValidISODate,
  toBeInFuture,
  toBeInPast,
  toBeWithinRange,
  toHaveValidDuration,
  toHaveValidBookingStatus,
  toHaveValidPaymentStatus,
  toHaveProperPriceFormat,
  toContainRequiredFields,
  toHaveValidSlug,
  toBeValidUUID,
  toHaveBeenCalledWithValidData,
});

// ==================== TYPE DECLARATIONS ====================

declare global {
  namespace Vi {
    interface Assertion<T = any> {
      toBeInDOM(): T;
      toHaveValidURL(options?: { protocol?: string; domain?: string }): T;
      toBeValidEmail(): T;
      toBeValidPhoneNumber(countryCode?: string): T;
      toBeValidCurrency(): T;
      toBeValidISODate(): T;
      toBeInFuture(): T;
      toBeInPast(): T;
      toBeWithinRange(min: number, max: number): T;
      toHaveValidDuration(): T;
      toHaveValidBookingStatus(): T;
      toHaveValidPaymentStatus(): T;
      toHaveProperPriceFormat(currency?: string): T;
      toContainRequiredFields(requiredFields: string[]): T;
      toHaveValidSlug(): T;
      toBeValidUUID(): T;
      toHaveBeenCalledWithValidData(schema: Record<string, string>): T;
    }
  }
}

export {};