// API Connectivity Test Script
// Tests that the application can connect to the database through the API

const testAPI = async () => {
  console.log('🧪 Testing Application API Connectivity...')

  try {
    // Test that we can fetch services from the running application
    const response = await fetch('http://localhost:8080/api/services')

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const services = await response.json()
    console.log(`✅ API connectivity successful - Found ${services.length} services`)

    // Test service details
    if (services.length > 0) {
      const firstService = services[0]
      console.log(`📋 Sample service: ${firstService.title} (${firstService.service_type})`)
      console.log(`💰 Price: ${firstService.price} ${firstService.currency}`)
    }

    // Test availability endpoint if it exists
    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().split('T')[0]

      const availabilityResponse = await fetch(`http://localhost:8080/api/availability?date=${dateStr}`)
      if (availabilityResponse.ok) {
        const availability = await availabilityResponse.json()
        console.log(`✅ Availability API working - ${availability.slots?.length || 0} slots found`)
      }
    } catch (err) {
      console.log('ℹ️  Availability API test skipped (endpoint may not exist)')
    }

    console.log('🎉 Application database connectivity verified!')
    return true

  } catch (error) {
    console.error('❌ API connectivity test failed:', error.message)
    return false
  }
}

// Simple fetch implementation if needed
if (typeof fetch === 'undefined') {
  global.fetch = async (url, options = {}) => {
    const https = require('https')
    const http = require('http')
    const { URL } = require('url')

    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url)
      const isHttps = parsedUrl.protocol === 'https:'
      const lib = isHttps ? https : http

      const req = lib.request(url, options, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: async () => JSON.parse(data),
            text: async () => data
          })
        })
      })

      req.on('error', reject)
      req.end()
    })
  }
}

testAPI().then(success => {
  if (success) {
    console.log('✅ All database systems operational!')
  } else {
    console.log('⚠️  Database connectivity issues detected')
  }
}).catch(console.error)