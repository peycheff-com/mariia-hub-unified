#!/usr/bin/env tsx

/**
 * Staging Database Seeder
 *
 * This script generates realistic but anonymized test data for the staging environment.
 * It creates sample services, users, bookings, and related data to thoroughly test
 * the application functionality without using real user data.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.staging' });

interface Service {
  id?: string;
  category: 'beauty' | 'fitness' | 'lifestyle';
  name: string;
  name_pl: string;
  description: string;
  description_pl: string;
  duration: number;
  price: number;
  currency: string;
  is_active: boolean;
  order_index: number;
  metadata?: Record<string, any>;
  created_at?: string;
}

interface Profile {
  id?: string;
  email: string;
  full_name: string;
  phone: string;
  role: 'client' | 'admin';
  preferences?: Record<string, any>;
  created_at?: string;
}

interface Booking {
  id?: string;
  service_id: string;
  client_id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  start_time: string;
  end_time: string;
  total_price: number;
  currency: string;
  notes?: string;
  client_notes?: string;
  created_at?: string;
}

class StagingDatabaseSeeder {
  private supabase: SupabaseClient;
  private readonly NUM_SERVICES = 20;
  private readonly NUM_CLIENTS = 50;
  private readonly NUM_BOOKINGS = 200;
  private readonly NUM_ADMINS = 3;

  constructor() {
    const supabaseUrl = process.env.STAGING_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration. Please check your environment variables.');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  // Utility function to wait
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate random future date within booking window
  private generateFutureDate(daysFromNow: number = 30): Date {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * daysFromNow));

    // Set random hour between 9 AM and 7 PM
    const hour = 9 + Math.floor(Math.random() * 10);
    const minute = Math.random() < 0.5 ? 0 : 30;

    date.setHours(hour, minute, 0, 0);
    return date;
  }

  // Generate random past date
  private generatePastDate(daysAgo: number = 30): Date {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));

    const hour = 9 + Math.floor(Math.random() * 10);
    const minute = Math.random() < 0.5 ? 0 : 30;

    date.setHours(hour, minute, 0, 0);
    return date;
  }

  // Seed services with realistic beauty and fitness offerings
  async seedServices(): Promise<string[]> {
    console.log('🔄 Seeding services...');

    const serviceTemplates: Partial<Service>[] = [
      // Beauty Services
      {
        category: 'beauty',
        name: 'Classic Manicure',
        name_pl: 'Klasyczny Manicure',
        description: 'Traditional manicure with cuticle care and polish application',
        description_pl: 'Tradycyjny manicure z pielęgnacją skórek i lakierowaniem',
        duration: 60,
        price: 120,
      },
      {
        category: 'beauty',
        name: 'Gel Polish Manicure',
        name_pl: 'Manicure Hybrydowy',
        description: 'Long-lasting gel polish application for perfect nails',
        description_pl: 'Trwałe lakierowanie hybrydowe dla idealnych paznokci',
        duration: 90,
        price: 180,
      },
      {
        category: 'beauty',
        name: 'Eyebrow Lamination',
        name_pl: 'Laminacja Brwi',
        description: 'Eyebrow shaping and lamination for a polished look',
        description_pl: 'Modelowanie i laminacja brwi dla wyrafinowanego wyglądu',
        duration: 45,
        price: 150,
      },
      {
        category: 'beauty',
        name: 'Lash Lift',
        name_pl: 'Podkręcanie Rzęs',
        description: 'Natural-looking lash lift and tint',
        description_pl: 'Naturalne podkręcanie i farbowanie rzęs',
        duration: 60,
        price: 200,
      },
      {
        category: 'beauty',
        name: 'Microblading Touch-up',
        name_pl: 'Uzupełnienie Microbladingu',
        description: 'Touch-up session for microbladed eyebrows',
        description_pl: 'Sesja uzupełniająca dla brwi microblading',
        duration: 90,
        price: 400,
      },
      {
        category: 'beauty',
        name: 'PMU Lips Enhancement',
        name_pl: 'Tatuaż Ust PMU',
        description: 'Permanent makeup for natural-looking fuller lips',
        description_pl: 'Makijaż permanentny dla naturalnie pełniejszych ust',
        duration: 120,
        price: 800,
      },
      {
        category: 'beauty',
        name: 'Facial Treatment',
        name_pl: 'Zabieg na Twarz',
        description: 'Rejuvenating facial with premium skincare products',
        description_pl: 'Odmładzający zabieg na twarz z produktami premium',
        duration: 75,
        price: 250,
      },
      {
        category: 'beauty',
        name: 'Anti-Cellulite Massage',
        name_pl: 'Masaż Antycellulitowy',
        description: 'Targeted massage to reduce cellulite and improve circulation',
        description_pl: 'Masaż celowany redukcja cellulitu i poprawa krążenia',
        duration: 60,
        price: 220,
      },

      // Fitness Services
      {
        category: 'fitness',
        name: 'Personal Training Session',
        name_pl: 'Trening Personalny',
        description: 'One-on-one personalized training session',
        description_pl: 'Indywidualna sesja treningowa osobistego',
        duration: 60,
        price: 200,
      },
      {
        category: 'fitness',
        name: 'Glutes Focused Training',
        name_pl: 'Trening Pośladków',
        description: 'Specialized workout for glute development and strength',
        description_pl: 'Specjalistyczny trening rozwoju i siły pośladków',
        duration: 45,
        price: 150,
      },
      {
        category: 'fitness',
        name: 'Group Fitness Class',
        name_pl: 'Zajęcia Grupowe Fitness',
        description: 'Energetic group fitness session with motivating music',
        description_pl: 'Energiczna sesja fitness grupowa z motywującą muzyką',
        duration: 50,
        price: 80,
      },
      {
        category: 'fitness',
        name: 'Starter Fitness Program',
        name_pl: 'Program Startowy Fitness',
        description: 'Beginner-friendly fitness introduction and assessment',
        description_pl: 'Przyjazny dla początkujących wprowadzenie i ocena fitness',
        duration: 90,
        price: 180,
      },
      {
        category: 'fitness',
        name: 'Yoga & Flexibility',
        name_pl: 'Joga i Elastyczność',
        description: 'Relaxing yoga session focusing on flexibility and mindfulness',
        description_pl: 'Relaksacyjna sesja jogi skupiona na elastyczności i uważności',
        duration: 60,
        price: 120,
      },
      {
        category: 'fitness',
        name: 'HIIT Workout',
        name_pl: 'Trening HIIT',
        description: 'High-intensity interval training for maximum calorie burn',
        description_pl: 'Trening interwałowy o wysokiej intensywności dla maksymalnego spalania kalorii',
        duration: 45,
        price: 100,
      },
      {
        category: 'fitness',
        name: 'Boxing Fitness',
        name_pl: 'Fitness Bokserski',
        description: 'Boxing-inspired workout for cardio and strength',
        description_pl: 'Trening inspirowany boksem dla cardio i siły',
        duration: 55,
        price: 140,
      },
      {
        category: 'fitness',
        name: 'Nutrition Consultation',
        name_pl: 'Konsultacja Żywieniowa',
        description: 'Personalized nutrition planning and guidance',
        description_pl: 'Personalizowane planowanie żywieniowe i doradztwo',
        duration: 60,
        price: 250,
      },

      // Lifestyle Services
      {
        category: 'lifestyle',
        name: 'Wellness Day Package',
        name_pl: 'Pakiet Dnia Wellness',
        description: 'Full day of beauty and wellness treatments',
        description_pl: 'Cały dzień zabiegów kosmetycznych i wellness',
        duration: 480,
        price: 1200,
      },
      {
        category: 'lifestyle',
        name: 'Spa Retreat',
        name_pl: 'Odnowa Spa',
        description: 'Half-day spa experience with multiple treatments',
        description_pl: 'Półdniowe doświadczenie spa z wieloma zabiegami',
        duration: 240,
        price: 600,
      },
      {
        category: 'lifestyle',
        name: 'Meditation Session',
        name_pl: 'Sesja Medytacji',
        description: 'Guided meditation for stress relief and mental clarity',
        description_pl: 'Medytacja prowadzona dla ulgi w stresie i jasności umysłu',
        duration: 30,
        price: 80,
      },
      {
        category: 'lifestyle',
        name: 'Body Detox Program',
        name_pl: 'Program Detoksykacji',
        description: 'Comprehensive body detox with treatments and nutrition guide',
        description_pl: 'Kompleksowy detoks ciała z zabiegami i przewodnikiem żywieniowym',
        duration: 180,
        price: 400,
      }
    ];

    const serviceIds: string[] = [];

    for (let i = 0; i < serviceTemplates.length; i++) {
      const template = serviceTemplates[i];
      const service: Service = {
        ...template,
        currency: 'PLN',
        is_active: faker.datatype.boolean(0.9), // 90% active
        order_index: i,
        metadata: {
          features: [
            faker.helpers.arrayElement(['Premium products', 'Experienced staff', 'Relaxing atmosphere', 'Customized approach']),
            faker.helpers.arrayElement(['Free consultation', 'Aftercare advice', 'Follow-up support', 'Flexible scheduling'])
          ],
          level: faker.helpers.arrayElement(['basic', 'premium', 'luxury']),
          tags: faker.helpers.arrayElements(['popular', 'new', 'recommended', 'bestseller', 'limited'], { min: 1, max: 2 })
        }
      } as Service;

      const { data, error } = await this.supabase
        .from('services')
        .insert(service)
        .select('id')
        .single();

      if (error) {
        console.error(`Error inserting service ${service.name}:`, error);
        continue;
      }

      if (data?.id) {
        serviceIds.push(data.id);
        console.log(`✅ Created service: ${service.name}`);
      }

      // Add small delay to avoid rate limiting
      await this.wait(50);
    }

    console.log(`✅ Created ${serviceIds.length} services`);
    return serviceIds;
  }

  // Seed user profiles
  async seedProfiles(): Promise<{ clients: string[], admins: string[] }> {
    console.log('🔄 Seeding user profiles...');

    const clientIds: string[] = [];
    const adminIds: string[] = [];

    // Create admin profiles
    for (let i = 0; i < this.NUM_ADMINS; i++) {
      const profile: Profile = {
        email: `admin${i + 1}@staging.mariia-hub.com`,
        full_name: faker.name.fullName(),
        phone: faker.phone.number('48#########'),
        role: 'admin',
        preferences: {
          language: faker.helpers.arrayElement(['en', 'pl']),
          currency: 'PLN',
          notifications: true,
          darkMode: faker.datatype.boolean()
        }
      };

      // Create auth user first
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email: profile.email,
        password: 'staging123!',
        email_confirm: true,
        user_metadata: { role: 'admin' }
      });

      if (authError || !authData.user) {
        console.error(`Error creating admin user ${profile.email}:`, authError);
        continue;
      }

      // Create profile
      const { data: profileData, error: profileError } = await this.supabase
        .from('profiles')
        .insert({
          ...profile,
          id: authData.user.id
        })
        .select('id')
        .single();

      if (profileError) {
        console.error(`Error creating admin profile ${profile.email}:`, profileError);
        continue;
      }

      if (profileData?.id) {
        adminIds.push(profileData.id);
        console.log(`✅ Created admin: ${profile.email}`);
      }
    }

    // Create client profiles
    for (let i = 0; i < this.NUM_CLIENTS; i++) {
      const profile: Profile = {
        email: faker.internet.email(),
        full_name: faker.name.fullName(),
        phone: faker.phone.number('48#########'),
        role: 'client',
        preferences: {
          language: faker.helpers.arrayElement(['en', 'pl']),
          currency: 'PLN',
          notifications: faker.datatype.boolean(0.8),
          darkMode: faker.datatype.boolean(0.3),
          favoriteServices: [],
          appointmentReminders: faker.datatype.boolean(0.9)
        }
      };

      // Create auth user first
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email: profile.email,
        password: 'client123!',
        email_confirm: true,
        user_metadata: { role: 'client' }
      });

      if (authError || !authData.user) {
        console.error(`Error creating client user ${profile.email}:`, authError);
        continue;
      }

      // Create profile
      const { data: profileData, error: profileError } = await this.supabase
        .from('profiles')
        .insert({
          ...profile,
          id: authData.user.id
        })
        .select('id')
        .single();

      if (profileError) {
        console.error(`Error creating client profile ${profile.email}:`, profileError);
        continue;
      }

      if (profileData?.id) {
        clientIds.push(profileData.id);
        console.log(`✅ Created client: ${profile.email}`);
      }

      // Add small delay
      await this.wait(50);
    }

    console.log(`✅ Created ${adminIds.length} admins and ${clientIds.length} clients`);
    return { clients: clientIds, admins: adminIds };
  }

  // Seed bookings with various statuses
  async seedBookings(serviceIds: string[], clientIds: string[]): Promise<void> {
    console.log('🔄 Seeding bookings...');

    const statuses: Booking['status'][] = ['pending', 'confirmed', 'cancelled', 'completed'];
    const statusWeights = [0.1, 0.4, 0.15, 0.35]; // Weighted distribution

    for (let i = 0; i < this.NUM_BOOKINGS; i++) {
      const serviceId = faker.helpers.arrayElement(serviceIds);
      const clientId = faker.helpers.arrayElement(clientIds);

      // Get service details for pricing
      const { data: service } = await this.supabase
        .from('services')
        .select('duration, price')
        .eq('id', serviceId)
        .single();

      if (!service) continue;

      const status = faker.helpers.weightedArrayElement(
        statuses.map((status, index) => ({ value: status, weight: statusWeights[index] }))
      );

      const startTime = status === 'completed' || status === 'cancelled'
        ? this.generatePastDate(60)
        : this.generateFutureDate(30);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + service.duration);

      const booking: Booking = {
        service_id: serviceId,
        client_id: clientId,
        status,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        total_price: service.price,
        currency: 'PLN',
        notes: status === 'cancelled' ? faker.helpers.arrayElement([
          'Client requested cancellation',
          'Double booking',
          'Emergency',
          'Schedule conflict',
          'Weather related'
        ]) : undefined,
        client_notes: faker.datatype.boolean(0.3) ? faker.lorem.sentences(1) : undefined
      };

      const { error } = await this.supabase
        .from('bookings')
        .insert(booking);

      if (error) {
        console.error(`Error creating booking:`, error);
        continue;
      }

      console.log(`✅ Created booking: ${status} - ${startTime.toLocaleDateString()}`);

      // Add delay
      await this.wait(30);
    }

    console.log(`✅ Created ${this.NUM_BOOKINGS} bookings`);
  }

  // Seed availability slots
  async seedAvailabilitySlots(): Promise<void> {
    console.log('🔄 Seeding availability slots...');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 60);

    const currentDate = new Date(startDate);
    let slotCount = 0;

    while (currentDate <= endDate) {
      // Skip Sundays
      if (currentDate.getDay() !== 0) {
        // Generate slots for each day (9 AM - 7 PM)
        for (let hour = 9; hour < 19; hour++) {
          // Skip lunch break
          if (hour === 13) continue;

          const startTime = new Date(currentDate);
          startTime.setHours(hour, 0, 0, 0);

          const endTime = new Date(currentDate);
          endTime.setHours(hour + 1, 0, 0, 0);

          const { error } = await this.supabase
            .from('availability_slots')
            .insert({
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString(),
              is_available: faker.datatype.boolean(0.8), // 80% available
              resource_id: 'default',
              max_bookings: faker.helpers.arrayElement([1, 2, 3])
            });

          if (!error) slotCount++;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`✅ Created ${slotCount} availability slots`);
  }

  // Seed service content and galleries
  async seedServiceContent(serviceIds: string[]): Promise<void> {
    console.log('🔄 Seeding service content...');

    for (const serviceId of serviceIds) {
      // Add service content
      const content = {
        service_id: serviceId,
        preparation: faker.lorem.paragraphs(2),
        preparation_pl: faker.lorem.paragraphs(2),
        aftercare: faker.lorem.paragraphs(2),
        aftercare_pl: faker.lorem.paragraphs(2),
        expectations: faker.lorem.paragraphs(3),
        expectations_pl: faker.lorem.paragraphs(3),
        contraindications: faker.lorem.paragraphs(1),
        contraindications_pl: faker.lorem.paragraphs(1),
        benefits: faker.helpers.arrayElements([
          'Improved appearance',
          'Boosted confidence',
          'Relaxation',
          'Stress relief',
          'Long-lasting results',
          'Natural look',
          'Minimal downtime'
        ], { min: 3, max: 5 }),
        benefits_pl: faker.helpers.arrayElements([
          'Poprawa wyglądu',
          'Zwiększona pewność siebie',
          'Relaks',
          'Redukcja stresu',
          'Trwałe rezultaty',
          'Naturalny wygląd',
          'Minimalny czas rekonwalescencji'
        ], { min: 3, max: 5 })
      };

      await this.supabase.from('service_content').insert(content);

      // Add gallery images
      const imageCount = faker.datatype.number({ min: 2, max: 5 });
      for (let i = 0; i < imageCount; i++) {
        const galleryItem = {
          service_id: serviceId,
          image_url: `https://picsum.photos/400/300?random=${faker.datatype.number({ min: 1000, max: 9999 })}`,
          caption: faker.lorem.sentence(),
          caption_pl: faker.lorem.sentence(),
          order_index: i,
          is_before_after: faker.datatype.boolean(0.2)
        };

        await this.supabase.from('service_gallery').insert(galleryItem);
      }
    }

    console.log(`✅ Created content and galleries for ${serviceIds.length} services`);
  }

  // Main seeding function
  async seedAll(): Promise<void> {
    console.log('🌱 Starting staging database seeding...');
    console.log('=====================================');

    try {
      // Reset existing data
      console.log('\n🧹 Resetting existing data...');
      await this.supabase.rpc('reset_staging_data');

      // Seed in order
      const serviceIds = await this.seedServices();
      const { clients } = await this.seedProfiles();

      await this.seedServiceContent(serviceIds);
      await this.seedAvailabilitySlots();
      await this.seedBookings(serviceIds, clients);

      console.log('\n🎉 Staging database seeding completed successfully!');
      console.log('==============================================');
      console.log('📊 Summary:');
      console.log(`  - Services: ${serviceIds.length}`);
      console.log(`  - Clients: ${clients.length}`);
      console.log(`  - Admins: ${this.NUM_ADMINS}`);
      console.log(`  - Bookings: ${this.NUM_BOOKINGS}`);
      console.log('\n🔑 Login credentials:');
      console.log('  Admins: admin{1-3}@staging.mariia-hub.com / staging123!');
      console.log('  Clients: {email} / client123!');

    } catch (error) {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    }
  }
}

// Run the seeder
async function main() {
  const seeder = new StagingDatabaseSeeder();
  await seeder.seedAll();
}

// Handle CLI execution
if (require.main === module) {
  main().catch(console.error);
}

export { StagingDatabaseSeeder };
