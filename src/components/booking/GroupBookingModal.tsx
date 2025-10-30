import React, { useState, useEffect } from 'react';
import { X, Users, Plus, Trash2, Mail, Phone, Check, AlertCircle, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast aria-live="polite" aria-atomic="true"';
import { useCurrency } from '@/contexts/CurrencyContext';
import { GroupParticipant, Service, LocationType } from '@/types/booking';

interface GroupBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service;
  availableSlots: Array<{
    date: string;
    time: string;
    capacity: number;
    remainingCapacity: number;
    price: number;
  }>;
  onSubmit: (data: GroupBookingData) => Promise<void>;
  isSubmitting?: boolean;
}

export interface GroupBookingData {
  groupName: string;
  groupSize: number;
  participants: GroupParticipant[];
  selectedSlot: {
    date: string;
    time: string;
  };
  locationType: LocationType;
  specialRequests?: string;
  primaryContact: {
    name: string;
    email: string;
    phone: string;
  };
  paymentMethod: 'card' | 'cash' | 'deposit';
  consentTerms: boolean;
  consentMarketing: boolean;
  depositAmount?: number;
}

export function GroupBookingModal({
  isOpen,
  onClose,
  service,
  availableSlots,
  onSubmit,
  isSubmitting = false,
}: GroupBookingModalProps) {
  const { t } = useTranslation();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const { formatPrice } = useCurrency();

  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [groupSize, setGroupSize] = useState(2);
  const [participants, setParticipants] = useState<GroupParticipant[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [locationType, setLocationType] = useState<LocationType>('studio');
  const [specialRequests, setSpecialRequests] = useState('');
  const [primaryContact, setPrimaryContact] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'deposit'>('card');
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const maxGroupSize = Math.min(service.max_group_size || 10, 20);
  const basePricePerPerson = service.price_from;

  // Initialize participants when group size changes
  useEffect(() => {
    const newParticipants = Array.from({ length: groupSize }, (_, i) => ({
      firstName: participants[i]?.firstName || '',
      lastName: participants[i]?.lastName || '',
      email: participants[i]?.email || '',
      phone: participants[i]?.phone || '',
      notes: participants[i]?.notes || '',
    }));
    setParticipants(newParticipants);
  }, [groupSize]);

  // Filter available slots for group capacity
  const availableGroupSlots = availableSlots.filter(
    slot => slot.remainingCapacity >= groupSize
  );

  // Calculate pricing
  const calculateTotalPrice = () => {
    if (!selectedSlot) return 0;

    const slot = availableSlots.find(
      s => s.date === selectedSlot.date && s.time === selectedSlot.time
    );

    if (!slot) return 0;

    let totalPrice = slot.price * groupSize;

    // Apply group discount (10% for 5+ people, 15% for 10+ people)
    if (groupSize >= 10) {
      totalPrice *= 0.85;
    } else if (groupSize >= 5) {
      totalPrice *= 0.9;
    }

    return totalPrice;
  };

  const calculateDeposit = () => {
    const total = calculateTotalPrice();
    // 30% deposit for groups
    return Math.round(total * 0.3);
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        if (!groupName.trim()) {
          newErrors.groupName = 'Group name is required';
        }
        if (groupSize < 2 || groupSize > maxGroupSize) {
          newErrors.groupSize = `Group size must be between 2 and ${maxGroupSize}`;
        }
        break;

      case 2:
        const emptyParticipants = participants.filter(
          p => !p.firstName.trim() || !p.lastName.trim()
        );
        if (emptyParticipants.length > 0) {
          newErrors.participants = 'All participants must have first and last names';
        }
        break;

      case 3:
        if (!selectedSlot) {
          newErrors.slot = 'Please select a time slot';
        }
        break;

      case 4:
        if (!primaryContact.name.trim()) {
          newErrors.primaryName = 'Primary contact name is required';
        }
        if (!primaryContact.email.trim()) {
          newErrors.primaryEmail = 'Primary contact email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primaryContact.email)) {
          newErrors.primaryEmail = 'Invalid email address';
        }
        if (!consentTerms) {
          newErrors.terms = 'You must accept the terms and conditions';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleParticipantChange = (index: number, field: keyof GroupParticipant, value: string) => {
    const newParticipants = [...participants];
    newParticipants[index] = { ...newParticipants[index], [field]: value };
    setParticipants(newParticipants);
  };

  const handleSubmit = async () => {
    if (!validateStep(4) || !selectedSlot) return;

    const bookingData: GroupBookingData = {
      groupName,
      groupSize,
      participants,
      selectedSlot,
      locationType,
      specialRequests,
      primaryContact,
      paymentMethod,
      consentTerms,
      consentMarketing,
      depositAmount: paymentMethod === 'deposit' ? calculateDeposit() : undefined,
    };

    try {
      await onSubmit(bookingData);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Group booking successful!',
        description: `Booking confirmed for ${groupSize} participants.`,
      });
      onClose();
    } catch (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'Booking failed',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    }
  };

  const totalAmount = calculateTotalPrice();
  const depositAmount = calculateDeposit();
  const hasGroupDiscount = groupSize >= 5;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-4xl max-h-[90vh] overflow-hidden glass-card rounded-3xl border border-champagne/20 shadow-luxury-strong">
        {/* Header */}
        <div className="sticky top-0 z-10 glass-card border-b border-champagne/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-champagne/20 rounded-xl">
                <Users className="w-6 h-6 text-champagne" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-pearl">Group Booking</h2>
                <p className="text-pearl/60">{service.title}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-pearl/60 hover:text-pearl hover:bg-champagne/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress */}
          <div className="mt-6">
            <div className="relative h-2 bg-graphite/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-champagne to-bronze transition-all duration-500"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-4 text-center text-sm">
              <div className={cn(step >= 1 ? 'text-champagne' : 'text-pearl/40')}>
                Group Details
              </div>
              <div className={cn(step >= 2 ? 'text-champagne' : 'text-pearl/40')}>
                Participants
              </div>
              <div className={cn(step >= 3 ? 'text-champagne' : 'text-pearl/40')}>
                Schedule
              </div>
              <div className={cn(step >= 4 ? 'text-champagne' : 'text-pearl/40')}>
                Payment & Details
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          {/* Step 1: Group Details */}
          {step === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Group Information</CardTitle>
                  <CardDescription>Tell us about your group</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="groupName">Group Name</Label>
                    <Input
                      id="groupName"
                      placeholder="e.g., Team Building Event, Birthday Group"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className={cn(errors.groupName && 'border-red-500')}
                    />
                    {errors.groupName && (
                      <p className="text-sm text-red-500 mt-1">{errors.groupName}</p>
                    )}
                  </div>

                  <div>
                    <Label>Number of Participants</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setGroupSize(Math.max(2, groupSize - 1))}
                        disabled={groupSize <= 2}
                      >
                        -
                      </Button>
                      <div className="w-20 text-center">
                        <span className="text-2xl font-semibold text-pearl">{groupSize}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setGroupSize(Math.min(maxGroupSize, groupSize + 1))}
                        disabled={groupSize >= maxGroupSize}
                      >
                        +
                      </Button>
                    </div>
                    <p className="text-sm text-pearl/60 mt-2">
                      Maximum participants: {maxGroupSize}
                    </p>
                    {errors.groupSize && (
                      <p className="text-sm text-red-500 mt-1">{errors.groupSize}</p>
                    )}
                  </div>

                  <div>
                    <Label>Location Type</Label>
                    <Select value={locationType} onValueChange={(value: LocationType) => setLocationType(value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="studio">Studio</SelectItem>
                        <SelectItem value="fitness">Fitness Center</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                    <Textarea
                      id="specialRequests"
                      placeholder="Any special requirements or preferences for your group..."
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {hasGroupDiscount && (
                <Alert className="border-green-500/20 bg-green-500/10">
                  <Check className="w-4 h-4 text-green-500" />
                  <AlertDescription className="text-green-400">
                    Your group qualifies for a {groupSize >= 10 ? '15%' : '10%'} discount!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 2: Participants */}
          {step === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Participant Information</CardTitle>
                  <CardDescription>
                    Please provide details for all {groupSize} participants
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="max-h-96 overflow-y-auto space-y-4">
                    {participants.map((participant, index) => (
                      <div key={index} className="p-4 border border-champagne/20 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-pearl">Participant {index + 1}</h4>
                          {index > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newParticipants = participants.filter((_, i) => i !== index);
                                setParticipants(newParticipants);
                                setGroupSize(newParticipants.length);
                              }}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`firstName-${index}`}>First Name *</Label>
                            <Input
                              id={`firstName-${index}`}
                              value={participant.firstName}
                              onChange={(e) => handleParticipantChange(index, 'firstName', e.target.value)}
                              placeholder="First name"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`lastName-${index}`}>Last Name *</Label>
                            <Input
                              id={`lastName-${index}`}
                              value={participant.lastName}
                              onChange={(e) => handleParticipantChange(index, 'lastName', e.target.value)}
                              placeholder="Last name"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`email-${index}`}>Email</Label>
                            <Input
                              id={`email-${index}`}
                              type="email"
                              value={participant.email}
                              onChange={(e) => handleParticipantChange(index, 'email', e.target.value)}
                              placeholder="Email (optional)"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`phone-${index}`}>Phone</Label>
                            <Input
                              id={`phone-${index}`}
                              value={participant.phone}
                              onChange={(e) => handleParticipantChange(index, 'phone', e.target.value)}
                              placeholder="Phone (optional)"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`notes-${index}`}>Notes</Label>
                          <Input
                            id={`notes-${index}`}
                            value={participant.notes}
                            onChange={(e) => handleParticipantChange(index, 'notes', e.target.value)}
                            placeholder="Any special notes for this participant"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {participants.length < maxGroupSize && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setParticipants([...participants, { firstName: '', lastName: '', email: '', phone: '', notes: '' }]);
                        setGroupSize(groupSize + 1);
                      }}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Participant
                    </Button>
                  )}

                  {errors.participants && (
                    <p className="text-sm text-red-500">{errors.participants}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Schedule */}
          {step === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Date & Time</CardTitle>
                  <CardDescription>
                    Choose a time slot that can accommodate your group of {groupSize} participants
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {availableGroupSlots.length === 0 ? (
                    <Alert className="border-yellow-500/20 bg-yellow-500/10">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <AlertDescription className="text-yellow-400">
                        No available slots for {groupSize} participants. Please try reducing group size or different dates.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="grid gap-3">
                      {availableGroupSlots.map((slot, index) => (
                        <div
                          key={index}
                          className={cn(
                            'p-4 border rounded-xl cursor-pointer transition-all',
                            selectedSlot?.date === slot.date && selectedSlot?.time === slot.time
                              ? 'border-champagne bg-champagne/10'
                              : 'border-champagne/20 hover:border-champagne/40'
                          )}
                          onClick={() => setSelectedSlot({ date: slot.date, time: slot.time })}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-pearl">
                                {new Date(slot.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                              <p className="text-pearl/60">{slot.time}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-champagne">
                                {formatPrice(slot.price * groupSize)}
                              </p>
                              <p className="text-xs text-pearl/60">
                                {slot.remainingCapacity} spots left
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.slot && (
                    <p className="text-sm text-red-500 mt-2">{errors.slot}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Payment & Details */}
          {step === 4 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Primary Contact</CardTitle>
                  <CardDescription>
                    Main contact person for the group booking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="primaryName">Full Name</Label>
                    <Input
                      id="primaryName"
                      value={primaryContact.name}
                      onChange={(e) => setPrimaryContact({ ...primaryContact, name: e.target.value })}
                      className={cn(errors.primaryName && 'border-red-500')}
                    />
                    {errors.primaryName && (
                      <p className="text-sm text-red-500 mt-1">{errors.primaryName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="primaryEmail">Email</Label>
                    <Input
                      id="primaryEmail"
                      type="email"
                      value={primaryContact.email}
                      onChange={(e) => setPrimaryContact({ ...primaryContact, email: e.target.value })}
                      className={cn(errors.primaryEmail && 'border-red-500')}
                    />
                    {errors.primaryEmail && (
                      <p className="text-sm text-red-500 mt-1">{errors.primaryEmail}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="primaryPhone">Phone</Label>
                    <Input
                      id="primaryPhone"
                      value={primaryContact.phone}
                      onChange={(e) => setPrimaryContact({ ...primaryContact, phone: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>
                    Choose how you'd like to pay for the group booking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div
                    className={cn(
                      'p-4 border rounded-xl cursor-pointer transition-all',
                      paymentMethod === 'card' ? 'border-champagne bg-champagne/10' : 'border-champagne/20'
                    )}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-champagne" />
                      <div>
                        <p className="font-medium text-pearl">Pay Full Amount</p>
                        <p className="text-sm text-pearl/60">Pay {formatPrice(totalAmount)} now</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={cn(
                      'p-4 border rounded-xl cursor-pointer transition-all',
                      paymentMethod === 'deposit' ? 'border-champagne bg-champagne/10' : 'border-champagne/20'
                    )}
                    onClick={() => setPaymentMethod('deposit')}
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-bronze" />
                      <div>
                        <p className="font-medium text-pearl">Pay Deposit</p>
                        <p className="text-sm text-pearl/60">
                          Pay {formatPrice(depositAmount)} now, {formatPrice(totalAmount - depositAmount)} on arrival
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={cn(
                      'p-4 border rounded-xl cursor-pointer transition-all',
                      paymentMethod === 'cash' ? 'border-champagne bg-champagne/10' : 'border-champagne/20'
                    )}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-bronze" />
                      <div>
                        <p className="font-medium text-pearl">Pay on Arrival</p>
                        <p className="text-sm text-pearl/60">Pay {formatPrice(totalAmount)} when you arrive</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms"
                        checked={consentTerms}
                        onCheckedChange={(checked) => setConsentTerms(checked as boolean)}
                      />
                      <Label htmlFor="terms" className="text-sm">
                        I agree to the terms and conditions and cancellation policy
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="marketing"
                        checked={consentMarketing}
                        onCheckedChange={(checked) => setConsentMarketing(checked as boolean)}
                      />
                      <Label htmlFor="marketing" className="text-sm">
                        I'd like to receive updates about special offers and events
                      </Label>
                    </div>
                  </div>
                  {errors.terms && (
                    <p className="text-sm text-red-500 mt-2">{errors.terms}</p>
                  )}
                </CardContent>
              </Card>

              {/* Booking Summary */}
              <Card className="bg-champagne/5 border-champagne/20">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-pearl/60">Service</span>
                    <span className="text-pearl">{service.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pearl/60">Group Name</span>
                    <span className="text-pearl">{groupName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pearl/60">Participants</span>
                    <span className="text-pearl">{groupSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pearl/60">Date & Time</span>
                    <span className="text-pearl">
                      {selectedSlot && `${new Date(selectedSlot.date).toLocaleDateString()} at ${selectedSlot.time}`}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-pearl/60">Base Price ({formatPrice(basePricePerPerson)} × {groupSize})</span>
                    <span className="text-pearl">{formatPrice(basePricePerPerson * groupSize)}</span>
                  </div>
                  {hasGroupDiscount && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Group Discount ({groupSize >= 10 ? '15%' : '10%'})</span>
                      <span>-{formatPrice(totalAmount - (basePricePerPerson * groupSize))}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="text-pearl">Total Amount</span>
                    <span className="text-champagne">{formatPrice(totalAmount)}</span>
                  </div>
                  {paymentMethod === 'deposit' && (
                    <div className="pt-2">
                      <div className="flex justify-between text-sm text-bronze">
                        <span>Due Now (Deposit)</span>
                        <span>{formatPrice(depositAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-pearl/60">
                        <span>Due on Arrival</span>
                        <span>{formatPrice(totalAmount - depositAmount)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-6 glass-card border-t border-champagne/10">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={step === 1 ? onClose : handleBack}
              disabled={isSubmitting}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>

            <div className="flex items-center gap-3">
              {step < 4 ? (
                <Button onClick={handleNext} disabled={isSubmitting}>
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !selectedSlot}
                  className="bg-gradient-brand text-white"
                >
                  {isSubmitting ? 'Processing...' : (
                    <>
                      Complete Booking
                      {paymentMethod === 'deposit' && ` - Pay ${formatPrice(depositAmount)}`}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}