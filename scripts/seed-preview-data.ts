#!/usr/bin/env tsx

/**
 * Preview Environment Database Seeder
 *
 * Lightweight seeder for preview environments (PR deployments)
 * Creates minimal but sufficient test data for quick validation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

const _PREVIEW_NUM_SERVICES = 8;
const _PREVIEW_NUM_CLIENTS = 10;
const _PREVIEW_NUM_BOOKINGS = 20;

class PreviewDatabaseSeeder {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.PREVIEW_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.PREVIEW_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration for preview environment');
      process.exit(1);
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async seedMinimal(): Promise<void> {
    console.log('🌱 Seeding preview environment with minimal test data...');

    try {
      // Create a few essential services
      const serviceIds = await this.seedEssentialServices();

      // Create test users
      const { clients } = await this.seedTestUsers();

      // Create sample bookings
      await this.seedSampleBookings(serviceIds, clients);

      console.log('✅ Preview environment seeded successfully');

    } catch (error) {
      console.error('❌ Failed to seed preview environment:', error);
      process.exit(1);
    }
  }

  private async seedEssentialServices(): Promise<string[]> {
    console.log('📋 Creating essential services...');

    const services = [
      {
        category: 'beauty',
        name: 'Classic Manicure',
        name_pl: 'Klasyczny Manicure',
        description: 'Traditional manicure with cuticle care',
        description_pl: 'Tradycyjny manicure z pielęgnacją skórek',
        duration: 60,
        price: 120,
        currency: 'PLN',
        is_active: true,
        order_index: 1
      },
      {
        category: 'beauty',
        name: 'Gel Polish Manicure',
        name_pl: 'Manicure Hybrydowy',
        description: 'Long-lasting gel polish application',
        description_pl: 'Trwałe lakierowanie hybrydowe',
        duration: 90,
        price: 180,
        currency: 'PLN',
        is_active: true,
        order_index: 2
      },
      {
        category: 'fitness',
        name: 'Personal Training',
        name_pl: 'Trening Personalny',
        description: 'One-on-one personalized training',
        description_pl: 'Indywidualny trening personalny',
        duration: 60,
        price: 200,
        currency: 'PLN',
        is_active: true,
        order_index: 3
      },
      {
        category: 'lifestyle',
        name: 'Spa Day Package',
        name_pl: 'Pakiet Spa',
        description: 'Full day of wellness treatments',
        description_pl: 'Cały dzień zabiegów wellness',
        duration: 240,
        price: 500,
        currency: 'PLN',
        is_active: true,
        order_index: 4
      }
    ];

    const serviceIds: string[] = [];

    for (const service of services) {
      const { data, error } = await this.supabase
        .from('services')
        .insert(service)
        .select('id')
        .single();

      if (data?.id && !error) {
        serviceIds.push(data.id);
      }
    }

    return serviceIds;
  }

  private async seedTestUsers(): Promise<{ clients: string[] }> {
    console.log('👥 Creating test users...');

    const testClients = [
      { email: 'client1@preview.test', full_name: 'Anna Kowalska' },
      { email: 'client2@preview.test', full_name: 'Piotr Nowak' },
      { email: 'client3@preview.test', full_name: 'Maria Wiśniewska' }
    ];

    const clientIds: string[] = [];

    for (const client of testClients) {
      const { data: authData } = await this.supabase.auth.admin.createUser({
        email: client.email,
        password: 'preview123',
        email_confirm: true
      });

      if (authData?.user) {
        await this.supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: client.email,
            full_name: client.full_name,
            phone: '+48123456789',
            role: 'client'
          });

        clientIds.push(authData.user.id);
      }
    }

    return { clients: clientIds };
  }

  private async seedSampleBookings(serviceIds: string[], clientIds: string[]): Promise<void> {
    console.log('📅 Creating sample bookings...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const { data: services } = await this.supabase
      .from('services')
      .select('duration, price')
      .in('id', serviceIds.slice(0, 2));

    if (!services) return;

    for (let i = 0; i < Math.min(3, clientIds.length); i++) {
      const service = services[i % services.length];
      const startTime = new Date(tomorrow);
      startTime.setHours(10 + i * 2, 0, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + service.duration);

      await this.supabase
        .from('bookings')
        .insert({
          service_id: serviceIds[i % serviceIds.length],
          client_id: clientIds[i],
          status: 'confirmed',
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          total_price: service.price,
          currency: 'PLN'
        });
    }
  }
}

// Run the seeder if called directly
if (require.main === module) {
  const seeder = new PreviewDatabaseSeeder();
  seeder.seedMinimal();
}

export { PreviewDatabaseSeeder };
