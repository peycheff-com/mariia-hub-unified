import { useEffect, useState, useCallback } from 'react';
import { Shield, TrendingUp, Clock, Users, Star, Award, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

interface TrustSignalsProps {
  serviceType?: 'beauty' | 'fitness';
  currentStep?: number;
  serviceName?: string;
  price?: number;
  urgencyData?: {
    slotsLeftToday?: number;
    nextAvailableIn?: number; // days
    popularTimeSlots?: string[];
    bookingRate?: number; // bookings/hour
  };
  socialProof?: {
    recentBookings?: number;
    averageRating?: number;
    totalReviews?: number;
    popularToday?: boolean;
  };
  className?: string;
}

export const TrustSignals = ({
  serviceType,
  currentStep = 1,
  serviceName,
  price,
  urgencyData,
  socialProof,
  className
}: TrustSignalsProps) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState('');

  // Countdown timer for urgency
  useEffect(() => {
    if (!urgencyData?.popularTimeSlots?.length) return;

    const interval = setInterval(() => {
      const now = new Date();
      const [hours, minutes] = urgencyData.popularTimeSlots[0].split(':');
      const targetTime = new Date();
      targetTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }

      const diff = targetTime.getTime() - now.getTime();
      const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
      const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${hoursLeft}h ${minutesLeft}m`);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [urgencyData?.popularTimeSlots]);

  const getUrgencyMessage = () => {
    if (urgencyData?.slotsLeftToday === 0) {
      return {
        text: t('booking.urgency.noSlotsToday', 'No slots available today'),
        level: 'high' as const,
        icon: Clock
      };
    }

    if (urgencyData?.slotsLeftToday && urgencyData.slotsLeftToday <= 2) {
      return {
        text: t('booking.urgency.fewSlotsLeft', 'Only {{count}} slots left today', { count: urgencyData.slotsLeftToday }),
        level: 'high' as const,
        icon: Clock,
        countdown: timeLeft
      };
    }

    if (socialProof?.popularToday) {
      return {
        text: t('booking.urgency.popularToday', 'High demand today'),
        level: 'medium' as const,
        icon: TrendingUp
      };
    }

    if (urgencyData?.nextAvailableIn && urgencyData.nextAvailableIn > 1) {
      return {
        text: t('booking.urguity.nextAvailable', 'Next available in {{days}} days', { days: urgencyData.nextAvailableIn }),
        level: 'low' as const,
        icon: Clock
      };
    }

    return null;
  };

  const urgencyMessage = getUrgencyMessage();

  return (
    <div className={cn(
      "space-y-3 p-4 rounded-2xl",
      "bg-gradient-to-br from-white/5 via-champagne/5 to-white/5",
      "border border-champagne/20 backdrop-blur-sm",
      className
    )}>
      {/* Trust Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <Shield className="w-4 h-4 text-green-500" />
          <div className="text-xs">
            <div className="font-medium text-green-600">Secure Booking</div>
            <div className="text-green-500/60">SSL Protected</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Award className="w-4 h-4 text-blue-500" />
          <div className="text-xs">
            <div className="font-medium text-blue-600">Expert Staff</div>
            <div className="text-blue-500/60">Verified</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <Star className="w-4 h-4 text-purple-500" />
          <div className="text-xs">
            <div className="font-medium text-purple-600">Top Rated</div>
            <div className="text-purple-500/60">4.9/5</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <CheckCircle className="w-4 h-4 text-orange-500" />
          <div className="text-xs">
            <div className="font-medium text-orange-600">Satisfaction</div>
            <div className="text-orange-500/60">Guaranteed</div>
          </div>
        </div>
      </div>

      {/* Urgency Indicator */}
      {urgencyMessage && (
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-xl border",
          urgencyMessage.level === 'high'
            ? "bg-red-500/10 border-red-500/20 text-red-600"
            : urgencyMessage.level === 'medium'
            ? "bg-orange-500/10 border-orange-500/20 text-orange-600"
            : "bg-blue-500/10 border-blue-500/20 text-blue-600"
        )}>
          <urgencyMessage.icon className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-sm">{urgencyMessage.text}</div>
            {urgencyMessage.countdown && (
              <div className="text-xs opacity-80 mt-0.5">
                {t('booking.urgency.timeRemaining', 'Ends in {{time}}', { time: urgencyMessage.countdown })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Social Proof */}
      {socialProof && (
        <div className="space-y-2">
          {/* Recent Activity */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-champagne/10">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-champagne-600" />
              <span className="text-sm font-medium text-champagne-700">
                {socialProof.recentBookings || 12} {t('booking.socialProof.bookingsToday', 'bookings today')}
              </span>
            </div>
            {socialProof.averageRating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-xs text-champagne-600">
                  {socialProof.averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-champagne/60">
                  ({socialProof.totalReviews}+)
                </span>
              </div>
            )}
          </div>

          {/* Service-specific Social Proof */}
          {serviceName && price && (
            <div className="text-xs text-champagne/60 text-center">
              {t('booking.socialProof.servicePopularity',
                '{{service}} is booked every {{hours}} hours on average',
                { service: serviceName, hours: Math.max(1, Math.floor(24 / (socialProof.recentBookings || 12))) }
              )}
            </div>
          )}
        </div>
      )}

      {/* Cancellation Policy */}
      <div className="text-xs text-champagne/60 text-center border-t border-champagne/10 pt-3">
        <CheckCircle className="w-3 h-3 inline mr-1" />
        {t('booking.cancellation.freeUpTo', 'Free cancellation up to 24 hours before')}
      </div>
    </div>
  );
};