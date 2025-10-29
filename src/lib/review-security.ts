import { supabase } from '@/integrations/supabase/client';
import { ReviewFormData } from '@/types/review';
import { getEnvVar } from '@/lib/runtime-env';

interface RateLimitEntry {
  ip: string;
  count: number;
  windowStart: number;
  blocked: boolean;
}

interface CaptchaVerification {
  success: boolean;
  challenge_ts: string;
  hostname: string;
}

export class ReviewSecurityService {
  private static rateLimitMap = new Map<string, RateLimitEntry>();
  private static readonly RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
  private static readonly MAX_REVIEWS_PER_WINDOW = 3;
  private static readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  static {
    // Clean up old rate limit entries periodically
    setInterval(() => {
      this.cleanupRateLimit();
    }, this.CLEANUP_INTERVAL);
  }

  // Rate Limiting
  static async checkRateLimit(ipAddress: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const now = Date.now();
    const entry = this.rateLimitMap.get(ipAddress);

    if (!entry) {
      this.rateLimitMap.set(ipAddress, {
        ip: ipAddress,
        count: 1,
        windowStart: now,
        blocked: false
      });
      return {
        allowed: true,
        remaining: this.MAX_REVIEWS_PER_WINDOW - 1,
        resetTime: now + this.RATE_LIMIT_WINDOW
      };
    }

    // Reset window if expired
    if (now - entry.windowStart > this.RATE_LIMIT_WINDOW) {
      entry.count = 1;
      entry.windowStart = now;
      entry.blocked = false;
      return {
        allowed: true,
        remaining: this.MAX_REVIEWS_PER_WINDOW - 1,
        resetTime: now + this.RATE_LIMIT_WINDOW
      };
    }

    // Check if blocked
    if (entry.blocked || entry.count >= this.MAX_REVIEWS_PER_WINDOW) {
      entry.blocked = true;
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.windowStart + this.RATE_LIMIT_WINDOW
      };
    }

    // Increment count
    entry.count++;
    return {
      allowed: true,
      remaining: this.MAX_REVIEWS_PER_WINDOW - entry.count,
      resetTime: entry.windowStart + this.RATE_LIMIT_WINDOW
    };
  }

  private static cleanupRateLimit(): void {
    const now = Date.now();
    for (const [ip, entry] of this.rateLimitMap.entries()) {
      if (now - entry.windowStart > this.RATE_LIMIT_WINDOW * 2) {
        this.rateLimitMap.delete(ip);
      }
    }
  }

  // CAPTCHA Verification
  static async verifyCaptcha(token: string, ipAddress: string): Promise<CaptchaVerification> {
    const recaptchaSecret = getEnvVar('RECAPTCHA_SECRET_KEY', ['VITE_RECAPTCHA_SECRET_KEY']);

    if (!recaptchaSecret) {
      // In development, bypass CAPTCHA
      return {
        success: true,
        challenge_ts: new Date().toISOString(),
        hostname: 'localhost'
      };
    }

    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${recaptchaSecret}&response=${token}&remoteip=${ipAddress}`,
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('CAPTCHA verification failed:', error);
      // Fail safe - allow if CAPTCHA service is down
      return {
        success: true,
        challenge_ts: new Date().toISOString(),
        hostname: 'unknown'
      };
    }
  }

  // Input Validation and Sanitization
  static validateAndSanitizeReview(reviewData: ReviewFormData): {
    valid: boolean;
    errors: string[];
    sanitized: ReviewFormData;
  } {
    const errors: string[] = [];
    const sanitized = { ...reviewData };

    // Validate rating
    if (!sanitized.rating || sanitized.rating < 1 || sanitized.rating > 5) {
      errors.push('Rating must be between 1 and 5');
    }

    // Validate title
    if (sanitized.title) {
      if (sanitized.title.length > 100) {
        errors.push('Title must be less than 100 characters');
      }
      // Sanitize title
      sanitized.title = this.sanitizeText(sanitized.title);
    }

    // Validate comment
    if (sanitized.comment) {
      if (sanitized.comment.length < 10) {
        errors.push('Review must be at least 10 characters long');
      }
      if (sanitized.comment.length > 2000) {
        errors.push('Review must be less than 2000 characters');
      }
      // Sanitize comment
      sanitized.comment = this.sanitizeText(sanitized.comment);
    }

    // Validate photos
    if (sanitized.photos && sanitized.photos.length > 0) {
      if (sanitized.photos.length > 5) {
        errors.push('Maximum 5 photos allowed');
      }

      // Validate each photo
      const validPhotos: File[] = [];
      for (const photo of sanitized.photos) {
        const validation = this.validateFile(photo, ['image/jpeg', 'image/png', 'image/webp'], 5 * 1024 * 1024);
        if (validation.valid) {
          validPhotos.push(photo);
        } else {
          errors.push(`Photo ${photo.name}: ${validation.error}`);
        }
      }
      sanitized.photos = validPhotos;
    }

    // Validate videos
    if (sanitized.videos && sanitized.videos.length > 0) {
      if (sanitized.videos.length > 2) {
        errors.push('Maximum 2 videos allowed');
      }

      // Validate each video
      const validVideos: File[] = [];
      for (const video of sanitized.videos) {
        const validation = this.validateFile(video, ['video/mp4', 'video/webm'], 50 * 1024 * 1024);
        if (validation.valid) {
          validVideos.push(video);
        } else {
          errors.push(`Video ${video.name}: ${validation.error}`);
        }
      }
      sanitized.videos = validVideos;
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized
    };
  }

  private static sanitizeText(text: string): string {
    return text
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Trim
      .trim();
  }

  private static validateFile(
    file: File,
    allowedTypes: string[],
    maxSize: number
  ): { valid: boolean; error?: string } {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`
      };
    }

    return { valid: true };
  }

  // Review Submission Security Check
  static async performSecurityChecks(
    reviewData: ReviewFormData,
    ipAddress: string,
    userAgent: string,
    captchaToken?: string
  ): Promise<{
    allowed: boolean;
    reasons: string[];
    riskScore: number;
  }> {
    const reasons: string[] = [];
    let riskScore = 0;

    // 1. Rate Limiting
    const rateLimit = await this.checkRateLimit(ipAddress);
    if (!rateLimit.allowed) {
      reasons.push('Rate limit exceeded');
      riskScore += 0.8;
    }

    // 2. CAPTCHA Verification
    if (captchaToken) {
      const captchaResult = await this.verifyCaptcha(captchaToken, ipAddress);
      if (!captchaResult.success) {
        reasons.push('CAPTCHA verification failed');
        riskScore += 0.9;
      }
    } else if (import.meta.env.PROD) {
      reasons.push('CAPTCHA token required');
      riskScore += 0.7;
    }

    // 3. Input Validation
    const validation = this.validateAndSanitizeReview(reviewData);
    if (!validation.valid) {
      reasons.push('Invalid input: ' + validation.errors.join(', '));
      riskScore += 0.5;
    }

    // 4. User-Agent Analysis
    if (this.isSuspiciousUserAgent(userAgent)) {
      reasons.push('Suspicious user agent');
      riskScore += 0.3;
    }

    // 5. IP Reputation
    const ipReputation = await this.checkIPReputation(ipAddress);
    if (ipReputation.suspicious) {
      reasons.push('Suspicious IP address');
      riskScore += 0.6;
    }

    // 6. Review Pattern Analysis
    const patternAnalysis = await this.analyzeSubmissionPattern(
      reviewData,
      ipAddress
    );
    if (patternAnalysis.suspicious) {
      reasons.push(...patternAnalysis.reasons);
      riskScore += patternAnalysis.riskScore;
    }

    // Determine if submission should be blocked
    const allowed = riskScore < 0.7 && validation.valid && rateLimit.allowed;

    // Log security check
    await this.logSecurityCheck({
      ipAddress,
      userAgent,
      riskScore,
      reasons,
      allowed,
      reviewData: validation.sanitized
    });

    return {
      allowed,
      reasons,
      riskScore
    };
  }

  private static isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /headless/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  private static async checkIPReputation(ipAddress: string): Promise<{
    suspicious: boolean;
    details: any;
  }> {
    // Mock implementation - in production, use IP intelligence service
    const knownBadIPs = ['192.168.1.100', '10.0.0.50']; // Example
    const isKnownBad = knownBadIPs.includes(ipAddress);

    return {
      suspicious: isKnownBad,
      details: {
        knownBad: isKnownBad,
        country: 'PL',
        proxy: false,
        vpn: false
      }
    };
  }

  private static async analyzeSubmissionPattern(
    reviewData: ReviewFormData,
    ipAddress: string
  ): Promise<{
    suspicious: boolean;
    reasons: string[];
    riskScore: number;
  }> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check for similar reviews from same IP
    const { data: recentReviews } = await supabase
      .from('reviews')
      .select('comment, rating, created_at')
      .eq('ip_address', ipAddress)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (recentReviews && recentReviews.length > 0) {
      // Check for duplicate content
      const duplicate = recentReviews.some(r =>
        r.comment === reviewData.comment
      );
      if (duplicate) {
        reasons.push('Duplicate review from same IP');
        riskScore += 0.8;
      }

      // Check for identical ratings
      const identicalRatings = recentReviews.filter(r =>
        r.rating === reviewData.rating
      ).length;
      if (identicalRatings >= 3) {
        reasons.push('Identical ratings pattern');
        riskScore += 0.4;
      }
    }

    return {
      suspicious: reasons.length > 0,
      reasons,
      riskScore
    };
  }

  private static async logSecurityCheck(data: {
    ipAddress: string;
    userAgent: string;
    riskScore: number;
    reasons: string[];
    allowed: boolean;
    reviewData: ReviewFormData;
  }): Promise<void> {
    try {
      await supabase
        .from('review_security_logs')
        .insert({
          ip_address: data.ipAddress,
          user_agent: data.userAgent,
          risk_score: data.riskScore,
          reasons: data.reasons,
          allowed: data.allowed,
          review_preview: {
            rating: data.reviewData.rating,
            title_length: data.reviewData.title?.length || 0,
            comment_length: data.reviewData.comment?.length || 0,
            photo_count: data.reviewData.photos?.length || 0,
            video_count: data.reviewData.videos?.length || 0
          },
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging security check:', error);
    }
  }

  // Get security statistics
  static async getSecurityStats(timeframe: string = '24h'): Promise<{
    totalAttempts: number;
    blockedAttempts: number;
    topReasons: Array<{ reason: string; count: number }>;
    averageRiskScore: number;
  }> {
    const since = new Date();
    switch (timeframe) {
      case '1h':
        since.setHours(since.getHours() - 1);
        break;
      case '24h':
        since.setDate(since.getDate() - 1);
        break;
      case '7d':
        since.setDate(since.getDate() - 7);
        break;
      case '30d':
        since.setDate(since.getDate() - 30);
        break;
    }

    const { data, error } = await supabase
      .from('review_security_logs')
      .select('*')
      .gte('created_at', since.toISOString());

    if (error || !data) {
      return {
        totalAttempts: 0,
        blockedAttempts: 0,
        topReasons: [],
        averageRiskScore: 0
      };
    }

    const totalAttempts = data.length;
    const blockedAttempts = data.filter(d => !d.allowed).length;
    const averageRiskScore = data.reduce((sum, d) => sum + d.risk_score, 0) / totalAttempts;

    // Count reasons
    const reasonCounts: Record<string, number> = {};
    data.forEach(d => {
      d.reasons.forEach(reason => {
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      });
    });

    const topReasons = Object.entries(reasonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));

    return {
      totalAttempts,
      blockedAttempts,
      topReasons,
      averageRiskScore
    };
  }
}

// Export as default for easier import
export default ReviewSecurityService;
