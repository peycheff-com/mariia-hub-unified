import { supabase } from '@/integrations/supabase/client';

/**
 * Service to handle email marketing for loyalty program
 * Sends automated emails for loyalty events
 */

export interface LoyaltyEmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class LoyaltyEmailService {
  /**
   * Send welcome email when customer joins loyalty program
   */
  static async sendWelcomeEmail(customerId: string) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', customerId)
        .single();

      if (!profile) return;

      const { data: loyalty } = await supabase
        .from('customer_loyalty')
        .select('tier, current_points')
        .eq('customer_id', customerId)
        .single();

      const template = this.generateWelcomeTemplate(profile, loyalty);

      await this.sendEmail(profile.email, template);
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  }

  /**
   * Send tier upgrade notification
   */
  static async sendTierUpgradeEmail(customerId: string, oldTier: string, newTier: string) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', customerId)
        .single();

      if (!profile) return;

      const template = this.generateTierUpgradeTemplate(profile, oldTier, newTier);

      await this.sendEmail(profile.email, template);
    } catch (error) {
      console.error('Error sending tier upgrade email:', error);
    }
  }

  /**
   * Send points expiring soon warning
   */
  static async sendPointsExpiringEmail(customerId: string, expiringPoints: number, expiryDate: string) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', customerId)
        .single();

      if (!profile) return;

      const { data: rewards } = await supabase
        .from('rewards_catalog')
        .select('name, points_cost')
        .eq('is_active', true)
        .order('points_cost', { ascending: true })
        .limit(3);

      const template = this.generatePointsExpiringTemplate(
        profile,
        expiringPoints,
        expiryDate,
        rewards || []
      );

      await this.sendEmail(profile.email, template);
    } catch (error) {
      console.error('Error sending points expiring email:', error);
    }
  }

  /**
   * Send achievement unlocked email
   */
  static async sendAchievementEmail(customerId: string, achievementName: string, pointsAwarded: number) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', customerId)
        .single();

      if (!profile) return;

      const template = this.generateAchievementTemplate(profile, achievementName, pointsAwarded);

      await this.sendEmail(profile.email, template);
    } catch (error) {
      console.error('Error sending achievement email:', error);
    }
  }

  /**
   * Send referral successful email to referrer
   */
  static async sendReferralSuccessEmail(referrerId: string, referredName: string, pointsAwarded: number) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', referrerId)
        .single();

      if (!profile) return;

      const template = this.generateReferralSuccessTemplate(profile, referredName, pointsAwarded);

      await this.sendEmail(profile.email, template);
    } catch (error) {
      console.error('Error sending referral success email:', error);
    }
  }

  /**
   * Send monthly loyalty statement
   */
  static async sendMonthlyStatement(customerId: string) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', customerId)
        .single();

      if (!profile) return;

      // Get monthly activity
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const { data: transactions } = await supabase
        .from('point_transactions')
        .select('points, transaction_type, description, created_at')
        .eq('customer_id', customerId)
        .gte('created_at', lastMonth.toISOString());

      const { data: loyalty } = await supabase
        .from('customer_loyalty')
        .select('current_points, tier, total_earned, total_redeemed')
        .eq('customer_id', customerId)
        .single();

      const template = this.generateMonthlyStatementTemplate(
        profile,
        loyalty,
        transactions || []
      );

      await this.sendEmail(profile.email, template);
    } catch (error) {
      console.error('Error sending monthly statement:', error);
    }
  }

  /**
   * Send birthday reward email
   */
  static async sendBirthdayRewardEmail(customerId: string, bonusPoints: number) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', customerId)
        .single();

      if (!profile) return;

      const template = this.generateBirthdayTemplate(profile, bonusPoints);

      await this.sendEmail(profile.email, template);
    } catch (error) {
      console.error('Error sending birthday email:', error);
    }
  }

  /**
   * Send personalized reward recommendations
   */
  static async sendRewardRecommendations(customerId: string) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', customerId)
        .single();

      if (!profile) return;

      const { data: loyalty } = await supabase
        .from('customer_loyalty')
        .select('current_points, tier')
        .eq('customer_id', customerId)
        .single();

      const { data: recommendations } = await supabase
        .from('rewards_catalog')
        .select('*')
        .eq('is_active', true)
        .lte('points_cost', loyalty?.current_points || 0)
        .order('points_cost', { ascending: false })
        .limit(5);

      const template = this.generateRewardRecommendationsTemplate(
        profile,
        loyalty?.current_points || 0,
        recommendations || []
      );

      await this.sendEmail(profile.email, template);
    } catch (error) {
      console.error('Error sending reward recommendations:', error);
    }
  }

  /**
   * Generate welcome email template
   */
  private static generateWelcomeTemplate(
    profile: any,
    loyalty: { tier: string; current_points: number } | null
  ): LoyaltyEmailTemplate {
    const customerName = profile.first_name || 'Valued Customer';
    const tier = loyalty?.tier || 'Bronze';
    const points = loyalty?.current_points || 0;
    const tierIcon = tier === 'platinum' ? '💎' : tier === 'gold' ? '🥇' : tier === 'silver' ? '🥈' : '🥉';

    return {
      subject: `Welcome to Mariia Beauty & Fitness Rewards!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B4513; margin-bottom: 10px;">Welcome to Our Loyalty Program!</h1>
            <p style="font-size: 18px; color: #666;">Hi ${customerName},</p>
          </div>

          <div style="background: linear-gradient(135deg, #F5DEB3, #8B4513); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <div style="text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">${tierIcon}</div>
              <h2 style="margin: 0; font-size: 24px;">You're a ${tier} Member!</h2>
              <p style="font-size: 18px; margin: 10px 0;">Current Balance: ${points} points</p>
            </div>
          </div>

          <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
            <h3 style="color: #8B4513; margin-top: 0;">How It Works:</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li>Earn 1 point for every PLN spent on services</li>
              <li>Unlock special rewards as you accumulate points</li>
              <li>Enjoy tier multipliers - higher tiers earn more!</li>
              <li>Refer friends and earn bonus points</li>
            </ul>
          </div>

          <div style="text-align: center;">
            <a href="${window.location.origin}/loyalty"
               style="background: #8B4513; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Your Rewards
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px;">
            <p>Mariia Beauty & Fitness | Your loyalty journey starts here!</p>
          </div>
        </div>
      `,
      text: `
        Welcome to Mariia Beauty & Fitness Rewards!

        Hi ${customerName},

        Thank you for joining our loyalty program! You're now a ${tier} member with ${points} points.

        How it works:
        - Earn 1 point for every PLN spent
        - Unlock special rewards
        - Enjoy tier multipliers
        - Refer friends for bonus points

        View your rewards: ${window.location.origin}/loyalty

        The Mariia Beauty & Fitness Team
      `
    };
  }

  /**
   * Generate tier upgrade template
   */
  private static generateTierUpgradeTemplate(
    profile: any,
    oldTier: string,
    newTier: string
  ): LoyaltyEmailTemplate {
    const customerName = profile.first_name || 'Valued Customer';
    const tierIcon = newTier === 'platinum' ? '💎' : newTier === 'gold' ? '🥇' : newTier === 'silver' ? '🥈' : '🥉';

    return {
      subject: `🎉 Congratulations! You've Reached ${newTier} Status!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B4513; margin-bottom: 10px;">Congratulations, ${customerName}!</h1>
            <div style="font-size: 72px; margin: 20px 0;">${tierIcon}</div>
            <h2 style="color: #8B4513; margin: 0; font-size: 28px;">You're Now ${newTier}!</h2>
          </div>

          <div style="background: linear-gradient(135deg, #FFD700, #FFA500); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h3 style="margin-top: 0; text-align: center;">Your New Benefits:</h3>
            <ul style="text-align: left; display: inline-block;">
              ${newTier === 'gold' || newTier === 'platinum' ? '<li>✨ Enhanced point multiplier</li>' : ''}
              ${newTier !== 'bronze' ? '<li>🎁 Birthday bonus points</li>' : ''}
              ${newTier === 'gold' || newTier === 'platinum' ? '<li>👑 Priority booking access</li>' : ''}
              ${newTier === 'platinum' ? '<li>💎 Personal concierge service</li>' : ''}
            </ul>
          </div>

          <div style="text-align: center;">
            <a href="${window.location.origin}/loyalty"
               style="background: #8B4513; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Explore Your New Perks
            </a>
          </div>
        </div>
      `,
      text: `
        Congratulations, ${customerName}!

        You've been upgraded to ${newTier} status!

        Your new benefits include:
        ${newTier === 'gold' || newTier === 'platinum' ? '- Enhanced point multiplier' : ''}
        ${newTier !== 'bronze' ? '- Birthday bonus points' : ''}
        ${newTier === 'gold' || newTier === 'platinum' ? '- Priority booking access' : ''}
        ${newTier === 'platinum' ? '- Personal concierge service' : ''}

        Explore your perks: ${window.location.origin}/loyalty

        The Mariia Beauty & Fitness Team
      `
    };
  }

  /**
   * Generate points expiring template
   */
  private static generatePointsExpiringTemplate(
    profile: any,
    expiringPoints: number,
    expiryDate: string,
    availableRewards: any[]
  ): LoyaltyEmailTemplate {
    const customerName = profile.first_name || 'Valued Customer';
    const formattedDate = new Date(expiryDate).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    return {
      subject: `⚠️ Points Expiring Soon - ${expiringPoints} Points`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #8B4513; text-align: center;">Points Expiring Soon!</h2>

          <p>Hi ${customerName},</p>
          <p>You have <strong style="font-size: 24px; color: #e74c3c;">${expiringPoints} points</strong>
             expiring on <strong>${formattedDate}</strong>.</p>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">Don't let your points go to waste! Redeem them for amazing rewards.</p>
          </div>

          ${availableRewards.length > 0 ? `
            <h3 style="color: #8B4513;">You Can Get:</h3>
            <ul style="list-style: none; padding: 0;">
              ${availableRewards.map(reward => `
                <li style="background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 5px;">
                  <strong>${reward.name}</strong> - ${reward.points_cost} points
                </li>
              `).join('')}
            </ul>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${window.location.origin}/loyalty?tab=rewards"
               style="background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Redeem Your Points Now
            </a>
          </div>
        </div>
      `,
      text: `
        Points Expiring Soon!

        Hi ${customerName},

        You have ${expiringPoints} points expiring on ${formattedDate}.

        Don't let your points expire! Redeem them for rewards now.

        Redeem points: ${window.location.origin}/loyalty?tab=rewards

        The Mariia Beauty & Fitness Team
      `
    };
  }

  /**
   * Generate achievement template
   */
  private static generateAchievementTemplate(
    profile: any,
    achievementName: string,
    pointsAwarded: number
  ): LoyaltyEmailTemplate {
    const customerName = profile.first_name || 'Valued Customer';

    return {
      subject: `🏆 Achievement Unlocked: ${achievementName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
          <div style="font-size: 72px; margin: 20px 0;">🏆</div>
          <h2 style="color: #8B4513;">Achievement Unlocked!</h2>
          <h3 style="color: #666; margin: 10px 0;">${achievementName}</h3>

          ${pointsAwarded > 0 ? `
            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <p style="margin: 0; font-size: 18px; color: #155724;">
                You've earned <strong>${pointsAwarded} bonus points!</strong>
              </p>
            </div>
          ` : ''}

          <div style="margin: 30px 0;">
            <p style="color: #666;">Keep up the great work! More achievements await.</p>
          </div>

          <a href="${window.location.origin}/loyalty?tab=achievements"
             style="background: #8B4513; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View All Achievements
          </a>
        </div>
      `,
      text: `
        Achievement Unlocked: ${achievementName}

        Hi ${customerName},

        Congratulations on unlocking: ${achievementName}
        ${pointsAwarded > 0 ? `\nYou've earned ${pointsAwarded} bonus points!` : ''}

        Keep up the great work!

        View achievements: ${window.location.origin}/loyalty?tab=achievements

        The Mariia Beauty & Fitness Team
      `
    };
  }

  /**
   * Generate referral success template
   */
  private static generateReferralSuccessTemplate(
    profile: any,
    referredName: string,
    pointsAwarded: number
  ): LoyaltyEmailTemplate {
    const customerName = profile.first_name || 'Valued Customer';

    return {
      subject: `🎉 Referral Success! ${pointsAwarded} Points Earned`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #8B4513; text-align: center;">Your Referral Was Successful!</h2>

          <p>Hi ${customerName},</p>
          <p>Great news! ${referredName} has completed their first booking using your referral code.</p>

          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 30px; border-radius: 10px; text-align: center; margin: 30px 0;">
            <div style="font-size: 48px; margin-bottom: 10px;">🎁</div>
            <p style="margin: 0; font-size: 24px; color: #155724;">
              <strong>${pointsAwarded} Points Earned!</strong>
            </p>
          </div>

          <p style="text-align: center; color: #666;">Keep sharing your code and earn more rewards!</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${window.location.origin}/loyalty?tab=referrals"
               style="background: #8B4513; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Your Referrals
            </a>
          </div>
        </div>
      `,
      text: `
        Referral Success!

        Hi ${customerName},

        Great news! ${referredName} has completed their first booking using your referral code.

        You've earned ${pointsAwarded} points!

        Keep sharing and earn more rewards.

        The Mariia Beauty & Fitness Team
      `
    };
  }

  /**
   * Generate birthday template
   */
  private static generateBirthdayTemplate(profile: any, bonusPoints: number): LoyaltyEmailTemplate {
    const customerName = profile.first_name || 'Valued Customer';

    return {
      subject: `🎂 Happy Birthday from Mariia Beauty & Fitness!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
          <div style="font-size: 72px; margin: 20px 0;">🎂</div>
          <h1 style="color: #8B4513;">Happy Birthday, ${customerName}!</h1>

          <p style="font-size: 18px; color: #666; margin: 30px 0;">
            To celebrate your special day, we've added <strong style="font-size: 24px; color: #e74c3c;">${bonusPoints} bonus points</strong> to your account!
          </p>

          <div style="background: linear-gradient(135deg, #ffc0cb, #ffb6c1); padding: 30px; border-radius: 10px; margin: 30px 0;">
            <h3 style="color: #8B4513; margin-top: 0;">Treat Yourself!</h3>
            <p style="color: #666;">Use your points for a special birthday treatment or save them for a future visit.</p>
          </div>

          <div style="margin: 30px 0;">
            <p style="color: #8B4513; font-style: italic;">Wishing you a beautiful day filled with joy and relaxation!</p>
          </div>

          <a href="${window.location.origin}/booking"
             style="background: #8B4513; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Book Your Birthday Treatment
          </a>
        </div>
      `,
      text: `
        Happy Birthday, ${customerName}!

        To celebrate your special day, we've added ${bonusPoints} bonus points to your account!

        Treat yourself to something special on us.

        Book now: ${window.location.origin}/booking

        Wishing you a wonderful birthday filled with joy!

        The Mariia Beauty & Fitness Team
      `
    };
  }

  /**
   * Generate monthly statement template
   */
  private static generateMonthlyStatementTemplate(
    profile: any,
    loyalty: any,
    transactions: any[]
  ): LoyaltyEmailTemplate {
    const customerName = profile.first_name || 'Valued Customer';
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const earnedThisMonth = transactions
      .filter(t => t.transaction_type === 'earned')
      .reduce((sum, t) => sum + t.points, 0);

    const redeemedThisMonth = transactions
      .filter(t => t.transaction_type === 'redeemed')
      .reduce((sum, t) => sum + Math.abs(t.points), 0);

    return {
      subject: `Your Loyalty Statement - ${currentMonth}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #8B4513;">Loyalty Statement - ${currentMonth}</h2>
          <p>Hi ${customerName},</p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
              <h4 style="margin: 0; color: #666;">Current Balance</h4>
              <p style="font-size: 28px; margin: 10px 0; color: #8B4513;">${loyalty?.current_points || 0}</p>
              <p style="margin: 0; color: #666;">points</p>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
              <h4 style="margin: 0; color: #666;">Your Tier</h4>
              <p style="font-size: 24px; margin: 10px 0; color: #8B4513; text-transform: capitalize;">${loyalty?.tier || 'Bronze'}</p>
              <p style="margin: 0; color: #666;">status</p>
            </div>
          </div>

          <div style="background: #e9ecef; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h4 style="margin-top: 0;">This Month's Activity</h4>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span>Points Earned:</span>
              <strong>+${earnedThisMonth}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span>Points Redeemed:</span>
              <strong>-${redeemedThisMonth}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span>Net Change:</span>
              <strong style="color: ${earnedThisMonth > redeemedThisMonth ? '#28a745' : '#dc3545'}">
                ${earnedThisMonth > redeemedThisMonth ? '+' : ''}${earnedThisMonth - redeemedThisMonth}
              </strong>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${window.location.origin}/loyalty"
               style="background: #8B4513; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Full Activity
            </a>
          </div>
        </div>
      `,
      text: `
        Loyalty Statement - ${currentMonth}

        Hi ${customerName},

        Here's your loyalty activity summary for ${currentMonth}:

        Current Balance: ${loyalty?.current_points || 0} points
        Your Tier: ${loyalty?.tier || 'Bronze'}

        This Month:
        Points Earned: +${earnedThisMonth}
        Points Redeemed: -${redeemedThisMonth}
        Net Change: ${earnedThisMonth > redeemedThisMonth ? '+' : ''}${earnedThisMonth - redeemedThisMonth}

        View full activity: ${window.location.origin}/loyalty

        The Mariia Beauty & Fitness Team
      `
    };
  }

  /**
   * Generate reward recommendations template
   */
  private static generateRewardRecommendationsTemplate(
    profile: any,
    currentPoints: number,
    recommendations: any[]
  ): LoyaltyEmailTemplate {
    const customerName = profile.first_name || 'Valued Customer';

    return {
      subject: `💝 New Rewards Available With Your Points!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #8B4513; text-align: center;">Exclusive Rewards For You!</h2>
          <p>Hi ${customerName},</p>
          <p>You have <strong style="font-size: 24px; color: #8B4513;">${currentPoints} points</strong> ready to redeem!</p>

          ${recommendations.length > 0 ? `
            <h3 style="color: #8B4513; margin: 30px 0 15px 0;">Recommended For You:</h3>
            ${recommendations.map(reward => `
              <div style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #8B4513;">
                <h4 style="margin: 0 0 5px 0;">${reward.name}</h4>
                <p style="margin: 0; color: #666; font-size: 14px;">${reward.description}</p>
                <p style="margin: 10px 0 0 0; color: #8B4513; font-weight: bold;">${reward.points_cost} points</p>
              </div>
            `).join('')}
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${window.location.origin}/loyalty?tab=rewards"
               style="background: #8B4513; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Redeem Your Rewards
            </a>
          </div>
        </div>
      `,
      text: `
        Exclusive Rewards Available!

        Hi ${customerName},

        You have ${currentPoints} points ready to redeem!

        ${recommendations.length > 0 ? 'Recommended rewards:\n' + recommendations.map(r => `- ${r.name} (${r.points_cost} points)`).join('\n') : ''}

        Redeem now: ${window.location.origin}/loyalty?tab=rewards

        The Mariia Beauty & Fitness Team
      `
    };
  }

  /**
   * Send email (placeholder - integrate with your email service)
   */
  private static async sendEmail(to: string, template: LoyaltyEmailTemplate) {
    // This is where you'd integrate with your email service
    // For example: SendGrid, Mailgun, AWS SES, etc.

    console.log('Sending email:', {
      to,
      subject: template.subject,
      html: template.html
    });

    // Example with a generic email API:
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject: template.subject,
          html: template.html,
          text: template.text
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      return await response.json();
    } catch (error) {
      console.error('Email service error:', error);
      // In production, you might want to log this to a monitoring service
      throw error;
    }
  }

  /**
   * Batch send emails for expiring points (run daily)
   */
  static async sendExpiringPointsBatch() {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      // Get customers with points expiring in 30 days
      const { data: expiringPoints } = await supabase
        .from('point_transactions')
        .select(`
          customer_id,
          SUM(points) as expiring_points,
          expires_at
        `)
        .eq('transaction_type', 'earned')
        .lt('expires_at', thirtyDaysFromNow.toISOString())
        .gt('expires_at', new Date().toISOString())
        .group('customer_id, expires_at');

      if (expiringPoints) {
        for (const customer of expiringPoints) {
          await this.sendPointsExpiringEmail(
            customer.customer_id,
            customer.expiring_points,
            customer.expires_at
          );
        }
      }
    } catch (error) {
      console.error('Error in batch sending expiring points emails:', error);
    }
  }
}