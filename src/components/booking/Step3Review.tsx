import { useState } from 'react';
import { ArrowLeft, Edit2, Check, AlertCircle, Calendar, Clock, MapPin, User, Mail, Phone, CreditCard, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Service } from '@/types/booking';

interface Step3ReviewProps {
  service: Service;
  date: string;
  time: string;
  fullName: string;
  email: string;
  phone: string;
  notes?: string;
  totalPrice: number;
  isGroupBooking?: boolean;
  groupSize?: number;
  onComplete: () => void;
  onBack: () => void;
  onEditStep: (step: 1 | 2 | 3) => void;
}

export const Step3Review = ({
  service,
  date,
  time,
  fullName,
  email,
  phone,
  notes,
  totalPrice,
  isGroupBooking = false,
  groupSize = 1,
  onComplete,
  onBack,
  onEditStep,
}: Step3ReviewProps) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      onComplete();
    } catch (error) {
      console.error('Booking confirmation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-pearl mb-2">Review Your Booking</h3>
        <p className="text-pearl/60">Please confirm all details are correct before proceeding to payment</p>
      </div>

      {/* Service Details */}
      <div className="bg-cocoa/20 rounded-2xl p-6 border border-champagne/20">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-pearl flex items-center gap-2">
            <Calendar className="w-5 h-5 text-champagne" />
            Service Details
          </h4>
          <button
            onClick={() => onEditStep(1)}
            className="text-champagne hover:text-champagne/80 text-sm flex items-center gap-1 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-champagne/20 flex items-center justify-center flex-shrink-0">
              {service.service_type === 'beauty' ?
                <div className="w-6 h-6 rounded-full bg-champagne/40" /> :
                <div className="w-6 h-6 bg-champagne/40 rounded-sm" />
              }
            </div>
            <div className="flex-1">
              <h5 className="font-medium text-pearl">{service.title}</h5>
              <p className="text-sm text-pearl/60">{service.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-pearl/60">
                <span>Duration: {service.duration_minutes} min</span>
                {isGroupBooking && (
                  <span>Group: {groupSize} participants</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Details */}
      <div className="bg-cocoa/20 rounded-2xl p-6 border border-champagne/20">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-pearl flex items-center gap-2">
            <Clock className="w-5 h-5 text-champagne" />
            Appointment Details
          </h4>
          <button
            onClick={() => onEditStep(2)}
            className="text-champagne hover:text-champagne/80 text-sm flex items-center gap-1 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-pearl/60" />
            <span className="text-pearl/80">Date:</span>
            <span className="text-pearl font-medium">{formatDate(date)}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-4 h-4 text-pearl/60" />
            <span className="text-pearl/80">Time:</span>
            <span className="text-pearl font-medium">{formatTime(time)}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="w-4 h-4 text-pearl/60" />
            <span className="text-pearl/80">Location:</span>
            <span className="text-pearl font-medium">
              {service.service_type === 'beauty' ? 'Beauty Studio' : 'Fitness Center'}
            </span>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-cocoa/20 rounded-2xl p-6 border border-champagne/20">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-pearl flex items-center gap-2">
            <User className="w-5 h-5 text-champagne" />
            Contact Information
          </h4>
          <button
            onClick={() => onEditStep(3)}
            className="text-champagne hover:text-champagne/80 text-sm flex items-center gap-1 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <User className="w-4 h-4 text-pearl/60" />
            <span className="text-pearl/80">Name:</span>
            <span className="text-pearl font-medium">{fullName}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-pearl/60" />
            <span className="text-pearl/80">Email:</span>
            <span className="text-pearl font-medium">{email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="w-4 h-4 text-pearl/60" />
            <span className="text-pearl/80">Phone:</span>
            <span className="text-pearl font-medium">{phone}</span>
          </div>
          {notes && (
            <div className="pt-2 border-t border-pearl/10">
              <p className="text-xs text-pearl/60 mb-1">Special requests:</p>
              <p className="text-sm text-pearl/80">{notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Price Summary */}
      <div className="bg-cocoa/20 rounded-2xl p-6 border border-champagne/20">
        <h4 className="text-lg font-semibold text-pearl flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-champagne" />
          Price Summary
        </h4>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-pearl/60">
              {service.title} {isGroupBooking && `(${groupSize} ×)`}
            </span>
            <span className="text-pearl">{formatPrice(totalPrice)}</span>
          </div>

          <div className="pt-2 border-t border-pearl/10">
            <div className="flex justify-between font-semibold">
              <span className="text-pearl">Total</span>
              <span className="text-champagne text-lg">{formatPrice(totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Important Information */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h5 className="font-medium text-pearl mb-1">Cancellation Policy</h5>
            <p className="text-sm text-pearl/60">
              Free cancellation up to 24 hours before your appointment.
              Late cancellations or no-shows may incur a fee.
            </p>
          </div>
        </div>
      </div>

      {/* Trust & Security */}
      <div className="flex items-center justify-center gap-6 text-xs text-pearl/60">
        <div className="flex items-center gap-1">
          <Shield className="w-4 h-4 text-green-400" />
          <span>Secure Payment</span>
        </div>
        <div className="flex items-center gap-1">
          <Check className="w-4 h-4 text-green-400" />
          <span>Instant Confirmation</span>
        </div>
        <div className="flex items-center gap-1">
          <Check className="w-4 h-4 text-green-400" />
          <span>Free Cancellation</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-4">
        <Button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="w-full bg-gradient-brand text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            `Confirm & Pay ${formatPrice(totalPrice)}`
          )}
        </Button>

        <button
          onClick={onBack}
          className="w-full py-3 text-pearl/60 hover:text-pearl text-sm transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Details
        </button>
      </div>
    </div>
  );
};