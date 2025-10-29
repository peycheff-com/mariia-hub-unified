/**
 * Booksy API Client
 *
 * Proper API client for Booksy integration with:
 * - Secure authentication
 * - Rate limiting
 * - Error handling
 * - Cache management
 * - Webhook support
 */

import { apiGateway } from './secure-api-gateway';
import { credentialManager } from '@/lib/secure-credentials';
import { createClient } from '@supabase/supabase-js';
import { getEnvVar, getRequiredEnvVar } from '@/lib/runtime-env';

// Booksy API types
export interface BooksyService {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  currency: string;
  category: string;
  active: boolean;
  variants?: BooksyServiceVariant[];
}

export interface BooksyServiceVariant {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export interface BooksyAvailability {
  date: string;
  slots: BooksyTimeSlot[];
  fullyBooked: boolean;
}

export interface BooksyTimeSlot {
  start: string;
  end: string;
  available: boolean;
  staffId?: string;
  resourceId?: string;
}

export interface BooksyBooking {
  id: string;
  serviceId: string;
  clientId: string;
  staffId: string;
  datetime: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  duration: number;
  price: number;
  currency: string;
  notes?: string;
  clientInfo?: BooksyClientInfo;
}

export interface BooksyClientInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface BooksyWebhookEvent {
  event: string;
  data: any;
  timestamp: string;
  signature: string;
}

class BooksyApiClient {
  private supabase = createClient(
    getRequiredEnvVar('SUPABASE_URL', ['VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']),
    getRequiredEnvVar('SUPABASE_SERVICE_ROLE_KEY', ['VITE_SUPABASE_SERVICE_ROLE_KEY'])
  );

  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private webhookSecret: string | null = null;
  private cache: Map<string, { data: any; expiry: Date }> = new Map();

  /**
   * Initialize the Booksy client with authentication
   */
  async initialize(): Promise<boolean> {
    try {
      // Get credentials from secure storage
      const credentials = await credentialManager.getCredentials('booksy');
      if (!credentials) {
        console.error('No Booksy credentials found');
        return false;
      }

      // Authenticate with Booksy
      const authSuccess = await this.authenticate();
      if (!authSuccess) {
        console.error('Failed to authenticate with Booksy');
        return false;
      }

      // Set up webhooks
      await this.setupWebhooks();

      return true;
    } catch (error) {
      console.error('Failed to initialize Booksy client:', error);
      return false;
    }
  }

  /**
   * Authenticate with Booksy API
   */
  private async authenticate(): Promise<boolean> {
    try {
      const credentials = await credentialManager.getCredentials('booksy');
      if (!credentials) return false;

      // Check if token is still valid
      if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
        return true;
      }

      // Use OAuth2 client credentials flow or API key based on Booksy's implementation
      const response = await apiGateway.request('booksy', '/oauth/token', {
        method: 'POST',
        body: {
          grant_type: 'client_credentials',
          client_id: credentials.apiKey,
          client_secret: credentials.apiSecret
        },
        bypassCircuitBreaker: true
      });

      if (response.success && response.data) {
        this.accessToken = response.data.access_token;
        this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureAuthenticated(): Promise<boolean> {
    if (!this.accessToken || !this.tokenExpiry || this.tokenExpiry <= new Date()) {
      return await this.authenticate();
    }
    return true;
  }

  /**
   * Get all services from Booksy
   */
  async getServices(): Promise<BooksyService[]> {
    if (!(await this.ensureAuthenticated())) {
      throw new Error('Not authenticated with Booksy');
    }

    const cacheKey = 'booksy:services';
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await apiGateway.request('booksy', '/services', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (response.success && response.data) {
      const services = response.data.services || response.data;
      this.cache.set(cacheKey, services, 300000); // Cache for 5 minutes
      return services;
    }

    throw new Error(response.error || 'Failed to fetch services');
  }

  /**
   * Get service details by ID
   */
  async getService(serviceId: string): Promise<BooksyService | null> {
    if (!(await this.ensureAuthenticated())) {
      throw new Error('Not authenticated with Booksy');
    }

    const cacheKey = `booksy:service:${serviceId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await apiGateway.request('booksy', `/services/${serviceId}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (response.success && response.data) {
      this.cache.set(cacheKey, response.data, 300000);
      return response.data;
    }

    return null;
  }

  /**
   * Get availability for a service on a specific date
   */
  async getAvailability(
    serviceId: string,
    date: string,
    staffId?: string
  ): Promise<BooksyAvailability> {
    if (!(await this.ensureAuthenticated())) {
      throw new Error('Not authenticated with Booksy');
    }

    const cacheKey = `booksy:availability:${serviceId}:${date}:${staffId || 'all'}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const params = new URLSearchParams({
      date,
      service_id: serviceId
    });

    if (staffId) {
      params.append('staff_id', staffId);
    }

    const response = await apiGateway.request('booksy', `/availability?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (response.success && response.data) {
      this.cache.set(cacheKey, response.data, 60000); // Cache for 1 minute
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch availability');
  }

  /**
   * Create a booking in Booksy
   */
  async createBooking(bookingData: {
    serviceId: string;
    clientId?: string;
    datetime: string;
    staffId?: string;
    clientInfo: {
      name: string;
      email: string;
      phone: string;
    };
    notes?: string;
  }): Promise<BooksyBooking> {
    if (!(await this.ensureAuthenticated())) {
      throw new Error('Not authenticated with Booksy');
    }

    // First, create or get the client
    let clientId = bookingData.clientId;
    if (!clientId) {
      const client = await this.findOrCreateClient(bookingData.clientInfo);
      clientId = client.id;
    }

    const response = await apiGateway.request('booksy', '/bookings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: {
        service_id: bookingData.serviceId,
        client_id: clientId,
        datetime: bookingData.datetime,
        staff_id: bookingData.staffId,
        notes: bookingData.notes,
        status: 'confirmed'
      }
    });

    if (response.success && response.data) {
      // Clear relevant caches
      this.cache.delete(`booksy:availability:${bookingData.serviceId}:${bookingData.datetime.split('T')[0]}`);

      // Log the booking in our database
      await this.logBookingToDatabase(response.data);

      return response.data;
    }

    throw new Error(response.error || 'Failed to create booking');
  }

  /**
   * Find or create a client in Booksy
   */
  private async findOrCreateClient(clientInfo: {
    name: string;
    email: string;
    phone: string;
  }): Promise<BooksyClientInfo> {
    // Try to find existing client by email or phone
    const searchResponse = await apiGateway.request('booksy', `/clients/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: {
        email: clientInfo.email,
        phone: clientInfo.phone
      }
    });

    if (searchResponse.success && searchResponse.data && searchResponse.data.length > 0) {
      return searchResponse.data[0];
    }

    // Create new client
    const createResponse = await apiGateway.request('booksy', '/clients', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: {
        name: clientInfo.name,
        email: clientInfo.email,
        phone: clientInfo.phone
      }
    });

    if (createResponse.success && createResponse.data) {
      return createResponse.data;
    }

    throw new Error('Failed to find or create client');
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<boolean> {
    if (!(await this.ensureAuthenticated())) {
      throw new Error('Not authenticated with Booksy');
    }

    const response = await apiGateway.request('booksy', `/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: {
        reason: reason || 'Cancelled by customer'
      }
    });

    if (response.success) {
      // Update our database
      await this.updateBookingStatus(bookingId, 'cancelled');
      return true;
    }

    return false;
  }

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(
    bookingId: string,
    newDatetime: string,
    reason?: string
  ): Promise<BooksyBooking> {
    if (!(await this.ensureAuthenticated())) {
      throw new Error('Not authenticated with Booksy');
    }

    const response = await apiGateway.request('booksy', `/bookings/${bookingId}/reschedule`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: {
        new_datetime: newDatetime,
        reason: reason || 'Rescheduled by customer'
      }
    });

    if (response.success && response.data) {
      await this.updateBookingStatus(bookingId, 'confirmed', {
        datetime: newDatetime,
        notes: response.data.notes
      });
      return response.data;
    }

    throw new Error(response.error || 'Failed to reschedule booking');
  }

  /**
   * Get booking details
   */
  async getBooking(bookingId: string): Promise<BooksyBooking | null> {
    if (!(await this.ensureAuthenticated())) {
      throw new Error('Not authenticated with Booksy');
    }

    const response = await apiGateway.request('booksy', `/bookings/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (response.success && response.data) {
      return response.data;
    }

    return null;
  }

  /**
   * Set up webhooks for real-time updates
   */
  private async setupWebhooks(): Promise<void> {
    const siteUrl =
      getEnvVar('NEXT_PUBLIC_SITE_URL', ['APP_URL', 'VITE_APP_URL', 'SITE_URL']) ||
      'http://localhost:8080';
    const webhookUrl = `${siteUrl.replace(/\/$/, '')}/api/webhooks/booksy`;

    const response = await apiGateway.request('booksy', '/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: {
        url: webhookUrl,
        events: [
          'booking.created',
          'booking.cancelled',
          'booking.rescheduled',
          'client.created',
          'client.updated',
          'service.updated'
        ],
        secret: this.webhookSecret || this.generateWebhookSecret()
      }
    });

    if (response.success) {
      console.log('Booksy webhooks configured successfully');
      // Store webhook secret securely
      await this.storeWebhookSecret(response.data.secret);
    }
  }

  /**
   * Generate webhook secret
   */
  private generateWebhookSecret(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Store webhook secret securely
   */
  private async storeWebhookSecret(secret: string): Promise<void> {
    // Store in encrypted database field
    await this.supabase
      .from('integration_secrets')
      .upsert({
        service: 'booksy',
        key: 'webhook_secret',
        encrypted_value: secret, // In production, this should be encrypted
        updated_at: new Date()
      });
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn('No webhook secret configured');
      return false;
    }

    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(event: BooksyWebhookEvent): Promise<void> {
    if (!this.verifyWebhookSignature(JSON.stringify(event.data), event.signature)) {
      throw new Error('Invalid webhook signature');
    }

    switch (event.event) {
      case 'booking.created':
        await this.handleBookingCreated(event.data);
        break;
      case 'booking.cancelled':
        await this.handleBookingCancelled(event.data);
        break;
      case 'booking.rescheduled':
        await this.handleBookingRescheduled(event.data);
        break;
      case 'client.created':
      case 'client.updated':
        await this.handleClientUpdate(event.data);
        break;
      case 'service.updated':
        await this.handleServiceUpdate(event.data);
        break;
    }
  }

  /**
   * Log booking to our database
   */
  private async logBookingToDatabase(booking: BooksyBooking): Promise<void> {
    await this.supabase
      .from('external_bookings')
      .upsert({
        id: booking.id,
        source: 'booksy',
        service_id: booking.serviceId,
        client_id: booking.clientId,
        staff_id: booking.staffId,
        datetime: booking.datetime,
        status: booking.status,
        duration: booking.duration,
        price: booking.price,
        currency: booking.currency,
        notes: booking.notes,
        raw_data: booking,
        created_at: new Date(),
        updated_at: new Date()
      });
  }

  /**
   * Update booking status in our database
   */
  private async updateBookingStatus(
    bookingId: string,
    status: string,
    updates?: Record<string, any>
  ): Promise<void> {
    await this.supabase
      .from('external_bookings')
      .update({
        status,
        updated_at: new Date(),
        ...(updates && { raw_data: updates })
      })
      .eq('id', bookingId)
      .eq('source', 'booksy');
  }

  /**
   * Handle booking created webhook
   */
  private async handleBookingCreated(booking: BooksyBooking): Promise<void> {
    await this.logBookingToDatabase(booking);

    // Trigger any additional business logic
    // e.g., send confirmation email, update calendar, etc.
  }

  /**
   * Handle booking cancelled webhook
   */
  private async handleBookingCancelled(booking: BooksyBooking): Promise<void> {
    await this.updateBookingStatus(booking.id, 'cancelled');
  }

  /**
   * Handle booking rescheduled webhook
   */
  private async handleBookingRescheduled(booking: BooksyBooking): Promise<void> {
    await this.updateBookingStatus(booking.id, 'confirmed', {
      datetime: booking.datetime
    });
  }

  /**
   * Handle client update webhook
   */
  private async handleClientUpdate(client: BooksyClientInfo): Promise<void> {
    // Sync client information to our database
    await this.supabase
      .from('external_clients')
      .upsert({
        id: client.id,
        source: 'booksy',
        name: client.name,
        email: client.email,
        phone: client.phone,
        notes: client.notes,
        raw_data: client,
        updated_at: new Date()
      });
  }

  /**
   * Handle service update webhook
   */
  private async handleServiceUpdate(service: BooksyService): Promise<void> {
    // Clear cache for this service
    this.cache.delete(`booksy:service:${service.id}`);

    // Update service in our database
    await this.supabase
      .from('external_services')
      .upsert({
        id: service.id,
        source: 'booksy',
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
        currency: service.currency,
        category: service.category,
        active: service.active,
        raw_data: service,
        updated_at: new Date()
      });
  }

  /**
   * Sync all services from Booksy
   */
  async syncServices(): Promise<BooksyService[]> {
    const services = await this.getServices();

    for (const service of services) {
      await this.supabase
        .from('external_services')
        .upsert({
          id: service.id,
          source: 'booksy',
          name: service.name,
          description: service.description,
          duration: service.duration,
          price: service.price,
          currency: service.currency,
          category: service.category,
          active: service.active,
          raw_data: service,
          updated_at: new Date()
        });
    }

    console.log(`Synced ${services.length} services from Booksy`);
    return services;
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    lastSync: Date | null;
    servicesCount: number;
    bookingsCount: number;
    status: 'healthy' | 'syncing' | 'error';
  }> {
    const { data } = await this.supabase
      .from('integration_sync_status')
      .select('*')
      .eq('source', 'booksy')
      .single();

    const { count: servicesCount } = await this.supabase
      .from('external_services')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'booksy');

    const { count: bookingsCount } = await this.supabase
      .from('external_bookings')
      .select('*', { count: 'exact, head: true })
      .eq('source', 'booksy');

    return {
      lastSync: data?.last_sync || null,
      servicesCount: servicesCount || 0,
      bookingsCount: bookingsCount || 0,
      status: data?.status || 'error'
    };
  }
}

// Export singleton instance
export const booksyClient = new BooksyApiClient();

// Initialize the client when the module loads
booksyClient.initialize().catch(console.error);
