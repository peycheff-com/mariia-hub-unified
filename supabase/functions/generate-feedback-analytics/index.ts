import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyticsRequest {
  timeframe?: 'week' | 'month' | 'quarter' | 'year'
  feedbackType?: string
  startDate?: string
  endDate?: string
  includeSentiment?: boolean
  includeTrends?: boolean
  includeComparison?: boolean
}

interface AnalyticsResponse {
  summary: {
    totalEntries: number
    averageRating: number
    responseRate: number
    resolutionTime: number
    satisfactionScore: number
  }
  breakdown: {
    byType: Record<string, number>
    byStatus: Record<string, number>
    byPriority: Record<string, number>
    bySentiment: Record<string, number>
    byChannel: Record<string, number>
  }
  trends: {
    daily: Array<{ date: string; count: number; rating: number }>
    weekly: Array<{ week: string; count: number; rating: number }>
    monthly: Array<{ month: string; count: number; rating: number }>
  }
  topIssues: Array<{
    category: string
    count: number
    avgRating: number
    sentiment: string
  }>
  npsData?: {
    score: number
    promoters: number
    passives: number
    detractors: number
    totalResponses: number
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      timeframe = 'month',
      feedbackType,
      startDate,
      endDate,
      includeSentiment = true,
      includeTrends = true,
      includeComparison = false
    }: AnalyticsRequest = await req.json()

    // Calculate date range
    const now = new Date()
    let dateStart: Date
    const dateEnd: Date = endDate ? new Date(endDate) : now

    if (startDate) {
      dateStart = new Date(startDate)
    } else {
      switch (timeframe) {
        case 'week':
          dateStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          dateStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'quarter':
          dateStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          dateStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          dateStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }
    }

    // Fetch feedback data
    let query = supabaseClient
      .from('feedback_entries')
      .select(`
        *,
        services:service_id(title, service_type),
        bookings:booking_id(id, booking_date)
      `)
      .gte('created_at', dateStart.toISOString())
      .lte('created_at', dateEnd.toISOString())

    if (feedbackType) {
      query = query.eq('feedback_type', feedbackType)
    }

    const { data: feedbackData, error: fetchError } = await query

    if (fetchError) {
      throw new Error(`Failed to fetch feedback data: ${fetchError.message}`)
    }

    // Fetch NPS data if requested
    let npsData
    try {
      const { data: npsSurveyData } = await supabaseClient
        .from('nps_surveys')
        .select('score')
        .gte('responded_at', dateStart.toISOString())
        .lte('responded_at', dateEnd.toISOString())

      if (npsSurveyData && npsSurveyData.length > 0) {
        const promoters = npsSurveyData.filter(s => s.score >= 9).length
        const passives = npsSurveyData.filter(s => s.score >= 7 && s.score <= 8).length
        const detractors = npsSurveyData.filter(s => s.score <= 6).length
        const total = npsSurveyData.length

        npsData = {
          score: Math.round(((promoters - detractors) / total) * 100),
          promoters: (promoters / total) * 100,
          passives: (passives / total) * 100,
          detractors: (detractors / total) * 100,
          totalResponses: total,
        }
      }
    } catch (error) {
      console.error('Failed to fetch NPS data:', error)
    }

    // Generate analytics
    const analytics = await generateAnalytics(feedbackData || [], {
      dateStart,
      dateEnd,
      includeSentiment,
      includeTrends,
      includeComparison,
    })

    // Add NPS data if available
    if (npsData) {
      analytics.npsData = npsData
    }

    return new Response(
      JSON.stringify(analytics),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Analytics generation error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function generateAnalytics(
  feedbackData: any[],
  options: {
    dateStart: Date
    dateEnd: Date
    includeSentiment: boolean
    includeTrends: boolean
    includeComparison: boolean
  }
): Promise<AnalyticsResponse> {
  const { dateStart, dateEnd, includeSentiment, includeTrends } = options

  // Summary statistics
  const totalEntries = feedbackData.length
  const ratedEntries = feedbackData.filter(f => f.rating !== null)
  const averageRating = ratedEntries.length > 0
    ? ratedEntries.reduce((sum, f) => sum + f.rating, 0) / ratedEntries.length
    : 0

  const respondedEntries = feedbackData.filter(f => f.responded_at !== null)
  const responseRate = totalEntries > 0 ? (respondedEntries.length / totalEntries) * 100 : 0

  const resolvedEntries = feedbackData.filter(f => f.status === 'resolved')
  const avgResolutionTime = resolvedEntries.length > 0
    ? calculateAverageResolutionTime(resolvedEntries)
    : 0

  const satisfactionScore = calculateSatisfactionScore(feedbackData)

  // Breakdown by categories
  const byType: Record<string, number> = {}
  const byStatus: Record<string, number> = {}
  const byPriority: Record<string, number> = {}
  const bySentiment: Record<string, number> = {}
  const byChannel: Record<string, number> = {}

  feedbackData.forEach(feedback => {
    // By type
    byType[feedback.feedback_type] = (byType[feedback.feedback_type] || 0) + 1

    // By status
    byStatus[feedback.status] = (byStatus[feedback.status] || 0) + 1

    // By priority
    byPriority[feedback.priority] = (byPriority[feedback.priority] || 0) + 1

    // By sentiment
    if (includeSentiment && feedback.sentiment) {
      bySentiment[feedback.sentiment] = (bySentiment[feedback.sentiment] || 0) + 1
    }

    // By channel
    byChannel[feedback.channel] = (byChannel[feedback.channel] || 0) + 1
  })

  // Trends data
  let trends: AnalyticsResponse['trends'] = {
    daily: [],
    weekly: [],
    monthly: [],
  }

  if (includeTrends) {
    trends = generateTrends(feedbackData, dateStart, dateEnd)
  }

  // Top issues
  const topIssues = generateTopIssues(feedbackData)

  return {
    summary: {
      totalEntries,
      averageRating: Math.round(averageRating * 100) / 100,
      responseRate: Math.round(responseRate * 100) / 100,
      resolutionTime: Math.round(avgResolutionTime * 100) / 100,
      satisfactionScore: Math.round(satisfactionScore * 100) / 100,
    },
    breakdown: {
      byType,
      byStatus,
      byPriority,
      bySentiment,
      byChannel,
    },
    trends,
    topIssues,
  }
}

function calculateAverageResolutionTime(resolvedEntries: any[]): number {
  const resolutionTimes = resolvedEntries.map(feedback => {
    const created = new Date(feedback.created_at)
    const resolved = new Date(feedback.resolved_at)
    return (resolved.getTime() - created.getTime()) / (1000 * 60 * 60) // hours
  })

  return resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
}

function calculateSatisfactionScore(feedbackData: any[]): number {
  const ratedEntries = feedbackData.filter(f => f.rating !== null)
  if (ratedEntries.length === 0) return 0

  // Weight by sentiment if available
  let totalScore = 0
  let totalWeight = 0

  ratedEntries.forEach(feedback => {
    let weight = 1
    if (feedback.sentiment === 'positive') weight = 1.2
    else if (feedback.sentiment === 'negative') weight = 0.8

    totalScore += feedback.rating * weight
    totalWeight += weight
  })

  return (totalScore / totalWeight) * 20 // Convert to 0-100 scale
}

function generateTrends(
  feedbackData: any[],
  dateStart: Date,
  dateEnd: Date
): AnalyticsResponse['trends'] {
  const daily = generateDailyTrends(feedbackData, dateStart, dateEnd)
  const weekly = generateWeeklyTrends(feedbackData, dateStart, dateEnd)
  const monthly = generateMonthlyTrends(feedbackData, dateStart, dateEnd)

  return { daily, weekly, monthly }
}

function generateDailyTrends(feedbackData: any[], dateStart: Date, dateEnd: Date) {
  const trends: Array<{ date: string; count: number; rating: number }> = []
  const currentDate = new Date(dateStart)

  while (currentDate <= dateEnd) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const dayEntries = feedbackData.filter(f =>
      f.created_at.startsWith(dateStr)
    )

    const dayRated = dayEntries.filter(f => f.rating !== null)
    const avgRating = dayRated.length > 0
      ? dayRated.reduce((sum, f) => sum + f.rating, 0) / dayRated.length
      : 0

    trends.push({
      date: dateStr,
      count: dayEntries.length,
      rating: Math.round(avgRating * 100) / 100,
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return trends
}

function generateWeeklyTrends(feedbackData: any[], dateStart: Date, dateEnd: Date) {
  const trends: Array<{ week: string; count: number; rating: number }> = []
  const weekStart = new Date(dateStart)

  // Adjust to start of week (Sunday)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())

  while (weekStart <= dateEnd) {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const weekEntries = feedbackData.filter(f => {
      const entryDate = new Date(f.created_at)
      return entryDate >= weekStart && entryDate <= weekEnd
    })

    const weekRated = weekEntries.filter(f => f.rating !== null)
    const avgRating = weekRated.length > 0
      ? weekRated.reduce((sum, f) => sum + f.rating, 0) / weekRated.length
      : 0

    trends.push({
      week: `Week of ${weekStart.toLocaleDateString()}`,
      count: weekEntries.length,
      rating: Math.round(avgRating * 100) / 100,
    })

    weekStart.setDate(weekStart.getDate() + 7)
  }

  return trends
}

function generateMonthlyTrends(feedbackData: any[], dateStart: Date, dateEnd: Date) {
  const trends: Array<{ month: string; count: number; rating: number }> = []
  const monthStart = new Date(dateStart.getFullYear(), dateStart.getMonth(), 1)

  while (monthStart <= dateEnd) {
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)

    const monthEntries = feedbackData.filter(f => {
      const entryDate = new Date(f.created_at)
      return entryDate >= monthStart && entryDate <= monthEnd
    })

    const monthRated = monthEntries.filter(f => f.rating !== null)
    const avgRating = monthRated.length > 0
      ? monthRated.reduce((sum, f) => sum + f.rating, 0) / monthRated.length
      : 0

    trends.push({
      month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      count: monthEntries.length,
      rating: Math.round(avgRating * 100) / 100,
    })

    monthStart.setMonth(monthStart.getMonth() + 1)
  }

  return trends
}

function generateTopIssues(feedbackData: any[]) {
  const issues: Record<string, { count: number; ratings: number[]; sentiments: string[] }> = {}

  feedbackData.forEach(feedback => {
    const category = feedback.category || 'General'

    if (!issues[category]) {
      issues[category] = { count: 0, ratings: [], sentiments: [] }
    }

    issues[category].count++
    if (feedback.rating !== null) {
      issues[category].ratings.push(feedback.rating)
    }
    if (feedback.sentiment) {
      issues[category].sentiments.push(feedback.sentiment)
    }
  })

  return Object.entries(issues)
    .map(([category, data]) => ({
      category,
      count: data.count,
      avgRating: data.ratings.length > 0
        ? data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length
        : 0,
      sentiment: data.sentiments.length > 0
        ? getMostFrequent(data.sentiments)
        : 'neutral',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

function getMostFrequent(arr: string[]): string {
  const frequency: Record<string, number> = {}
  arr.forEach(item => {
    frequency[item] = (frequency[item] || 0) + 1
  })
  return Object.entries(frequency).sort(([, a], [, b]) => b - a)[0][0]
}