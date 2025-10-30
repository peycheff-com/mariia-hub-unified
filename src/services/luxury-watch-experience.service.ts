import { supabase } from '@/integrations/supabase/client';

export interface LuxuryTheme {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  isPremium: boolean;
  price: number;
  features: LuxuryFeature[];
}

export interface LuxuryFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  isEnabled: boolean;
  isPremium: boolean;
}

export interface WatchFace {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  theme: string;
  isPremium: boolean;
  price: number;
  features: string[];
  compatibleDevices: ('watchos' | 'wearos')[];
}

export interface PremiumExperience {
  personalizedGreetings: boolean;
  luxuryAnimations: boolean;
  premiumSounds: boolean;
  exclusiveContent: boolean;
  prioritySupport: boolean;
  advancedAnalytics: boolean;
  customComplications: boolean;
  exclusiveThemes: boolean;
}

export interface UserLuxuryProfile {
  membershipLevel: 'standard' | 'premium' | 'elite' | 'vip';
  unlockedThemes: string[];
  unlockedWatchFaces: string[];
  activeTheme: string;
  activeWatchFace: string;
  personalizedSettings: PersonalizedSettings;
  achievements: LuxuryAchievement[];
  points: number;
}

export interface PersonalizedSettings {
  greetingStyle: 'formal' | 'friendly' | 'casual' | 'professional';
  preferredLanguage: 'en' | 'pl';
  nameDisplay: 'first' | 'full' | 'nickname';
  timeFormat: '12h' | '24h';
  dateFormat: 'us' | 'eu' | 'iso';
  measurementUnits: 'metric' | 'imperial';
  healthFocus: 'fitness' | 'beauty' | 'wellness' | 'balance';
}

export interface LuxuryAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlockedAt: Date;
  category: 'style' | 'wellness' | 'productivity' | 'social';
}

class LuxuryWatchExperienceService {
  private static instance: LuxuryWatchExperienceService;
  private currentUserProfile: UserLuxuryProfile | null = null;
  private luxuryThemes: LuxuryTheme[] = [];
  private watchFaces: WatchFace[] = [];

  private constructor() {
    this.initializeLuxuryContent();
  }

  static getInstance(): LuxuryWatchExperienceService {
    if (!LuxuryWatchExperienceService.instance) {
      LuxuryWatchExperienceService.instance = new LuxuryWatchExperienceService();
    }
    return LuxuryWatchExperienceService.instance;
  }

  /**
   * Initialize luxury content and themes
   */
  private async initializeLuxuryContent(): Promise<void> {
    this.luxuryThemes = [
      {
        id: 'champagne_gold',
        name: 'Champagne Gold',
        description: 'Elegant gold theme with warm accents',
        primaryColor: '#D4AF37',
        secondaryColor: '#F5DEB3',
        accentColor: '#B8860B',
        backgroundColor: '#1a1a1a',
        textColor: '#FFFFFF',
        isPremium: true,
        price: 4.99,
        features: [
          {
            id: 'premium_animations',
            name: 'Premium Animations',
            description: 'Smooth, luxurious animations',
            icon: 'animation',
            isEnabled: true,
            isPremium: true
          },
          {
            id: 'luxury_sounds',
            name: 'Luxury Sounds',
            description: 'Premium audio feedback',
            icon: 'volume_up',
            isEnabled: true,
            isPremium: true
          }
        ]
      },
      {
        id: 'rose_gold',
        name: 'Rose Gold',
        description: 'Sophisticated rose gold with pink accents',
        primaryColor: '#E0BFB8',
        secondaryColor: '#F4E4E1',
        accentColor: '#C9905F',
        backgroundColor: '#2d2d2d',
        textColor: '#FFFFFF',
        isPremium: true,
        price: 4.99,
        features: []
      },
      {
        id: 'platinum',
        name: 'Platinum',
        description: 'Sleek platinum with cool tones',
        primaryColor: '#E5E4E2',
        secondaryColor: '#FFFFFF',
        accentColor: '#8C7853',
        backgroundColor: '#000000',
        textColor: '#FFFFFF',
        isPremium: true,
        price: 5.99,
        features: []
      },
      {
        id: 'midnight_blue',
        name: 'Midnight Blue',
        description: 'Deep blue with silver accents',
        primaryColor: '#191970',
        secondaryColor: '#4169E1',
        accentColor: '#C0C0C0',
        backgroundColor: '#0a0a0a',
        textColor: '#FFFFFF',
        isPremium: false,
        price: 0,
        features: []
      }
    ];

    this.watchFaces = [
      {
        id: 'classic_chronograph',
        name: 'Classic Chronograph',
        description: 'Traditional watch face with modern complications',
        previewImage: '/watch-faces/classic-chronograph.png',
        theme: 'champagne_gold',
        isPremium: true,
        price: 2.99,
        features: ['appointment_complication', 'heart_rate_complication', 'steps_complication'],
        compatibleDevices: ['watchos', 'wearos']
      },
      {
        id: 'minimalist_elegance',
        name: 'Minimalist Elegance',
        description: 'Clean, sophisticated design with essential information',
        previewImage: '/watch-faces/minimalist-elegance.png',
        theme: 'platinum',
        isPremium: true,
        price: 1.99,
        features: ['time_complication', 'date_complication', 'battery_complication'],
        compatibleDevices: ['watchos', 'wearos']
      },
      {
        id: 'fitness_pro',
        name: 'Fitness Pro',
        description: 'Comprehensive fitness and health tracking display',
        previewImage: '/watch-faces/fitness-pro.png',
        theme: 'midnight_blue',
        isPremium: false,
        price: 0,
        features: ['heart_rate_complication', 'workout_complication', 'calories_complication'],
        compatibleDevices: ['watchos', 'wearos']
      }
    ];
  }

  /**
   * Get user's luxury profile
   */
  async getUserLuxuryProfile(): Promise<UserLuxuryProfile> {
    if (this.currentUserProfile) {
      return this.currentUserProfile;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_luxury_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get luxury profile: ${error.message}`);
    }

    if (!data) {
      // Create default profile
      const defaultProfile = await this.createDefaultLuxuryProfile(user.id);
      this.currentUserProfile = defaultProfile;
      return defaultProfile;
    }

    this.currentUserProfile = this.mapLuxuryProfileFromDatabase(data);
    return this.currentUserProfile;
  }

  /**
   * Create default luxury profile for new users
   */
  private async createDefaultLuxuryProfile(userId: string): Promise<UserLuxuryProfile> {
    const defaultProfile: UserLuxuryProfile = {
      membershipLevel: 'standard',
      unlockedThemes: ['midnight_blue'],
      unlockedWatchFaces: ['fitness_pro'],
      activeTheme: 'midnight_blue',
      activeWatchFace: 'fitness_pro',
      personalizedSettings: {
        greetingStyle: 'friendly',
        preferredLanguage: 'pl',
        nameDisplay: 'first',
        timeFormat: '24h',
        dateFormat: 'eu',
        measurementUnits: 'metric',
        healthFocus: 'balance'
      },
      achievements: [],
      points: 0
    };

    const { error } = await supabase
      .from('user_luxury_profiles')
      .insert({
        user_id: userId,
        membership_level: defaultProfile.membershipLevel,
        unlocked_themes: defaultProfile.unlockedThemes,
        unlocked_watch_faces: defaultProfile.unlockedWatchFaces,
        active_theme: defaultProfile.activeTheme,
        active_watch_face: defaultProfile.activeWatchFace,
        personalized_settings: defaultProfile.personalizedSettings,
        achievements: defaultProfile.achievements,
        points: defaultProfile.points
      });

    if (error) {
      throw new Error(`Failed to create luxury profile: ${error.message}`);
    }

    return defaultProfile;
  }

  /**
   * Upgrade membership to premium level
   */
  async upgradeMembership(level: 'premium' | 'elite' | 'vip'): Promise<void> {
    const profile = await this.getUserLuxuryProfile();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const unlockedThemes = [...profile.unlockedThemes];
    const unlockedWatchFaces = [...profile.unlockedWatchFaces];

    // Unlock content based on membership level
    switch (level) {
      case 'premium':
        unlockedThemes.push('champagne_gold', 'rose_gold');
        unlockedWatchFaces.push('minimalist_elegance');
        break;
      case 'elite':
        unlockedThemes.push('champagne_gold', 'rose_gold', 'platinum');
        unlockedWatchFaces.push('minimalist_elegance', 'classic_chronograph');
        break;
      case 'vip':
        unlockedThemes.push(...this.luxuryThemes.map(t => t.id));
        unlockedWatchFaces.push(...this.watchFaces.map(w => w.id));
        break;
    }

    const { error } = await supabase
      .from('user_luxury_profiles')
      .update({
        membership_level: level,
        unlocked_themes: unlockedThemes,
        unlocked_watch_faces: unlockedWatchFaces,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to upgrade membership: ${error.message}`);
    }

    // Update cached profile
    this.currentUserProfile = {
      ...profile,
      membershipLevel: level,
      unlockedThemes,
      unlockedWatchFaces
    };

    // Award achievement for upgrade
    await this.awardAchievement({
      id: `upgrade_${level}_${Date.now()}`,
      title: `${level.charAt(0).toUpperCase() + level.slice(1)} Member`,
      description: `Welcome to the ${level} membership! Enjoy exclusive benefits.`,
      icon: 'star',
      rarity: 'epic',
      points: 100,
      unlockedAt: new Date(),
      category: 'style'
    });
  }

  /**
   * Get available luxury themes
   */
  getLuxuryThemes(): LuxuryTheme[] {
    const profile = this.currentUserProfile;
    if (!profile) return this.luxuryThemes.filter(t => !t.isPremium);

    return this.luxuryThemes.map(theme => ({
      ...theme,
      features: theme.features.map(feature => ({
        ...feature,
        isEnabled: profile.unlockedThemes.includes(theme.id) ? true : feature.isEnabled
      }))
    }));
  }

  /**
   * Get available watch faces
   */
  getWatchFaces(): WatchFace[] {
    const profile = this.currentUserProfile;
    if (!profile) return this.watchFaces.filter(w => !w.isPremium);

    return this.watchFaces.filter(face =>
      profile.unlockedWatchFaces.includes(face.id) || !face.isPremium
    );
  }

  /**
   * Set active theme
   */
  async setActiveTheme(themeId: string): Promise<void> {
    const profile = await this.getUserLuxuryProfile();
    const theme = this.luxuryThemes.find(t => t.id === themeId);

    if (!theme) {
      throw new Error('Theme not found');
    }

    if (theme.isPremium && !profile.unlockedThemes.includes(themeId)) {
      throw new Error('Theme not unlocked');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_luxury_profiles')
      .update({ active_theme: themeId })
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to set active theme: ${error.message}`);
    }

    if (this.currentUserProfile) {
      this.currentUserProfile.activeTheme = themeId;
    }

    // Apply theme changes
    this.applyTheme(theme);
  }

  /**
   * Set active watch face
   */
  async setActiveWatchFace(watchFaceId: string): Promise<void> {
    const profile = await this.getUserLuxuryProfile();
    const watchFace = this.watchFaces.find(w => w.id === watchFaceId);

    if (!watchFace) {
      throw new Error('Watch face not found');
    }

    if (watchFace.isPremium && !profile.unlockedWatchFaces.includes(watchFaceId)) {
      throw new Error('Watch face not unlocked');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_luxury_profiles')
      .update({ active_watch_face: watchFaceId })
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to set active watch face: ${error.message}`);
    }

    if (this.currentUserProfile) {
      this.currentUserProfile.activeWatchFace = watchFaceId;
    }
  }

  /**
   * Update personalized settings
   */
  async updatePersonalizedSettings(settings: Partial<PersonalizedSettings>): Promise<void> {
    const profile = await this.getUserLuxuryProfile();
    const updatedSettings = { ...profile.personalizedSettings, ...settings };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_luxury_profiles')
      .update({ personalized_settings: updatedSettings })
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to update settings: ${error.message}`);
    }

    if (this.currentUserProfile) {
      this.currentUserProfile.personalizedSettings = updatedSettings;
    }
  }

  /**
   * Get personalized greeting
   */
  getPersonalizedGreeting(): string {
    const profile = this.currentUserProfile;
    if (!profile) return 'Welcome';

    const hour = new Date().getHours();
    const { greetingStyle, preferredLanguage } = profile.personalizedSettings;

    let timeGreeting = '';
    if (hour < 12) {
      timeGreeting = preferredLanguage === 'pl' ? 'Dzień dobry' : 'Good morning';
    } else if (hour < 18) {
      timeGreeting = preferredLanguage === 'pl' ? 'Dzień dobry' : 'Good afternoon';
    } else {
      timeGreeting = preferredLanguage === 'pl' ? 'Dobry wieczór' : 'Good evening';
    }

    const membershipPrefix = profile.membershipLevel !== 'standard'
      ? `${profile.membershipLevel.charAt(0).toUpperCase() + profile.membershipLevel.slice(1)} `
      : '';

    switch (greetingStyle) {
      case 'formal':
        return `${timeGreeting}, ${membershipPrefix}Member`;
      case 'professional':
        return `${timeGreeting}. ${membershipPrefix}Access Granted.`;
      case 'casual':
        return `Hey ${membershipPrefix}Member! ${timeGreeting}!`;
      case 'friendly':
      default:
        return `${timeGreeting}, ${membershipPrefix}Member!`;
    }
  }

  /**
   * Generate premium watch complications
   */
  generatePremiumComplications(): PremiumComplication[] {
    const profile = this.currentUserProfile;
    if (!profile || profile.membershipLevel === 'standard') {
      return this.getStandardComplications();
    }

    return [
      {
        id: 'luxury_time',
        type: 'time',
        title: 'Luxury Time',
        style: 'elegant',
        isPremium: true,
        data: {
          format: profile.personalizedSettings.timeFormat === '12h' ? 'h:mm a' : 'HH:mm',
          showSeconds: profile.membershipLevel === 'vip',
          fontFamily: 'serif',
          color: this.getActiveTheme().primaryColor
        }
      },
      {
        id: 'appointment_premium',
        type: 'appointment',
        title: 'Next Appointment',
        style: 'detailed',
        isPremium: true,
        data: {
          showClientName: true,
          showServiceType: true,
          showLocation: profile.membershipLevel !== 'premium',
          countdownEnabled: true
        }
      },
      {
        id: 'health_rings',
        type: 'health',
        title: 'Health Rings',
        style: 'circular',
        isPremium: true,
        data: {
          showSteps: true,
          showCalories: true,
          showExercise: true,
          showStand: profile.membershipLevel === 'vip',
          animated: true
        }
      },
      {
        id: 'membership_status',
        type: 'status',
        title: 'Membership',
        style: 'badge',
        isPremium: true,
        data: {
          level: profile.membershipLevel,
          points: profile.points,
          nextReward: this.getNextReward(profile)
        }
      }
    ];
  }

  /**
   * Get premium animations library
   */
  getPremiumAnimations(): PremiumAnimation[] {
    const profile = this.currentUserProfile;
    if (!profile || profile.membershipLevel === 'standard') {
      return [];
    }

    return [
      {
        id: 'luxury_fade',
        name: 'Luxury Fade',
        description: 'Smooth fade transitions with premium easing',
        duration: 800,
        easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        isPremium: true
      },
      {
        id: 'golden_glimmer',
        name: 'Golden Glimmer',
        description: 'Subtle golden shimmer effects',
        duration: 2000,
        easing: 'ease-in-out',
        isPremium: true
      },
      {
        id: 'elegant_rotation',
        name: 'Elegant Rotation',
        description: 'Smooth 3D rotation effects',
        duration: 600,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        isPremium: true
      }
    ];
  }

  /**
   * Award achievement to user
   */
  private async awardAchievement(achievement: LuxuryAchievement): Promise<void> {
    const profile = await this.getUserLuxuryProfile();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    profile.achievements.push(achievement);
    profile.points += achievement.points;

    // Update database
    await supabase
      .from('user_luxury_profiles')
      .update({
        achievements: profile.achievements,
        points: profile.points
      })
      .eq('user_id', user.id);

    // Trigger celebration effect
    this.triggerAchievementCelebration(achievement);
  }

  /**
   * Apply theme to UI
   */
  private applyTheme(theme: LuxuryTheme): void {
    const root = document.documentElement;
    root.style.setProperty('--luxury-primary', theme.primaryColor);
    root.style.setProperty('--luxury-secondary', theme.secondaryColor);
    root.style.setProperty('--luxury-accent', theme.accentColor);
    root.style.setProperty('--luxury-background', theme.backgroundColor);
    root.style.setProperty('--luxury-text', theme.textColor);
  }

  /**
   * Get active theme
   */
  private getActiveTheme(): LuxuryTheme {
    const profile = this.currentUserProfile;
    if (!profile) return this.luxuryThemes[0];

    return this.luxuryThemes.find(t => t.id === profile.activeTheme) || this.luxuryThemes[0];
  }

  /**
   * Get standard complications for non-premium users
   */
  private getStandardComplications(): PremiumComplication[] {
    return [
      {
        id: 'basic_time',
        type: 'time',
        title: 'Time',
        style: 'simple',
        isPremium: false,
        data: { format: 'HH:mm' }
      },
      {
        id: 'basic_date',
        type: 'date',
        title: 'Date',
        style: 'simple',
        isPremium: false,
        data: { format: 'MMM dd' }
      }
    ];
  }

  /**
   * Get next reward for user
   */
  private getNextReward(profile: UserLuxuryProfile): string {
    const thresholds = {
      standard: { next: 100, reward: 'Premium Theme' },
      premium: { next: 500, reward: 'Elite Status' },
      elite: { next: 1000, reward: 'VIP Benefits' },
      vip: { next: null, reward: 'Maximum Level' }
    };

    const current = thresholds[profile.membershipLevel];
    if (!current.next) return 'Maximum level reached';

    const remaining = current.next - profile.points;
    return `${remaining} points to ${current.reward}`;
  }

  /**
   * Trigger achievement celebration animation
   */
  private triggerAchievementCelebration(achievement: LuxuryAchievement): void {
    // Dispatch custom event for UI components to handle
    window.dispatchEvent(new CustomEvent('achievementUnlocked', {
      detail: achievement
    }));
  }

  private mapLuxuryProfileFromDatabase(data: any): UserLuxuryProfile {
    return {
      membershipLevel: data.membership_level,
      unlockedThemes: data.unlocked_themes || [],
      unlockedWatchFaces: data.unlocked_watch_faces || [],
      activeTheme: data.active_theme || 'midnight_blue',
      activeWatchFace: data.active_watch_face || 'fitness_pro',
      personalizedSettings: data.personalized_settings || {},
      achievements: data.achievements || [],
      points: data.points || 0
    };
  }

  public cleanup(): void {
    this.currentUserProfile = null;
  }
}

export interface PremiumComplication {
  id: string;
  type: 'time' | 'date' | 'appointment' | 'health' | 'status' | 'weather';
  title: string;
  style: 'simple' | 'detailed' | 'circular' | 'badge' | 'elegant';
  isPremium: boolean;
  data: Record<string, any>;
}

export interface PremiumAnimation {
  id: string;
  name: string;
  description: string;
  duration: number;
  easing: string;
  isPremium: boolean;
}

export const luxuryWatchExperienceService = LuxuryWatchExperienceService.getInstance();