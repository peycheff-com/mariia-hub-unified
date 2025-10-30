import { loyaltyService } from './loyalty.service';
import { supabase } from '@/integrations/supabase/client';

/**
 * Integration service to connect loyalty program with booking system
 * Automatically awards points and processes loyalty-related events
 */
export class LoyaltyIntegrationService {

  /**
   * Award points for a completed booking
   */
  async awardBookingPoints(bookingId: string): Promise<void> {
    try {
      // Get booking details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          services!inner(
            id,
            service_type,
            price,
            title,
            duration_minutes
          )
        `)
        .eq('id', bookingId)
        .eq('status', 'completed')
        .single();

      if (bookingError || !booking) {
        console.log('Booking not found or not completed:', bookingId);
        return;
      }

      // Get or create loyalty member
      const member = await loyaltyService.getLoyaltyMember(booking.user_id);
      if (!member) {
        console.log('No loyalty member found for user:', booking.user_id);
        return;
      }

      // Get loyalty settings for point calculation
      const settings = await loyaltyService.getLoyaltySettings('points_earn_rates');
      const earnRates = settings?.booking || {
        beauty: 10,
        fitness: 8,
        lifestyle: 6
      };

      // Calculate base points
      const basePoints = earnRates[booking.services.service_type] || 5;

      // Apply tier multiplier
      const tierMultiplier = member.tier?.points_multiplier || 1.0;
      const finalPoints = Math.round(basePoints * tierMultiplier);

      // Award points
      await loyaltyService.earnPoints(
        member.id,
        finalPoints,
        `Booking completed: ${booking.services.title}`,
        'earn',
        'booking',
        booking.id,
        booking.id
      );

      // Update member stats
      await this.updateMemberStats(member.id, booking);

      // Check for achievements
      await loyaltyService.checkAchievements(member.id, 'booking', {
        bookingId,
        serviceType: booking.services.service_type,
        totalPrice: booking.total_amount
      });

      console.log(`Awarded ${finalPoints} points for booking ${bookingId}`);
    } catch (error) {
      console.error('Error awarding booking points:', error);
    }
  }

  /**
   * Award points for leaving a review
   */
  async awardReviewPoints(reviewId: string): Promise<void> {
    try {
      // Get review details
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select(`
          *,
          bookings!inner(
            user_id,
            services!inner(service_type)
          )
        `)
        .eq('id', reviewId)
        .eq('is_public', true)
        .single();

      if (reviewError || !review) {
        console.log('Review not found or not public:', reviewId);
        return;
      }

      // Get loyalty member
      const member = await loyaltyService.getLoyaltyMember(review.bookings.user_id);
      if (!member) return;

      // Get review points from settings
      const settings = await loyaltyService.getLoyaltySettings('points_earn_rates');
      const reviewPoints = settings?.review || 25;

      // Award points
      await loyaltyService.earnPoints(
        member.id,
        reviewPoints,
        `Review submitted for ${review.bookings.services.title}`,
        'earn',
        'review',
        review.id
      );

      // Check for achievements
      await loyaltyService.checkAchievements(member.id, 'review', {
        reviewId,
        rating: review.rating
      });

      console.log(`Awarded ${reviewPoints} points for review ${reviewId}`);
    } catch (error) {
      console.error('Error awarding review points:', error);
    }
  }

  /**
   * Process a successful referral
   */
  async processReferral(referralCode: string, newUserId: string): Promise<void> {
    try {
      // Find referral by code
      const referral = await loyaltyService.checkReferralCode(referralCode);
      if (!referral) {
        console.log('Invalid or expired referral code:', referralCode);
        return;
      }

      // Process the successful referral
      await loyaltyService.processSuccessfulReferral(referral.id, newUserId);

      console.log(`Processed successful referral ${referralCode} for user ${newUserId}`);
    } catch (error) {
      console.error('Error processing referral:', error);
    }
  }

  /**
   * Award birthday bonus points
   */
  async awardBirthdayBonus(userId: string): Promise<void> {
    try {
      const member = await loyaltyService.getLoyaltyMember(userId);
      if (!member) return;

      // Check if birthday bonus already awarded this year
      const currentYear = new Date().getFullYear();
      const currentYearStart = new Date(currentYear, 0, 1).toISOString();

      const { data: existingBonus } = await supabase
        .from('points_transactions')
        .select('id')
        .eq('member_id', member.id)
        .eq('transaction_type', 'bonus')
        .eq('reference_type', 'birthday')
        .gte('created_at', currentYearStart)
        .limit(1);

      if (existingBonus && existingBonus.length > 0) {
        console.log('Birthday bonus already awarded this year for user:', userId);
        return;
      }

      // Get birthday points from settings
      const settings = await loyaltyService.getLoyaltySettings('points_earn_rates');
      const birthdayPoints = settings?.birthday || 50;

      // Award birthday points
      await loyaltyService.earnPoints(
        member.id,
        birthdayPoints,
        'Happy Birthday! Special bonus points from us',
        'bonus',
        'birthday'
      );

      console.log(`Awarded ${birthdayPoints} birthday bonus points to user ${userId}`);
    } catch (error) {
      console.error('Error awarding birthday bonus:', error);
    }
  }

  /**
   * Award points for social media engagement
   */
  async awardSocialPoints(userId: string, platform: string, action: string): Promise<void> {
    try {
      const member = await loyaltyService.getLoyaltyMember(userId);
      if (!member) return;

      // Get social points from settings
      const settings = await loyaltyService.getLoyaltySettings('points_earn_rates');
      const socialPoints = settings?.social_share || 5;

      // Award points
      await loyaltyService.earnPoints(
        member.id,
        socialPoints,
        `Social media engagement: ${action} on ${platform}`,
        'earn',
        'social',
        null
      );

      console.log(`Awarded ${socialPoints} social points to user ${userId}`);
    } catch (error) {
      console.error('Error awarding social points:', error);
    }
  }

  /**
   * Update member statistics after booking
   */
  private async updateMemberStats(memberId: string, booking: any): Promise<void> {
    try {
      // Update total visits and spend
      await supabase
        .from('loyalty_members')
        .update({
          total_visits: supabase.rpc('increment', { x: 1 }),
          total_spend: supabase.rpc('increment', { x: booking.total_amount })
        })
        .eq('id', memberId);

      // Check for tier advancement
      await supabase.rpc('check_tier_advancement', { p_member_id: memberId });
    } catch (error) {
      console.error('Error updating member stats:', error);
    }
  }

  /**
   * Process expiring points notifications
   */
  async processExpiringPointsNotifications(): Promise<void> {
    try {
      // Get members with points expiring in the next 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data: expiringPoints } = await supabase
        .from('points_transactions')
        .select(`
          member_id:loyalty_members!inner(
            user_id,
            member_number,
            current_points
          ),
          points,
          expires_at
        `)
        .eq('transaction_type', 'earn')
        .lt('expires_at', thirtyDaysFromNow.toISOString())
        .gt('expires_at', new Date().toISOString());

      if (expiringPoints) {
        // Group by member and calculate total expiring points
        const memberExpiringPoints = expiringPoints.reduce((acc: any, transaction: any) => {
          const memberId = transaction.member_id;
          if (!acc[memberId]) {
            acc[memberId] = {
              member: transaction.member_id,
              totalPoints: 0,
              earliestExpiry: transaction.expires_at
            };
          }
          acc[memberId].totalPoints += transaction.points;
          if (new Date(transaction.expires_at) < new Date(acc[memberId].earliestExpiry)) {
            acc[memberId].earliestExpiry = transaction.expires_at;
          }
          return acc;
        }, {});

        // Send notifications (this would integrate with your notification system)
        Object.values(memberExpiringPoints).forEach((memberData: any) => {
          console.log(`Points expiring notification for member ${memberData.member.member_number}: ${memberData.totalTotalPoints} points expiring on ${memberData.earliestExpiry}`);
        });
      }
    } catch (error) {
      console.error('Error processing expiring points notifications:', error);
    }
  }

  /**
   * Create welcome series for new loyalty members
   */
  async createWelcomeSeries(memberId: string): Promise<void> {
    try {
      const { data: member } = await supabase
        .from('loyalty_members')
        .select(`
          *,
          user:profiles!inner(email, full_name)
        `)
        .eq('id', memberId)
        .single();

      if (!member) return;

      // Create a series of welcome notifications/emails
      const welcomeSteps = [
        {
          delay: 0, // Immediate
          title: 'Welcome to Our Loyalty Program!',
          message: `Thank you for joining our loyalty program, ${member.user.full_name}! You've been enrolled in our ${member.tier?.name || 'Bronze'} tier.`
        },
        {
          delay: 1, // 1 day
          title: 'Start Earning Points',
          message: 'Did you know you earn points for every booking? Plus, get bonus points for reviews and referrals!'
        },
        {
          delay: 7, // 7 days
          title: 'Explore Your Benefits',
          message: 'Check out our rewards catalog and see what you can redeem with your points!'
        }
      ];

      welcomeSteps.forEach((step, index) => {
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + step.delay);

        console.log(`Scheduled welcome email ${index + 1} for ${member.user.email} on ${scheduledDate.toISOString()}: ${step.title}`);
        // In a real implementation, this would integrate with your email service
      });
    } catch (error) {
      console.error('Error creating welcome series:', error);
    }
  }

  /**
   * Generate loyalty analytics data
   */
  async generateAnalytics(dateRange: { start: Date; end: Date }): Promise<any> {
    try {
      const startDate = dateRange.start.toISOString();
      const endDate = dateRange.end.toISOString();

      // Get overview stats
      const { data: members } = await supabase
        .from('loyalty_members')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const { data: transactions } = await supabase
        .from('points_transactions')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const { data: redemptions } = await supabase
        .from('reward_redemptions')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      return {
        newMembers: members?.length || 0,
        totalPointsIssued: transactions?.filter(t => t.transaction_type === 'earn').reduce((sum, t) => sum + t.points, 0) || 0,
        totalPointsRedeemed: transactions?.filter(t => t.transaction_type === 'redeem').reduce((sum, t) => sum + Math.abs(t.points), 0) || 0,
        rewardsRedeemed: redemptions?.length || 0,
        newReferrals: referrals?.length || 0,
        completedReferrals: referrals?.filter(r => r.status === 'completed').length || 0
      };
    } catch (error) {
      console.error('Error generating analytics:', error);
      return null;
    }
  }
}

export const loyaltyIntegrationService = new LoyaltyIntegrationService();