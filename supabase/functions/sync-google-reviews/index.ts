import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleReview {
  rating: number;
  comment: string | null;
  author_name: string;
  author_url: string;
  relative_time_description: string;
  time: number;
  profile_photo_url: string;
}

interface GooglePlacesResponse {
  result: {
    reviews?: GoogleReview[];
    user_ratings_total: number;
    rating: number;
  };
  status: string;
  error_message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { syncId } = await req.json();

    if (!syncId) {
      throw new Error('Sync ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get business information from settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'google_place_id')
      .single();

    if (settingsError || !settings?.value) {
      throw new Error('Google Place ID not configured in settings');
    }

    const googlePlaceId = settings.value;
    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');

    if (!googleApiKey) {
      throw new Error('Google Places API key not configured');
    }

    // Update sync status to 'processing'
    await supabase
      .from('external_review_syncs')
      .update({ status: 'processing' })
      .eq('id', syncId);

    // Fetch reviews from Google Places API
    const googleApiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${googlePlaceId}&fields=reviews,rating,user_ratings_total&reviews_sort=newest&key=${googleApiKey}`;

    const response = await fetch(googleApiUrl);
    const data: GooglePlacesResponse = await response.json();

    if (data.status !== 'OK') {
      throw new Error(data.error_message || `Google API error: ${data.status}`);
    }

    const reviews = data.result.reviews || [];
    let importedCount = 0;
    let updatedCount = 0;

    // Process each review
    for (const googleReview of reviews) {
      if (!googleReview.comment) continue; // Skip reviews without comments

      // Check if review already exists
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('external_review_id', `google_${googleReview.time}`)
        .single();

      const reviewData = {
        user_id: null, // External reviews don't have user accounts
        service_id: null, // General business review
        rating: googleReview.rating,
        title: null,
        content: googleReview.comment,
        source_platform: 'google',
        external_review_id: `google_${googleReview.time}`,
        external_platform_url: googleReview.author_url,
        is_approved: true, // Auto-approve Google reviews
        is_verified: true, // Google reviews are inherently verified
        verification_method: 'google',
        metadata: {
          author_name: googleReview.author_name,
          author_url: googleReview.author_url,
          profile_photo_url: googleReview.profile_photo_url,
          relative_time_description: googleReview.relative_time_description,
          original_time: googleReview.time,
          platform: 'google_places'
        }
      };

      if (existingReview) {
        // Update existing review
        await supabase
          .from('reviews')
          .update(reviewData)
          .eq('id', existingReview.id);
        updatedCount++;
      } else {
        // Insert new review with a placeholder user
        // Create a temporary user profile for external reviewers
        const { data: tempProfile } = await supabase
          .from('profiles')
          .upsert({
            id: crypto.randomUUID(),
            full_name: googleReview.author_name,
            avatar_url: googleReview.profile_photo_url,
            is_external_reviewer: true,
            metadata: {
              google_author_url: googleReview.author_url
            }
          })
          .select('id')
          .single();

        await supabase
          .from('reviews')
          .insert({
            ...reviewData,
            user_id: tempProfile.id,
            created_at: new Date(googleReview.time * 1000).toISOString()
          });
        importedCount++;
      }
    }

    // Update overall business rating in settings
    await supabase
      .from('settings')
      .upsert({
        key: 'google_business_rating',
        value: {
          rating: data.result.rating,
          total_reviews: data.result.user_ratings_total,
          last_updated: new Date().toISOString()
        }
      });

    // Update sync status to 'success'
    await supabase
      .from('external_review_syncs')
      .update({
        status: 'success',
        total_reviews: reviews.length,
        imported_reviews: importedCount,
        updated_reviews: updatedCount,
        last_sync_at: new Date().toISOString()
      })
      .eq('id', syncId);

    // Log the sync activity
    await supabase
      .from('activity_logs')
      .insert({
        action: 'sync_google_reviews',
        details: {
          imported: importedCount,
          updated: updatedCount,
          total: reviews.length,
          sync_id: syncId
        },
        created_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({
        success: true,
        imported: importedCount,
        updated: updatedCount,
        total: reviews.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error syncing Google reviews:', error);

    // Update sync status to 'failed' if we have a syncId
    try {
      const { syncId } = await req.json();
      if (syncId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        await supabase
          .from('external_review_syncs')
          .update({
            status: 'failed',
            error_message: error.message,
            last_sync_at: new Date().toISOString()
          })
          .eq('id', syncId);
      }
    } catch (updateError) {
      console.error('Failed to update sync status:', updateError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});