import { supabase } from '@/integrations/supabase/client';

import { Booking } from './booking.service';

/**
 * Service to integrate loyalty program with booking system
 * Automatically awards points when bookings are completed
 */

export class LoyaltyIntegrationService {
  /**
   * Award points for a completed booking
   */
  static async awardPointsForBooking(booking: Booking) {
    try {
      // Get the active loyalty program
      const { data: program, error: programError } = await supabase
        .from('loyalty_programs')
        .select('*')
        .eq('is_active', true)
        .single();

      if (programError || !program) {
        console.log('No active loyalty program found');
        return null;
      }

      // Get customer's current loyalty status
      const { data: customerLoyalty, error: loyaltyError } = await supabase
        .from('customer_loyalty')
        .select('*')
        .eq('customer_id', booking.client_id)
        .eq('program_id', program.id)
        .single();

      if (loyaltyError && loyaltyError.code !== 'PGRST116') {
        throw loyaltyError;
      }

      // Get tier multiplier
      const tierMultiplier = customerLoyalty?.tier
        ? await this.getTierMultiplier(customerLoyalty.tier, program.id)
        : 1;

      // Calculate base points (1 point per currency unit spent)
      const basePoints = Math.floor(booking.total_price * program.points_per_currency);

      // Apply tier multiplier
      const finalPoints = Math.floor(basePoints * tierMultiplier);

      // Award the points
      const { data: transaction, error: awardError } = await supabase.rpc('earn_loyalty_points', {
        p_customer_id: booking.client_id,
        p_program_id: program.id,
        p_points: finalPoints,
        p_reference_id: booking.id,
        p_reference_type: 'booking',
        p_description: `Points earned for ${this.getServiceName(booking.service_id)}`
      });

      if (awardError) throw awardError;

      // Check for achievements
      await this.checkAndAwardAchievements(booking.client_id, program.id);

      // Update streaks
      await this.updateBookingStreak(booking.client_id);

      console.log(`Awarded ${finalPoints} points to customer ${booking.client_id}`);
      return transaction;
    } catch (error) {
      console.error('Error awarding loyalty points:', error);
      throw error;
    }
  }

  /**
   * Get tier multiplier for customer
   */
  private static async getTierMultiplier(tierName: string, programId: string): Promise<number> {
    const { data, error } = await supabase
      .from('loyalty_tiers')
      .select('point_multiplier')
      .eq('program_id', programId)
      .eq('name', tierName.toLowerCase())
      .single();

    return data?.point_multiplier || 1;
  }

  /**
   * Get service name for description
   */
  private static async getServiceName(serviceId: string): Promise<string> {
    const { data } = await supabase
      .from('services')
      .select('name')
      .eq('id', serviceId)
      .single();

    return data?.name || 'Service';
  }

  /**
   * Check and award achievements based on customer activity
   */
  private static async checkAndAwardAchievements(customerId: string, programId: string) {
    try {
      // Get all active achievements
      const { data: achievements, error } = await supabase
        .from('achievement_badges')
        .select('*')
        .eq('is_active', true);

      if (error || !achievements) return;

      // Get customer's current achievements
      const { data: customerAchievements } = await supabase
        .from('customer_achievements')
        .select('badge_id')
        .eq('customer_id', customerId);

      const earnedBadgeIds = new Set(customerAchievements?.map(ca => ca.badge_id) || []);

      // Check each achievement
      for (const achievement of achievements) {
        if (earnedBadgeIds.has(achievement.id)) continue;

        const isEarned = await this.evaluateAchievementCriteria(
          customerId,
          achievement.criteria,
          achievement.id
        );

        if (isEarned) {
          // Award the achievement
          await supabase
            .from('customer_achievements')
            .insert({
              customer_id: customerId,
              badge_id: achievement.id
            });

          // Award achievement points
          if (achievement.points_awarded > 0) {
            await supabase.rpc('earn_loyalty_points', {
              p_customer_id: customerId,
              p_program_id: programId,
              p_points: achievement.points_awarded,
              p_reference_id: achievement.id,
              p_reference_type: 'achievement',
              p_description: `Achievement unlocked: ${achievement.name}`
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }

  /**
   * Evaluate if customer meets achievement criteria
   */
  private static async evaluateAchievementCriteria(
    customerId: string,
    criteria: any,
    badgeId: string
  ): Promise<boolean> {
    switch (criteria.type) {
      case 'first_booking':
        const { data: bookingCount } = await supabase
          .from('bookings')
          .select('id')
          .eq('client_id', customerId)
          .eq('status', 'completed');

        return (bookingCount?.length || 0) >= 1;

      case 'booking_count':
        const { data: totalBookings } = await supabase
          .from('bookings')
          .select('id')
          .eq('client_id', customerId)
          .eq('status', 'completed');

        return (totalBookings?.length || 0) >= criteria.count;

      case 'category_bookings':
        const { data: serviceData } = await supabase
          .from('services')
          .select('category')
          .eq('id', criteria.serviceId || '')
          .single();

        if (!serviceData) return false;

        const { data: categoryBookings } = await supabase
          .from('bookings')
          .select('id')
          .eq('client_id', customerId)
          .eq('status', 'completed')
          .eq('service_category', serviceData.category);

        return (categoryBookings?.length || 0) >= criteria.count;

      case 'points_earned':
        const { data: loyaltyData } = await supabase
          .from('customer_loyalty')
          .select('total_earned')
          .eq('customer_id', customerId)
          .single();

        return (loyaltyData?.total_earned || 0) >= criteria.count;

      case 'birthday_booking':
        const { data: profile } = await supabase
          .from('profiles')
          .select('date_of_birth')
          .eq('id', customerId)
          .single();

        if (!profile?.date_of_birth) return false;

        const today = new Date();
        const birthday = new Date(profile.date_of_birth);
        const isBirthday = today.getDate() === birthday.getDate() &&
                          today.getMonth() === birthday.getMonth();

        if (!isBirthday) return false;

        const { data: birthdayBooking } = await supabase
          .from('bookings')
          .select('id')
          .eq('client_id', customerId)
          .eq('status', 'completed')
          .gte('start_time', new Date(today.setHours(0, 0, 0, 0)).toISOString())
          .lte('start_time', new Date(today.setHours(23, 59, 59, 999)).toISOString());

        return (birthdayBooking?.length || 0) > 0;

      default:
        return false;
    }
  }

  /**
   * Update customer's booking streak
   */
  private static async updateBookingStreak(customerId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get or create booking streak record
      const { data: streak } = await supabase
        .from('customer_streaks')
        .select('*')
        .eq('customer_id', customerId)
        .eq('streak_type', 'booking')
        .single();

      if (streak) {
        // Update existing streak
        const lastActivity = streak.last_activity ? new Date(streak.last_activity) : null;
        const daysDiff = lastActivity
          ? Math.floor((new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
          : 1;

        let newStreak = streak.current_streak;
        let newLongest = streak.longest_streak;

        if (daysDiff <= 31) { // Within a month
          newStreak += 1;
          if (newStreak > newLongest) {
            newLongest = newStreak;
          }
        } else {
          // Reset streak if too much time has passed
          newStreak = 1;
        }

        await supabase
          .from('customer_streaks')
          .update({
            current_streak: newStreak,
            longest_streak: newLongest,
            last_activity: today,
            updated_at: new Date().toISOString()
          })
          .eq('id', streak.id);

        // Award streak bonus at milestones
        if (newStreak === 3 || newStreak === 6 || newStreak === 12) {
          const bonusPoints = newStreak * 10;
          const { data: program } = await supabase
            .from('loyalty_programs')
            .select('id')
            .eq('is_active', true)
            .single();

          if (program) {
            await supabase.rpc('earn_loyalty_points', {
              p_customer_id: customerId,
              p_program_id: program.id,
              p_points: bonusPoints,
              p_reference_type: 'streak_bonus',
              p_description: `${newStreak}-month streak bonus!`
            });
          }
        }
      } else {
        // Create new streak record
        await supabase
          .from('customer_streaks')
          .insert({
            customer_id: customerId,
            streak_type: 'booking',
            current_streak: 1,
            longest_streak: 1,
            last_activity: today,
            next_bonus_threshold: 3
          });
      }
    } catch (error) {
      console.error('Error updating booking streak:', error);
    }
  }

  /**
   * Process refund - remove points if needed
   */
  static async handleBookingRefund(booking: Booking) {
    try {
      // Find the transaction for this booking
      const { data: transaction } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('reference_id', booking.id)
        .eq('reference_type', 'booking')
        .eq('transaction_type', 'earned')
        .single();

      if (!transaction) return;

      // Deduct the points
      await supabase.rpc('redeem_loyalty_points', {
        p_customer_id: booking.client_id,
        p_program_id: transaction.program_id,
        p_points: Math.abs(transaction.points),
        p_reference_id: booking.id,
        p_reference_type: 'refund',
        p_description: `Points refunded for cancelled booking`
      });
    } catch (error) {
      console.error('Error handling booking refund:', error);
    }
  }

  /**
   * Award points for referral completion
   */
  static async awardReferralPoints(referralId: string, referrerId: string, referredId: string) {
    try {
      const { data: referral } = await supabase
        .from('referrals')
        .select('*')
        .eq('id', referralId)
        .single();

      if (!referral) throw new Error('Referral not found');

      const { data: program } = await supabase
        .from('loyalty_programs')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!program) throw new Error('No active loyalty program');

      // Award points to referrer
      await supabase.rpc('earn_loyalty_points', {
        p_customer_id: referrerId,
        p_program_id: program.id,
        p_points: referral.referrer_reward_points,
        p_reference_id: referralId,
        p_reference_type: 'referral',
        p_description: 'Referral bonus'
      });

      // Award points to referred
      await supabase.rpc('earn_loyalty_points', {
        p_customer_id: referredId,
        p_program_id: program.id,
        p_points: referral.reward_points,
        p_reference_id: referralId,
        p_reference_type: 'referral',
        p_description: 'Welcome bonus for joining via referral'
      });

      return true;
    } catch (error) {
      console.error('Error awarding referral points:', error);
      throw error;
    }
  }
}