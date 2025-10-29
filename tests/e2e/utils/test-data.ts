export interface TestUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  password: string;
  preferences?: {
    beauty: boolean;
    fitness: boolean;
    newsletters: boolean;
  };
}

export interface TestService {
  id: string;
  name: string;
  type: 'beauty' | 'fitness' | 'lifestyle';
  price: number;
  duration: number;
  description: string;
  slug: string;
}

export interface TestPackage {
  id: string;
  name: string;
  serviceType: 'beauty' | 'fitness';
  sessions: number;
  price: number;
  validity: number; // days
  services: string[];
}

export interface TestBooking {
  id: string;
  serviceId: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  dateTime: string;
  price: number;
}

// Test data factory
export class TestDataFactory {
  static createTestUser(overrides?: Partial<TestUser>): TestUser {
    const timestamp = Date.now();
    return {
      id: `test-user-${timestamp}`,
      email: `test+${timestamp}@example.com`,
      name: 'Test User',
      phone: '+48 123 456 789',
      password: 'TestPassword123!',
      preferences: {
        beauty: true,
        fitness: false,
        newsletters: false,
      },
      ...overrides,
    };
  }

  static createBeautyService(): TestService {
    return {
      id: 'beauty-brows-test',
      name: 'Beauty Brows Enhancement',
      type: 'beauty',
      price: 350,
      duration: 60,
      description: 'Professional brow enhancement service',
      slug: 'beauty-brows-enhancement',
    };
  }

  static createFitnessService(): TestService {
    return {
      id: 'fitness-glutes-test',
      name: 'Glute Sculpting Program',
      type: 'fitness',
      price: 250,
      duration: 90,
      description: 'Intensive glute workout program',
      slug: 'fitness-glutes-program',
    };
  }

  static createPackage(): TestPackage {
    return {
      id: 'package-beauty-5',
      name: 'Beauty Package 5 Sessions',
      serviceType: 'beauty',
      sessions: 5,
      price: 1500,
      validity: 90,
      services: ['beauty-brows-test'],
    };
  }

  static createBooking(overrides?: Partial<TestBooking>): TestBooking {
    return {
      id: `booking-${Date.now()}`,
      serviceId: 'beauty-brows-test',
      userId: 'test-user-default',
      status: 'pending',
      dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      price: 350,
      ...overrides,
    };
  }
}

// Test data manager for cleanup
export class TestDataManager {
  private createdUsers: TestUser[] = [];
  private createdBookings: TestBooking[] = [];
  private createdPackages: TestPackage[] = [];
  private context: BrowserContext;

  constructor(context: BrowserContext) {
    this.context = context;
  }

  async createUser(overrides?: Partial<TestUser>): Promise<TestUser> {
    const user = TestDataFactory.createTestUser(overrides);
    this.createdUsers.push(user);
    return user;
  }

  async createBooking(overrides?: Partial<TestBooking>): Promise<TestBooking> {
    const booking = TestDataFactory.createBooking(overrides);
    this.createdBookings.push(booking);
    return booking;
  }

  async createPackage(overrides?: Partial<TestPackage>): Promise<TestPackage> {
    const pkg = TestDataFactory.createPackage(overrides);
    this.createdPackages.push(pkg);
    return pkg;
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test data...');

    // In a real implementation, this would make API calls to clean up
    // For now, we'll just log what would be cleaned up

    if (this.createdUsers.length > 0) {
      console.log(`🗑️  Would delete ${this.createdUsers.length} test users`);
    }

    if (this.createdBookings.length > 0) {
      console.log(`🗑️  Would delete ${this.createdBookings.length} test bookings`);
    }

    if (this.createdPackages.length > 0) {
      console.log(`🗑️  Would delete ${this.createdPackages.length} test packages`);
    }

    // Clear local arrays
    this.createdUsers = [];
    this.createdBookings = [];
    this.createdPackages = [];
  }

  // Get cleanup summary for debugging
  getCleanupSummary(): {
    users: number;
    bookings: number;
    packages: number;
  } {
    return {
      users: this.createdUsers.length,
      bookings: this.createdBookings.length,
      packages: this.createdPackages.length,
    };
  }
}

// Environment-specific test data
export const TestEnvironments = {
  staging: {
    baseURL: 'https://staging.mariia-hub.com',
    apiURL: 'https://staging-api.mariia-hub.com',
    testUserPrefix: 'staging-test',
  },
  development: {
    baseURL: 'http://localhost:8080',
    apiURL: 'http://localhost:8080',
    testUserPrefix: 'dev-test',
  },
  production: {
    baseURL: 'https://mariia-hub.com',
    apiURL: 'https://api.mariia-hub.com',
    testUserPrefix: 'prod-test',
  },
};

// Mock API responses for testing
export const MockApiResponses = {
  services: {
    beauty: [
      TestDataFactory.createBeautyService(),
      {
        id: 'beauty-lips-test',
        name: 'Lip Enhancement',
        type: 'beauty' as const,
        price: 400,
        duration: 90,
        description: 'Professional lip enhancement service',
        slug: 'beauty-lips-enhancement',
      },
    ],
    fitness: [
      TestDataFactory.createFitnessService(),
      {
        id: 'fitness-core-test',
        name: 'Core Strength Program',
        type: 'fitness' as const,
        price: 200,
        duration: 60,
        description: 'Core strengthening workout program',
        slug: 'fitness-core-program',
      },
    ],
  },

  timeSlots: [
    {
      id: 'slot-1',
      time: '09:00',
      available: true,
      location: 'studio',
      price: 350,
    },
    {
      id: 'slot-2',
      time: '10:30',
      available: true,
      location: 'studio',
      price: 350,
    },
    {
      id: 'slot-3',
      time: '14:00',
      available: false,
      location: 'studio',
      price: 350,
    },
  ],

  packages: [
    TestDataFactory.createPackage(),
    {
      id: 'package-fitness-10',
      name: 'Fitness Package 10 Sessions',
      serviceType: 'fitness' as const,
      sessions: 10,
      price: 2000,
      validity: 120,
      services: ['fitness-glutes-test'],
    },
  ],
};

// Polish phone number validation
export const PolishPhoneNumbers = {
  valid: [
    '+48 123 456 789',
    '+48 123-456-789',
    '+48123456789',
    '123 456 789',
    '123-456-789',
    '123456789',
  ],
  invalid: [
    '+48 123 456 78', // too short
    '+48 123 456 7890', // too long
    '+48 12 345 678', // wrong format
    'abc def ghi', // non-numeric
    '+33 123 456 789', // wrong country code
  ],
};

// Test email addresses
export const TestEmails = {
  valid: [
    'test@example.com',
    'user.name@domain.co.uk',
    'user+tag@example.org',
    'test123@test-domain.com',
  ],
  invalid: [
    'invalid-email',
    '@example.com',
    'test@',
    'test..test@example.com',
    'test@example.',
  ],
};

// Credit card test data (Stripe test cards)
export const TestCreditCards = {
  visa: {
    number: '4242424242424242',
    exp_month: '12',
    exp_year: new Date().getFullYear() + 3,
    cvc: '123',
    name: 'Test User',
  },
  mastercard: {
    number: '5555555555554444',
    exp_month: '12',
    exp_year: new Date().getFullYear() + 3,
    cvc: '123',
    name: 'Test User',
  },
  declined: {
    number: '4000000000000002',
    exp_month: '12',
    exp_year: new Date().getFullYear() + 3,
    cvc: '123',
    name: 'Test User',
  },
};
