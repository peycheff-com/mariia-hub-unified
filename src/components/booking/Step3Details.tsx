import { useState, useEffect } from 'react';
import { User, Mail, Phone, MessageSquare, AlertCircle, Check, Users, Shield, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { BookingStep3Schema } from '@/schemas';


interface Step3Props {
  serviceType: 'beauty' | 'fitness';
  onComplete: (data: {
    fullName: string;
    email: string;
    phone: string;
    notes?: string;
    preferences?: Record<string, any>;
    consents: {
      terms: boolean;
      marketing?: boolean;
    };
  }) => void;
  onBack?: () => void;
}

export const Step3Details = ({ serviceType, onComplete, onBack }: Step3Props) => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGuest, setIsGuest] = useState(false);
  const [isExpressBooking, setIsExpressBooking] = useState(false);
  const [showAccountOption, setShowAccountOption] = useState(true);

  // Load user data if logged in
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, booking_count, last_booking_date')
          .eq('id', user.id)
          .single();

        if (profile) {
          setFullName(profile.full_name || '');
          setPhone(profile.phone || '');

          // Check for express booking eligibility (existing customer with bookings)
          const bookingCount = profile.booking_count || 0;
          const lastBooking = profile.last_booking_date;

          if (bookingCount > 0 && lastBooking) {
            const daysSinceLastBooking = Math.floor(
              (Date.now() - new Date(lastBooking).getTime()) / (1000 * 60 * 60 * 24)
            );

            // Express booking available for customers with previous bookings
            if (daysSinceLastBooking <= 90) {
              setIsExpressBooking(true);
            }
          }

          setShowAccountOption(false); // Hide account options for logged-in users
        }
      } else {
        // No logged-in user, show account options
        setShowAccountOption(true);
      }
    } catch (error) {
      logger.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    try {
      const validatedData = BookingStep3Schema.parse({
        fullName,
        email,
        phone,
        notes: notes || undefined,
        consent: termsAccepted,
        marketingConsent: marketingAccepted
      });

      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onComplete({
        fullName,
        email,
        phone,
        notes: notes || undefined,
        consents: {
          terms: termsAccepted,
          marketing: marketingAccepted,
        },
      });
    }
  };

  // Manual submit only - removed dangerous auto-submit behavior
  // Users should explicitly click continue button to proceed

  return (
    <div className="space-y-6">
      {/* Account Options - Show for new users only */}
      {showAccountOption && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-pearl">Quick Checkout Options</h3>

          {/* Express Booking for Existing Customers */}
          {isExpressBooking && (
            <div className="bg-cocoa/20 rounded-2xl p-6 border border-champagne/20 bg-gradient-to-br from-champagne/10 to-transparent">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-champagne/20 flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-champagne" />
                </div>
                <div>
                  <h4 className="font-semibold text-pearl">Express Booking</h4>
                  <p className="text-sm text-pearl/60">Skip the form - use your saved details</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  // Auto-fill with saved data and skip to review
                  // This would trigger express booking flow
                }}
                className="w-full bg-gradient-to-r from-champagne to-bronze text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Book with Saved Details
              </Button>
            </div>
          )}

          {/* Account Options */}
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsGuest(false);
                // Trigger social login modal or redirect
              }}
              className="h-12 border-champagne/30 text-pearl hover:bg-champagne/10 hover:border-champagne/50 transition-all duration-200 flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Continue with Account
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsGuest(true)}
              className={cn(
                "h-12 border-champagne/30 text-pearl hover:bg-champagne/10 hover:border-champagne/50 transition-all duration-200 flex items-center gap-2",
                isGuest && "bg-champagne/10 border-champagne/50"
              )}
            >
              <Users className="w-4 h-4" />
              Guest Checkout
            </Button>
          </div>

          {isGuest && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h5 className="font-medium text-pearl mb-1">Guest Checkout</h5>
                  <p className="text-sm text-pearl/60">
                    Book quickly without creating an account. You can create one later for faster booking.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Social Login Options */}
          <div className="space-y-3">
            <p className="text-sm text-pearl/60 text-center">Or continue with</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  // Handle Google OAuth
                }}
                className="h-10 border-champagne/30 text-pearl hover:bg-champagne/10 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  // Handle Facebook OAuth
                }}
                className="h-10 border-champagne/30 text-pearl hover:bg-champagne/10 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-pearl">Your Information</h3>
          {isGuest && (
            <span className="text-xs bg-champagne/20 text-champagne px-2 py-1 rounded-full">
              Guest Checkout
            </span>
          )}
        </div>
        
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-pearl/80 text-sm flex items-center gap-2">
            <User className="w-4 h-4" />
            Full name
          </Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) setErrors({ ...errors, fullName: '' });
            }}
            placeholder="Maria Kowalska"
            className={cn(
              "bg-cocoa/60 border-pearl/30 text-pearl placeholder:text-pearl/40",
              errors.fullName && "border-red-500/50"
            )}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          />
          {errors.fullName && (
            <div id="fullName-error" className="text-red-400 text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.fullName}
            </div>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-pearl/80 text-sm flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </Label>
          <Input
            type="email"
            id="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            placeholder="maria@example.com"
            className={cn(
              "bg-cocoa/60 border-pearl/30 text-pearl placeholder:text-pearl/40",
              errors.email && "border-red-500/50"
            )}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <div id="email-error" className="text-red-400 text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.email}
            </div>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-pearl/80 text-sm flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone
          </Label>
          <Input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (errors.phone) setErrors({ ...errors, phone: '' });
            }}
            placeholder="+48 123 456 789"
            className={cn(
              "bg-cocoa/60 border-pearl/30 text-pearl placeholder:text-pearl/40",
              errors.phone && "border-red-500/50"
            )}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
          {errors.phone && (
            <div id="phone-error" className="text-red-400 text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.phone}
            </div>
          )}
        </div>
      </div>

      {/* Optional fields */}
      {!showOptional ? (
        <button
          onClick={() => setShowOptional(true)}
          className="text-pearl/60 hover:text-pearl text-sm underline-offset-4 hover:underline"
        >
          + Add notes or special requests
        </button>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-pearl/80 text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Notes (optional)
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={serviceType === 'beauty' 
              ? "Any allergies, skin sensitivities, or preferences..."
              : "Any injuries, fitness goals, or preferences..."
            }
            className="bg-cocoa/60 border-pearl/30 text-pearl placeholder:text-pearl/40 min-h-[80px]"
          />
        </div>
      )}

      {/* Consents */}
      <div className="space-y-3 pt-4 border-t border-pearl/10">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => {
              setTermsAccepted(checked as boolean);
              if (errors.terms) setErrors({ ...errors, terms: '' });
            }}
            className={cn(
              "mt-0.5 border-pearl/30 data-[state=checked]:bg-champagne data-[state=checked]:border-champagne",
              errors.terms && "border-red-500/50"
            )}
          />
          <label htmlFor="terms" className="text-sm text-pearl/80 cursor-pointer">
            I accept the <a href="/policies" target="_blank" className="text-champagne hover:text-champagne-400 underline">terms and conditions</a> and understand the <a href="/policies" target="_blank" className="text-champagne hover:text-champagne-400 underline">cancellation policy</a>
          </label>
        </div>
        {errors.terms && (
          <div className="text-red-400 text-xs flex items-center gap-1 ml-6">
            <AlertCircle className="w-3 h-3" />
            {errors.terms}
          </div>
        )}

        <div className="flex items-start gap-3">
          <Checkbox
            id="marketing"
            checked={marketingAccepted}
            onCheckedChange={(checked) => setMarketingAccepted(checked as boolean)}
            className="mt-0.5 border-pearl/30 data-[state=checked]:bg-champagne data-[state=checked]:border-champagne"
          />
          <label htmlFor="marketing" className="text-sm text-pearl/80 cursor-pointer">
            Send me exclusive offers and beauty/fitness tips (optional)
          </label>
        </div>
      </div>

      {/* Trust signals */}
      <div className="flex items-center gap-4 pt-4 text-xs text-pearl/60">
        <div className="flex items-center gap-1">
          <Check className="w-3 h-3 text-green-400" />
          <span>Secure booking</span>
        </div>
        <div className="flex items-center gap-1">
          <Check className="w-3 h-3 text-green-400" />
          <span>Instant confirmation</span>
        </div>
        <div className="flex items-center gap-1">
          <Check className="w-3 h-3 text-green-400" />
          <span>Free cancellation</span>
        </div>
      </div>

      {/* Continue Button */}
      <div className="pt-4">
        <Button
          onClick={handleSubmit}
          disabled={!fullName || !email || !phone || !termsAccepted || loading}
          className="w-full bg-gradient-to-r from-champagne to-bronze text-white py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? 'Loading...' : 'Review & Continue'}
        </Button>

        {/* Back button for desktop */}
        {onBack && (
          <button
            onClick={onBack}
            className="w-full mt-3 py-2 text-pearl/60 hover:text-pearl text-sm transition-colors"
          >
            Back to Time Selection
          </button>
        )}
      </div>
    </div>
  );
};