import { supabase } from "@/integrations/supabase/client";
import { getEnvVar } from '@/lib/runtime-env';

interface SocialMediaReview {
  id: string;
  platform: 'instagram' | 'facebook' | 'twitter';
  content: string;
  author: {
    username: string;
    display_name: string;
    avatar_url?: string;
    followers_count?: number;
    verified: boolean;
  };
  media_urls?: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  posted_at: string;
  url: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  mentions_service?: boolean;
  hashtags?: string[];
}

interface SocialMediaConfig {
  instagram: {
    access_token?: string;
    business_account_id?: string;
    hashtag: string;
  };
  facebook: {
    page_id?: string;
    access_token?: string;
    page_name: string;
  };
  twitter: {
    bearer_token?: string;
    username: string;
    hashtag: string;
  };
}

export class SocialMediaReviewAggregator {
  private config: SocialMediaConfig;

  constructor(config: SocialMediaConfig) {
    this.config = config;
  }

  async aggregateAllReviews(): Promise<SocialMediaReview[]> {
    const allReviews: SocialMediaReview[] = [];

    try {
      // Instagram reviews
      if (this.config.instagram.access_token) {
        const instagramReviews = await this.fetchInstagramReviews();
        allReviews.push(...instagramReviews);
      }

      // Facebook reviews
      if (this.config.facebook.access_token) {
        const facebookReviews = await this.fetchFacebookReviews();
        allReviews.push(...facebookReviews);
      }

      // Twitter mentions
      if (this.config.twitter.bearer_token) {
        const twitterMentions = await this.fetchTwitterMentions();
        allReviews.push(...twitterMentions);
      }

      // Process and filter reviews
      const processedReviews = await this.processReviews(allReviews);

      // Store in database
      await this.storeReviews(processedReviews);

      return processedReviews;
    } catch (error) {
      console.error('Error aggregating social media reviews:', error);
      throw error;
    }
  }

  private async fetchInstagramReviews(): Promise<SocialMediaReview[]> {
    const reviews: SocialMediaReview[] = [];

    try {
      // Fetch Instagram posts with hashtag
      const hashtagUrl = `https://graph.instagram.com/ig_hashtag_search?user_id=${this.config.instagram.business_account_id}&q=${this.config.instagram.hashtag}&access_token=${this.config.instagram.access_token}`;

      const hashtagResponse = await fetch(hashtagUrl);
      const hashtagData = await hashtagResponse.json();

      if (hashtagData.data && hashtagData.data.length > 0) {
        const hashtagId = hashtagData.data[0].id;

        // Get recent media with this hashtag
        const mediaUrl = `https://graph.instagram.com/${hashtagId}/recent_media?user_id=${this.config.instagram.business_account_id}&fields=id,caption,media_type,media_url,permalink,timestamp,username,like_count,comments_count&access_token=${this.config.instagram.access_token}`;

        const mediaResponse = await fetch(mediaUrl);
        const mediaData = await mediaResponse.json();

        if (mediaData.data) {
          for (const media of mediaData.data) {
            if (media.caption && this.containsReviewKeywords(media.caption)) {
              const review: SocialMediaReview = {
                id: `instagram_${media.id}`,
                platform: 'instagram',
                content: media.caption,
                author: {
                  username: media.username,
                  display_name: media.username,
                  verified: false // Instagram doesn't provide verification status in basic API
                },
                media_urls: media.media_url ? [media.media_url] : [],
                likes_count: media.like_count || 0,
                comments_count: media.comments_count || 0,
                shares_count: 0, // Instagram doesn't provide share count
                posted_at: media.timestamp,
                url: media.permalink,
                sentiment: this.analyzeSentiment(media.caption),
                mentions_service: this.containsServiceMention(media.caption),
                hashtags: this.extractHashtags(media.caption)
              };

              reviews.push(review);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Instagram reviews:', error);
    }

    return reviews;
  }

  private async fetchFacebookReviews(): Promise<SocialMediaReview[]> {
    const reviews: SocialMediaReview[] = [];

    try {
      // Fetch Facebook page posts
      const postsUrl = `https://graph.facebook.com/v18.0/${this.config.facebook.page_id}/posts?fields=id,message,created_time,permalink_url,from,likes.summary(true),comments.summary(true),shares&access_token=${this.config.facebook.access_token}`;

      const postsResponse = await fetch(postsUrl);
      const postsData = await postsResponse.json();

      if (postsData.data) {
        for (const post of postsData.data) {
          if (post.message && this.containsReviewKeywords(post.message)) {
            const review: SocialMediaReview = {
              id: `facebook_${post.id}`,
              platform: 'facebook',
              content: post.message,
              author: {
                username: post.from?.id || 'unknown',
                display_name: post.from?.name || 'Facebook User',
                verified: false
              },
              media_urls: [], // Would need additional API calls to get photos
              likes_count: post.likes?.summary?.total_count || 0,
              comments_count: post.comments?.summary?.total_count || 0,
              shares_count: post.shares?.count || 0,
              posted_at: post.created_time,
              url: post.permalink_url,
              sentiment: this.analyzeSentiment(post.message),
              mentions_service: this.containsServiceMention(post.message),
              hashtags: this.extractHashtags(post.message)
            };

            reviews.push(review);
          }
        }
      }

      // Also fetch Facebook page ratings/reviews
      const ratingsUrl = `https://graph.facebook.com/v18.0/${this.config.facebook.page_id}/ratings?fields=id,review_text,rating,created_time,reviewer&access_token=${this.config.facebook.access_token}`;

      const ratingsResponse = await fetch(ratingsUrl);
      const ratingsData = await ratingsResponse.json();

      if (ratingsData.data) {
        for (const rating of ratingsData.data) {
          if (rating.review_text) {
            const review: SocialMediaReview = {
              id: `facebook_rating_${rating.id}`,
              platform: 'facebook',
              content: rating.review_text,
              author: {
                username: rating.reviewer?.id || 'unknown',
                display_name: rating.reviewer?.name || 'Facebook User',
                verified: false
              },
              media_urls: [],
              likes_count: 0,
              comments_count: 0,
              shares_count: 0,
              posted_at: rating.created_time,
              url: `https://facebook.com/${rating.id}`,
              sentiment: rating.rating >= 4 ? 'positive' : rating.rating <= 2 ? 'negative' : 'neutral',
              mentions_service: true, // Rating implies service mention
              hashtags: []
            };

            reviews.push(review);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Facebook reviews:', error);
    }

    return reviews;
  }

  private async fetchTwitterMentions(): Promise<SocialMediaReview[]> {
    const reviews: SocialMediaReview[] = [];

    try {
      // Search for tweets mentioning the business
      const searchQuery = `@${this.config.twitter.username} OR ${this.config.twitter.hashtag}`;
      const searchUrl = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(searchQuery)}&tweet.fields=created_at,author_id,public_metrics,context_annotations,entities&expansions=author_id,attachments.media_keys&user.fields=username,name,verified,public_metrics&media.fields=url`;

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

            const review: SocialMediaReview = {
              id: `twitter_${tweet.id}`,
              platform: 'twitter',
              content: tweet.text,
              author: {
                username: author?.username || 'unknown',
                display_name: author?.name || 'Twitter User',
                avatar_url: author?.profile_image_url,
                followers_count: author?.public_metrics?.followers_count,
                verified: author?.verified || false
              },
              media_urls: media
                .filter((m: any) => tweet.attachments?.media_keys?.includes(m.media_key))
                .map((m: any) => m.url),
              likes_count: tweet.public_metrics?.like_count || 0,
              comments_count: tweet.public_metrics?.reply_count || 0,
              shares_count: tweet.public_metrics?.retweet_count || 0,
              posted_at: tweet.created_at,
              url: `https://twitter.com/${author?.username}/status/${tweet.id}`,
              sentiment: this.analyzeSentiment(tweet.text),
              mentions_service: true, // Mention implies service
              hashtags: tweet.entities?.hashtags?.map((h: any) => h.tag) || []
            };

            reviews.push(review);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Twitter mentions:', error);
    }

    return reviews;
  }

  private containsReviewKeywords(text: string): boolean {
    const reviewKeywords = [
      'amazing', 'excellent', 'perfect', 'great', 'wonderful', 'fantastic',
      'love', 'loved', 'best', 'awesome', 'recommend', 'recommended',
      'terrible', 'awful', 'horrible', 'bad', 'worst', 'disappointed',
      'experience', 'visit', 'appointment', 'service', 'treatment'
    ];

    const lowerText = text.toLowerCase();
    return reviewKeywords.some(keyword => lowerText.includes(keyword));
  }

  private containsServiceMention(text: string): boolean {
    const serviceKeywords = [
      'mariia', 'lips', 'brows', 'fitness', 'glutes', 'training',
      'appointment', 'booking', 'service', 'treatment'
    ];

    const lowerText = text.toLowerCase();
    return serviceKeywords.some(keyword => lowerText.includes(keyword));
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
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

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#\w+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }

  private async processReviews(reviews: SocialMediaReview[]): Promise<SocialMediaReview[]> {
    // Filter out reviews that are too old (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filteredReviews = reviews.filter(review => {
      const reviewDate = new Date(review.posted_at);
      return reviewDate > thirtyDaysAgo;
    });

    // Sort by engagement (likes + comments + shares)
    return filteredReviews.sort((a, b) => {
      const engagementA = a.likes_count + a.comments_count + a.shares_count;
      const engagementB = b.likes_count + b.comments_count + b.shares_count;
      return engagementB - engagementA;
    });
  }

  private async storeReviews(reviews: SocialMediaReview[]): Promise<void> {
    for (const review of reviews) {
      try {
        // Check if review already exists
        const { data: existing } = await supabase
          .from('social_media_reviews')
          .select('id')
          .eq('external_id', review.id)
          .single();

        const reviewData = {
          external_id: review.id,
          platform: review.platform,
          content: review.content,
          author_name: review.author.display_name,
          author_username: review.author.username,
          author_avatar_url: review.author.avatar_url,
          author_verified: review.author.verified,
          author_followers_count: review.author.followers_count,
          media_urls: review.media_urls || [],
          likes_count: review.likes_count,
          comments_count: review.comments_count,
          shares_count: review.shares_count,
          posted_at: review.posted_at,
          url: review.url,
          sentiment: review.sentiment,
          mentions_service: review.mentions_service,
          hashtags: review.hashtags || [],
          created_at: new Date().toISOString()
        };

        if (existing) {
          await supabase
            .from('social_media_reviews')
            .update(reviewData)
            .eq('id', existing.id);
        } else {
          await supabase
            .from('social_media_reviews')
            .insert(reviewData);
        }
      } catch (error) {
        console.error(`Error storing review ${review.id}:`, error);
      }
    }
  }

  // Get aggregated social media reviews from database
  static async getStoredReviews(platform?: string, limit = 50): Promise<any[]> {
    let query = supabase
      .from('social_media_reviews')
      .select('*')
      .order('posted_at', { ascending: false })
      .limit(limit);

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching stored reviews:', error);
      return [];
    }

    return data || [];
  }
}

// Utility function to schedule social media aggregation
export const scheduleSocialMediaAggregation = async () => {
  // This would typically be called by a cron job or scheduled function
  const config: SocialMediaConfig = {
    instagram: {
      hashtag: 'mariiahub'
    },
    facebook: {
      page_name: 'MariiaHub'
    },
    twitter: {
      username: 'mariiahub',
      hashtag: 'mariiahub'
    }
  };

  // Get API keys from secure storage/environment
  const instagramToken = getEnvVar('INSTAGRAM_ACCESS_TOKEN', ['VITE_INSTAGRAM_ACCESS_TOKEN']);
  const facebookToken = getEnvVar('FACEBOOK_ACCESS_TOKEN', ['VITE_FACEBOOK_ACCESS_TOKEN']);
  const twitterToken = getEnvVar('TWITTER_BEARER_TOKEN', ['VITE_TWITTER_BEARER_TOKEN']);

  if (instagramToken) config.instagram.access_token = instagramToken;
  if (facebookToken) config.facebook.access_token = facebookToken;
  if (twitterToken) config.twitter.bearer_token = twitterToken;

  const aggregator = new SocialMediaReviewAggregator(config);

  try {
    const reviews = await aggregator.aggregateAllReviews();
    console.log(`Aggregated ${reviews.length} social media reviews`);
    return reviews;
  } catch (error) {
    console.error('Failed to aggregate social media reviews:', error);
    return [];
  }
};
