import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AnalyticsData {
  revenue: {
    daily: { date: string; revenue: number; bookings: number }[];
    monthly: { month: string; revenue: number; bookings: number }[];
    total: number;
  };
  bookings: {
    funnel: {
      views: number;
      initiated: number;
      confirmed: number;
      completed: number;
    };
    conversionRate: number;
    averageOrderValue: number;
  };
  services: {
    popularity: Array<{
      serviceId: string;
      name: string;
      category: string;
      bookings: number;
      revenue: number;
      rating: number;
    }>;
    categories: Array<{
      category: string;
      bookings: number;
      revenue: number;
    }>;
  };
  clients: {
    demographics: {
      ageGroups: Record<string, number>;
      locations: Record<string, number>;
      gender: Record<string, number>;
    };
    retention: {
      newClients: number;
      returningClients: number;
      retentionRate: number;
    };
  };
  providers: {
    performance: Array<{
      providerId: string;
      name: string;
      bookings: number;
      revenue: number;
      rating: number;
      utilizationRate: number;
    }>;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { startDate, endDate, aggregationType } = await req.json()

    const analyticsData: AnalyticsData = await aggregateAnalyticsData(
      supabaseClient,
      new Date(startDate),
      new Date(endDate),
      aggregationType
    )

    // Cache the results
    await cacheAnalyticsData(supabaseClient, aggregationType, analyticsData)

    return new Response(
      JSON.stringify(analyticsData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in analytics aggregation:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function aggregateAnalyticsData(
  supabase: any,
  startDate: Date,
  endDate: Date,
  aggregationType: string
): Promise<AnalyticsData> {
  const analyticsData: AnalyticsData = {
    revenue: {
      daily: [],
      monthly: [],
      total: 0,
    },
    bookings: {
      funnel: {
        views: 0,
        initiated: 0,
        confirmed: 0,
        completed: 0,
      },
      conversionRate: 0,
      averageOrderValue: 0,
    },
    services: {
      popularity: [],
      categories: [],
    },
    clients: {
      demographics: {
        ageGroups: {},
        locations: {},
        gender: {},
      },
      retention: {
        newClients: 0,
        returningClients: 0,
        retentionRate: 0,
      },
    },
    providers: {
      performance: [],
    },
  }

  // Aggregate Revenue Data
  const revenueData = await aggregateRevenueData(supabase, startDate, endDate)
  analyticsData.revenue = revenueData

  // Aggregate Booking Data
  const bookingData = await aggregateBookingData(supabase, startDate, endDate)
  analyticsData.bookings = bookingData

  // Aggregate Service Data
  const serviceData = await aggregateServiceData(supabase, startDate, endDate)
  analyticsData.services = serviceData

  // Aggregate Client Data
  const clientData = await aggregateClientData(supabase, startDate, endDate)
  analyticsData.clients = clientData

  // Aggregate Provider Data
  const providerData = await aggregateProviderData(supabase, startDate, endDate)
  analyticsData.providers = providerData

  return analyticsData
}

async function aggregateRevenueData(supabase: any, startDate: Date, endDate: Date) {
  // Get completed bookings within date range
  const { data: bookings } = await supabase
    .from('bookings')
    .select('total_amount, booking_date, status')
    .gte('booking_date', startDate.toISOString())
    .lte('booking_date', endDate.toISOString())
    .in('status', ['confirmed', 'completed'])

  // Group by date
  const dailyMap = new Map<string, { revenue: number; bookings: number }>()
  const monthlyMap = new Map<string, { revenue: number; bookings: number }>()
  let totalRevenue = 0

  bookings?.forEach(booking => {
    const date = new Date(booking.booking_date)
    const dateKey = date.toISOString().split('T')[0]
    const monthKey = date.toISOString().slice(0, 7) // YYYY-MM

    const revenue = parseFloat(booking.total_amount) || 0
    totalRevenue += revenue

    // Daily aggregation
    const dailyData = dailyMap.get(dateKey) || { revenue: 0, bookings: 0 }
    dailyData.revenue += revenue
    dailyData.bookings += 1
    dailyMap.set(dateKey, dailyData)

    // Monthly aggregation
    const monthlyData = monthlyMap.get(monthKey) || { revenue: 0, bookings: 0 }
    monthlyData.revenue += revenue
    monthlyData.bookings += 1
    monthlyMap.set(monthKey, monthlyData)
  })

  return {
    daily: Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    monthly: Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    total: totalRevenue,
  }
}

async function aggregateBookingData(supabase: any, startDate: Date, endDate: Date) {
  // Get booking funnel data
  const [viewsData, draftsData, bookingsData] = await Promise.all([
    // Simulated views - in real app, this would come from analytics table
    supabase
      .from('analytics')
      .select('id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),

    supabase
      .from('booking_drafts')
      .select('id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),

    supabase
      .from('bookings')
      .select('id, status, total_amount')
      .gte('booking_date', startDate.toISOString())
      .lte('booking_date', endDate.toISOString())
  ])

  const views = viewsData?.length || 1000 // Fallback value
  const initiated = draftsData?.length || 0
  const confirmed = bookingsData?.filter(b => b.status === 'confirmed').length || 0
  const completed = bookingsData?.filter(b => b.status === 'completed').length || 0

  // Calculate conversion rate
  const conversionRate = views > 0 ? (completed / views) * 100 : 0

  // Calculate average order value
  const totalRevenue = bookingsData?.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0) || 0
  const averageOrderValue = completed > 0 ? totalRevenue / completed : 0

  return {
    funnel: {
      views,
      initiated,
      confirmed,
      completed,
    },
    conversionRate,
    averageOrderValue,
  }
}

async function aggregateServiceData(supabase: any, startDate: Date, endDate: Date) {
  // Get service popularity data
  const { data: servicesData } = await supabase
    .from('services')
    .select(`
      id,
      title,
      category,
      price,
      bookings!inner(
        id,
        total_amount,
        status,
        reviews!inner(rating)
      )
    `)
    .gte('bookings.booking_date', startDate.toISOString())
    .lte('bookings.booking_date', endDate.toISOString())
    .in('bookings.status', ['confirmed', 'completed'])

  const serviceMap = new Map<string, any>()
  const categoryMap = new Map<string, { bookings: number; revenue: number }>()

  servicesData?.forEach(service => {
    const serviceId = service.id
    const category = service.category

    // Aggregate service data
    if (!serviceMap.has(serviceId)) {
      serviceMap.set(serviceId, {
        serviceId,
        name: service.title,
        category,
        bookings: 0,
        revenue: 0,
        ratings: [],
      })
    }

    const serviceData = serviceMap.get(serviceId)
    serviceData.bookings += service.bookings.length
    serviceData.revenue += service.bookings.reduce((sum: number, b: any) => sum + (parseFloat(b.total_amount) || 0), 0)

    // Collect ratings
    service.bookings.forEach((booking: any) => {
      booking.reviews.forEach((review: any) => {
        if (review.rating) {
          serviceData.ratings.push(review.rating)
        }
      })
    })

    // Aggregate category data
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { bookings: 0, revenue: 0 })
    }

    const categoryData = categoryMap.get(category)
    categoryData.bookings += service.bookings.length
    categoryData.revenue += service.bookings.reduce((sum: number, b: any) => sum + (parseFloat(b.total_amount) || 0), 0)
  })

  // Calculate average ratings
  serviceMap.forEach((service: any) => {
    service.rating = service.ratings.length > 0
      ? service.ratings.reduce((sum: number, r: number) => sum + r, 0) / service.ratings.length
      : 0
    delete service.ratings
  })

  return {
    popularity: Array.from(serviceMap.values())
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 20), // Top 20 services
    categories: Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.bookings - a.bookings),
  }
}

async function aggregateClientData(supabase: any, startDate: Date, endDate: Date) {
  // Get client demographics data
  const { data: clientsData } = await supabase
    .from('profiles')
    .select(`
      id,
      date_of_birth,
      city,
      gender,
      created_at,
      bookings!inner(
        id,
        booking_date,
        status
      )
    `)
    .lte('created_at', endDate.toISOString())

  const demographics = {
    ageGroups: {} as Record<string, number>,
    locations: {} as Record<string, number>,
    gender: {} as Record<string, number>,
  }

  let newClients = 0
  let returningClients = 0

  clientsData?.forEach(client => {
    // Age groups
    if (client.date_of_birth) {
      const age = new Date().getFullYear() - new Date(client.date_of_birth).getFullYear()
      let ageGroup = 'Unknown'
      if (age < 18) ageGroup = 'Under 18'
      else if (age < 25) ageGroup = '18-24'
      else if (age < 35) ageGroup = '25-34'
      else if (age < 45) ageGroup = '35-44'
      else if (age < 55) ageGroup = '45-54'
      else if (age < 65) ageGroup = '55-64'
      else ageGroup = '65+'

      demographics.ageGroups[ageGroup] = (demographics.ageGroups[ageGroup] || 0) + 1
    }

    // Locations
    const city = client.city || 'Unknown'
    demographics.locations[city] = (demographics.locations[city] || 0) + 1

    // Gender
    const gender = client.gender || 'Not specified'
    demographics.gender[gender] = (demographics.gender[gender] || 0) + 1

    // Client retention
    const clientCreated = new Date(client.created_at)
    if (clientCreated >= startDate && clientCreated <= endDate) {
      newClients++
    }

    const hasOldBooking = client.bookings?.some((b: any) => {
      const bookingDate = new Date(b.booking_date)
      return bookingDate < startDate
    })

    const hasNewBooking = client.bookings?.some((b: any) => {
      const bookingDate = new Date(b.booking_date)
      return bookingDate >= startDate && bookingDate <= endDate
    })

    if (hasOldBooking && hasNewBooking) {
      returningClients++
    }
  })

  const totalActiveClients = newClients + returningClients
  const retentionRate = totalActiveClients > 0 ? (returningClients / totalActiveClients) * 100 : 0

  return {
    demographics,
    retention: {
      newClients,
      returningClients,
      retentionRate,
    },
  }
}

async function aggregateProviderData(supabase: any, startDate: Date, endDate: Date) {
  // Get provider performance data
  const { data: providersData } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      bookings!inner(
        id,
        total_amount,
        status,
        rating
      )
    `)
    .eq('role', 'provider')
    .gte('bookings.booking_date', startDate.toISOString())
    .lte('bookings.booking_date', endDate.toISOString())

  const providerMap = new Map<string, any>()

  providersData?.forEach(provider => {
    const providerId = provider.id
    const bookings = provider.bookings || []

    const completedBookings = bookings.filter((b: any) => b.status === 'completed')
    const totalRevenue = completedBookings.reduce((sum: number, b: any) => sum + (parseFloat(b.total_amount) || 0), 0)
    const averageRating = bookings
      .filter((b: any) => b.rating)
      .reduce((sum: number, b: any, _, arr: any[]) => sum + b.rating / arr.length, 0)

    // Calculate utilization rate (simplified)
    const utilizationRate = completedBookings.length > 0 ? Math.min(100, (completedBookings.length / 40) * 100) : 0 // Assuming 40 slots per month

    providerMap.set(providerId, {
      providerId,
      name: provider.full_name || 'Unknown',
      bookings: completedBookings.length,
      revenue: totalRevenue,
      rating: averageRating || 0,
      utilizationRate,
    })
  })

  return {
    performance: Array.from(providerMap.values())
      .sort((a, b) => b.bookings - a.bookings),
  }
}

async function cacheAnalyticsData(supabase: any, aggregationType: string, data: AnalyticsData) {
  try {
    // Store cached data with timestamp
    await supabase
      .from('analytics_cache')
      .upsert({
        key: `analytics_${aggregationType}`,
        data,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      })
  } catch (error) {
    console.error('Error caching analytics data:', error)
  }
}