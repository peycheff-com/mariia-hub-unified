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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all unapproved reviews for analysis
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        profiles (
          full_name,
          email,
          created_at
        )
      `)
      .eq('is_approved', false)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    let analyzed = 0;
    let flagged = 0;

    for (const review of reviews || []) {
      analyzed++;
      const fraudAnalysis = await analyzeReviewForFraud(review, supabase);

      if (fraudAnalysis.isSuspicious) {
        flagged++;

        // Create fraud flag
        await supabase
          .from('review_flags')
          .insert({
            review_id: review.id,
            flag_type: fraudAnalysis.flagType,
            confidence_score: fraudAnalysis.confidence,
            auto_action: fraudAnalysis.recommendedAction,
            ai_analysis: fraudAnalysis.details,
            created_at: new Date().toISOString()
          });

        // If high confidence, automatically take action
        if (fraudAnalysis.confidence > 0.9) {
          if (fraudAnalysis.recommendedAction === 'hide') {
            await supabase
              .from('reviews')
              .update({ is_approved: false })
              .eq('id', review.id);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analyzed,
        flagged,
        message: `Analyzed ${analyzed} reviews, flagged ${flagged} for review`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in fraud detection:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function analyzeReviewForFraud(review: any, supabase: any) {
  let suspicionScore = 0;
  let flagType = 'fake';
  const reasons: string[] = [];
  const details: any = {};

  // 1. Check user account age
  if (review.profiles) {
    const accountAge = Date.now() - new Date(review.profiles.created_at).getTime();
    const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);

    if (daysSinceCreation < 1) {
      suspicionScore += 0.4;
      reasons.push('Account created less than 24 hours ago');
      details.newAccount = true;
    }

    if (daysSinceCreation < 7) {
      suspicionScore += 0.2;
      reasons.push('Account created less than a week ago');
    }
  }

  // 2. Analyze review content patterns
  const contentAnalysis = analyzeReviewContent(review.content);
  if (contentAnalysis.isGeneric) {
    suspicionScore += 0.3;
    reasons.push('Generic review content');
    details.genericContent = true;
  }

  if (contentAnalysis.hasSpamPatterns) {
    suspicionScore += 0.6;
    flagType = 'spam';
    reasons.push('Spam-like patterns detected');
    details.spamPatterns = true;
  }

  if (contentAnalysis.hasExcessivePunctuation) {
    suspicionScore += 0.2;
    reasons.push('Excessive punctuation');
  }

  // 3. Check rating patterns
  if (review.rating === 5 || review.rating === 1) {
    // Check if user only leaves extreme ratings
    const { data: userReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('user_id', review.user_id);

    if (userReviews && userReviews.length > 1) {
      const allExtreme = userReviews.every(r => r.rating === 5 || r.rating === 1);
      if (allExtreme) {
        suspicionScore += 0.3;
        reasons.push('User only leaves extreme ratings');
        details.extremeRatingsOnly = true;
      }
    }
  }

  // 4. Check for duplicate content
  const { data: duplicates } = await supabase
    .from('reviews')
    .select('id')
    .neq('id', review.id)
    .ilike('content', `%${review.content.substring(0, 50)}%`)
    .limit(5);

  if (duplicates && duplicates.length > 0) {
    suspicionScore += 0.8;
    flagType = 'duplicate';
    reasons.push('Duplicate or similar content detected');
    details.duplicateContent = true;
    details.duplicateCount = duplicates.length;
  }

  // 5. Check review frequency
  const { data: recentReviews } = await supabase
    .from('reviews')
    .select('created_at')
    .eq('user_id', review.user_id)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(10);

  if (recentReviews && recentReviews.length > 3) {
    suspicionScore += 0.5;
    reasons.push('Multiple reviews in 24 hours');
    details.frequentReviewer = true;
    details.reviewCount24h = recentReviews.length;
  }

  // 6. Analyze photos (if any)
  if (review.photos && review.photos.length > 0) {
    const photoAnalysis = await analyzePhotos(review.photos);
    if (photoAnalysis.hasStockImages) {
      suspicionScore += 0.7;
      reasons.push('Potential stock images detected');
      details.stockImages = true;
    }
    if (photoAnalysis.allSameStyle) {
      suspicionScore += 0.3;
      reasons.push('All photos have identical style');
    }
  }

  // Determine confidence and action
  const confidence = Math.min(suspicionScore, 1.0);
  let recommendedAction = 'flag_for_review';

  if (confidence > 0.8) {
    recommendedAction = 'hide';
  } else if (confidence > 0.6) {
    recommendedAction = 'flag_for_review';
  } else if (confidence < 0.3) {
    recommendedAction = 'approve';
  }

  return {
    isSuspicious: confidence > 0.5,
    flagType,
    confidence,
    recommendedAction,
    details: {
      ...details,
      contentAnalysis,
      suspicionScore,
      reasons
    }
  };
}

function analyzeReviewContent(content: string) {
  const genericPhrases = [
    'good service',
    'nice place',
    'would recommend',
    'great experience',
    'staff was friendly',
    'highly recommend'
  ];

  const spamPhrases = [
    'click here',
    'buy now',
    'free money',
    'make money fast',
    'limited time',
    'act now'
  ];

  const exclamationCount = (content.match(/!/g) || []).length;
  const uppercaseCount = (content.match(/[A-Z]/g) || []).length;
  const totalLength = content.length;

  const isGeneric = genericPhrases.some(phrase =>
    content.toLowerCase().includes(phrase)
  ) && content.length < 100;

  const hasSpamPatterns = spamPhrases.some(phrase =>
    content.toLowerCase().includes(phrase)
  );

  const hasExcessivePunctuation =
    exclamationCount > 3 ||
    (uppercaseCount / totalLength > 0.3);

  return {
    isGeneric,
    hasSpamPatterns,
    hasExcessivePunctuation,
    exclamationCount,
    uppercaseRatio: uppercaseCount / totalLength
  };
}

async function analyzePhotos(photoUrls: string[]) {
  // Simulate photo analysis
  // In production, this would use actual image analysis APIs
  return {
    hasStockImages: Math.random() > 0.9, // 10% chance of stock images
    allSameStyle: Math.random() > 0.8, // 20% chance of same style
    hasWatermarks: Math.random() > 0.95, // 5% chance of watermarks
    qualityScore: Math.random() // 0-1 quality score
  };
}