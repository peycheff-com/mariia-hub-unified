import {
  ApiResponse,
  ListParams
} from './common';

/**
 * Extended user interface for API users
 */
export interface ApiUser {
  id: string;
  email: string;
  emailVerified: boolean;
  profile: UserProfile;
  businessProfile?: BusinessProfile;
  preferences: UserPreferences;
  membership: UserMembership;
  statistics: UserStatistics;
  permissions: UserPermission[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

/**
 * User profile
 */
export interface UserProfile {
  firstName: string;
  lastName: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  address?: any; // PolishAddress from common types
  website?: string;
  socialLinks?: SocialLink[];
}

/**
 * Social link
 */
export interface SocialLink {
  platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'youtube' | 'tiktok';
  url: string;
  verified?: boolean;
}

/**
 * Business profile
 */
export interface BusinessProfile {
  companyName: string;
  nip?: string;
  industry?: string;
  companySize?: 'micro' | 'small' | 'medium' | 'large';
  website?: string;
  description?: string;
  logo?: string;
  verified?: boolean;
  verificationDate?: string;
}

/**
 * User preferences
 */
export interface UserPreferences {
  language: 'pl' | 'en' | 'de' | 'fr';
  currency: 'PLN' | 'EUR' | 'USD' | 'GBP';
  timezone: string;
  notifications: NotificationPreferences;
  marketing: MarketingPreferences;
  privacy: PrivacyPreferences;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  whatsapp?: boolean;
  bookingReminders: boolean;
  paymentNotifications: boolean;
  marketingEmails: boolean;
  newsletter: boolean;
}

/**
 * Marketing preferences
 */
export interface MarketingPreferences {
  emailMarketing: boolean;
  smsMarketing: boolean;
  personalizedOffers: boolean;
  recommendations: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'never';
}

/**
 * Privacy preferences
 */
export interface PrivacyPreferences {
  profileVisibility: 'public' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  allowTagging: boolean;
  allowSearch: boolean;
  dataAnalytics: boolean;
}

/**
 * User membership
 */
export interface UserMembership {
  tier: 'basic' | 'silver' | 'gold' | 'platinum' | 'vip';
  points: number;
  level: number;
  benefits: string[];
  nextLevel?: string;
  pointsToNextLevel?: number;
  joinDate: string;
  upgradeDate?: string;
}

/**
 * User statistics
 */
export interface UserStatistics {
  totalBookings: number;
  totalSpent: number;
  averageBookingValue: number;
  favoriteServices: string[];
  bookingFrequency: number;
  lastBookingDate?: string;
  referralCount: number;
  reviewCount: number;
  averageRating: number;
}

/**
 * User permission
 */
export interface UserPermission {
  resource: string;
  action: string;
  scope?: string;
  grantedAt: string;
  expiresAt?: string;
}

/**
 * User search filters
 */
export interface UserSearchFilters {
  email?: string;
  name?: string;
  membershipTier?: string;
  status?: 'active' | 'inactive' | 'suspended';
  businessAccount?: boolean;
  verified?: boolean;
  dateFrom?: string;
  dateTo?: string;
  minBookings?: number;
  maxBookings?: number;
}

/**
 * Create user request
 */
export interface CreateUserRequest {
  email: string;
  password: string;
  profile: UserProfile;
  preferences?: Partial<UserPreferences>;
  businessProfile?: BusinessProfile;
  metadata?: Record<string, any>;
}

/**
 * Update user request
 */
export interface UpdateUserRequest {
  profile?: Partial<UserProfile>;
  businessProfile?: Partial<BusinessProfile>;
  preferences?: Partial<UserPreferences>;
  metadata?: Record<string, any>;
}

/**
 * Users API interface
 */
export interface UsersApi {
  /**
   * Get current user
   */
  getCurrentUser(): Promise<ApiResponse<ApiUser>>;

  /**
   * Update current user
   */
  updateCurrentUser(request: UpdateUserRequest): Promise<ApiResponse<ApiUser>>;

  /**
   * Delete current user account
   */
  deleteCurrentUser(password: string): Promise<ApiResponse<void>>;

  /**
   * Get user by ID (admin only)
   */
  getUser(id: string): Promise<ApiResponse<ApiUser>>;

  /**
   * List users (admin only)
   */
  listUsers(params?: ListUsersParams): Promise<ApiResponse<ApiUser[]>>;

  /**
   * Search users (admin only)
   */
  searchUsers(query: string, filters?: UserSearchFilters, params?: ListParams): Promise<ApiResponse<ApiUser[]>>;

  /**
   * Create user (admin only)
   */
  createUser(request: CreateUserRequest): Promise<ApiResponse<ApiUser>>;

  /**
   * Update user (admin only)
   */
  updateUser(id: string, request: UpdateUserRequest): Promise<ApiResponse<ApiUser>>;

  /**
   * Delete user (admin only)
   */
  deleteUser(id: string, reason?: string): Promise<ApiResponse<void>>;

  /**
   * Update user status (admin only)
   */
  updateUserStatus(id: string, status: string, reason?: string): Promise<ApiResponse<ApiUser>>;

  /**
   * Get user permissions
   */
  getUserPermissions(): Promise<ApiResponse<UserPermission[]>>;

  /**
   * Update user preferences
   */
  updatePreferences(preferences: Partial<UserPreferences>): Promise<ApiResponse<UserPreferences>>;

  /**
   * Upload user avatar
   */
  uploadAvatar(file: File): Promise<ApiResponse<string>>;

  /**
   * Delete user avatar
   */
  deleteAvatar(): Promise<ApiResponse<void>>;

  /**
   * Export user data (GDPR)
   */
  exportUserData(): Promise<ApiResponse<any>>;

  /**
   * Anonymize user data (GDPR)
   */
  anonymizeUserData(): Promise<ApiResponse<void>>;

  /**
   * Get user activity log
   */
  getActivityLog(params?: ListParams): Promise<ApiResponse<UserActivity[]>>;

  /**
   * Get user analytics
   */
  getAnalytics(params?: UserAnalyticsParams): Promise<ApiResponse<UserAnalytics>>;
}

/**
 * List users parameters
 */
export interface ListUsersParams extends ListParams {
  membershipTier?: string;
  status?: string;
  businessAccount?: boolean;
  verified?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * User activity
 */
export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * User analytics parameters
 */
export interface UserAnalyticsParams {
  dateFrom: string;
  dateTo: string;
  groupBy?: 'day' | 'week' | 'month' | 'membership_tier';
  includeBusinessMetrics?: boolean;
}

/**
 * User analytics
 */
export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  churnedUsers: number;
  retentionRate: number;
  averageSessionDuration: number;
  usersByMembershipTier: Record<string, number>;
  userGrowth: UserGrowthData[];
  userEngagement: UserEngagementMetrics;
  businessUserMetrics?: BusinessUserMetrics;
}

/**
 * User growth data
 */
export interface UserGrowthData {
  date: string;
  newUsers: number;
  activeUsers: number;
  totalUsers: number;
}

/**
 * User engagement metrics
 */
export interface UserEngagementMetrics {
  averageBookingsPerUser: number;
  averageSpentPerUser: number;
  averageSessionDuration: number;
  bounceRate: number;
  retentionRate: number;
  churnRate: number;
}

/**
 * Business user metrics
 */
export interface BusinessUserMetrics {
  totalBusinessUsers: number;
  verifiedBusinessUsers: number;
  averageRevenuePerBusinessUser: number;
  businessUserGrowthRate: number;
  topIndustries: IndustryMetric[];
}

/**
 * Industry metric
 */
export interface IndustryMetric {
  industry: string;
  count: number;
  revenue: number;
  growth: number;
}