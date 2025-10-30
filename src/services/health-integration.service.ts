import { supabase } from '@/integrations/supabase/client';

export interface HealthMetrics {
  steps: number;
  calories: number;
  activeMinutes: number;
  distance: number;
  heartRate: number;
  heartRateVariability: number;
  bloodOxygen: number;
  stressLevel: number;
  sleepHours: number;
  sleepQuality: 'poor' | 'fair' | 'good' | 'excellent';
  weight: number;
  bodyFat: number;
  muscleMass: number;
  water: number;
  timestamp: Date;
  source: 'apple_health' | 'google_fit' | 'wear_os' | 'watchos' | 'manual';
}

export interface WorkoutSession {
  id: string;
  type: WorkoutType;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  caloriesBurned?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  distance?: number;
  steps?: number;
  activeEnergy?: number;
  heartRateZones: HeartRateZone[];
  notes?: string;
  source: 'apple_health' | 'google_fit' | 'wear_os' | 'watchos' | 'manual';
  isCompleted: boolean;
}

export interface HeartRateZone {
  zone: 1 | 2 | 3 | 4 | 5;
  name: string;
  minHeartRate: number;
  maxHeartRate: number;
  timeInZone: number; // in seconds
  percentageOfTime: number;
}

export interface FitnessGoal {
  id: string;
  type: 'steps' | 'calories' | 'active_minutes' | 'weight' | 'workout_frequency';
  target: number;
  current: number;
  unit: string;
  deadline: Date;
  isActive: boolean;
  achievements: FitnessAchievement[];
}

export interface FitnessAchievement {
  id: string;
  type: 'milestone' | 'streak' | 'personal_best' | 'goal_completion';
  title: string;
  description: string;
  value: number;
  unit: string;
  earnedAt: Date;
  points: number;
}

export enum WorkoutType {
  STRENGTH = 'strength',
  CARDIO = 'cardio',
  YOGA = 'yoga',
  PILATES = 'pilates',
  DANCE = 'dance',
  CYCLING = 'cycling',
  RUNNING = 'running',
  WALKING = 'walking',
  SWIMMING = 'swimming',
  HIIT = 'hiit',
  FUNCTIONAL = 'functional',
  STRETCHING = 'stretching',
  MEDITATION = 'meditation'
}

class HealthIntegrationService {
  private static instance: HealthIntegrationService;
  private isInitialized = false;
  private supportedPlatforms: ('apple_health' | 'google_fit')[] = [];
  private activeWorkoutSession: WorkoutSession | null = null;
  private healthDataCache: Map<string, HealthMetrics> = new Map();
  private goalsCache: Map<string, FitnessGoal> = new Map();

  private constructor() {}

  static getInstance(): HealthIntegrationService {
    if (!HealthIntegrationService.instance) {
      HealthIntegrationService.instance = new HealthIntegrationService();
    }
    return HealthIntegrationService.instance;
  }

  /**
   * Initialize health integration service
   */
  async initialize(): Promise<boolean> {
    try {
      await this.detectSupportedPlatforms();
      await this.requestPermissions();
      await this.loadStoredGoals();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize health integration:', error);
      return false;
    }
  }

  /**
   * Detect which health platforms are available
   */
  private async detectSupportedPlatforms(): Promise<void> {
    const userAgent = navigator.userAgent.toLowerCase();

    // Apple Health (HealthKit) - available on iOS/watchOS
    if (/iphone|ipad|ipod|watchos|mac/.test(userAgent)) {
      // Check if HealthKit web API is available
      if ('HealthKit' in window) {
        this.supportedPlatforms.push('apple_health');
      }
    }

    // Google Fit - available on Android/Wear OS
    if (/android|wear.*os/.test(userAgent)) {
      // Check if Google Fit API is available
      if ('gapi' in window && 'fit' in (window as any).gapi) {
        this.supportedPlatforms.push('google_fit');
      }
    }

    console.log('Supported health platforms:', this.supportedPlatforms);
  }

  /**
   * Request permissions for health data access
   */
  private async requestPermissions(): Promise<void> {
    for (const platform of this.supportedPlatforms) {
      try {
        switch (platform) {
          case 'apple_health':
            await this.requestAppleHealthPermissions();
            break;
          case 'google_fit':
            await this.requestGoogleFitPermissions();
            break;
        }
      } catch (error) {
        console.error(`Failed to request permissions for ${platform}:`, error);
      }
    }
  }

  /**
   * Request Apple Health (HealthKit) permissions
   */
  private async requestAppleHealthPermissions(): Promise<void> {
    // This would interface with HealthKit web API or native bridge
    // For now, simulate permission request
    return new Promise((resolve) => {
      // Simulate user granting permission
      setTimeout(() => {
        console.log('Apple Health permissions granted');
        resolve();
      }, 1000);
    });
  }

  /**
   * Request Google Fit permissions
   */
  private async requestGoogleFitPermissions(): Promise<void> {
    // This would interface with Google Fit API
    // For now, simulate permission request
    return new Promise((resolve) => {
      // Simulate user granting permission
      setTimeout(() => {
        console.log('Google Fit permissions granted');
        resolve();
      }, 1000);
    });
  }

  /**
   * Get today's health metrics
   */
  async getTodayHealthMetrics(): Promise<HealthMetrics> {
    const today = new Date();
    const cacheKey = today.toDateString();

    // Check cache first
    if (this.healthDataCache.has(cacheKey)) {
      return this.healthDataCache.get(cacheKey)!;
    }

    const metrics: HealthMetrics = {
      steps: await this.getSteps(today),
      calories: await this.getCalories(today),
      activeMinutes: await this.getActiveMinutes(today),
      distance: await this.getDistance(today),
      heartRate: await this.getCurrentHeartRate(),
      heartRateVariability: await this.getHeartRateVariability(today),
      bloodOxygen: await this.getBloodOxygen(today),
      stressLevel: await this.getStressLevel(today),
      sleepHours: await this.getSleepHours(today),
      sleepQuality: await this.getSleepQuality(today),
      weight: await this.getWeight(today),
      bodyFat: await this.getBodyFat(today),
      muscleMass: await this.getMuscleMass(today),
      water: await this.getWaterIntake(today),
      timestamp: new Date(),
      source: this.getPrimarySource()
    };

    // Cache the metrics
    this.healthDataCache.set(cacheKey, metrics);

    // Store in database
    await this.storeHealthMetrics(metrics);

    return metrics;
  }

  /**
   * Start a workout session
   */
  async startWorkoutSession(type: WorkoutType, notes?: string): Promise<string> {
    if (this.activeWorkoutSession) {
      throw new Error('Workout session already active');
    }

    const sessionId = `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.activeWorkoutSession = {
      id: sessionId,
      type,
      startTime: new Date(),
      heartRateZones: [],
      notes,
      source: this.getPrimarySource(),
      isCompleted: false
    };

    // Start tracking on available platforms
    await this.startWorkoutTracking(this.activeWorkoutSession);

    return sessionId;
  }

  /**
   * End active workout session
   */
  async endWorkoutSession(): Promise<WorkoutSession> {
    if (!this.activeWorkoutSession) {
      throw new Error('No active workout session');
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - this.activeWorkoutSession.startTime.getTime()) / 60000);

    // Collect final workout data
    const workoutData = await this.collectWorkoutData(this.activeWorkoutSession, endTime);

    this.activeWorkoutSession = {
      ...this.activeWorkoutSession,
      endTime,
      duration,
      ...workoutData,
      isCompleted: true
    };

    // Store completed workout
    await this.storeWorkoutSession(this.activeWorkoutSession);

    const completedSession = this.activeWorkoutSession;
    this.activeWorkoutSession = null;

    return completedSession;
  }

  /**
   * Get current workout session
   */
  getActiveWorkoutSession(): WorkoutSession | null {
    return this.activeWorkoutSession;
  }

  /**
   * Get workout history
   */
  async getWorkoutHistory(limit: number = 30): Promise<WorkoutSession[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get workout history:', error);
      return [];
    }

    return data.map(this.mapWorkoutFromDatabase);
  }

  /**
   * Create fitness goal
   */
  async createFitnessGoal(goal: Omit<FitnessGoal, 'id' | 'achievements' | 'isActive'>): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const goalId = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newGoal: FitnessGoal = {
      ...goal,
      id: goalId,
      achievements: [],
      isActive: true
    };

    const { error } = await supabase
      .from('fitness_goals')
      .insert({
        id: goalId,
        user_id: user.id,
        goal_type: goal.type,
        target: goal.target,
        current: goal.current,
        unit: goal.unit,
        deadline: goal.deadline.toISOString(),
        is_active: true
      });

    if (error) {
      throw new Error(`Failed to create fitness goal: ${error.message}`);
    }

    this.goalsCache.set(goalId, newGoal);
    return goalId;
  }

  /**
   * Get active fitness goals
   */
  async getActiveFitnessGoals(): Promise<FitnessGoal[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('fitness_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('deadline', { ascending: true });

    if (error) {
      console.error('Failed to get fitness goals:', error);
      return [];
    }

    return data.map(this.mapGoalFromDatabase);
  }

  /**
   * Update fitness goal progress
   */
  async updateGoalProgress(goalId: string, currentValue: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('fitness_goals')
      .update({ current: currentValue })
      .eq('id', goalId)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to update goal progress: ${error.message}`);
    }

    // Update cache
    const cachedGoal = this.goalsCache.get(goalId);
    if (cachedGoal) {
      cachedGoal.current = currentValue;

      // Check for achievements
      await this.checkForAchievements(cachedGoal);
    }
  }

  /**
   * Get personalized health insights
   */
  async getHealthInsights(): Promise<HealthInsight[]> {
    const metrics = await this.getTodayHealthMetrics();
    const workouts = await this.getWorkoutHistory(7);
    const goals = await this.getActiveFitnessGoals();

    const insights: HealthInsight[] = [];

    // Steps insight
    if (metrics.steps < 8000) {
      insights.push({
        type: 'activity',
        title: 'Increase Daily Steps',
        description: `You're ${(8000 - metrics.steps).toLocaleString()} steps away from the recommended 8,000 daily goal.`,
        priority: 'medium',
        actionable: true,
        suggestions: [
          'Take a 10-minute walk after lunch',
          'Use stairs instead of elevator',
          'Park further away from destinations'
        ]
      });
    }

    // Heart rate insight
    if (metrics.heartRate > 100 && metrics.stressLevel > 7) {
      insights.push({
        type: 'stress',
        title: 'High Stress Detected',
        description: 'Your heart rate is elevated while stress levels are high. Consider stress reduction techniques.',
        priority: 'high',
        actionable: true,
        suggestions: [
          'Try deep breathing exercises',
          'Take a short meditation break',
          'Practice progressive muscle relaxation'
        ]
      });
    }

    // Sleep insight
    if (metrics.sleepHours < 7) {
      insights.push({
        type: 'sleep',
        title: 'Improve Sleep Duration',
        description: `You got ${metrics.sleepHours} hours of sleep last night. Aim for 7-9 hours for optimal recovery.`,
        priority: 'high',
        actionable: true,
        suggestions: [
          'Establish a consistent bedtime routine',
          'Avoid screens 1 hour before bed',
          'Keep bedroom cool and dark'
        ]
      });
    }

    // Workout consistency insight
    const recentWorkouts = workouts.filter(w =>
      new Date(w.endTime!).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    if (recentWorkouts.length < 3) {
      insights.push({
        type: 'consistency',
        title: 'Workout Consistency',
        description: `You've completed ${recentWorkouts.length} workouts this week. Try to maintain 3-4 sessions per week.`,
        priority: 'medium',
        actionable: true,
        suggestions: [
          'Schedule workouts in your calendar',
          'Find a workout buddy for accountability',
          'Start with shorter sessions if needed'
        ]
      });
    }

    return insights;
  }

  // Private helper methods

  private async getSteps(date: Date): Promise<number> {
    // Get steps from available health platforms
    let totalSteps = 0;

    for (const platform of this.supportedPlatforms) {
      try {
        const steps = await this.getStepsFromPlatform(platform, date);
        totalSteps = Math.max(totalSteps, steps);
      } catch (error) {
        console.error(`Failed to get steps from ${platform}:`, error);
      }
    }

    return totalSteps;
  }

  private async getCalories(date: Date): Promise<number> {
    // Implementation similar to getSteps
    return 2000; // Mock value
  }

  private async getActiveMinutes(date: Date): Promise<number> {
    return 30; // Mock value
  }

  private async getDistance(date: Date): Promise<number> {
    return 5000; // Mock value in meters
  }

  private async getCurrentHeartRate(): Promise<number> {
    return 72; // Mock value
  }

  private async getHeartRateVariability(date: Date): Promise<number> {
    return 45; // Mock value
  }

  private async getBloodOxygen(date: Date): Promise<number> {
    return 98; // Mock value
  }

  private async getStressLevel(date: Date): Promise<number> {
    return 3; // Mock value 1-10 scale
  }

  private async getSleepHours(date: Date): Promise<number> {
    return 7.5; // Mock value
  }

  private async getSleepQuality(date: Date): Promise<'poor' | 'fair' | 'good' | 'excellent'> {
    return 'good'; // Mock value
  }

  private async getWeight(date: Date): Promise<number> {
    return 70; // Mock value in kg
  }

  private async getBodyFat(date: Date): Promise<number> {
    return 20; // Mock value in percentage
  }

  private async getMuscleMass(date: Date): Promise<number> {
    return 35; // Mock value in kg
  }

  private async getWaterIntake(date: Date): Promise<number> {
    return 2000; // Mock value in ml
  }

  private getPrimarySource(): 'apple_health' | 'google_fit' | 'wear_os' | 'watchos' | 'manual' {
    if (this.supportedPlatforms.includes('apple_health')) {
      return 'apple_health';
    } else if (this.supportedPlatforms.includes('google_fit')) {
      return 'google_fit';
    }
    return 'manual';
  }

  private async storeHealthMetrics(metrics: HealthMetrics): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('health_metrics').insert({
      user_id: user.id,
      metrics_data: metrics,
      recorded_at: metrics.timestamp.toISOString(),
      source: metrics.source
    });
  }

  private async startWorkoutTracking(session: WorkoutSession): Promise<void> {
    // Start tracking on available platforms
    for (const platform of this.supportedPlatforms) {
      try {
        await this.startWorkoutOnPlatform(platform, session);
      } catch (error) {
        console.error(`Failed to start workout tracking on ${platform}:`, error);
      }
    }
  }

  private async collectWorkoutData(session: WorkoutSession, endTime: Date): Promise<Partial<WorkoutSession>> {
    const data: Partial<WorkoutSession> = {};

    for (const platform of this.supportedPlatforms) {
      try {
        const platformData = await this.getWorkoutDataFromPlatform(platform, session, endTime);
        // Merge data, preferring more complete data
        Object.assign(data, platformData);
      } catch (error) {
        console.error(`Failed to get workout data from ${platform}:`, error);
      }
    }

    return data;
  }

  private async storeWorkoutSession(session: WorkoutSession): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('workout_sessions').insert({
      id: session.id,
      user_id: user.id,
      workout_type: session.type,
      start_time: session.startTime.toISOString(),
      end_time: session.endTime?.toISOString(),
      duration: session.duration,
      calories_burned: session.caloriesBurned,
      avg_heart_rate: session.avgHeartRate,
      max_heart_rate: session.maxHeartRate,
      distance: session.distance,
      steps: session.steps,
      heart_rate_zones: session.heartRateZones,
      notes: session.notes,
      source: session.source,
      is_completed: session.isCompleted
    });
  }

  private async checkForAchievements(goal: FitnessGoal): Promise<void> {
    const progress = (goal.current / goal.target) * 100;

    if (progress >= 100 && goal.current > 0) {
      // Goal completed
      const achievement: FitnessAchievement = {
        id: `achievement_${Date.now()}`,
        type: 'goal_completion',
        title: `Goal Completed: ${goal.type}`,
        description: `You've reached your ${goal.type} goal of ${goal.target} ${goal.unit}!`,
        value: goal.target,
        unit: goal.unit,
        earnedAt: new Date(),
        points: 100
      };

      await this.awardAchievement(goal.id, achievement);
    } else if (progress >= 75 && progress < 100) {
      // Milestone
      const achievement: FitnessAchievement = {
        id: `achievement_${Date.now()}`,
        type: 'milestone',
        title: `${Math.floor(progress)}% Progress`,
        description: `You're ${Math.floor(progress)}% of the way to your ${goal.type} goal!`,
        value: progress,
        unit: '%',
        earnedAt: new Date(),
        points: 50
      };

      await this.awardAchievement(goal.id, achievement);
    }
  }

  private async awardAchievement(goalId: string, achievement: FitnessAchievement): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('fitness_achievements').insert({
      id: achievement.id,
      user_id: user.id,
      goal_id: goalId,
      achievement_type: achievement.type,
      title: achievement.title,
      description: achievement.description,
      value: achievement.value,
      unit: achievement.unit,
      points: achievement.points,
      earned_at: achievement.earnedAt.toISOString()
    });

    // Update cache
    const cachedGoal = this.goalsCache.get(goalId);
    if (cachedGoal) {
      cachedGoal.achievements.push(achievement);
    }
  }

  private async loadStoredGoals(): Promise<void> {
    const goals = await this.getActiveFitnessGoals();
    goals.forEach(goal => {
      this.goalsCache.set(goal.id, goal);
    });
  }

  private mapWorkoutFromDatabase(data: any): WorkoutSession {
    return {
      id: data.id,
      type: data.workout_type,
      startTime: new Date(data.start_time),
      endTime: data.end_time ? new Date(data.end_time) : undefined,
      duration: data.duration,
      caloriesBurned: data.calories_burned,
      avgHeartRate: data.avg_heart_rate,
      maxHeartRate: data.max_heart_rate,
      distance: data.distance,
      steps: data.steps,
      heartRateZones: data.heart_rate_zones || [],
      notes: data.notes,
      source: data.source,
      isCompleted: data.is_completed
    };
  }

  private mapGoalFromDatabase(data: any): FitnessGoal {
    return {
      id: data.id,
      type: data.goal_type,
      target: data.target,
      current: data.current,
      unit: data.unit,
      deadline: new Date(data.deadline),
      isActive: data.is_active,
      achievements: [] // Would need to load separately
    };
  }

  // Platform-specific methods (mocked for now)
  private async getStepsFromPlatform(platform: string, date: Date): Promise<number> {
    // Mock implementation
    return Math.floor(Math.random() * 15000);
  }

  private async startWorkoutOnPlatform(platform: string, session: WorkoutSession): Promise<void> {
    // Mock implementation
    console.log(`Starting workout tracking on ${platform}`);
  }

  private async getWorkoutDataFromPlatform(platform: string, session: WorkoutSession, endTime: Date): Promise<Partial<WorkoutSession>> {
    // Mock implementation
    return {
      caloriesBurned: Math.floor(Math.random() * 500),
      avgHeartRate: Math.floor(Math.random() * 50) + 100,
      distance: Math.floor(Math.random() * 10000),
      steps: Math.floor(Math.random() * 10000)
    };
  }

  public cleanup(): void {
    this.healthDataCache.clear();
    this.goalsCache.clear();
    this.activeWorkoutSession = null;
  }
}

export interface HealthInsight {
  type: 'activity' | 'stress' | 'sleep' | 'nutrition' | 'consistency';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestions: string[];
}

export const healthIntegrationService = HealthIntegrationService.getInstance();