import { supabase } from '@/integrations/supabase/client';
import { Review, FraudDetectionConfig } from '@/types/review';

interface FraudDetectionResult {
  fraud_score: number; // 0-1
  flags: string[];
  confidence: number;
  details: Record<string, any>;
  should_flag: boolean;
}

interface ReviewPattern {
  id: string;
  type: 'velocity' | 'content' | 'behavior' | 'network';
  pattern: string;
  weight: number;
  active: boolean;
}

export class ReviewFraudDetector {
  private config: FraudDetectionConfig;
  private patterns: ReviewPattern[] = [
    // Velocity patterns
    {
      id: 'rapid_reviews',
      type: 'velocity',
      pattern: 'multiple_reviews_from_same_ip',
      weight: 0.8,
      active: true
    },
    {
      id: 'burst_reviews',
      type: 'velocity',
      pattern: 'burst_of_5_star_reviews',
      weight: 0.6,
      active: true
    },
    // Content patterns
    {
      id: 'duplicate_content',
      type: 'content',
      pattern: 'identical_review_text',
      weight: 0.9,
      active: true
    },
    {
      id: 'spam_keywords',
      type: 'content',
      pattern: 'spam_like_content',
      weight: 0.7,
      active: true
    },
    {
      id: 'generic_content',
      type: 'content',
      pattern: 'generic_non_specific_review',
      weight: 0.4,
      active: true
    },
    // Behavior patterns
    {
      id: 'rating_consistency',
      type: 'behavior',
      pattern: 'always_5_or_1_star',
      weight: 0.5,
      active: true
    },
    {
      id: 'no_bookings',
      type: 'behavior',
      pattern: 'review_without_booking',
      weight: 0.6,
      active: true
    },
    // Network patterns
    {
      id: 'cluster_reviews',
      type: 'network',
      pattern: 'reviews_from_known_vpn_ips',
      weight: 0.7,
      active: true
    },
    {
      id: 'suspicious_domains',
      type: 'network',
      pattern: 'reviews_from_disposable_emails',
      weight: 0.5,
      active: true
    }
  ];

  constructor(config: FraudDetectionConfig) {
    this.config = config;
  }

  async analyzeReview(review: Partial<Review>, clientData?: any): Promise<FraudDetectionResult> {
    const flags: string[] = [];
    let fraudScore = 0;
    const details: Record<string, any> = {};

    // Skip if review is from verified source
    if (review.verification_data?.source_platform === 'google' ||
        review.verification_data?.source_platform === 'booksy') {
      return {
        fraud_score: 0.1,
        flags: [],
        confidence: 0.9,
        details: { reason: 'Verified external source' },
        should_flag: false
      };
    }

    // Velocity Analysis
    if (this.config.ip_analysis.enabled) {
      const ipAnalysis = await this.analyzeIPVelocity(review);
      if (ipAnalysis.suspicious) {
        flags.push(...ipAnalysis.flags);
        fraudScore += ipAnalysis.score;
        details.ip_analysis = ipAnalysis.details;
      }
    }

    // Content Analysis
    if (this.config.content_analysis.enabled) {
      const contentAnalysis = this.analyzeContent(review);
      if (contentAnalysis.suspicious) {
        flags.push(...contentAnalysis.flags);
        fraudScore += contentAnalysis.score;
        details.content_analysis = contentAnalysis.details;
      }
    }

    // Behavior Analysis
    if (this.config.behavior_analysis.enabled) {
      const behaviorAnalysis = await this.analyzeBehavior(review, clientData);
      if (behaviorAnalysis.suspicious) {
        flags.push(...behaviorAnalysis.flags);
        fraudScore += behaviorAnalysis.score;
        details.behavior_analysis = behaviorAnalysis.details;
      }
    }

    // Network Analysis
    const networkAnalysis = await this.analyzeNetwork(review, clientData);
    if (networkAnalysis.suspicious) {
      flags.push(...networkAnalysis.flags);
      fraudScore += networkAnalysis.score;
      details.network_analysis = networkAnalysis.details;
    }

    // Normalize score to 0-1
    fraudScore = Math.min(1, fraudScore);

    const shouldFlag = fraudScore >= (this.config.auto_flag_threshold || 0.7);

    // Log detection
    await this.logFraudDetection({
      review_id: review.id,
      fraud_score: fraudScore,
      flags,
      details,
      should_flag
    });

    return {
      fraud_score: fraudScore,
      flags,
      confidence: this.calculateConfidence(fraudScore, flags),
      details,
      should_flag
    };
  }

  private async analyzeIPVelocity(review: Partial<Review>): Promise<{
    suspicious: boolean;
    flags: string[];
    score: number;
    details: any;
  }> {
    if (!review.ip_address) {
      return { suspicious: false, flags: [], score: 0, details: {} };
    }

    const flags: string[] = [];
    let score = 0;
    const details: any = {};

    // Check for multiple reviews from same IP in last 24 hours
    const { data: recentReviews } = await supabase
      .from('reviews')
      .select('id, created_at')
      .eq('ip_address', review.ip_address)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (recentReviews && recentReviews.length >= this.config.ip_analysis.max_reviews_per_hour) {
      flags.push('multiple_reviews_from_same_ip');
      score += 0.4;
      details.recent_reviews_from_ip = recentReviews.length;
    }

    // Check if IP is from suspicious ranges (VPN/proxy)
    const ipData = await this.checkIPReputation(review.ip_address);
    if (ipData.isProxy || ipData.isVPN) {
      flags.push('suspicious_ip_range');
      score += 0.3;
      details.ip_reputation = ipData;
    }

    // Check geolocation consistency
    if (review.verification_data?.booking_location) {
      const locationMatch = await this.checkLocationConsistency(
        review.ip_address,
        review.verification_data.booking_location
      );
      if (!locationMatch.matches) {
        flags.push('location_inconsistency');
        score += 0.2;
        details.location_check = locationMatch;
      }
    }

    return {
      suspicious: flags.length > 0,
      flags,
      score,
      details
    };
  }

  private analyzeContent(review: Partial<Review>): {
    suspicious: boolean;
    flags: string[];
    score: number;
    details: any;
  }> {
    const flags: string[] = [];
    let score = 0;
    const details: any = {};

    if (!review.comment) {
      return { suspicious: false, flags: [], score: 0, details: {} };
    }

    const text = review.comment.toLowerCase();

    // Check for duplicate content
    if (this.isDuplicateContent(review.comment)) {
      flags.push('duplicate_content');
      score += 0.5;
      details.is_duplicate = true;
    }

    // Check for spam keywords
    const spamKeywords = this.config.content_analysis.spam_keywords || [];
    const spamMatches = spamKeywords.filter(keyword => text.includes(keyword.toLowerCase()));
    if (spamMatches.length > 0) {
      flags.push('spam_keywords');
      score += 0.3;
      details.spam_matches = spamMatches;
    }

    // Check for generic/non-specific reviews
    if (this.isGenericContent(text)) {
      flags.push('generic_content');
      score += 0.2;
      details.is_generic = true;
    }

    // Check for review patterns (e.g., repeating characters)
    if (this.hasSuspiciousPatterns(text)) {
      flags.push('suspicious_patterns');
      score += 0.4;
      details.has_patterns = true;
    }

    // Check review length
    if (text.length < 10 || text.length > 2000) {
      flags.push('unusual_length');
      score += 0.2;
      details.review_length = text.length;
    }

    return {
      suspicious: flags.length > 0,
      flags,
      score,
      details
    };
  }

  private async analyzeBehavior(
    review: Partial<Review>,
    clientData?: any
  ): Promise<{
    suspicious: boolean;
    flags: string[];
    score: number;
    details: any;
  }> {
    const flags: string[] = [];
    let score = 0;
    const details: any = {};

    // Check if reviewer has any bookings
    if (!review.booking_id && clientData) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('client_id', clientData.id)
        .limit(1);

      if (!bookings || bookings.length === 0) {
        flags.push('review_without_booking');
        score += 0.3;
        details.has_bookings = false;
      } else {
        details.has_bookings = true;
      }
    }

    // Check rating consistency
    if (clientData) {
      const { data: clientReviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('client_id', clientData.id)
        .limit(10);

      if (clientReviews && clientReviews.length > 2) {
        const allFiveStar = clientReviews.every(r => r.rating === 5);
        const allOneStar = clientReviews.every(r => r.rating === 1);

        if (allFiveStar || allOneStar) {
          flags.push('rating_consistency');
          score += 0.2;
          details.rating_pattern = allFiveStar ? 'all_5_star' : 'all_1_star';
        }
      }
    }

    // Check timing patterns
    const now = new Date();
    const reviewDate = new Date(review.created_at || now);
    const timeSinceBooking = review.booking_id
      ? await this.getTimeSinceBooking(review.booking_id, reviewDate)
      : null;

    if (timeSinceBooking !== null && timeSinceBooking < 5 * 60 * 1000) { // Less than 5 minutes
      flags.push('immediate_review');
      score += 0.2;
      details.time_since_booking = timeSinceBooking;
    }

    return {
      suspicious: flags.length > 0,
      flags,
      score,
      details
    };
  }

  private async analyzeNetwork(
    review: Partial<Review>,
    clientData?: any
  ): Promise<{
    suspicious: boolean;
    flags: string[];
    score: number;
    details: any;
  }> {
    const flags: string[] = [];
    let score = 0;
    const details: any = {};

    if (!clientData?.email) {
      return { suspicious: false, flags: [], score: 0, details: {} };
    }

    // Check email domain reputation
    const domain = clientData.email.split('@')[1];
    const disposableEmailDomains = await this.getDisposableEmailDomains();

    if (disposableEmailDomains.includes(domain.toLowerCase())) {
      flags.push('disposable_email');
      score += 0.5;
      details.email_domain = domain;
    }

    // Check for account age
    const accountAge = Date.now() - new Date(clientData.created_at).getTime();
    if (accountAge < 24 * 60 * 60 * 1000) { // Less than 24 hours
      flags.push('new_account');
      score += 0.3;
      details.account_age_hours = accountAge / (1000 * 60 * 60);
    }

    return {
      suspicious: flags.length > 0,
      flags,
      score,
      details
    };
  }

  private async checkIPReputation(ipAddress: string): Promise<{
    isProxy: boolean;
    isVPN: boolean;
    country: string;
    risk: 'low' | 'medium' | 'high';
  }> {
    // Mock implementation - in production, use a service like IPQualityScore
    const suspiciousRanges = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];

    const isProxy = suspiciousRanges.some(range => this.ipInCIDR(ipAddress, range));
    const isVPN = false; // Would check against VPN databases

    return {
      isProxy,
      isVPN,
      country: 'PL', // Would use GeoIP lookup
      risk: isProxy ? 'high' : 'low'
    };
  }

  private async checkLocationConsistency(
    ipAddress: string,
    bookingLocation: string
  ): Promise<{
    matches: boolean;
    ipLocation: string;
    distance: number;
  }> {
    // Mock implementation
    return {
      matches: true,
      ipLocation: 'Warsaw, Poland',
      distance: 0
    };
  }

  private isDuplicateContent(content: string): boolean {
    // Check against existing reviews
    // This is a simplified version
    const commonSpamPhrases = [
      'Great service!!!',
      'Excellent work!!!',
      'Amazing results!!!',
      'Highly recommend!!!'
    ];

    return commonSpamPhrases.some(phrase =>
      content.toLowerCase().includes(phrase.toLowerCase())
    );
  }

  private isGenericContent(text: string): boolean {
    const genericPhrases = [
      'good service',
      'nice experience',
      'was ok',
      'fine service',
      'it was good'
    ];

    const matches = genericPhrases.filter(phrase => text.includes(phrase));
    return matches.length >= 2 && text.length < 30;
  }

  private hasSuspiciousPatterns(text: string): boolean {
    // Check for repeating characters
    if (/(.)\1{4,}/.test(text)) return true;

    // Check for excessive capitalization
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.5 && text.length > 20) return true;

    // Check for excessive exclamation marks
    if (text.split('!').length > 5) return true;

    return false;
  }

  private async getTimeSinceBooking(
    bookingId: string,
    reviewDate: Date
  ): Promise<number | null> {
    const { data: booking } = await supabase
      .from('bookings')
      .select('created_at')
      .eq('id', bookingId)
      .single();

    if (!booking) return null;

    return reviewDate.getTime() - new Date(booking.created_at).getTime();
  }

  private async getDisposableEmailDomains(): Promise<string[]> {
    // Mock implementation - in production, fetch from API
    return [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com'
    ];
  }

  private ipInCIDR(ip: string, cidr: string): boolean {
    // Simplified CIDR check
    return false;
  }

  private calculateConfidence(score: number, flags: string[]): number {
    // Higher confidence with more flags and higher score
    const flagWeight = Math.min(flags.length * 0.1, 0.5);
    const scoreWeight = score;
    return Math.min(scoreWeight + flagWeight, 1);
  }

  private async logFraudDetection(data: {
    review_id?: string;
    fraud_score: number;
    flags: string[];
    details: any;
    should_flag: boolean;
  }): Promise<void> {
    try {
      await supabase
        .from('fraud_detection_logs')
        .insert({
          ...data,
          detected_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging fraud detection:', error);
    }
  }

  // Batch analysis for existing reviews
  async analyzeExistingReviews(limit = 100): Promise<{
    reviewed: number;
    flagged: number;
    results: FraudDetectionResult[];
  }> {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*, profiles(email)')
      .eq('is_fraud_suspected', false)
      .limit(limit);

    if (error || !reviews) {
      return { reviewed: 0, flagged: 0, results: [] };
    }

    const results: FraudDetectionResult[] = [];
    let flagged = 0;

    for (const review of reviews) {
      const analysis = await this.analyzeReview(review, review.profiles);
      results.push(analysis);

      if (analysis.should_flag) {
        flagged++;
        await supabase
          .from('reviews')
          .update({
            is_fraud_suspected: true,
            fraud_score: analysis.fraud_score,
            fraud_flags: analysis.flags
          })
          .eq('id', review.id);
      }
    }

    return {
      reviewed: reviews.length,
      flagged,
      results
    };
  }
}

// Singleton instance
export const fraudDetector = new ReviewFraudDetector({
  ip_analysis: {
    enabled: true,
    max_reviews_per_hour: 3,
    suspicious_ip_ranges: [],
  },
  content_analysis: {
    enabled: true,
    spam_keywords: [
      'click here',
      'buy now',
      'free money',
      'make money fast',
      'guaranteed',
      'winner',
      'congratulations',
      'limited time',
      'act now'
    ],
    duplicate_threshold: 0.8,
  },
  behavior_analysis: {
    enabled: true,
    rating_consistency_check: true,
    timing_pattern_analysis: true,
  },
  auto_flag_threshold: 0.7,
});