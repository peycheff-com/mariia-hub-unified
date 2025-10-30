import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLuxuryExperience } from '@/contexts/LuxuryExperienceContext';
import { useTranslation } from 'react-i18next';
import {
  Crown,
  Star,
  Diamond,
  Sparkles,
  Phone,
  Mail,
  MessageCircle,
  Video,
  Clock,
  Award,
  Heart,
  Gift,
  Shield,
  Zap,
  TrendingUp,
  User,
  Calendar,
  MapPin,
  Globe,
  Languages,
  CheckCircle,
  AlertCircle,
  HeadphonesIcon,
  ConciergeBell,
  Wine,
  Music,
  Flower2,
  ChevronRight,
  Bell,
  Settings,
  LogOut
} from 'lucide-react';

interface LuxurySupportInterfaceProps {
  onQuickAction?: (action: string) => void;
}

const LuxurySupportInterface: React.FC<LuxurySupportInterfaceProps> = ({ onQuickAction }) => {
  const {
    clientProfile,
    currentTier,
    serviceStandards,
    luxuryTheme,
    personalizedGreeting,
    getTierBenefits,
    calculateTierProgress,
    hasDedicatedAgent,
    getDedicatedAgent,
    requestWhiteGloveService,
    getPreferredCommunicationChannel,
    isInPreferredContactHours,
    enableLuxuryFeatures,
    currentLanguage
  } = useLuxuryExperience();

  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(false);

  useEffect(() => {
    if (enableLuxuryFeatures()) {
      setShowWelcomeAnimation(true);
      const timer = setTimeout(() => setShowWelcomeAnimation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [enableLuxuryFeatures]);

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'vip_platinum': return <Diamond className="h-6 w-6 text-purple-500" />;
      case 'vip_gold': return <Crown className="h-6 w-6 text-yellow-500" />;
      case 'vip_silver': return <Star className="h-6 w-6 text-gray-400" />;
      case 'premium': return <Award className="h-6 w-6 text-blue-500" />;
      default: return <Shield className="h-6 w-6 text-gray-600" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'vip_platinum': return 'from-purple-600 to-pink-600';
      case 'vip_gold': return 'from-yellow-600 to-amber-600';
      case 'vip_silver': return 'from-gray-400 to-gray-600';
      case 'premium': return 'from-blue-600 to-indigo-600';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  const getCommunicationIcon = (channel: string) => {
    switch (channel) {
      case 'phone': return <Phone className="h-5 w-5" />;
      case 'email': return <Mail className="h-5 w-5" />;
      case 'chat': return <MessageCircle className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'whatsapp': return <MessageCircle className="h-5 w-5" />;
      default: return <HeadphonesIcon className="h-5 w-5" />;
    }
  };

  const handleQuickAction = (action: string) => {
    if (onQuickAction) {
      onQuickAction(action);
    }
  };

  const isVIP = ['vip_platinum', 'vip_gold', 'vip_silver'].includes(currentTier);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-rose-50/30">
      {/* Welcome Animation for VIP Clients */}
      {showWelcomeAnimation && isVIP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center animate-pulse">
            <div className={`mb-4 text-6xl font-bold bg-gradient-to-r ${getTierColor(currentTier)} bg-clip-text text-transparent`}>
              {currentTier.replace('_', ' ').toUpperCase()}
            </div>
            <div className="text-white text-xl mb-8">{personalizedGreeting()}</div>
            <div className="flex justify-center gap-2">
              {[...Array(6)].map((_, i) => (
                <Sparkles key={i} className="h-6 w-6 text-yellow-400 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Luxury Header */}
      <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Client Avatar and Info */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-amber-200">
                  <AvatarImage src={clientProfile?.avatar} />
                  <AvatarFallback className={`bg-gradient-to-r ${getTierColor(currentTier)} text-white font-bold`}>
                    {clientProfile?.name?.charAt(0) || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className={`text-2xl font-bold bg-gradient-to-r ${getTierColor(currentTier)} bg-clip-text text-transparent`}>
                      {personalizedGreeting()}
                    </h1>
                    {getTierIcon(currentTier)}
                  </div>
                  <p className="text-gray-600">{t('support.subtitle')}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-4">
              {isVIP && (
                <Button
                  onClick={() => handleQuickAction('whiteGlove')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <ConciergeBell className="h-4 w-4 mr-2" />
                  White Glove Service
                </Button>
              )}

              <Button
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </Button>
            </div>
          </div>

          {/* VIP Status Bar */}
          {isVIP && (
            <div className="mt-4 flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-amber-900">
                    {currentTier.replace('_', ' ').toUpperCase()} Member
                  </span>
                </div>

                {hasDedicatedAgent() && (
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-amber-600" />
                    <span className="text-amber-900">
                      Dedicated Agent: {getDedicatedAgent()}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span className="text-amber-900">
                    {isInPreferredContactHours() ? 'Available Now' : 'Outside Preferred Hours'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-600" />
                <span className="text-amber-900">
                  Progress: {calculateTierProgress(clientProfile!)}% to next tier
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full grid-cols-5 bg-gradient-to-r ${getTierColor(currentTier)} bg-opacity-10 border border-amber-200`}>
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Sparkles className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="channels" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Channels
            </TabsTrigger>
            <TabsTrigger value="benefits" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Gift className="h-4 w-4 mr-2" />
              VIP Benefits
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Calendar className="h-4 w-4 mr-2" />
              Service History
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <Card className="lg:col-span-2 border-amber-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Zap className="h-5 w-5 text-amber-600" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Get immediate assistance with our premium support options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => handleQuickAction('prioritySupport')}
                      className={`h-20 flex-col gap-2 bg-gradient-to-r ${getTierColor(currentTier)} hover:opacity-90`}
                    >
                      {getCommunicationIcon(getPreferredCommunicationChannel())}
                      <span>Priority Support</span>
                      <span className="text-xs opacity-80">
                        {serviceStandards.responseTime[getPreferredCommunicationChannel() as keyof typeof serviceStandards.responseTime]}{getPreferredCommunicationChannel() === 'email' ? 'hr' : getPreferredCommunicationChannel() === 'chat' ? 'sec' : 'min'} response
                      </span>
                    </Button>

                    <Button
                      onClick={() => handleQuickAction('dedicatedAgent')}
                      variant="outline"
                      className="h-20 flex-col gap-2 border-amber-300 hover:bg-amber-50"
                      disabled={!hasDedicatedAgent()}
                    >
                      <User className="h-6 w-6 text-amber-600" />
                      <span>Dedicated Agent</span>
                      {hasDedicatedAgent() && (
                        <span className="text-xs text-amber-600">{getDedicatedAgent()}</span>
                      )}
                    </Button>

                    {isVIP && (
                      <Button
                        onClick={() => handleQuickAction('exclusiveConsultation')}
                        variant="outline"
                        className="h-20 flex-col gap-2 border-amber-300 hover:bg-amber-50"
                      >
                        <Video className="h-6 w-6 text-amber-600" />
                        <span>Video Consultation</span>
                        <span className="text-xs text-amber-600">Personalized session</span>
                      </Button>
                    )}

                    <Button
                      onClick={() => handleQuickAction('knowledgeBase')}
                      variant="outline"
                      className="h-20 flex-col gap-2 border-amber-300 hover:bg-amber-50"
                    >
                      <BookOpen className="h-6 w-6 text-amber-600" />
                      <span>Knowledge Base</span>
                      <span className="text-xs text-amber-600">Self-service options</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Service Status */}
              <Card className="border-amber-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Shield className="h-5 w-5 text-amber-600" />
                    Service Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Response Time</span>
                    <Badge className="bg-green-100 text-green-800">
                      {serviceStandards.responseTime[getPreferredCommunicationChannel() as keyof typeof serviceStandards.responseTime]} {getPreferredCommunicationChannel() === 'email' ? 'hours' : 'minutes'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Availability</span>
                    <Badge className="bg-green-100 text-green-800">
                      {serviceStandards.availability.hours}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Support Quality</span>
                    <Badge className="bg-green-100 text-green-800">
                      Premium
                    </Badge>
                  </div>
                  {isVIP && (
                    <div className="pt-4 border-t border-amber-200">
                      <div className="flex items-center gap-2 text-amber-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">VIP Access Active</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Clock className="h-5 w-5 text-amber-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Mock recent activities */}
                  <div className="flex items-center gap-4 p-3 bg-amber-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">Support ticket resolved</p>
                      <p className="text-xs text-amber-600">Booking inquiry completed successfully</p>
                    </div>
                    <span className="text-xs text-amber-500">2 hours ago</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-amber-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">New message from agent</p>
                      <p className="text-xs text-amber-600">Service recommendation sent</p>
                    </div>
                    <span className="text-xs text-amber-500">1 day ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Channels Tab */}
          <TabsContent value="channels" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Phone Support */}
              <Card className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Phone className="h-5 w-5 text-amber-600" />
                    Phone Support
                  </CardTitle>
                  <CardDescription>
                    Direct line to our premium support team
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-900">+48 123 456 789</div>
                    <Badge className="mt-2 bg-green-100 text-green-800">
                      {serviceStandards.responseTime.phone} min response
                    </Badge>
                  </div>
                  <Button
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    onClick={() => handleQuickAction('phoneCall')}
                  >
                    Call Now
                  </Button>
                  {isVIP && (
                    <div className="text-xs text-amber-600 text-center">
                      VIP priority line - skip queue
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Email Support */}
              <Card className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Mail className="h-5 w-5 text-amber-600" />
                    Email Support
                  </CardTitle>
                  <CardDescription>
                    Detailed assistance via email
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-amber-900">support@mariaborysevych.com</div>
                    <Badge className="mt-2 bg-blue-100 text-blue-800">
                      {serviceStandards.responseTime.email}hr response
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={() => handleQuickAction('emailSupport')}
                  >
                    Send Email
                  </Button>
                </CardContent>
              </Card>

              {/* Live Chat */}
              <Card className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <MessageCircle className="h-5 w-5 text-amber-600" />
                    Live Chat
                  </CardTitle>
                  <CardDescription>
                    Real-time chat with support agents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-amber-900">Online Now</span>
                    </div>
                    <Badge className="mt-2 bg-green-100 text-green-800">
                      {serviceStandards.responseTime.chat}sec response
                    </Badge>
                  </div>
                  <Button
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    onClick={() => handleQuickAction('liveChat')}
                  >
                    Start Chat
                  </Button>
                </CardContent>
              </Card>

              {/* Video Consultation - VIP Only */}
              {isVIP && (
                <Card className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-amber-50 to-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-900">
                      <Video className="h-5 w-5 text-amber-600" />
                      Video Consultation
                    </CardTitle>
                    <CardDescription>
                      Personalized video session with specialists
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-sm font-medium text-amber-900">Personal Consultation</div>
                      <Badge className="mt-2 bg-purple-100 text-purple-800">
                        VIP Exclusive
                      </Badge>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      onClick={() => handleQuickAction('videoConsultation')}
                    >
                      Schedule Video Call
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* WhatsApp */}
              <Card className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <MessageCircle className="h-5 w-5 text-amber-600" />
                    WhatsApp
                  </CardTitle>
                  <CardDescription>
                    Quick support via WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-amber-900">+48 123 456 789</div>
                    <Badge className="mt-2 bg-green-100 text-green-800">
                      {serviceStandards.responseTime.whatsapp}min response
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={() => handleQuickAction('whatsapp')}
                  >
                    Message on WhatsApp
                  </Button>
                </CardContent>
              </Card>

              {/* Emergency Support - VIP Platinum Only */}
              {currentTier === 'vip_platinum' && (
                <Card className="border-purple-200 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-900">
                      <Shield className="h-5 w-5 text-purple-600" />
                      Emergency Support
                    </CardTitle>
                    <CardDescription>
                      24/7 priority emergency assistance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-sm font-medium text-purple-900">Urgent Matters Only</div>
                      <Badge className="mt-2 bg-red-100 text-red-800">
                        24/7 Priority
                      </Badge>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                      onClick={() => handleQuickAction('emergencySupport')}
                    >
                      Emergency Contact
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* VIP Benefits Tab */}
          <TabsContent value="benefits" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Gift className="h-5 w-5 text-amber-600" />
                  Your {currentTier.replace('_', ' ').toUpperCase()} Benefits
                </CardTitle>
                <CardDescription>
                  Exclusive privileges and premium services available to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getTierBenefits(currentTier).map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <CheckCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-amber-900">{benefit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Service History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  Service History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-amber-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-amber-900 mb-2">No service history yet</h3>
                  <p className="text-amber-600">Your support interactions will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Settings className="h-5 w-5 text-amber-600" />
                  Support Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-amber-900 mb-3">Communication Preferences</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                        <span className="text-sm text-amber-900">Preferred Language</span>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-900 uppercase">
                            {currentLanguage}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                        <span className="text-sm text-amber-900">Preferred Channel</span>
                        <div className="flex items-center gap-2">
                          {getCommunicationIcon(getPreferredCommunicationChannel())}
                          <span className="text-sm font-medium text-amber-900 capitalize">
                            {getPreferredCommunicationChannel()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LuxurySupportInterface;