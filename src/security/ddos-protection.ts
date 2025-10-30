/**
 * DDoS Protection and Advanced Rate Limiting System
 *
 * Enterprise-grade DDoS protection for Mariia Hub platform
 * with intelligent bot detection and traffic pattern analysis.
 */

import { Context, Next } from 'hono';
import { productionSecurityConfig } from '../config/production-security';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockedUntil?: number;
  lastRequest: number;
  isSuspicious: boolean;
}

interface SuspiciousIP {
  ip: string;
  score: number;
  reasons: string[];
  firstSeen: number;
  lastSeen: number;
  blocked: boolean;
  blockedUntil?: number;
}

interface TrafficPattern {
  windowStart: number;
  requestCount: number;
  uniquePaths: Set<string>;
  suspiciousPatterns: string[];
  averageRequestInterval: number;
}

interface BotDetectionResult {
  isBot: boolean;
  confidence: number;
  botType: 'good' | 'bad' | 'unknown';
  reasons: string[];
}

class DDoSProtection {
  private rateLimits = new Map<string, RateLimitEntry>();
  private suspiciousIPs = new Map<string, SuspiciousIP>();
  private trafficPatterns: TrafficPattern[] = [];
  private emergencyMode = false;
  private emergencyStartTime = 0;
  private readonly config = productionSecurityConfig.ddosProtection;
  private readonly rateLimitConfig = productionSecurityConfig.rateLimiting;

  /**
   * Main DDoS protection middleware
   */
  async middleware(c: Context, next: Next): Promise<void> {
    const ip = this.getClientIP(c);
    const userAgent = c.req.header('User-Agent') || '';
    const path = c.req.path;
    const now = Date.now();

    // Initialize traffic pattern tracking
    this.updateTrafficPattern(now, path);

    // Check if we're in emergency mode
    if (this.emergencyMode && this.shouldStayInEmergencyMode(now)) {
      await this.handleEmergencyMode(c, ip);
      return;
    }

    // Bot detection
    const botDetection = this.detectBot(userAgent, c.req.header());
    if (botDetection.isBot && botDetection.botType === 'bad') {
      await this.handleMaliciousBot(c, ip, botDetection);
      return;
    }

    // Geo-blocking check
    if (this.config.geoBlocking.enabled) {
      const country = await this.getCountryFromIP(ip);
      if (!this.isCountryAllowed(country)) {
        await this.handleGeoBlock(c, ip, country);
        return;
      }
    }

    // IP whitelist/blacklist check
    if (this.config.ipBlacklist.includes(ip)) {
      await this.handleBlacklistedIP(c, ip);
      return;
    }

    if (this.config.ipWhitelist.length > 0 && !this.config.ipWhitelist.includes(ip)) {
      // If whitelist is configured, only allow whitelisted IPs
      await this.handleUnlistedIP(c, ip);
      return;
    }

    // Rate limiting
    const rateLimitResult = this.checkRateLimit(ip, now);
    if (!rateLimitResult.allowed) {
      await this.handleRateLimitExceeded(c, ip, rateLimitResult);
      return;
    }

    // Suspicious activity detection
    const suspiciousCheck = this.checkSuspiciousActivity(ip, c, now);
    if (suspiciousCheck.isSuspicious) {
      await this.handleSuspiciousActivity(c, ip, suspiciousCheck);
      return;
    }

    // Emergency mode activation check
    if (this.shouldActivateEmergencyMode(now)) {
      this.activateEmergencyMode(now);
      await this.handleEmergencyMode(c, ip);
      return;
    }

    // Update rate limit counter
    this.updateRateLimit(ip, now);

    // Add security headers
    this.addSecurityHeaders(c);

    // Continue with request
    await next();

    // Log the request for analysis
    this.logRequest(c, ip, botDetection);
  }

  /**
   * Get client IP address from request
   */
  private getClientIP(c: Context): string {
    return (
      c.req.header('CF-Connecting-IP') || // Cloudflare
      c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
      c.req.header('X-Real-IP') ||
      c.req.header('X-Client-IP') ||
      'unknown'
    );
  }

  /**
   * Advanced bot detection
   */
  private detectBot(userAgent: string, headers: Record<string, string>): BotDetectionResult {
    const reasons: string[] = [];
    let confidence = 0;
    let botType: 'good' | 'bad' | 'unknown' = 'unknown';

    // Known good bots
    const goodBots = [
      'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
      'yandexbot', 'facebookexternalhit', 'twitterbot', 'whatsapp',
      'telegrambot', 'applebot', 'semrushbot'
    ];

    // Known bad bots
    const badBots = [
      'sqlmap', 'nikto', 'nmap', 'dirb', 'gobuster', 'wpscan',
      'nessus', 'openvas', 'burp', 'zap', 'acunetix',
      'masscan', 'zmap', 'shodan', 'censys', 'scrapy'
    ];

    // Check for good bots
    if (goodBots.some(bot => userAgent.toLowerCase().includes(bot))) {
      botType = 'good';
      confidence = 0.8;
      reasons.push('Known good bot detected');
    }

    // Check for bad bots
    if (badBots.some(bot => userAgent.toLowerCase().includes(bot))) {
      botType = 'bad';
      confidence = 0.9;
      reasons.push('Known malicious bot detected');
    }

    // Suspicious patterns
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /harvest/i,
      /miner/i,
      /curl/i,
      /wget/i,
      /python/i,
      /perl/i,
      /java/i,
      /go-http/i,
      /ruby/i,
      /node/i
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      if (botType === 'unknown') {
        botType = 'bad';
        confidence = 0.6;
        reasons.push('Suspicious user agent pattern');
      }
    }

    // Empty or missing user agent
    if (!userAgent || userAgent.length < 10) {
      if (botType === 'unknown') {
        botType = 'bad';
        confidence = 0.4;
        reasons.push('Missing or suspicious user agent');
      }
    }

    // Check for bot-like headers
    const suspiciousHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-cluster-client-ip',
      'x-originating-ip'
    ];

    const headerCount = Object.keys(headers).length;
    if (headerCount < 3) {
      confidence += 0.2;
      reasons.push('Minimal HTTP headers');
    }

    // Check request patterns (if we have history)
    const recentRequests = this.getRecentIPRequests(headers['x-real-ip'] || 'unknown');
    if (recentRequests > 100) {
      confidence += 0.3;
      reasons.push('High request frequency');
    }

    return {
      isBot: confidence > 0.5,
      confidence: Math.min(confidence, 1.0),
      botType,
      reasons
    };
  }

  /**
   * Rate limiting with burst protection
   */
  private checkRateLimit(ip: string, now: number): { allowed: boolean; retryAfter?: number; remaining?: number } {
    const entry = this.rateLimits.get(ip);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired one
      this.rateLimits.set(ip, {
        count: 1,
        resetTime: now + this.rateLimitConfig.windowMs,
        lastRequest: now,
        isSuspicious: false
      });
      return { allowed: true, remaining: this.rateLimitConfig.maxRequests - 1 };
    }

    // Check if IP is temporarily blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
        remaining: 0
      };
    }

    // Check burst limit
    const timeSinceLastRequest = now - entry.lastRequest;
    if (timeSinceLastRequest < 1000 && entry.count >= this.rateLimitConfig.burstLimit) {
      // Burst limit exceeded
      entry.blockedUntil = now + 60000; // Block for 1 minute
      return {
        allowed: false,
        retryAfter: 60,
        remaining: 0
      };
    }

    // Check regular limit
    if (entry.count >= this.rateLimitConfig.maxRequests) {
      return {
        allowed: false,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        remaining: 0
      };
    }

    return {
      allowed: true,
      remaining: this.rateLimitConfig.maxRequests - entry.count
    };
  }

  /**
   * Update rate limit counter
   */
  private updateRateLimit(ip: string, now: number): void {
    const entry = this.rateLimits.get(ip);
    if (entry) {
      entry.count++;
      entry.lastRequest = now;
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  private checkSuspiciousActivity(ip: string, c: Context, now: number): { isSuspicious: boolean; reasons: string[] } {
    const reasons: string[] = [];
    const path = c.req.path;
    const method = c.req.method;

    // Check for suspicious paths
    const suspiciousPaths = [
      '/admin',
      '/wp-admin',
      '/wp-login',
      '/.env',
      '/config',
      '/backup',
      '/database',
      '/phpmyadmin',
      '/test'
    ];

    if (suspiciousPaths.some(suspiciousPath => path.includes(suspiciousPath))) {
      reasons.push(`Access to suspicious path: ${path}`);
    }

    // Check for SQL injection patterns
    const sqlPatterns = [
      /union\s+select/i,
      /select\s+.*\s+from/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /drop\s+table/i,
      /exec\s*\(/i,
      /script\s*>/i
    ];

    if (sqlPatterns.some(pattern => pattern.test(path))) {
      reasons.push('SQL injection pattern detected');
    }

    // Check for XSS patterns
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];

    if (xssPatterns.some(pattern => pattern.test(path))) {
      reasons.push('XSS pattern detected');
    }

    // Check for path traversal
    if (path.includes('../') || path.includes('..\\')) {
      reasons.push('Path traversal attempt detected');
    }

    // Check for excessive request length
    if (path.length > 1000) {
      reasons.push('Excessively long URL');
    }

    // Check for rapid requests from same IP
    const recentRequests = this.getRecentIPRequests(ip);
    if (recentRequests > 50) {
      reasons.push('Rapid requests from IP');
    }

    // Check user agent anomalies
    const userAgent = c.req.header('User-Agent') || '';
    if (!userAgent || userAgent.length < 10) {
      reasons.push('Missing or short user agent');
    }

    // Check for unusual HTTP methods
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    if (!allowedMethods.includes(method)) {
      reasons.push(`Unusual HTTP method: ${method}`);
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons
    };
  }

  /**
   * Traffic pattern analysis
   */
  private updateTrafficPattern(now: number, path: string): void {
    // Remove old patterns (older than 1 hour)
    const oneHourAgo = now - 3600000;
    this.trafficPatterns = this.trafficPatterns.filter(pattern => pattern.windowStart > oneHourAgo);

    // Find current pattern window
    let currentPattern = this.trafficPatterns.find(pattern =>
      pattern.windowStart > now - 60000 // Last minute
    );

    if (!currentPattern) {
      currentPattern = {
        windowStart: now,
        requestCount: 0,
        uniquePaths: new Set(),
        suspiciousPatterns: [],
        averageRequestInterval: 0
      };
      this.trafficPatterns.push(currentPattern);
    }

    currentPattern.requestCount++;
    currentPattern.uniquePaths.add(path);

    // Analyze for suspicious patterns
    if (currentPattern.requestCount > 1000) {
      currentPattern.suspiciousPatterns.push('High request volume');
    }

    if (currentPattern.uniquePaths.size > 100) {
      currentPattern.suspiciousPatterns.push('High path diversity (possible scraping)');
    }
  }

  /**
   * Emergency mode management
   */
  private shouldActivateEmergencyMode(now: number): boolean {
    if (this.emergencyMode) return false;

    // Check if we've exceeded thresholds
    const recentPatterns = this.trafficPatterns.filter(pattern =>
      pattern.windowStart > now - 300000 // Last 5 minutes
    );

    const totalRequests = recentPatterns.reduce((sum, pattern) => sum + pattern.requestCount, 0);
    const suspiciousPatternCount = recentPatterns.reduce((sum, pattern) =>
      sum + pattern.suspiciousPatterns.length, 0
    );

    return totalRequests > 10000 || suspiciousPatternCount > 10;
  }

  private activateEmergencyMode(now: number): void {
    this.emergencyMode = true;
    this.emergencyStartTime = now;
    console.warn('DDoS protection: Emergency mode activated');
  }

  private shouldStayInEmergencyMode(now: number): boolean {
    // Stay in emergency mode for at least 5 minutes
    const minDuration = 300000;
    return (now - this.emergencyStartTime) < minDuration;
  }

  // Response handlers
  private async handleMaliciousBot(c: Context, ip: string, detection: BotDetection): Promise<void> {
    console.warn(`Malicious bot blocked: ${ip}, type: ${detection.botType}, reasons: ${detection.reasons.join(', ')}`);
    c.status(403);
    c.json({
      error: 'Access Denied',
      message: 'Automated access is not permitted',
      code: 'BOT_DETECTED'
    });
  }

  private async handleRateLimitExceeded(c: Context, ip: string, result: any): Promise<void> {
    c.header('Retry-After', result.retryAfter?.toString());
    c.status(429);
    c.json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: result.retryAfter,
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }

  private async handleSuspiciousActivity(c: Context, ip: string, check: any): Promise<void> {
    console.warn(`Suspicious activity from ${ip}: ${check.reasons.join(', ')}`);

    // Block suspicious IPs for a short duration
    const entry = this.rateLimits.get(ip);
    if (entry) {
      entry.blockedUntil = Date.now() + 300000; // 5 minutes
      entry.isSuspicious = true;
    }

    c.status(403);
    c.json({
      error: 'Access Denied',
      message: 'Suspicious activity detected',
      code: 'SUSPICIOUS_ACTIVITY'
    });
  }

  private async handleEmergencyMode(c: Context, ip: string): Promise<void> {
    c.header('Retry-After', '300');
    c.status(503);
    c.json({
      error: 'Service Temporarily Unavailable',
      message: 'The service is experiencing high traffic. Please try again later.',
      code: 'EMERGENCY_MODE'
    });
  }

  private async handleGeoBlock(c: Context, ip: string, country: string): Promise<void> {
    console.warn(`Geo-blocked request from ${ip}, country: ${country}`);
    c.status(403);
    c.json({
      error: 'Access Denied',
      message: 'Access from your location is not permitted',
      code: 'GEO_BLOCKED'
    });
  }

  private async handleBlacklistedIP(c: Context, ip: string): Promise<void> {
    console.warn(`Blacklisted IP attempted access: ${ip}`);
    c.status(403);
    c.json({
      error: 'Access Denied',
      message: 'Your IP address has been blocked',
      code: 'IP_BLOCKED'
    });
  }

  private async handleUnlistedIP(c: Context, ip: string): Promise<void> {
    console.warn(`Unlisted IP attempted access: ${ip}`);
    c.status(403);
    c.json({
      error: 'Access Denied',
      message: 'Access is restricted to authorized IPs only',
      code: 'IP_NOT_AUTHORIZED'
    });
  }

  // Helper methods
  private addSecurityHeaders(c: Context): void {
    c.header('X-DDoS-Protection', 'active');
    c.header('X-RateLimit-Limit', this.rateLimitConfig.maxRequests.toString());
    c.header('X-RateLimit-Window', (this.rateLimitConfig.windowMs / 1000).toString());
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
  }

  private getRecentIPRequests(ip: string): number {
    const entry = this.rateLimits.get(ip);
    return entry ? entry.count : 0;
  }

  private async getCountryFromIP(ip: string): Promise<string> {
    // In production, this would use a GeoIP database or service
    // For now, return a default
    return 'PL';
  }

  private isCountryAllowed(country: string): boolean {
    const { allowedCountries, blockedCountries } = this.config.geoBlocking;

    if (blockedCountries.includes(country)) {
      return false;
    }

    if (allowedCountries.length > 0) {
      return allowedCountries.includes(country);
    }

    return true;
  }

  private logRequest(c: Context, ip: string, botDetection: BotDetectionResult): void {
    if (botDetection.isBot || this.rateLimits.get(ip)?.isSuspicious) {
      console.log('Security log:', {
        ip,
        method: c.req.method,
        path: c.req.path,
        userAgent: c.req.header('User-Agent'),
        isBot: botDetection.isBot,
        botType: botDetection.botType,
        botConfidence: botDetection.confidence,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Cleanup and maintenance
  public cleanup(): void {
    const now = Date.now();

    // Clean expired rate limit entries
    for (const [ip, entry] of this.rateLimits.entries()) {
      if (now > entry.resetTime && (!entry.blockedUntil || now > entry.blockedUntil)) {
        this.rateLimits.delete(ip);
      }
    }

    // Clean old traffic patterns
    const oneHourAgo = now - 3600000;
    this.trafficPatterns = this.trafficPatterns.filter(pattern => pattern.windowStart > oneHourAgo);

    // Reset emergency mode if needed
    if (this.emergencyMode && !this.shouldStayInEmergencyMode(now)) {
      this.emergencyMode = false;
      console.info('DDoS protection: Emergency mode deactivated');
    }
  }
}

// Singleton instance
const ddosProtection = new DDoSProtection();

// Export middleware
export const ddosProtectionMiddleware = ddosProtection.middleware.bind(ddosProtection);

// Export class for advanced usage
export { DDoSProtection };

// Cleanup task
setInterval(() => {
  ddosProtection.cleanup();
}, 60000); // Clean up every minute