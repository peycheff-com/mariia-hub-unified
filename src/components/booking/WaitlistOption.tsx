import React, { useState } from 'react';
import { Clock, Calendar, Bell, CheckCircle, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useBookingService, useBookingTimeSlot, useBookingWaitlist } from '@/stores/bookingStore';
import { waitlistService } from '@/services/waitlist.service';

interface WaitlistOptionProps {
  onWaitlistJoined?: () => void;
  onCancel?: () => void;
}

export function WaitlistOption({ onWaitlistJoined, onCancel }: WaitlistOptionProps) {
  const selectedService = useBookingService();
  const selectedTimeSlot = useBookingTimeSlot();
  const { waitlistMode, setWaitlistMode, waitlistEntry, setWaitlistEntry, joinWaitlist } = useBookingWaitlist();

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    flexibleWithTime: true,
    flexibleWithLocation: false,
    notes: '',
    preferredTimeRange: {
      start: '09:00',
      end: '17:00',
    },
    notificationPreferences: {
      email: true,
      sms: false,
      push: true,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!selectedService || !selectedTimeSlot || !waitlistMode) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Set waitlist entry
      setWaitlistEntry({
        serviceId: selectedService.id,
        preferredDate: selectedTimeSlot.date,
        preferredTime: selectedTimeSlot.time,
        flexibleWithTime: formData.flexibleWithTime,
        contactEmail: formData.email,
        contactPhone: formData.phone,
      });

      // Join waitlist
      await joinWaitlist();

      onWaitlistJoined?.();
    } catch (error) {
      console.error('Failed to join waitlist:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Join Waitlist
        </CardTitle>
        <CardDescription>
          The selected time slot is fully booked. Join our waitlist and we'll notify you
          as soon as a spot becomes available.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Selection Summary */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <h4 className="font-medium">Selected Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {selectedTimeSlot.date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{selectedTimeSlot.time}</span>
            </div>
          </div>
          <div className="pt-2">
            <span className="font-medium">Service:</span> {selectedService.title}
          </div>
        </div>

        {/* Waitlist Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="font-medium">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="waitlist-email">Email *</Label>
                <Input
                  id="waitlist-email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="waitlist-phone">Phone Number</Label>
                <Input
                  id="waitlist-phone"
                  type="tel"
                  placeholder="+48 123 456 789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Flexibility Options */}
          <div className="space-y-3">
            <h4 className="font-medium">Flexibility Options</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="flexible-time">Flexible with time</Label>
                  <p className="text-xs text-muted-foreground">
                    Accept different times on the same day if your preferred time becomes available
                  </p>
                </div>
                <Switch
                  id="flexible-time"
                  checked={formData.flexibleWithTime}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, flexibleWithTime: checked })
                  }
                />
              </div>

              {formData.flexibleWithTime && (
                <div className="p-3 bg-muted rounded-lg">
                  <Label className="text-sm font-medium">Preferred Time Range</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <Label htmlFor="time-start" className="text-xs">
                        Earliest time
                      </Label>
                      <Input
                        id="time-start"
                        type="time"
                        value={formData.preferredTimeRange.start}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            preferredTimeRange: {
                              ...formData.preferredTimeRange,
                              start: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="time-end" className="text-xs">
                        Latest time
                      </Label>
                      <Input
                        id="time-end"
                        type="time"
                        value={formData.preferredTimeRange.end}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            preferredTimeRange: {
                              ...formData.preferredTimeRange,
                              end: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="flexible-location">Flexible with location</Label>
                  <p className="text-xs text-muted-foreground">
                    Accept nearby locations if your preferred location is fully booked
                  </p>
                </div>
                <Switch
                  id="flexible-location"
                  checked={formData.flexibleWithLocation}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, flexibleWithLocation: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="space-y-3">
            <h4 className="font-medium">Notification Preferences</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify-email"
                  checked={formData.notification aria-live="polite" aria-atomic="true"Preferences.email}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      notificationPreferences: {
                        ...formData.notification aria-live="polite" aria-atomic="true"Preferences,
                        email: checked as boolean,
                      },
                    })
                  }
                />
                <Label htmlFor="notify-email" className="text-sm">
                  Email notification aria-live="polite" aria-atomic="true"s
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify-sms"
                  checked={formData.notification aria-live="polite" aria-atomic="true"Preferences.sms}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      notificationPreferences: {
                        ...formData.notification aria-live="polite" aria-atomic="true"Preferences,
                        sms: checked as boolean,
                      },
                    })
                  }
                />
                <Label htmlFor="notify-sms" className="text-sm">
                  SMS notification aria-live="polite" aria-atomic="true"s
                </Label>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="waitlist-notes">Additional Notes (Optional)</Label>
            <Textarea
              id="waitlist-notes"
              placeholder="Any special requirements or preferences..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Waitlist Benefits */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
            <h4 className="font-medium text-blue-900 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Waitlist Benefits
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Priority notification aria-live="polite" aria-atomic="true" when spots become available</li>
              <li>• 15-minute priority window to book</li>
              <li>• Automatic consideration for cancellations</li>
              <li>• No obligation to book if contacted</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              className="flex-1"
              disabled={!formData.email || isSubmitting}
            >
              {isSubmitting ? 'Joining Waitlist...' : 'Join Waitlist'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Back to Calendar
            </Button>
          </div>
        </form>

        {/* Info Alert */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="text-xs text-amber-800">
              <p className="font-medium mb-1">How Waitlist Works:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>You'll receive a notification aria-live="polite" aria-atomic="true" when a spot becomes available</li>
                <li>You'll have 15 minutes to claim the spot</li>
                <li>If you don't respond, the spot goes to the next person</li>
                <li>You can remove yourself from the waitlist at any time</li>
              </ol>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}