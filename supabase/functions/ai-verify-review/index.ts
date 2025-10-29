import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { reviewId, photos, content, verificationType } = await req.json();

    if (!reviewId) {
      throw new Error('Review ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let verified = false;
    let method = 'ai';
    let reason = '';
    let confidence = 0.0;

    // AI Photo Verification
    if (verificationType === 'photo' && photos && photos.length > 0) {
      // Simulate AI photo analysis
      // In production, this would call an actual AI service like Google Vision API
      const photoAnalysis = await analyzePhotos(photos);

      if (photoAnalysis.hasAuthenticContent && photoAnalysis.confidence > 0.7) {
        verified = true;
        method = 'photo_ai';
        confidence = photoAnalysis.confidence;
      } else {
        reason = photoAnalysis.reason || 'Photos could not be verified as authentic';
      }
    }

    // Content Analysis
    if (!verified && content) {
      const contentAnalysis = await analyzeContent(content);

      // Check for genuine review indicators
      if (contentAnalysis.isGenuine && contentAnalysis.confidence > 0.6) {
        verified = true;
        method = 'content_ai';
        confidence = contentAnalysis.confidence;
      } else if (contentAnalysis.suspicionScore > 0.7) {
        reason = contentAnalysis.reason || 'Review content appears to be generated or fake';
      }
    }

    // Cross-reference with user history
    const { data: userReviews } = await supabase
      .from('reviews')
      .select('created_at, rating, is_verified')
      .eq('user_id', (await supabase.from('reviews').select('user_id').eq('id', reviewId).single()).data?.user_id)
      .limit(10);

    if (userReviews && userReviews.length > 1) {
      // Existing user with history - increase trust
      const avgRating = userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length;
      if (avgRating >= 3 && avgRating <= 5) {
        confidence = Math.min(confidence + 0.2, 1.0);
        if (!verified && confidence > 0.8) {
          verified = true;
          method = 'history_based';
        }
      }
    }

    // Log verification attempt
    await supabase
      .from('review_verifications')
      .insert({
        review_id: reviewId,
        verification_type: 'ai',
        verification_status: verified ? 'approved' : 'rejected',
        verification_data: {
          method,
          confidence,
          reason: reason || null,
          photo_count: photos?.length || 0,
          content_length: content?.length || 0,
          user_history_count: userReviews?.length || 0,
          verified_at: new Date().toISOString()
        }
      });

    return new Response(
      JSON.stringify({
        verified,
        method,
        reason,
        confidence
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in AI verification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

// Simulated photo analysis (in production, use actual AI service)
async function analyzePhotos(photos: string[]) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate AI analysis results
  const hasAuthenticContent = Math.random() > 0.2; // 80% pass rate for demo
  const confidence = hasAuthenticContent ? 0.8 + Math.random() * 0.2 : 0.3 + Math.random() * 0.3;

  return {
    hasAuthenticContent,
    confidence,
    reason: hasAuthenticContent ? null : 'Photos appear to be stock images or unrelated content',
    analysis: {
      hasHumanFaces: Math.random() > 0.5,
      hasServiceContext: Math.random() > 0.3,
      imageQuality: 'high' | 'medium' | 'low',
      duplicatesDetected: Math.random() > 0.8
    }
  };
}

// Simulated content analysis
async function analyzeContent(content: string) {
  await new Promise(resolve => setTimeout(resolve, 500));

  const textLength = content.length;
  const wordCount = content.split(' ').length;

  // Genuine review indicators
  const hasSpecificDetails = /\b(amazing|excellent|perfect|terrible|awful|disappointed)\b/i.test(content);
  const hasPersonalTouch = /\b(I|my|me|felt|experienced)\b/i.test(content);
  const hasContextualInfo = /\b(appointment|service|treatment|visit|staff)\b/i.test(content);

  // Suspicious indicators
  const isTooShort = textLength < 20;
  const isTooGeneric = !hasSpecificDetails && !hasPersonalTouch;
  const hasSpamPatterns = /(!!!|click here|buy now|free money)/i.test(content);

  let isGenuine = true;
  let suspicionScore = 0;
  let confidence = 0.5;
  let reason = '';

  if (isTooShort) {
    suspicionScore += 0.3;
    reason = 'Review is too short to be meaningful';
  }

  if (isTooGeneric) {
    suspicionScore += 0.2;
    reason = reason ? `${reason}, lacks specific details` : 'Review lacks specific details';
  }

  if (hasSpamPatterns) {
    suspicionScore += 0.8;
    reason = reason ? `${reason}, spam patterns detected` : 'Spam patterns detected';
  }

  if (hasSpecificDetails && hasPersonalTouch && wordCount > 10) {
    confidence = 0.8 + Math.random() * 0.2;
  } else if (wordCount > 20) {
    confidence = 0.6 + Math.random() * 0.2;
  }

  if (suspicionScore > 0.7) {
    isGenuine = false;
    confidence = 0.9;
  }

  return {
    isGenuine,
    confidence,
    suspicionScore,
    reason: isGenuine ? null : reason,
    analysis: {
      textLength,
      wordCount,
      hasSpecificDetails,
      hasPersonalTouch,
      hasContextualInfo,
      sentiment: analyzeSentiment(content)
    }
  });
}

function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['amazing', 'excellent', 'perfect', 'great', 'wonderful', 'fantastic', 'love', 'best', 'awesome'];
  const negativeWords = ['terrible', 'awful', 'horrible', 'bad', 'worst', 'hate', 'disappointed', 'poor'];

  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}