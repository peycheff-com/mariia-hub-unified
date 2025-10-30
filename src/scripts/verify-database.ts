// Database Verification Script
// This script tests database connectivity and verifies core tables exist

import { createClient } from '@supabase/supabase-js'
import { Database } from '../integrations/supabase/types'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fxpwracjakqpqpoivypm.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4cHdyYWNqYWtxcXFwb2l2eXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyOTMzMzIsImV4cCI6MjA3Mzg2OTMzMn0.O7LHvEsfyFQT0FwYqyk9AKZ_mmIBaxgiTS1S5Utkk6c'

const supabase = createClient<Database>(supabaseUrl, supabaseKey)

interface VerificationResult {
  success: boolean
  message: string
  details?: any
}

async function verifyTable(tableName: string): Promise<VerificationResult> {
  try {
    const { data, error } = await supabase
      .from(tableName as any)
      .select('count', { count: 'exact', head: true })

    if (error) {
      return {
        success: false,
        message: `Error accessing table ${tableName}: ${error.message}`,
        details: error
      }
    }

    return {
      success: true,
      message: `Table ${tableName} accessible (${data?.[0]?.count || 0} rows)`,
      details: { count: data?.[0]?.count || 0 }
    }
  } catch (err) {
    return {
      success: false,
      message: `Failed to query table ${tableName}: ${err}`,
      details: err
    }
  }
}

async function verifyServicesData(): Promise<VerificationResult> {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('id, title, service_type, price, is_active')
      .limit(5)

    if (error) {
      return {
        success: false,
        message: `Error fetching services: ${error.message}`,
        details: error
      }
    }

    return {
      success: true,
      message: `Services data retrieved (${data?.length || 0} services found)`,
      details: { services: data }
    }
  } catch (err) {
    return {
      success: false,
      message: `Failed to fetch services: ${err}`,
      details: err
    }
  }
}

async function runDatabaseVerification(): Promise<void> {
  console.log('🔍 Starting Database Verification...')
  console.log('=====================================')

  // Test basic connectivity
  try {
    const { data, error } = await supabase
      .from('services')
      .select('count', { count: 'exact', head: true })

    if (error) {
      console.error('❌ Database connectivity failed:', error.message)
      process.exit(1)
    }

    console.log('✅ Database connectivity established')
  } catch (err) {
    console.error('❌ Failed to connect to database:', err)
    process.exit(1)
  }

  // Core tables to verify
  const coreTables = [
    'services',
    'bookings',
    'profiles',
    'availability_slots',
    'booking_drafts',
    'holds',
    'service_content',
    'service_gallery',
    'reviews'
  ]

  console.log('\n📋 Verifying Core Tables:')
  console.log('----------------------------')

  const results: { [key: string]: VerificationResult } = {}

  for (const table of coreTables) {
    const result = await verifyTable(table)
    results[table] = result
    console.log(`${result.success ? '✅' : '❌'} ${result.message}`)
  }

  // Check services data specifically
  console.log('\n🎯 Verifying Services Data:')
  console.log('----------------------------')

  const servicesResult = await verifyServicesData()
  console.log(`${servicesResult.success ? '✅' : '❌'} ${servicesResult.message}`)

  if (servicesResult.success && servicesResult.details?.services) {
    console.log('Sample services:')
    servicesResult.details.services.forEach((service: any, index: number) => {
      console.log(`  ${index + 1}. ${service.title} (${service.service_type}) - ${service.price} PLN`)
    })
  }

  // Summary
  const successfulTables = Object.values(results).filter(r => r.success).length
  const totalTables = coreTables.length

  console.log('\n📊 Verification Summary:')
  console.log('=========================')
  console.log(`Tables verified: ${successfulTables}/${totalTables}`)
  console.log(`Database status: ${successfulTables === totalTables ? '✅ HEALTHY' : '⚠️  NEEDS ATTENTION'}`)

  if (successfulTables < totalTables) {
    console.log('\n⚠️  Issues found:')
    Object.entries(results).forEach(([table, result]) => {
      if (!result.success) {
        console.log(`  - ${table}: ${result.message}`)
      }
    })
  }

  // Test basic booking functionality
  console.log('\n🧪 Testing Basic Functionality:')
  console.log('-------------------------------')

  try {
    // Test availability checking
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]

    const { data: availability, error: availabilityError } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('date', dateStr)
      .limit(3)

    if (availabilityError) {
      console.log(`❌ Availability check failed: ${availabilityError.message}`)
    } else {
      console.log(`✅ Availability slots found: ${availability?.length || 0}`)
    }

    // Test booking drafts
    const { data: drafts, error: draftsError } = await supabase
      .from('booking_drafts')
      .select('count', { count: 'exact', head: true })

    if (draftsError) {
      console.log(`❌ Booking drafts check failed: ${draftsError.message}`)
    } else {
      console.log(`✅ Booking drafts accessible: ${drafts?.[0]?.count || 0} drafts`)
    }

  } catch (err) {
    console.log(`❌ Functionality test failed: ${err}`)
  }

  console.log('\n🎉 Database verification completed!')

  if (successfulTables === totalTables && servicesResult.success) {
    console.log('✅ All systems operational - ready for bookings!')
  } else {
    console.log('⚠️  Some issues detected - review the logs above')
    process.exit(1)
  }
}

// Run verification
runDatabaseVerification().catch(console.error)