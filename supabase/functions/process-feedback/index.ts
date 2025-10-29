import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FeedbackProcessingRequest {
  feedbackId: string
  autoCategorize?: boolean
  sentimentAnalysis?: boolean
  keywordExtraction?: boolean
}

interface SentimentAnalysisResult {
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  score: number // -1 to 1
  confidence: number // 0 to 1
}

interface CategorizationResult {
  category: string
  subcategory: string
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical'
  tags: string[]
  confidence: number
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

    const { feedbackId, autoCategorize = true, sentimentAnalysis = true, keywordExtraction = true }: FeedbackProcessingRequest = await req.json()

    if (!feedbackId) {
      throw new Error('Feedback ID is required')
    }

    // Fetch feedback entry
    const { data: feedback, error: fetchError } = await supabaseClient
      .from('feedback_entries')
      .select('*')
      .eq('id', feedbackId)
      .single()

    if (fetchError || !feedback) {
      throw new Error('Feedback not found')
    }

    const updates: any = {}

    // Sentiment Analysis
    if (sentimentAnalysis && feedback.content) {
      try {
        const sentimentResult = await analyzeSentiment(feedback.content)
        updates.sentiment = sentimentResult.sentiment
        updates.sentiment_score = sentimentResult.score
        updates.auto_categorized = true
      } catch (error) {
        console.error('Sentiment analysis failed:', error)
      }
    }

    // Auto-categorization
    if (autoCategorize && feedback.content) {
      try {
        const categorizationResult = await categorizeFeedback(feedback)
        updates.category = categorizationResult.category
        updates.subcategory = categorizationResult.subcategory
        updates.priority = categorizationResult.priority
        updates.tags = categorizationResult.tags
        updates.auto_categorized = true
      } catch (error) {
        console.error('Auto-categorization failed:', error)
      }
    }

    // Keyword extraction
    if (keywordExtraction && feedback.content) {
      try {
        const keywords = await extractKeywords(feedback.content)
        updates.keywords = keywords
      } catch (error) {
        console.error('Keyword extraction failed:', error)
      }
    }

    // Update feedback entry with processed data
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabaseClient
        .from('feedback_entries')
        .update(updates)
        .eq('id', feedbackId)

      if (updateError) {
        throw new Error(`Failed to update feedback: ${updateError.message}`)
      }
    }

    // Create integration logs for external systems
    await createIntegrationLogs(supabaseClient, feedbackId, updates)

    return new Response(
      JSON.stringify({
        success: true,
        processed: updates,
        feedbackId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Feedback processing error:', error)
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

// Sentiment Analysis using a simple rule-based approach
// In production, you might want to use a more sophisticated NLP service
async function analyzeSentiment(text: string): Promise<SentimentAnalysisResult> {
  const positiveWords = [
    'excellent', 'amazing', 'great', 'wonderful', 'fantastic', 'love', 'perfect',
    'awesome', 'brilliant', 'outstanding', 'superb', 'magnificent', 'exceptional',
    'good', 'nice', 'pleased', 'satisfied', 'happy', 'delighted', 'impressed',
    'recommend', 'helpful', 'friendly', 'professional', 'quality', 'smooth'
  ]

  const negativeWords = [
    'terrible', 'awful', 'horrible', 'bad', 'poor', 'disappointed', 'hate',
    'worst', 'disgusting', 'unacceptable', 'frustrating', 'annoying', 'useless',
    'broken', 'failed', 'error', 'problem', 'issue', 'difficult', 'confusing',
    'slow', 'expensive', 'rude', 'unhelpful', 'unprofessional', 'waste'
  ]

  const words = text.toLowerCase().split(/\s+/)
  let positiveCount = 0
  let negativeCount = 0

  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++
    if (negativeWords.includes(word)) negativeCount++
  })

  const totalSentimentWords = positiveCount + negativeCount
  if (totalSentimentWords === 0) {
    return {
      sentiment: 'neutral',
      score: 0,
      confidence: 0.5,
    }
  }

  const score = (positiveCount - negativeCount) / totalSentimentWords
  let sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'

  if (score > 0.3) sentiment = 'positive'
  else if (score < -0.3) sentiment = 'negative'
  else if (Math.abs(score) <= 0.1) sentiment = 'neutral'
  else sentiment = 'mixed'

  return {
    sentiment,
    score: Math.max(-1, Math.min(1, score)),
    confidence: Math.min(1, totalSentimentWords / 10),
  }
}

// Auto-categorization based on content analysis
async function categorizeFeedback(feedback: any): Promise<CategorizationResult> {
  const content = feedback.content.toLowerCase()
  const title = feedback.title?.toLowerCase() || ''
  const feedbackType = feedback.feedback_type

  // Category mapping based on keywords
  const categoryKeywords = {
    'Customer Service': ['staff', 'team', 'customer service', 'support', 'help', 'assistance', 'receptionist'],
    'Technical Issue': ['error', 'bug', 'crash', 'broken', 'not working', 'technical', 'system', 'website', 'app'],
    'Booking Process': ['booking', 'appointment', 'reservation', 'scheduling', 'calendar', 'availability'],
    'Payment': ['payment', 'billing', 'charge', 'price', 'cost', 'refund', 'money', 'card'],
    'Service Quality': ['service', 'treatment', 'quality', 'professional', 'expertise', 'skill'],
    'Cleanliness': ['clean', 'hygiene', 'sanitary', 'dirty', 'messy', 'tidy'],
    'Location': ['location', 'place', 'facility', 'room', 'environment', 'atmosphere'],
    'Communication': ['communication', 'information', 'updates', 'notification', 'contact'],
  }

  // Priority indicators
  const urgencyKeywords = {
    critical: ['emergency', 'urgent', 'critical', 'system down', 'cannot book', 'payment failed'],
    high: ['very disappointed', 'terrible', 'awful', 'unacceptable', 'major issue'],
    medium: ['issue', 'problem', 'concern', 'could be better'],
    low: ['suggestion', 'recommendation', 'minor', 'small improvement'],
  }

  // Determine category
  let bestCategory = 'General'
  let bestScore = 0

  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    const score = keywords.reduce((count, keyword) => {
      return count + (content.includes(keyword) || title.includes(keyword) ? 1 : 0)
    }, 0)

    if (score > bestScore) {
      bestScore = score
      bestCategory = category
    }
  })

  // Determine priority
  let priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical' = 'medium'
  Object.entries(urgencyKeywords).forEach(([level, keywords]) => {
    if (keywords.some(keyword => content.includes(keyword) || title.includes(keyword))) {
      priority = level as any
    }
  })

  // Generate tags
  const tags: string[] = []

  // Feedback type specific tags
  if (feedbackType === 'bug_report') {
    tags.push('technical', 'bug')
  }
  if (feedbackType === 'feature_request') {
    tags.push('enhancement', 'suggestion')
  }
  if (feedbackType === 'service_rating') {
    tags.push('service', 'rating')
  }

  // Content-based tags
  if (content.includes('mobile') || content.includes('app')) tags.push('mobile')
  if (content.includes('website') || content.includes('online')) tags.push('website')
  if (content.includes('email') || content.includes('notification')) tags.push('communication')
  if (content.includes('price') || content.includes('cost')) tags.push('pricing')
  if (content.includes('time') || content.includes('wait')) tags.push('timing')

  // Determine subcategory based on feedback type and content
  let subcategory = 'General'
  if (feedbackType === 'bug_report') {
    if (content.includes('payment') || content.includes('billing')) subcategory = 'Payment System'
    else if (content.includes('booking') || content.includes('appointment')) subcategory = 'Booking System'
    else if (content.includes('mobile') || content.includes('app')) subcategory = 'Mobile App'
    else subcategory = 'Website Issue'
  } else if (feedbackType === 'service_rating') {
    if (content.includes('staff') || content.includes('team')) subcategory = 'Staff Interaction'
    else if (content.includes('clean') || content.includes('hygiene')) subcategory = 'Cleanliness'
    else subcategory = 'Service Quality'
  }

  return {
    category: bestCategory,
    subcategory,
    priority,
    tags: [...new Set(tags)], // Remove duplicates
    confidence: Math.min(1, bestScore / 3),
  }
}

// Extract keywords from feedback content
async function extractKeywords(text: string): Promise<string[]> {
  // Simple keyword extraction
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'shall', 'can', 'this', 'that', 'these', 'those', 'i',
    'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where',
    'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
    'now', 'then', 'here', 'there', 'when', 'where', 'why', 'how', 'again', 'further',
    'once', 'please', 'thank', 'thanks', 'really', 'quite', 'rather', 'well', 'good',
    'bad', 'nice', 'great', 'excellent', 'amazing', 'terrible', 'awful'
  ])

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))

  // Count word frequencies
  const wordFreq: { [key: string]: number } = {}
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1
  })

  // Sort by frequency and return top keywords
  const keywords = Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word)

  return keywords
}

// Create integration logs for external systems
async function createIntegrationLogs(supabaseClient: any, feedbackId: string, updates: any) {
  const integrations = ['zendesk', 'jira', 'slack']

  for (const integration of integrations) {
    try {
      await supabaseClient
        .from('feedback_integration_logs')
        .insert({
          feedback_id: feedbackId,
          integration_provider: integration,
          integration_type: 'sync',
          status: 'pending',
          request_data: updates,
          created_at: new Date().toISOString(),
        })
    } catch (error) {
      console.error(`Failed to create integration log for ${integration}:`, error)
    }
  }
}