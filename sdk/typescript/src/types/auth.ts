import {
  ApiResponse,
  PolishAddress,
  PolishPhoneNumber,
  NIP,
  ConsentTypes,
  NotificationPreferences
} from './common';

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  phone?: PolishPhoneNumber;
  phoneVerified: boolean;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';

  // Profile information
  bio?: string;
  website?: string;
  socialLinks?: SocialLink[];
  interests?: string[];
  preferences: UserPreferences;

  // Address information (Polish format)
  address?: PolishAddress;
  billingAddress?: PolishAddress;

  // Business information (for business accounts)
  businessInfo?: BusinessInfo;

  // Language and localization
  language: 'pl' | 'en' | 'de' | 'fr';
  timezone: string;
  currency: 'PLN' | 'EUR' | 'USD' | 'GBP';

  // Membership and loyalty
  membershipTier: MembershipTier;
  loyaltyPoints: number;
  loyaltyLevel: LoyaltyLevel;
  referralCode?: string;
  referredBy?: string;
  referralCount: number;

  // Privacy and consent
  consents: ConsentTypes;
  privacySettings: PrivacySettings;
  marketingPreferences: MarketingPreferences;
  notificationPreferences: NotificationPreferences;

  // Account status and roles
  status: UserStatus;
  roles: UserRole[];
  permissions: string[];

  // Authentication
  lastLoginAt?: string;
  loginCount: number;
  twoFactorEnabled: boolean;
  passwordChangedAt?: string;
  emailVerifiedAt?: string;
  phoneVerifiedAt?: string;

  // Polish market specific
  polishPreferences: PolishUserPreferences;
  polishBusinessVerification?: PolishBusinessVerification;

  // Metadata
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
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
 * User preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'pl' | 'en' | 'de' | 'fr';
  timezone: string;
  currency: 'PLN' | 'EUR' | 'USD' | 'GBP';
  dateFormat: string;
  timeFormat: '12h' | '24h';
  weekStart: 'sunday' | 'monday';
  measurementUnits: 'metric' | 'imperial';
}

/**
 * Business information
 */
export interface BusinessInfo {
  companyName: string;
  nip?: NIP;
  regon?: string;
  krs?: string;
  industry?: string;
  companySize?: 'micro' | 'small' | 'medium' | 'large';
  businessType?: 'sole_proprietorship' | 'llc' | 'corporation' | 'partnership';
}

/**
 * Membership tier
 */
export type MembershipTier = 'basic' | 'silver' | 'gold' | 'platinum' | 'vip';

/**
 * Loyalty level
 */
export interface LoyaltyLevel {
  level: string;
  points: number;
  nextLevel?: string;
  pointsToNextLevel?: number;
  benefits: string[];
}

/**
 * Privacy settings
 */
export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  showAddress: boolean;
  allowTagging: boolean;
  allowSearch: boolean;
  allowDataAnalytics: boolean;
  allowPersonalization: boolean;
}

/**
 * Marketing preferences
 */
export interface MarketingPreferences {
  emailMarketing: boolean;
  smsMarketing: boolean;
  pushNotifications: boolean;
  whatsappMarketing: boolean;
  socialMediaMarketing: boolean;
  thirdPartyMarketing: boolean;
  personalizedOffers: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'never';
}

/**
 * Polish user preferences
 */
export interface PolishUserPreferences {
  preferPolishContent: boolean;
  polishCurrencyFirst: boolean;
  polishTimeFormat: boolean;
  polishDateFormat: boolean;
  polishHolidays: boolean;
  polishBusinessHours: boolean;
  polishPaymentMethods: boolean;
  polishLanguageSupport: boolean;
}

/**
 * Polish business verification
 */
export interface PolishBusinessVerification {
  verified: boolean;
  verifiedAt?: string;
  verificationMethod: 'nip' | 'regon' | 'krs' | 'documents';
  verificationDocuments: VerificationDocument[];
  businessType: 'sole_proprietorship' | 'company';
  vatPayer: boolean;
  vatCertificateUrl?: string;
  registrationCertificateUrl?: string;
}

/**
 * Verification document
 */
export interface VerificationDocument {
  type: string;
  typePl: string;
  url: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

/**
 * User status
 */
export type UserStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'pending_verification'
  | 'restricted'
  | 'deleted';

/**
 * User role
 */
export type UserRole =
  | 'customer'
  | 'business'
  | 'admin'
  | 'super_admin'
  | 'staff'
  | 'moderator'
  | 'analyst';

/**
 * Authentication request
 */
export interface AuthRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: DeviceInfo;
}

/**
 * Device information
 */
export interface DeviceInfo {
  userAgent: string;
  platform: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  device?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  scope?: string;
}

/**
 * Registration request
 */
export interface RegistrationRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: PolishPhoneNumber;
  dateOfBirth?: string;
  language?: 'pl' | 'en';
  consents: ConsentTypes;
  businessInfo?: BusinessInfo;
  referralCode?: string;
  marketingPreferences?: MarketingPreferences;
  polishPreferences?: PolishUserPreferences;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
  language?: 'pl' | 'en';
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirmation {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Update profile request
 */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  phone?: PolishPhoneNumber;
  address?: PolishAddress;
  billingAddress?: PolishAddress;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  website?: string;
  socialLinks?: SocialLink[];
  interests?: string[];
  preferences?: Partial<UserPreferences>;
  polishPreferences?: Partial<PolishUserPreferences>;
}

/**
 * Update consents request
 */
export interface UpdateConsentsRequest {
  consents: Partial<ConsentTypes>;
  marketingPreferences?: Partial<MarketingPreferences>;
  notificationPreferences?: Partial<NotificationPreferences>;
}

/**
 * Email verification request
 */
export interface EmailVerificationRequest {
  token: string;
}

/**
 * Phone verification request
 */
export interface PhoneVerificationRequest {
  phone: PolishPhoneNumber;
  language?: 'pl' | 'en';
}

/**
 * Phone verification confirmation
 */
export interface PhoneVerificationConfirmation {
  phone: PolishPhoneNumber;
  code: string;
}

/**
 * Two-factor authentication setup
 */
export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

/**
 * Two-factor authentication verification
 */
export interface TwoFactorVerification {
  code: string;
  backupCode?: string;
}

/**
 * Session interface
 */
export interface Session {
  id: string;
  userId: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  location?: Geolocation;
  isActive: boolean;
  lastAccessAt: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * Geolocation
 */
export interface Geolocation {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

/**
 * User analytics
 */
export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  retentionRate: number;
  churnRate: number;
  averageSessionDuration: number;
  usersByRole: Record<UserRole, number>;
  usersByStatus: Record<UserStatus, number>;
  usersByLanguage: Record<string, number>;
  usersByCountry: Record<string, number>;
  registrationByMonth: MonthlyRegistrations[];
  loginActivity: LoginActivity[];
  polishMarketMetrics: PolishUserMetrics;
}

/**
 * Monthly registrations
 */
export interface MonthlyRegistrations {
  month: string;
  registrations: number;
  language?: string;
  source?: string;
}

/**
 * Login activity
 */
export interface LoginActivity {
  date: string;
  logins: number;
  uniqueUsers: number;
  bounceRate: number;
  averageSessionDuration: number;
}

/**
 * Polish user metrics
 */
export interface PolishUserMetrics {
  polishUsers: number;
  polishLanguageUsers: number;
  polishBusinessAccounts: number;
  polishVerifiedBusinesses: number;
  polishRegistrationRate: number;
  polishRetentionRate: number;
  polishUsersByVoivodeship: Record<string, number>;
  polishUsersByCity: Record<string, number>;
}

/**
 * OAuth provider
 */
export type OAuthProvider = 'google' | 'facebook' | 'apple' | 'microsoft';

/**
 * OAuth authentication request
 */
export interface OAuthAuthRequest {
  provider: OAuthProvider;
  code?: string;
  state?: string;
  redirectUri?: string;
  accessToken?: string;
  idToken?: string;
}

/**
 * OAuth response
 */
export interface OAuthResponse {
  user: User;
  authResponse: AuthResponse;
  provider: OAuthProvider;
  isNewUser: boolean;
}

/**
 * API key interface
 */
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  scopes: string[];
  isActive: boolean;
  expiresAt?: string;
  lastUsedAt?: string;
  usageCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create API key request
 */
export interface CreateApiKeyRequest {
  name: string;
  permissions: string[];
  scopes: string[];
  expiresAt?: string;
}

/**
 * Update API key request
 */
export interface UpdateApiKeyRequest {
  name?: string;
  permissions?: string[];
  scopes?: string[];
  isActive?: boolean;
  expiresAt?: string;
}

/**
 * Auth API interface
 */
export interface AuthApi {
  /**
   * Authenticate user
   */
  login(request: AuthRequest): Promise<ApiResponse<AuthResponse>>;

  /**
   * Register new user
   */
  register(request: RegistrationRequest): Promise<ApiResponse<AuthResponse>>;

  /**
   * Logout user
   */
  logout(): Promise<ApiResponse<void>>;

  /**
   * Refresh access token
   */
  refreshToken(refreshToken: string): Promise<ApiResponse<AuthResponse>>;

  /**
   * Get current user
   */
  getCurrentUser(): Promise<ApiResponse<User>>;

  /**
   * Update user profile
   */
  updateProfile(request: UpdateProfileRequest): Promise<ApiResponse<User>>;

  /**
   * Change password
   */
  changePassword(request: ChangePasswordRequest): Promise<ApiResponse<void>>;

  /**
   * Request password reset
   */
  requestPasswordReset(request: PasswordResetRequest): Promise<ApiResponse<void>>;

  /**
   * Confirm password reset
   */
  confirmPasswordReset(request: PasswordResetConfirmation): Promise<ApiResponse<void>>;

  /**
   * Verify email
   */
  verifyEmail(request: EmailVerificationRequest): Promise<ApiResponse<void>>;

  /**
   * Resend email verification
   */
  resendEmailVerification(): Promise<ApiResponse<void>>;

  /**
   * Request phone verification
   */
  requestPhoneVerification(request: PhoneVerificationRequest): Promise<ApiResponse<void>>;

  /**
   * Confirm phone verification
   */
  confirmPhoneVerification(request: PhoneVerificationConfirmation): Promise<ApiResponse<void>>;

  /**
   * Setup two-factor authentication
   */
  setupTwoFactor(): Promise<ApiResponse<TwoFactorSetup>>;

  /**
   * Verify two-factor authentication
   */
  verifyTwoFactor(request: TwoFactorVerification): Promise<ApiResponse<void>>;

  /**
   * Disable two-factor authentication
   */
  disableTwoFactor(request: TwoFactorVerification): Promise<ApiResponse<void>>;

  /**
   * Update consents and preferences
   */
  updateConsents(request: UpdateConsentsRequest): Promise<ApiResponse<User>>;

  /**
   * Get user sessions
   */
  getSessions(): Promise<ApiResponse<Session[]>>;

  /**
   * Revoke session
   */
  revokeSession(sessionId: string): Promise<ApiResponse<void>>;

  /**
   * Revoke all sessions except current
   */
  revokeAllOtherSessions(): Promise<ApiResponse<void>>;

  /**
   * Delete user account
   */
  deleteAccount(password: string): Promise<ApiResponse<void>>;

  /**
   * OAuth authentication
   */
  oauthLogin(request: OAuthAuthRequest): Promise<ApiResponse<OAuthResponse>>;

  /**
   * Link OAuth provider
   */
  linkOAuthProvider(request: OAuthAuthRequest): Promise<ApiResponse<User>>;

  /**
   * Unlink OAuth provider
   */
  unlinkOAuthProvider(provider: OAuthProvider): Promise<ApiResponse<User>>;

  /**
   * Get API keys
   */
  getApiKeys(): Promise<ApiResponse<ApiKey[]>>;

  /**
   * Create API key
   */
  createApiKey(request: CreateApiKeyRequest): Promise<ApiResponse<ApiKey>>;

  /**
   * Update API key
   */
  updateApiKey(keyId: string, request: UpdateApiKeyRequest): Promise<ApiResponse<ApiKey>>;

  /**
   * Delete API key
   */
  deleteApiKey(keyId: string): Promise<ApiResponse<void>>;

  /**
   * Verify API key
   */
  verifyApiKey(apiKey: string): Promise<ApiResponse<boolean>>;

  /**
   * Get user analytics (admin only)
   */
  getAnalytics(params?: AnalyticsParams): Promise<ApiResponse<UserAnalytics>>;

  /**
   * Search users (admin only)
   */
  searchUsers(query: string, params?: SearchUsersParams): Promise<ApiResponse<User[]>>;

  /**
   * Update user status (admin only)
   */
  updateUserStatus(userId: string, status: UserStatus, reason?: string): Promise<ApiResponse<User>>;

  /**
   * Verify Polish business (admin only)
   */
  verifyPolishBusiness(userId: string, verification: PolishBusinessVerification): Promise<ApiResponse<User>>;
}

/**
 * Analytics parameters
 */
export interface AnalyticsParams {
  dateFrom: string;
  dateTo: string;
  groupBy?: 'day' | 'week' | 'month' | 'role' | 'status' | 'language';
  includePolishMetrics?: boolean;
}

/**
 * Search users parameters
 */
export interface SearchUsersParams {
  role?: UserRole;
  status?: UserStatus;
  verified?: boolean;
  businessAccount?: boolean;
  polishUser?: boolean;
  limit?: number;
  offset?: number;
}