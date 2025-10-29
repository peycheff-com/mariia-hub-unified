import { supabase } from "@/integrations/supabase/client";
import { ReviewSource } from "@/types/review";

interface EnhancedSocialMediaConfig {
  google: {
    api_key?: string;
    place_id?: string;
    enabled: boolean;
  };
  booksy: {
    api_key?: string;
    salon_id?: string;
    enabled: boolean;
  };
  instagram: {
    access_token?: string;
    business_account_id?: string;
    hashtag: string;
    enabled: boolean;
  };
  facebook: {
    page_id?: string;
    access_token?: string;
    enabled: boolean;
  };
  twitter: {
    bearer_token?: string;
    username: string;
    hashtag: string;
    enabled: boolean;
  };
  sync_interval?: number; // in minutes
}

interface GoogleReview {
  author_name: string;
  author_url: string;
  language: string;
  original_language: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
  translated: boolean;
}

interface BooksyReview {
  id: string;
  client: {
    name: string;
    avatar_url?: string;
  };
  rating: number;
  comment: string;
  service_name: string;
  date: string;
  response?: string;
  photos?: string[];
}

export class EnhancedReviewAggregator {
  private config: EnhancedSocialMediaConfig;

  constructor(config: EnhancedSocialMediaConfig) {
    this.config = config;
  }

  async aggregateAllReviews(): Promise<ReviewSource[]> {
    const allReviews: ReviewSource[] = [];

    try {
      // Google Reviews
      if (this.config.google.enabled && this.config.google.api_key && this.config.google.place_id) {
        const googleReviews = await this.fetchGoogleReviews();
        allReviews.push(...googleReviews);
      }

      // Booksy Reviews
      if (this.config.booksy.enabled && this.config.booksy.api_key) {
        const booksyReviews = await this.fetchBooksyReviews();
        allReviews.push(...booksyReviews);
      }

      // Instagram
      if (this.config.instagram.enabled && this.config.instagram.access_token) {
        const instagramReviews = await this.fetchInstagramReviews();
        allReviews.push(...instagramReviews);
      }

      // Facebook
      if (this.config.facebook.enabled && this.config.facebook.access_token) {
        const facebookReviews = await this.fetchFacebookReviews();
        allReviews.push(...facebookReviews);
      }

      // Twitter
      if (this.config.twitter.enabled && this.config.twitter.bearer_token) {
        const twitterReviews = await this.fetchTwitterReviews();
        allReviews.push(...twitterReviews);
      }

      // Process and store reviews
      const processedReviews = await this.processReviews(allReviews);
      await this.storeReviews(processedReviews);

      return processedReviews;
    } catch (error) {
      console.error('Error aggregating reviews:', error);
      throw error;
    }
  }

  private async fetchGoogleReviews(): Promise<ReviewSource[]> {
    const reviews: ReviewSource[] = [];

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${this.config.google.place_id}&fields=name,rating,reviews&key=${this.config.google.api_key}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.result && data.result.reviews) {
        for (const review of data.result.reviews as GoogleReview[]) {
          const reviewSource: ReviewSource = {
            id: crypto.randomUUID(),
            review_id: '', // Will be mapped to internal review later
            platform: 'google',
            external_id: `google_${review.time}_${review.author_name}`,
            external_url: review.author_url,
            reviewer_name: review.author_name,
            reviewer_avatar: review.profile_photo_url,
            platform_rating: review.rating,
            sync_date: new Date().toISOString(),
            last_synced_at: new Date().toISOString(),
            sync_status: 'synced',
            raw_data: {
              language: review.language,
              original_language: review.original_language,
              relative_time: review.relative_time_description,
              translated: review.translated,
              original_text: review.original_language !== review.language ? review.text : null
            }
          };

          // Create or update internal review
          const internalReviewId = await this.createInternalReview({
            rating: review.rating,
            comment: review.text,
            source_platform: 'google',
            external_id: reviewSource.external_id,
            reviewer_name: review.author_name,
            verified: false // Google reviews are considered verified
          });

          reviewSource.review_id = internalReviewId;
          reviews.push(reviewSource);
        }
      }
    } catch (error) {
      console.error('Error fetching Google reviews:', error);
    }

    return reviews;
  }

  private async fetchBooksyReviews(): Promise<ReviewSource[]> {
    const reviews: ReviewSource[] = [];

    try {
      // Booksy API endpoint for reviews (this is a mock implementation)
      const url = `https://api.booksy.com/api/v1/salons/${this.config.booksy.salon_id}/reviews`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.booksy.api_key}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.reviews) {
        for (const review of data.reviews as BooksyReview[]) {
          const reviewSource: ReviewSource = {
            id: crypto.randomUUID(),
            review_id: '',
            platform: 'booksy',
            external_id: `booksy_${review.id}`,
            external_url: `https://booksy.com/business/review/${review.id}`,
            reviewer_name: review.client.name,
            reviewer_avatar: review.client.avatar_url,
            platform_rating: review.rating,
            sync_date: new Date().toISOString(),
            last_synced_at: new Date().toISOString(),
            sync_status: 'synced',
            raw_data: {
              service_name: review.service_name,
              photos: review.photos || [],
              business_response: review.response
            }
          };

          // Create or update internal review
          const internalReviewId = await this.createInternalReview({
            rating: review.rating,
            comment: review.comment,
            source_platform: 'booksy',
            external_id: reviewSource.external_id,
            reviewer_name: review.client.name,
            verified: true, // Booksy reviews are from confirmed bookings
            service_name: review.service_name,
            photos: review.photos || []
          });

          reviewSource.review_id = internalReviewId;
          reviews.push(reviewSource);
        }
      }
    } catch (error) {
      console.error('Error fetching Booksy reviews:', error);
    }

    return reviews;
  }

  private async fetchInstagramReviews(): Promise<ReviewSource[]> {
    const reviews: ReviewSource[] = [];

    try {
      const hashtagUrl = `https://graph.instagram.com/ig_hashtag_search?user_id=${this.config.instagram.business_account_id}&q=${this.config.instagram.hashtag}&access_token=${this.config.instagram.access_token}`;

      const hashtagResponse = await fetch(hashtagUrl);
      const hashtagData = await hashtagResponse.json();

      if (hashtagData.data && hashtagData.data.length > 0) {
        const hashtagId = hashtagData.data[0].id;

        const mediaUrl = `https://graph.instagram.com/${hashtagId}/recent_media?user_id=${this.config.instagram.business_account_id}&fields=id,caption,media_type,media_url,permalink,timestamp,username,like_count,comments_count&access_token=${this.config.instagram.access_token}`;

        const mediaResponse = await fetch(mediaUrl);
        const mediaData = await mediaResponse.json();

        if (mediaData.data) {
          for (const media of mediaData.data) {
            if (media.caption && this.containsReviewKeywords(media.caption)) {
              const reviewSource: ReviewSource = {
                id: crypto.randomUUID(),
                review_id: '',
                platform: 'instagram',
                external_id: `instagram_${media.id}`,
                external_url: media.permalink,
                reviewer_name: media.username,
                reviewer_avatar: `https://instagram.com/${media.username}/picture`,
                sync_date: new Date().toISOString(),
                last_synced_at: new Date().toISOString(),
                sync_status: 'synced',
                raw_data: {
                  media_type: media.media_type,
                  media_url: media.media_url,
                  likes: media.like_count,
                  comments: media.comments_count,
                  caption: media.caption
                }
              };

              // Create internal review for mentions
              const internalReviewId = await this.createInternalReview({
                rating: this.estimateRatingFromSentiment(media.caption),
                comment: media.caption,
                source_platform: 'instagram',
                external_id: reviewSource.external_id,
                reviewer_name: media.username,
                verified: false,
                photos: media.media_url ? [media.media_url] : []
              });

              reviewSource.review_id = internalReviewId;
              reviews.push(reviewSource);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Instagram reviews:', error);
    }

    return reviews;
  }

  private async fetchFacebookReviews(): Promise<ReviewSource[]> {
    const reviews: ReviewSource[] = [];

    try {
      // Fetch Facebook ratings/reviews
      const ratingsUrl = `https://graph.facebook.com/v18.0/${this.config.facebook.page_id}/ratings?fields=id,review_text,rating,created_time,reviewer&access_token=${this.config.facebook.access_token}`;

      const ratingsResponse = await fetch(ratingsUrl);
      const ratingsData = await ratingsResponse.json();

      if (ratingsData.data) {
        for (const rating of ratingsData.data) {
          if (rating.review_text) {
            const reviewSource: ReviewSource = {
              id: crypto.randomUUID(),
              review_id: '',
              platform: 'facebook',
              external_id: `facebook_rating_${rating.id}`,
              external_url: `https://facebook.com/${rating.id}`,
              reviewer_name: rating.reviewer?.name || 'Facebook User',
              reviewer_avatar: `https://graph.facebook.com/${rating.reviewer?.id}/picture`,
              platform_rating: rating.rating,
              sync_date: new Date().toISOString(),
              last_synced_at: new Date().toISOString(),
              sync_status: 'synced',
              raw_data: {
                reviewer_id: rating.reviewer?.id,
                created_time: rating.created_time
              }
            };

            // Create internal review
            const internalReviewId = await this.createInternalReview({
              rating: rating.rating,
              comment: rating.review_text,
              source_platform: 'facebook',
              external_id: reviewSource.external_id,
              reviewer_name: rating.reviewer?.name || 'Facebook User',
              verified: true // Facebook reviews are from real accounts
            });

            reviewSource.review_id = internalReviewId;
            reviews.push(reviewSource);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Facebook reviews:', error);
    }

    return reviews;
  }

  private async fetchTwitterReviews(): Promise<ReviewSource[]> {
    const reviews: ReviewSource[] = [];

    try {
      const searchQuery = `@${this.config.twitter.username} OR ${this.config.twitter.hashtag}`;
      const searchUrl = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(searchQuery)}&tweet.fields=created_at,author_id,public_metrics,context_annotations,entities&expansions=author_id,attachments.media_keys&user.fields=username,name,verified,public_metrics,profile_image_url&media.fields,url`;

      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${this.config.twitter.bearer_token}`
        }
      });

      const data = await response.json();

      if (data.data) {
        const users = data.includes?.users || [];
        const media = data.includes?.media || [];

        for (const tweet of data.data) {
          if (this.containsReviewKeywords(tweet.text)) {
            const author = users.find((u: any) => u.id === tweet.author_id);

            const reviewSource: ReviewSource = {
              id: crypto.randomUUID(),
              review_id: '',
              platform: 'facebook', // Using facebook as generic for Twitter in enum
              external_id: `twitter_${tweet.id}`,
              external_url: `https://twitter.com/${author?.username}/status/${tweet.id}`,
              reviewer_name: author?.name || 'Twitter User',
              reviewer_avatar: author?.profile_image_url,
              sync_date: new Date().toISOString(),
              last_synced_at: new Date().toISOString(),
              sync_status: 'synced',
              raw_data: {
                username: author?.username,
                verified: author?.verified || false,
                followers: author?.public_metrics?.followers_count,
                likes: tweet.public_metrics?.like_count,
                retweets: tweet.public_metrics?.retweet_count,
                replies: tweet.public_metrics?.reply_count,
                media_urls: media
                  .filter((m: any) => tweet.attachments?.media_keys?.includes(m.media_key))
                  .map((m: any) => m.url)
              }
            };

            // Create internal review for mention
            const internalReviewId = await this.createInternalReview({
              rating: this.estimateRatingFromSentiment(tweet.text),
              comment: tweet.text,
              source_platform: 'twitter',
              external_id: reviewSource.external_id,
              reviewer_name: author?.name || 'Twitter User',
              verified: author?.verified || false,
              photos: reviewSource.raw_data.media_urls || []
            });

            reviewSource.review_id = internalReviewId;
            reviews.push(reviewSource);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Twitter reviews:', error);
    }

    return reviews;
  }

  private async createInternalReview(reviewData: {
    rating: number;
    comment: string;
    source_platform: string;
    external_id: string;
    reviewer_name: string;
    verified: boolean;
    service_name?: string;
    photos?: string[];
  }): Promise<string> {
    // Check if review already exists
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('verification_data->>external_id', reviewData.external_id)
      .single();

    if (existing) {
      return existing.id;
    }

    // Create new review
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        rating: reviewData.rating,
        comment: reviewData.comment,
        photos: reviewData.photos || [],
        is_verified: reviewData.verified,
        verification_data: {
          external_id: reviewData.external_id,
          source_platform: reviewData.source_platform
        },
        status: 'published',
        is_fraud_suspected: false,
        fraud_score: 0,
        helpful_count: 0,
        report_count: 0,
        featured: false,
        response_requested: false
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('Error creating internal review:', error);
      return '';
    }

    return data.id;
  }

  private containsReviewKeywords(text: string): boolean {
    const reviewKeywords = [
      'amazing', 'excellent', 'perfect', 'great', 'wonderful', 'fantastic',
      'love', 'loved', 'best', 'awesome', 'recommend', 'recommended',
      'terrible', 'awful', 'horrible', 'bad', 'worst', 'disappointed',
      'experience', 'visit', 'appointment', 'service', 'treatment', 'results'
    ];

    const lowerText = text.toLowerCase();
    return reviewKeywords.some(keyword => lowerText.includes(keyword));
  }

  private estimateRatingFromSentiment(text: string): number {
    const positiveWords = [
      'amazing', 'excellent', 'perfect', 'great', 'wonderful', 'fantastic',
      'love', 'loved', 'best', 'awesome', 'recommend', 'happy', 'satisfied'
    ];

    const negativeWords = [
      'terrible', 'awful', 'horrible', 'bad', 'worst', 'disappointed',
      'unsatisfied', 'poor', 'waste', 'regret', 'avoid'
    ];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

    if (positiveCount > negativeCount) return 5;
    if (negativeCount > positiveCount) return 1;
    if (positiveCount === 0 && negativeCount === 0) return 3;
    return 3;
  }

  private async processReviews(reviews: ReviewSource[]): Promise<ReviewSource[]> {
    // Filter reviews from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    return reviews.filter(review => {
      const syncDate = new Date(review.sync_date);
      return syncDate > ninetyDaysAgo;
    });
  }

  private async storeReviews(reviews: ReviewSource[]): Promise<void> {
    for (const review of reviews) {
      try {
        // Check if source already exists
        const { data: existing } = await supabase
          .from('review_sources')
          .select('id')
          .eq('external_id', review.external_id)
          .eq('platform', review.platform)
          .single();

        const sourceData = {
          review_id: review.review_id,
          platform: review.platform,
          external_id: review.external_id,
          external_url: review.external_url,
          reviewer_name: review.reviewer_name,
          reviewer_avatar: review.reviewer_avatar,
          platform_rating: review.platform_rating,
          sync_date: review.sync_date,
          last_synced_at: review.last_synced_at,
          sync_status: review.sync_status,
          raw_data: review.raw_data
        };

        if (existing) {
          await supabase
            .from('review_sources')
            .update(sourceData)
            .eq('id', existing.id);
        } else {
          await supabase
            .from('review_sources')
            .insert(sourceData);
        }
      } catch (error) {
        console.error(`Error storing review source ${review.external_id}:`, error);
      }
    }
  }

  // Sync statistics
  async getSyncStatistics(): Promise<{
    total: number;
    byPlatform: Record<string, number>;
    lastSync: Record<string, string>;
  }> {
    const { data, error } = await supabase
      .from('review_sources')
      .select('platform, sync_date')
      .gte('sync_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error || !data) {
      return { total: 0, byPlatform: {}, lastSync: {} };
    }

    const byPlatform: Record<string, number> = {};
    const lastSync: Record<string, string> = {};

    data.forEach(item => {
      byPlatform[item.platform] = (byPlatform[item.platform] || 0) + 1;
      if (!lastSync[item.platform] || new Date(item.sync_date) > new Date(lastSync[item.platform])) {
        lastSync[item.platform] = item.sync_date;
      }
    });

    return {
      total: data.length,
      byPlatform,
      lastSync
    };
  }
}

// Schedule regular aggregation
export const scheduleReviewAggregation = async () => {
  const config: EnhancedSocialMediaConfig = {
    google: {
      api_key: import.meta.env.VITE_GOOGLE_PLACES_API_KEY,
      place_id: import.meta.env.VITE_GOOGLE_PLACE_ID,
      enabled: !!import.meta.env.VITE_GOOGLE_PLACES_API_KEY && !!import.meta.env.VITE_GOOGLE_PLACE_ID
    },
    booksy: {
      api_key: import.meta.env.VITE_BOOKSY_API_KEY,
      salon_id: import.meta.env.VITE_BOOKSY_SALON_ID,
      enabled: !!import.meta.env.VITE_BOOKSY_API_KEY
    },
    instagram: {
      access_token: import.meta.env.VITE_INSTAGRAM_ACCESS_TOKEN,
      business_account_id: import.meta.env.VITE_INSTAGRAM_BUSINESS_ACCOUNT_ID,
      hashtag: 'mariiahub',
      enabled: !!import.meta.env.VITE_INSTAGRAM_ACCESS_TOKEN
    },
    facebook: {
      access_token: import.meta.env.VITE_FACEBOOK_ACCESS_TOKEN,
      page_id: import.meta.env.VITE_FACEBOOK_PAGE_ID,
      enabled: !!import.meta.env.VITE_FACEBOOK_ACCESS_TOKEN
    },
    twitter: {
      bearer_token: import.meta.env.VITE_TWITTER_BEARER_TOKEN,
      username: 'mariiahub',
      hashtag: 'mariiahub',
      enabled: !!import.meta.env.VITE_TWITTER_BEARER_TOKEN
    },
    sync_interval: 60 // Run every hour
  };

  const aggregator = new EnhancedReviewAggregator(config);

  try {
    console.log('Starting review aggregation...');
    const reviews = await aggregator.aggregateAllReviews();

    const stats = await aggregator.getSyncStatistics();
    console.log(`Aggregated ${reviews.length} reviews:`, stats);

    return reviews;
  } catch (error) {
    console.error('Review aggregation failed:', error);
    return [];
  }
};