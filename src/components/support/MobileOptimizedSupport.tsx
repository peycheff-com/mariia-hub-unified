import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLuxuryExperience } from '@/contexts/LuxuryExperienceContext';
import { useTranslation } from 'react-i18next';
import {
  MessageCircle,
  Phone,
  Mail,
  Video,
  Search,
  Menu,
  X,
  ChevronRight,
  Star,
  Clock,
  User,
  Calendar,
  MapPin,
  Heart,
  Gift,
  Crown,
  Sparkles,
  Bell,
  Settings,
  HeadphonesIcon,
  Zap,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Home,
  FileText,
  HelpCircle,
  LogOut,
  Plus,
  Filter,
  ArrowUp,
  Mic,
  Camera,
  Image,
  Paperclip,
  Send,
  MoreVertical,
  RefreshCw,
  Download,
  Share2,
  Eye,
  Edit,
  Trash2,
  Volume2,
  VolumeX
} from 'lucide-react';

interface MobileOptimizedSupportProps {
  onQuickAction?: (action: string) => void;
}

interface MobileTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  lastUpdate: string;
  unreadCount: number;
  assignedAgent?: string;
}

interface MobileAgent {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'busy' | 'offline';
  rating: number;
  responseTime: string;
  specialty: string;
}

const MobileOptimizedSupport: React.FC<MobileOptimizedSupportProps> = ({ onQuickAction }) => {
  const {
    clientProfile,
    currentTier,
    hasDedicatedAgent,
    getDedicatedAgent,
    enableLuxuryFeatures,
    personalizedGreeting,
    getPreferredCommunicationChannel
  } = useLuxuryExperience();

  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickActionsVisible, setQuickActionsVisible] = useState(true);
  const [tickets, setTickets] = useState<MobileTicket[]>([]);
  const [availableAgents, setAvailableAgents] = useState<MobileAgent[]>([]);
  const [unreadCount, setUnreadCount] = useState(3);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // Mock mobile data
  const mockTickets: MobileTicket[] = [
    {
      id: '1',
      ticketNumber: 'TK-2024-001',
      subject: 'Beauty consultation for special event',
      status: 'in_progress',
      priority: 'high',
      createdAt: '2024-01-15T10:30:00Z',
      lastUpdate: '2024-01-15T14:20:00Z',
      unreadCount: 2,
      assignedAgent: 'Anna Kowalska'
    },
    {
      id: '2',
      ticketNumber: 'TK-2024-002',
      subject: 'Question about new fitness programs',
      status: 'open',
      priority: 'medium',
      createdAt: '2024-01-14T16:45:00Z',
      lastUpdate: '2024-01-15T09:15:00Z',
      unreadCount: 1
    },
    {
      id: '3',
      ticketNumber: 'TK-2024-003',
      subject: 'Payment issue with recent booking',
      status: 'resolved',
      priority: 'urgent',
      createdAt: '2024-01-13T11:20:00Z',
      lastUpdate: '2024-01-14T13:30:00Z',
      unreadCount: 0,
      assignedAgent: 'Piotr Wiśniewski'
    }
  ];

  const mockAgents: MobileAgent[] = [
    {
      id: '1',
      name: 'Anna Kowalska',
      avatar: '/api/placeholder/40/40',
      status: 'online',
      rating: 4.9,
      responseTime: '< 2 min',
      specialty: 'Beauty Services'
    },
    {
      id: '2',
      name: 'Piotr Wiśniewski',
      status: 'online',
      rating: 4.8,
      responseTime: '< 5 min',
      specialty: 'Technical Support'
    },
    {
      id: '3',
      name: 'Maria Nowak',
      status: 'busy',
      rating: 4.9,
      responseTime: '< 3 min',
      specialty: 'VIP Concierge'
    }
  ];

  useEffect(() => {
    setTickets(mockTickets);
    setAvailableAgents(mockAgents);
  }, []);

  useEffect(() => {
    // Handle scroll events for mobile UI
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setQuickActionsVisible(scrollY < 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'vip_platinum': return 'from-purple-600 to-pink-600';
      case 'vip_gold': return 'from-yellow-600 to-amber-600';
      case 'vip_silver': return 'from-gray-400 to-gray-600';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleQuickAction = (action: string) => {
    if (onQuickAction) {
      onQuickAction(action);
    }
  };

  const handleVoiceCommand = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'pl-PL';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        // Process voice command
        processVoiceCommand(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Voice recognition error:', event.error);
      };

      recognition.start();
    } else {
      console.log('Speech recognition not supported');
    }
  };

  const processVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('nowy')) {
      handleQuickAction('createTicket');
    } else if (lowerCommand.includes('agent')) {
      handleQuickAction('liveChat');
    } else if (lowerCommand.includes('telefon')) {
      handleQuickAction('phoneCall');
    } else if (lowerCommand.includes('wyszukaj')) {
      // Perform search
    }
  };

  const renderFloatingQuickActions = () => {
    if (!quickActionsVisible) return null;

    return (
      <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
              onClick={() => handleQuickAction('createTicket')}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh]">
            <SheetHeader>
              <SheetTitle>Create Support Ticket</SheetTitle>
              <SheetDescription>
                Quick ticket creation with AI assistance
              </SheetDescription>
            </SheetHeader>
            {/* Mobile ticket form content */}
          </SheetContent>
        </Sheet>

        {enableLuxuryFeatures() && (
          <Button
            size="lg"
            className="w-14 h-14 rounded-full bg-gradient-to-r from-yellow-600 to-amber-600 shadow-lg"
            onClick={() => handleQuickAction('whiteGlove')}
          >
            <Sparkles className="h-6 w-6" />
          </Button>
        )}

        <Button
          size="lg"
          className="w-14 h-14 rounded-full bg-blue-600 shadow-lg"
          onClick={() => handleQuickAction('liveChat')}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 to-orange-50/20 pb-20">
      {/* Mobile Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-sm border-b border-amber-100">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-600" />
                    {currentTier.replace('_', ' ').toUpperCase()}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {/* User Profile Section */}
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={clientProfile?.avatar} />
                      <AvatarFallback className="bg-gradient-to-r from-amber-600 to-orange-600">
                        {clientProfile?.name?.charAt(0) || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-amber-900">{personalizedGreeting()}</div>
                      <div className="text-sm text-amber-600">VIP Member</div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">Quick Actions</h3>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleQuickAction('createTicket')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Ticket
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleQuickAction('liveChat')}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Live Chat
                    </Button>
                    {enableLuxuryFeatures() && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleQuickAction('whiteGlove')}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        White Glove Service
                      </Button>
                    )}
                  </div>

                  {/* Settings */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">Settings</h3>
                    <Button variant="ghost" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Preferences
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <Bell className="h-4 w-4 mr-2" />
                      Notifications
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div>
              <h1 className="text-lg font-bold text-gray-900">Support</h1>
              <p className="text-xs text-gray-600">{unreadCount} unread messages</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={voiceEnabled ? 'text-green-600' : 'text-gray-600'}
            >
              {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {isSearching && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tickets, articles, or agents..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                autoFocus
              />
              {voiceEnabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={handleVoiceCommand}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="px-4 py-4">
        {/* Welcome Card */}
        <Card className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-amber-900">{personalizedGreeting()}</h2>
                <p className="text-sm text-amber-600">How can we assist you today?</p>
              </div>
              <div className={`text-2xl bg-gradient-to-r ${getTierColor(currentTier)} bg-clip-text text-transparent font-bold`}>
                {currentTier.replace('_', ' ').toUpperCase()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            onClick={() => handleQuickAction('liveChat')}
            className="h-20 flex-col gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <MessageCircle className="h-6 w-6" />
            <span className="text-sm">Live Chat</span>
            <span className="text-xs opacity-80">Instant support</span>
          </Button>

          <Button
            onClick={() => handleQuickAction('phoneCall')}
            variant="outline"
            className="h-20 flex-col gap-2 border-amber-300 hover:bg-amber-50"
          >
            <Phone className="h-6 w-6 text-amber-600" />
            <span className="text-sm">Call Us</span>
            <span className="text-xs text-amber-600">+48 123 456 789</span>
          </Button>

          <Button
            onClick={() => handleQuickAction('knowledgeBase')}
            variant="outline"
            className="h-20 flex-col gap-2 border-amber-300 hover:bg-amber-50"
          >
            <HelpCircle className="h-6 w-6 text-amber-600" />
            <span className="text-sm">Help Center</span>
            <span className="text-xs text-amber-600">Self-service</span>
          </Button>

          {enableLuxuryFeatures() && (
            <Button
              onClick={() => handleQuickAction('whiteGlove')}
              className="h-20 flex-col gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="h-6 w-6" />
              <span className="text-sm">VIP Service</span>
              <span className="text-xs opacity-80">White glove</span>
            </Button>
          )}
        </div>

        {/* Available Agents */}
        {availableAgents.length > 0 && (
          <Card className="mb-6 border-amber-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-amber-900">Available Agents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableAgents.slice(0, 3).map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={agent.avatar} />
                        <AvatarFallback>
                          {agent.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getAgentStatusColor(agent.status)}`} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{agent.name}</div>
                      <div className="text-xs text-gray-600">{agent.specialty} • {agent.responseTime}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-xs text-gray-600">{agent.rating}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Tickets */}
        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-amber-900">Recent Tickets</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-3 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors"
                onClick={() => handleQuickAction('viewTicket', { ticketId: ticket.id })}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{ticket.subject}</h3>
                    {ticket.unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white text-xs">{ticket.unreadCount}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>{ticket.ticketNumber}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(ticket.lastUpdate)}</span>
                    {ticket.assignedAgent && (
                      <>
                        <span>•</span>
                        <span>{ticket.assignedAgent}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="grid grid-cols-5 py-2">
          <Button
            variant="ghost"
            className="flex-col h-16 gap-1"
            onClick={() => setActiveTab('home')}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </Button>
          <Button
            variant="ghost"
            className="flex-col h-16 gap-1"
            onClick={() => setActiveTab('tickets')}
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs">Tickets</span>
            {unreadCount > 0 && (
              <Badge className="absolute top-2 right-4 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                {unreadCount}
              </Badge>
            )}
          </Button>
          <Button
            variant="ghost"
            className="flex-col h-16 gap-1"
            onClick={() => setActiveTab('agents')}
          >
            <HeadphonesIcon className="h-5 w-5" />
            <span className="text-xs">Agents</span>
          </Button>
          <Button
            variant="ghost"
            className="flex-col h-16 gap-1"
            onClick={() => setActiveTab('help')}
          >
            <HelpCircle className="h-5 w-5" />
            <span className="text-xs">Help</span>
          </Button>
          <Button
            variant="ghost"
            className="flex-col h-16 gap-1"
            onClick={() => setActiveTab('profile')}
          >
            <User className="h-5 w-5" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>

      {/* Floating Quick Actions */}
      {renderFloatingQuickActions()}

      {/* Mobile Performance Optimizations */}
      <div className="hidden">
        {/* Preload critical resources */}
        <link rel="preload" href="/api/placeholder" as="image" />
        {/* Service worker registration hints */}
        <script>
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
          }
        </script>
      </div>
    </div>
  );
};

export default MobileOptimizedSupport;