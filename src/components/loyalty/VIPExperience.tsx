import React, { useState } from 'react';
import {
  Crown,
  Star,
  Shield,
  Gem,
  Sparkles,
  Calendar,
  Clock,
  Users,
  MapPin,
  Car,
  Phone,
  MessageSquare,
  Gift,
  ChevronRight,
  Check,
  AlertCircle,
  Heart,
  Zap,
  TrendingUp,
  Award,
  Music,
  Camera,
  Utensils
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLoyaltyContext } from '@/contexts/LoyaltyContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface VIPExperienceProps {
  className?: string;
}

interface VIPBenefit {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  tierRequired: number;
  actionText?: string;
  action?: () => void;
}

interface VIPEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  maxAttendees: number;
  currentAttendees: number;
  image?: string;
  tierRequired: number;
}

interface ConciergeService {
  id: string;
  name: string;
  description: string;
  availability: string;
  bookingLink?: string;
  icon: React.ReactNode;
}

export function VIPExperience({ className }: VIPExperienceProps) {
  const { state } = useLoyaltyContext();
  const [activeTab, setActiveTab] = useState('benefits');
  const [selectedEvent, setSelectedEvent] = useState<VIPEvent | null>(null);

  const currentTier = state.member?.tier;
  const currentTierLevel = currentTier?.level || 1;
  const vipExperience = state.vipExperience;

  // VIP Benefits based on tier level
  const vipBenefits: VIPBenefit[] = [
    {
      id: 'priority-booking',
      title: 'Priority Booking',
      description: 'Book appointments 48 hours before general availability opens',
      icon: <Calendar className="h-5 w-5" />,
      available: currentTierLevel >= 2,
      tierRequired: 2,
      actionText: 'Book Now',
    },
    {
      id: 'personal-concierge',
      title: 'Personal Concierge',
      description: 'Dedicated concierge service for personalized assistance',
      icon: <Users className="h-5 w-5" />,
      available: currentTierLevel >= 4,
      tierRequired: 4,
      actionText: 'Contact Concierge',
    },
    {
      id: 'exclusive-events',
      title: 'Exclusive Events',
      description: 'Invitations to VIP-only events and workshops',
      icon: <Star className="h-5 w-5" />,
      available: currentTierLevel >= 2,
      tierRequired: 2,
      actionText: 'View Events',
    },
    {
      id: 'complimentary-upgrades',
      title: 'Complimentary Upgrades',
      description: 'Free service upgrades when available',
      icon: <TrendingUp className="h-5 w-5" />,
      available: currentTierLevel >= 3,
      tierRequired: 3,
    },
    {
      id: 'dedicated-support',
      title: 'Dedicated Support',
      description: 'Priority customer support with dedicated representatives',
      icon: <Phone className="h-5 w-5" />,
      available: currentTierLevel >= 4,
      tierRequired: 4,
      actionText: 'Contact Support',
    },
    {
      id: 'free-consultation',
      title: 'Free Consultations',
      description: 'Complimentary personalized beauty consultations',
      icon: <MessageSquare className="h-5 w-5" />,
      available: currentTierLevel >= 2,
      tierRequired: 2,
      actionText: 'Schedule Now',
    },
    {
      id: 'partner-discounts',
      title: 'Partner Discounts',
      description: 'Exclusive discounts with luxury partner brands',
      icon: <Gift className="h-5 w-5" />,
      available: currentTierLevel >= 3,
      tierRequired: 3,
    },
    {
      id: 'early-access',
      title: 'Early Access',
      description: 'First access to new services and products',
      icon: <Zap className="h-5 w-5" />,
      available: currentTierLevel >= 3,
      tierRequired: 3,
    },
    {
      id: 'white-glove',
      title: 'White-Glove Service',
      description: 'Premium white-glove service for all appointments',
      icon: <Sparkles className="h-5 w-5" />,
      available: currentTierLevel >= 4,
      tierRequired: 4,
    },
    {
      id: 'lifetime-recognition',
      title: 'Lifetime Recognition',
      description: 'Permanent VIP status and exclusive lifetime benefits',
      icon: <Award className="h-5 w-5" />,
      available: currentTierLevel >= 5,
      tierRequired: 5,
    },
  ];

  // Sample VIP Events
  const vipEvents: VIPEvent[] = [
    {
      id: '1',
      title: 'Luxury Beauty Workshop',
      date: '2024-02-15T18:00:00',
      location: 'Mariia Hub Studio',
      description: 'Exclusive workshop featuring latest beauty trends and techniques',
      maxAttendees: 20,
      currentAttendees: 12,
      tierRequired: 3,
    },
    {
      id: '2',
      title: 'VIP Wine & Beauty Evening',
      date: '2024-02-28T19:00:00',
      location: 'Exclusive Venue',
      description: 'An elegant evening combining fine wine with luxury beauty treatments',
      maxAttendees: 15,
      currentAttendees: 8,
      tierRequired: 4,
    },
    {
      id: '3',
      title: 'Diamond Members Gala',
      date: '2024-03-10T20:00:00',
      location: 'Luxury Hotel',
      description: 'Annual gala exclusively for Diamond tier members',
      maxAttendees: 10,
      currentAttendees: 6,
      tierRequired: 5,
    },
  ];

  // Concierge Services
  const conciergeServices: ConciergeService[] = [
    {
      id: '1',
      name: 'Personal Shopping',
      description: 'Personalized shopping assistance for beauty products',
      availability: 'Mon-Fri 9AM-6PM',
      icon: <Camera className="h-5 w-5" />,
    },
    {
      id: '2',
      name: 'Transportation',
      description: 'Luxury transportation to and from appointments',
      availability: 'Available 24/7',
      icon: <Car className="h-5 w-5" />,
    },
    {
      id: '3',
      name: 'Event Planning',
      description: 'Custom event planning for special occasions',
      availability: 'By Appointment',
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      id: '4',
      name: 'Dining Reservations',
      description: 'Priority reservations at partner restaurants',
      availability: 'Same day booking',
      icon: <Utensils className="h-5 w-5" />,
    },
  ];

  const filteredEvents = vipEvents.filter(event => event.tierRequired <= currentTierLevel);
  const availableConciergeServices = conciergeServices.filter(() => currentTierLevel >= 4);

  const getTierIcon = (tierLevel: number) => {
    switch (tierLevel) {
      case 2:
        return <Shield className="h-5 w-5 text-gray-600" />;
      case 3:
        return <Crown className="h-5 w-5 text-yellow-600" />;
      case 4:
        return <Gem className="h-5 w-5 text-purple-600" />;
      case 5:
        return <Sparkles className="h-5 w-5 text-blue-600" />;
      default:
        return <Star className="h-5 w-5 text-orange-600" />;
    }
  };

  const getTierName = (tierLevel: number) => {
    switch (tierLevel) {
      case 2:
        return 'Silver';
      case 3:
        return 'Gold';
      case 4:
        return 'Platinum';
      case 5:
        return 'Diamond';
      default:
        return 'Bronze';
    }
  };

  if (currentTierLevel < 2) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            VIP Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Crown className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Unlock VIP Benefits</h3>
            <p className="text-muted-foreground mb-6">
              Reach Silver tier (500 points) to start enjoying exclusive VIP benefits and experiences.
            </p>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-900 mb-2">Silver Tier Benefits</h4>
              <ul className="space-y-1 text-sm text-amber-800">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Priority booking (48 hours)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Exclusive events access
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Free consultations
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* VIP Status Header */}
      <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-600 text-white">
                {getTierIcon(currentTierLevel)}
              </div>
              <div>
                <CardTitle className="text-purple-900">VIP Experience</CardTitle>
                <p className="text-purple-700">
                  {getTierName(currentTierLevel)} Member - Exclusive Benefits & Services
                </p>
              </div>
            </div>
            <Badge className="bg-purple-600 text-white">
              {currentTierLevel >= 4 ? 'Elite VIP' : 'VIP Member'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="benefits" className="gap-2">
            <Gift className="h-4 w-4" />
            Benefits
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2">
            <Calendar className="h-4 w-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="concierge" className="gap-2">
            <Users className="h-4 w-4" />
            Concierge
          </TabsTrigger>
          <TabsTrigger value="recognition" className="gap-2">
            <Award className="h-4 w-4" />
            Recognition
          </TabsTrigger>
        </TabsList>

        <TabsContent value="benefits" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vipBenefits.map((benefit) => (
              <Card
                key={benefit.id}
                className={cn(
                  'transition-all',
                  benefit.available
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50 opacity-60'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-full',
                        benefit.available ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      )}
                    >
                      {benefit.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{benefit.title}</h3>
                        {benefit.available && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {benefit.description}
                      </p>
                      {!benefit.available && (
                        <div className="flex items-center gap-2 text-xs text-amber-600">
                          <AlertCircle className="h-3 w-3" />
                          <span>Requires {getTierName(benefit.tierRequired)} tier</span>
                        </div>
                      )}
                      {benefit.available && benefit.actionText && (
                        <Button variant="outline" size="sm" className="mt-2">
                          {benefit.actionText}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 h-32 flex items-center justify-center">
                    <Calendar className="h-12 w-12 text-purple-600" />
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(event.date), 'MMM d, yyyy • h:mm a')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{event.currentAttendees}/{event.maxAttendees} attending</span>
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full" onClick={() => setSelectedEvent(event)}>
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{event.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p>{event.description}</p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{format(new Date(event.date), 'EEEE, MMMM d, yyyy • h:mm a')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{event.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{event.currentAttendees} of {event.maxAttendees} spots taken</span>
                              </div>
                            </div>
                            <Button className="w-full">
                              Register for Event
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Upcoming Events</h3>
                <p className="text-muted-foreground">Check back soon for new VIP events!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="concierge" className="space-y-4">
          {currentTierLevel >= 4 ? (
            <>
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-blue-600 text-white">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">Personal Concierge Service</h3>
                      <p className="text-blue-700">Your dedicated concierge is available 24/7</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button className="gap-2">
                      <Phone className="h-4 w-4" />
                      Call Concierge
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Message Concierge
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conciergeServices.map((service) => (
                  <Card key={service.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-muted">
                          {service.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{service.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                          <div className="flex items-center gap-2 text-xs text-green-600">
                            <Check className="h-3 w-3" />
                            <span>{service.availability}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Concierge Service</h3>
                <p className="text-muted-foreground mb-4">
                  Personal concierge service is available for Platinum and Diamond tier members.
                </p>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-left max-w-md mx-auto">
                  <h4 className="font-semibold text-amber-900 mb-2">How to Unlock:</h4>
                  <p className="text-sm text-amber-800">
                    Reach Platinum tier (5,000 points) to access personal concierge services and white-glove treatment.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recognition" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
              <CardContent className="p-6 text-center">
                <Award className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-yellow-900 mb-2">VIP Recognition</h3>
                <div className="space-y-2 text-sm text-yellow-800">
                  <p>You are among our most valued clients</p>
                  <p>Lifetime member since {format(new Date(state.member?.join_date || ''), 'MMMM yyyy')}</p>
                  <p>Exclusive access to new innovations</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6 text-center">
                <Heart className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-purple-900 mb-2">Member Milestones</h3>
                <div className="space-y-2 text-sm text-purple-800">
                  <p>🎯 {state.stats?.totalVisits || 0} total visits</p>
                  <p>💎 {state.stats?.lifetimePoints?.toLocaleString() || 0} lifetime points</p>
                  <p>👥 {(state.stats?.referralCount || 0)} successful referrals</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {currentTierLevel === 5 && (
            <Card className="bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="text-xl font-bold text-blue-900">Diamond Elite Status</h3>
                    <p className="text-blue-700">You've reached the pinnacle of our loyalty program</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-900">∞</p>
                    <p className="text-sm text-blue-700">Unlimited Benefits</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-900">VIP</p>
                    <p className="text-sm text-blue-700">Priority Access</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-900">24/7</p>
                    <p className="text-sm text-blue-700">Concierge Service</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}