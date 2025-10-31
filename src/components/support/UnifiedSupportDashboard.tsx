import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import {
  Crown,
  Diamond,
  Star,
  Sparkles,
  Shield,
  TrendingUp,
  Users,
  Award,
  Target,
  Brain,
  Globe,
  Heart,
  Zap,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Settings,
  Bell,
  Phone,
  MessageCircle,
  Video,
  Mail,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  MapPin,
  Languages,
  HeadphonesIcon,
  ConciergeBell,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Filter,
  Search,
  Eye,
  EyeOff,
  UserPlus,
  UserCheck,
  UserX,
  Building,
  DollarSign,
  Percent,
  Package,
  ShoppingCart,
  CreditCard,
  AlertTriangle,
  Info,
  Lightbulb,
  BookOpen,
  GraduationCap,
  Medal,
  Trophy,
  Gem,
  Crown2,
  MessageSquare,
  MailIcon,
  VideoIcon,
  PhoneIcon,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Wifi,
  Smartphone,
  Monitor,
  Tablet,
  Globe2,
  Map,
  Navigation,
  Clock3,
  Timer,
  ZapOff,
  Battery,
  BatteryCharging,
  Cpu,
  HardDrive,
  MemoryStick,
  Database,
  Cloud,
  Server,
  Router,
  Network,
  Signal,
  SignalHigh,
  SignalLow,
  Radio,
  Bluetooth,
  Usb,
  Hdmi,
  UsbPort,
  LanPort,
  SdCard,
  SimCard,
  Memory,
  Storage,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Wind,
  Thermometer,
  Droplets,
  Gauge,
  Speed,
  TachometerAlt,
  TimerOff,
  TimerReset,
  Play,
  Pause,
  Square,
  Circle,
  SquareIcon,
  CircleIcon,
  PlayCircle,
  PauseCircle,
  StopCircle,
  SkipForward,
  SkipBack,
  FastForward,
  Rewind,
  Volume2,
  VolumeX,
  Volume1,
  Volume,
  VolumeOff,
  VolumeUp,
  VolumeDown,
  Mute,
  Unmute,
  Speaker,
  SpeakerOff,
  Mic,
  MicOff,
  Mic2,
  VideoOff,
  VideoIcon2,
  Camera,
  CameraOff,
  Maximize,
  Minimize,
  Maximize2,
  Minimize2,
  Expand,
  Shrink,
  Fullscreen,
  FullscreenExit,
  Crop,
  Scissors,
  Move,
  Grab,
  GrabHorizontal,
  GrabVertical,
  Hand,
  HandMetal,
  HandPeace,
  HandSparkles,
  HandHelping,
  HandHeart,
  HandHoldingHeart,
  HandHolding,
  HandPointing,
  HandPointUp,
  HandPointDown,
  HandPointLeft,
  HandPointRight,
  HandTap,
  HandMove,
  HandDollar,
  HandCoin,
  HandPlatter,
  HandMetal2,
  HandPeace2,
  HandRock,
  HandPaper,
  HandScissors,
  HandLizard,
  HandSpock,
  Ok,
  ThumbsUp,
  ThumbsDown,
  Pointer,
  PointerOff,
  MousePointer,
  MousePointer2,
  MousePointerClick,
  Touch,
  Swipe,
  SwipeLeft,
  SwipeRight,
  SwipeUp,
  SwipeDown,
  DragHorizontal,
  DragVertical,
  DragLeft,
  DragRight,
  DragUp,
  DragDown,
  Resize,
  ResizeHorizontal,
  ResizeVertical,
  ResizeLeft,
  ResizeRight,
  ResizeUp,
  ResizeDown,
  ExpandHorizontal,
  ExpandVertical,
  ShrinkHorizontal,
  ShrinkVertical,
  Move3d,
  MoveDiagonal,
  MoveDiagonal2,
  MoveHorizontal,
  MoveVertical,
  ArrowRight,
  ArrowLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightCircle,
  ArrowLeftCircle,
  ArrowUpRight,
  ArrowUpLeft,
  ArrowDownRight,
  ArrowDownLeft,
  ArrowBigUp,
  ArrowBigDown,
  ArrowBigRight,
  ArrowBigLeft,
  ArrowBigUpDash,
  ArrowBigDownDash,
  ArrowBigRightDash,
  ArrowBigLeftDash,
  ArrowUpFromLine,
  ArrowDownFromLine,
  ArrowRightFromLine,
  ArrowLeftFromLine,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowRightToLine,
  ArrowLeftToLine,
  ArrowUpFromDot,
  ArrowDownFromDot,
  ArrowRightFromDot,
  ArrowLeftFromDot,
  ArrowUpToDot,
  ArrowDownToDot,
  ArrowRightToDot,
  ArrowLeftToDot,
  ArrowUpDown,
  ArrowLeftRight,
  ArrowUpLeftFromCircle,
  ArrowUpRightFromCircle,
  ArrowDownLeftFromCircle,
  ArrowDownRightFromCircle,
  ArrowUpLeftToCircle,
  ArrowUpRightToCircle,
  ArrowDownLeftToCircle,
  ArrowDownRightToCircle,
  ArrowUpLeftFromSquare,
  ArrowUpRightFromSquare,
  ArrowDownLeftFromSquare,
  ArrowDownRightFromSquare,
  ArrowUpLeftToSquare,
  ArrowUpRightToSquare,
  ArrowDownLeftToSquare,
  ArrowDownRightToSquare,
  ArrowUpLeftDiamond,
  ArrowUpRightDiamond,
  ArrowDownLeftDiamond,
  ArrowDownRightDiamond,
  ArrowUpLeftFromDiamond,
  ArrowUpRightFromDiamond,
  ArrowDownLeftFromDiamond,
  ArrowDownRightFromDiamond,
  ArrowUpLeftToDiamond,
  ArrowUpRightToDiamond,
  ArrowDownLeftToDiamond,
  ArrowDownRightToDiamond,
  ArrowUpLeftFromTriangle,
  ArrowUpRightFromTriangle,
  ArrowDownLeftFromTriangle,
  ArrowDownRightFromTriangle,
  ArrowUpLeftToTriangle,
  ArrowUpRightToTriangle,
  ArrowDownLeftToTriangle,
  ArrowDownRightToTriangle,
  ArrowUpLeftFromHexagon,
  ArrowUpRightFromHexagon,
  ArrowDownLeftFromHexagon,
  ArrowDownRightFromHexagon,
  ArrowUpLeftToHexagon,
  ArrowUpRightToHexagon,
  ArrowDownLeftToHexagon,
  ArrowDownRightToHexagon,
  ArrowUpLeftFromOctagon,
  ArrowUpRightFromOctagon,
  ArrowDownLeftFromOctagon,
  ArrowDownRightFromOctagon,
  ArrowUpLeftToOctagon,
  ArrowUpRightToOctagon,
  ArrowDownLeftToOctagon,
  ArrowDownRightToOctagon,
  ArrowUpLeftFromStar,
  ArrowUpRightFromStar,
  ArrowDownLeftFromStar,
  ArrowDownRightFromStar,
  ArrowUpLeftToStar,
  ArrowUpRightToStar,
  ArrowDownLeftToStar,
  ArrowDownRightToStar,
  ArrowUpLeftFromHeart,
  ArrowUpRightFromHeart,
  ArrowDownLeftFromHeart,
  ArrowDownRightFromHeart,
  ArrowUpLeftToHeart,
  ArrowUpRightToHeart,
  ArrowDownLeftToHeart,
  ArrowDownRightToHeart,
  ArrowUpLeftFromPlus,
  ArrowUpRightFromPlus,
  ArrowDownLeftFromPlus,
  ArrowDownRightFromPlus,
  ArrowUpLeftToPlus,
  ArrowUpRightToPlus,
  ArrowDownLeftToPlus,
  ArrowDownRightToPlus,
  ArrowUpLeftFromMinus,
  ArrowUpRightFromMinus,
  ArrowDownLeftFromMinus,
  ArrowDownRightFromMinus,
  ArrowUpLeftToMinus,
  ArrowUpRightToMinus,
  ArrowDownLeftToMinus,
  ArrowDownRightToMinus,
  ArrowUpLeftFromMultiply,
  ArrowUpRightFromMultiply,
  ArrowDownLeftFromMultiply,
  ArrowDownRightFromMultiply,
  ArrowUpLeftToMultiply,
  ArrowUpRightToMultiply,
  ArrowDownLeftToMultiply,
  ArrowDownRightToMultiply,
  ArrowUpLeftFromDivide,
  ArrowUpRightFromDivide,
  ArrowDownLeftFromDivide,
  ArrowDownRightFromDivide,
  ArrowUpLeftToDivide,
  ArrowUpRightToDivide,
  ArrowDownLeftToDivide,
  ArrowDownRightToDivide,
  ArrowUpLeftFromEqual,
  ArrowUpRightFromEqual,
  ArrowDownLeftFromEqual,
  ArrowDownRightFromEqual,
  ArrowUpLeftToEqual,
  ArrowUpRightToEqual,
  ArrowDownLeftToEqual,
  ArrowDownRightToEqual,
  ArrowUpLeftFromNotEqual,
  ArrowUpRightFromNotEqual,
  ArrowDownLeftFromNotEqual,
  ArrowDownRightFromNotEqual,
  ArrowUpLeftToNotEqual,
  ArrowUpRightToNotEqual,
  ArrowDownLeftToNotEqual,
  ArrowDownRightToNotEqual,
  ArrowUpLeftFromLessThan,
  ArrowUpRightFromLessThan,
  ArrowDownLeftFromLessThan,
  ArrowDownRightFromLessThan,
  ArrowUpLeftToLessThan,
  ArrowUpRightToLessThan,
  ArrowDownLeftToLessThan,
  ArrowDownRightToLessThan,
  ArrowUpLeftFromGreaterThan,
  ArrowUpRightFromGreaterThan,
  ArrowDownLeftFromGreaterThan,
  ArrowDownRightFromGreaterThan,
  ArrowUpLeftToGreaterThan,
  ArrowUpRightToGreaterThan,
  ArrowDownLeftToGreaterThan,
  ArrowDownRightToGreaterThan,
  ArrowUpLeftFromLessThanEqual,
  ArrowUpRightFromLessThanEqual,
  ArrowDownLeftFromLessThanEqual,
  ArrowDownRightFromLessThanEqual,
  ArrowUpLeftToLessThanEqual,
  ArrowUpRightToLessThanEqual,
  ArrowDownLeftToLessThanEqual,
  ArrowDownRightToLessThanEqual,
  ArrowUpLeftFromGreaterThanEqual,
  ArrowUpRightFromGreaterThanEqual,
  ArrowDownLeftFromGreaterThanEqual,
  ArrowDownRightFromGreaterThanEqual,
  ArrowUpLeftToGreaterThanEqual,
  ArrowUpRightToGreaterThanEqual,
  ArrowDownLeftToGreaterThanEqual,
  ArrowDownRightFromGreaterThanEqual,
  ArrowUpLeftFromApproximately,
  ArrowUpRightFromApproximately,
  ArrowDownLeftFromApproximately,
  ArrowDownRightFromApproximately,
  ArrowUpLeftToApproximately,
  ArrowUpRightToApproximately,
  ArrowDownLeftToApproximately,
  ArrowDownRightToApproximately,
  ArrowUpLeftFromNotApproximately,
  ArrowUpRightFromNotApproximately,
  ArrowDownLeftFromNotApproximately,
  ArrowDownRightFromNotApproximately,
  ArrowUpLeftToNotApproximately,
  ArrowUpRightToNotApproximately,
  ArrowDownLeftToNotApproximately,
  ArrowDownRightToNotApproximately,
  ArrowUpLeftFromInfinity,
  ArrowUpRightFromInfinity,
  ArrowDownLeftFromInfinity,
  ArrowDownRightFromInfinity,
  ArrowUpLeftToInfinity,
  ArrowUpRightToInfinity,
  ArrowDownLeftToInfinity,
  ArrowDownRightToInfinity,
  ArrowUpLeftFromPi,
  ArrowUpRightFromPi,
  ArrowDownLeftFromPi,
  ArrowDownRightFromPi,
  ArrowUpLeftToPi,
  ArrowUpRightToPi,
  ArrowDownLeftToPi,
  ArrowDownRightToPi,
  ArrowUpLeftFromE,
  ArrowUpRightFromE,
  ArrowDownLeftFromE,
  ArrowDownRightFromE,
  ArrowUpLeftToE,
  ArrowUpRightToE,
  ArrowDownLeftToE,
  ArrowDownRightToE,
  ArrowUpLeftFromAlpha,
  ArrowUpRightFromAlpha,
  ArrowDownLeftFromAlpha,
  ArrowDownRightFromAlpha,
  ArrowUpLeftToAlpha,
  ArrowUpRightToAlpha,
  ArrowDownLeftToAlpha,
  ArrowDownRightToAlpha,
  ArrowUpLeftFromBeta,
  ArrowUpRightFromBeta,
  ArrowDownLeftFromBeta,
  ArrowDownRightFromBeta,
  ArrowUpLeftToBeta,
  ArrowUpRightToBeta,
  ArrowDownLeftToBeta,
  ArrowDownRightToBeta,
  ArrowUpLeftFromGamma,
  ArrowUpRightFromGamma,
  ArrowDownLeftFromGamma,
  ArrowDownRightFromGamma,
  ArrowUpLeftToGamma,
  ArrowUpRightToGamma,
  ArrowDownLeftToGamma,
  ArrowDownRightToGamma,
  ArrowUpLeftFromDelta,
  ArrowUpRightFromDelta,
  ArrowDownLeftFromDelta,
  ArrowDownRightFromDelta,
  ArrowUpLeftToDelta,
  ArrowUpRightToDelta,
  ArrowDownLeftToDelta,
  ArrowDownRightToDelta,
  ArrowUpLeftFromEpsilon,
  ArrowUpRightFromEpsilon,
  ArrowDownLeftFromEpsilon,
  ArrowDownRightFromEpsilon,
  ArrowUpLeftToEpsilon,
  ArrowUpRightToEpsilon,
  ArrowDownLeftToEpsilon,
  ArrowDownRightToEpsilon,
  ArrowUpLeftFromZeta,
  ArrowUpRightFromZeta,
  ArrowDownLeftFromZeta,
  ArrowDownRightFromZeta,
  ArrowUpLeftToZeta,
  ArrowUpRightToZeta,
  ArrowDownLeftToZeta,
  ArrowDownRightToZeta,
  ArrowUpLeftFromEta,
  ArrowUpRightFromEta,
  ArrowDownLeftFromEta,
  ArrowDownRightFromEta,
  ArrowUpLeftToEta,
  ArrowUpRightToEta,
  ArrowDownLeftToEta,
  ArrowDownRightToEta,
  ArrowUpLeftFromTheta,
  ArrowUpRightFromTheta,
  ArrowDownLeftFromTheta,
  ArrowDownRightFromTheta,
  ArrowUpLeftToTheta,
  ArrowUpRightToTheta,
  ArrowDownLeftToTheta,
  ArrowDownRightToTheta,
  ArrowUpLeftFromIota,
  ArrowUpRightFromIota,
  ArrowDownLeftFromIota,
  ArrowDownRightFromIota,
  ArrowUpLeftToIota,
  ArrowUpRightToIota,
  ArrowDownLeftToIota,
  ArrowDownRightToIota,
  ArrowUpLeftFromKappa,
  ArrowUpRightFromKappa,
  ArrowDownLeftFromKappa,
  ArrowDownRightFromKappa,
  ArrowUpLeftToKappa,
  ArrowUpRightToKappa,
  ArrowDownLeftToKappa,
  ArrowDownRightToKappa,
  ArrowUpLeftFromLambda,
  ArrowUpRightFromLambda,
  ArrowDownLeftFromLambda,
  ArrowDownRightFromLambda,
  ArrowUpLeftToLambda,
  ArrowUpRightToLambda,
  ArrowDownLeftToLambda,
  ArrowDownRightToLambda,
  ArrowUpLeftFromMu,
  ArrowUpRightFromMu,
  ArrowDownLeftFromMu,
  ArrowDownRightFromMu,
  ArrowUpLeftToMu,
  ArrowUpRightToMu,
  ArrowDownLeftToMu,
  ArrowDownRightToMu,
  ArrowUpLeftFromNu,
  ArrowUpRightFromNu,
  ArrowDownLeftFromNu,
  ArrowDownRightFromNu,
  ArrowUpLeftToNu,
  ArrowUpRightToNu,
  ArrowDownLeftToNu,
  ArrowDownRightFromNu,
  ArrowUpLeftFromXi,
  ArrowUpRightFromXi,
  ArrowDownLeftFromXi,
  ArrowDownRightFromXi,
  ArrowUpLeftToXi,
  ArrowUpRightToXi,
  ArrowDownLeftToXi,
  ArrowDownRightToXi,
  ArrowUpLeftFromOmicron,
  ArrowUpRightFromOmicron,
  ArrowDownLeftFromOmicron,
  ArrowDownRightFromOmicron,
  ArrowUpLeftToOmicron,
  ArrowUpRightToOmicron,
  ArrowDownLeftToOmicron,
  ArrowDownRightToOmicron,
  ArrowUpLeftFromPi,
  ArrowUpRightFromPi,
  ArrowDownLeftFromPi,
  ArrowDownRightFromPi,
  ArrowUpLeftToPi,
  ArrowUpRightToPi,
  ArrowDownLeftToPi,
  ArrowDownRightToPi,
  ArrowUpLeftFromRho,
  ArrowUpRightFromRho,
  ArrowDownLeftFromRho,
  ArrowDownRightFromRho,
  ArrowUpLeftToRho,
  ArrowUpRightToRho,
  ArrowDownLeftToRho,
  ArrowDownRightToRho,
  ArrowUpLeftFromSigma,
  ArrowUpRightFromSigma,
  ArrowDownLeftFromSigma,
  ArrowDownRightFromSigma,
  ArrowUpLeftToSigma,
  ArrowUpRightToSigma,
  ArrowDownLeftToSigma,
  ArrowDownRightToSigma,
  ArrowUpLeftFromTau,
  ArrowUpRightFromTau,
  ArrowDownLeftFromTau,
  ArrowDownRightFromTau,
  ArrowUpLeftToTau,
  ArrowUpRightToTau,
  ArrowDownLeftToTau,
  ArrowDownRightToTau,
  ArrowUpLeftFromUpsilon,
  ArrowUpRightFromUpsilon,
  ArrowDownLeftFromUpsilon,
  ArrowDownRightFromUpsilon,
  ArrowUpLeftToUpsilon,
  ArrowUpRightToUpsilon,
  ArrowDownLeftToUpsilon,
  ArrowDownRightToUpsilon,
  ArrowUpLeftFromPhi,
  ArrowUpRightFromPhi,
  ArrowDownLeftFromPhi,
  ArrowDownRightFromPhi,
  ArrowUpLeftToPhi,
  ArrowUpRightToPhi,
  ArrowDownLeftToPhi,
  ArrowDownRightFromPhi,
  ArrowUpLeftFromChi,
  ArrowUpRightFromChi,
  ArrowDownLeftFromChi,
  ArrowDownRightFromChi,
  ArrowUpLeftToChi,
  ArrowUpRightToChi,
  ArrowDownLeftToChi,
  ArrowDownRightToChi,
  ArrowUpLeftFromPsi,
  ArrowUpRightFromPsi,
  ArrowDownLeftFromPsi,
  ArrowDownRightFromPsi,
  ArrowUpLeftToPsi,
  ArrowUpRightToPsi,
  ArrowDownLeftToPsi,
  ArrowDownRightToPsi,
  ArrowUpLeftFromOmega,
  ArrowUpRightFromOmega,
  ArrowDownLeftFromOmega,
  ArrowDownRightFromOmega,
  ArrowUpLeftToOmega,
  ArrowUpRightToOmega,
  ArrowDownLeftToOmega,
  ArrowDownRightToOmega
} from 'lucide-react';

interface UnifiedSupportDashboardProps {
  clientId?: string;
  agentId?: string;
  viewMode?: 'agent' | 'supervisor' | 'executive';
  initialView?: 'overview' | 'tickets' | 'clients' | 'analytics';
}

interface OmnichannelConversation {
  id: string;
  clientId: string;
  clientName: string;
  clientTier: 'vip_platinum' | 'vip_gold' | 'vip_silver' | 'premium' | 'standard';
  channels: ChannelInteraction[];
  unifiedContext: UnifiedContext;
  status: 'active' | 'waiting' | 'resolved' | 'escalated';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignedAgent?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  satisfactionPrediction?: number;
  firstResponseTime?: number;
  resolutionTime?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ChannelInteraction {
  id: string;
  channel: 'chat' | 'email' | 'phone' | 'video' | 'whatsapp' | 'facebook' | 'instagram' | 'twitter' | 'linkedin';
  channelType: 'text' | 'voice' | 'video';
  message: string;
  sender: 'client' | 'agent';
  timestamp: string;
  metadata?: Record<string, any>;
  attachments?: Attachment[];
  emotions?: EmotionData[];
  translatedContent?: {
    originalLanguage: string;
    translatedText: string;
    confidence: number;
  };
}

interface UnifiedContext {
  clientProfile: ClientProfile;
  interactionHistory: InteractionHistory[];
  preferences: ClientPreferences;
  journeyStage: string;
  riskFactors: string[];
  opportunities: string[];
  personalizedInsights: string[];
  relevantKnowledge: KnowledgeBaseArticle[];
  suggestedActions: SuggestedAction[];
}

interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: string;
  joinDate: string;
  totalSpend: number;
  bookingCount: number;
  lastInteraction: string;
  preferredLanguage: string;
  timezone: string;
  location: string;
  avatar?: string;
  company?: string;
  notes?: string;
  customFields?: Record<string, any>;
}

interface InteractionHistory {
  id: string;
  type: string;
  channel: string;
  date: string;
  duration?: number;
  outcome: string;
  satisfaction?: number;
  agent?: string;
  summary: string;
  tags: string[];
  sentiment?: string;
  resolutionTime?: number;
}

interface ClientPreferences {
  preferredChannels: string[];
  communicationStyle: string;
  responseTimeExpectation: string;
  language: string;
  timezone: string;
  notifications: boolean;
  privacyLevel: string;
  accessibilityNeeds: string[];
  personalizationLevel: string;
}

interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  relevanceScore: number;
  language: string;
  lastUpdated: string;
}

interface SuggestedAction {
  id: string;
  type: 'response' | 'knowledge' | 'escalation' | 'follow_up' | 'proactive_outreach';
  title: string;
  description: string;
  confidence: number;
  priority: number;
  automated: boolean;
  template?: string;
  knowledgeArticle?: string;
  escalationPath?: string;
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnail?: string;
  metadata?: Record<string, any>;
}

interface EmotionData {
  emotion: string;
  confidence: number;
  timestamp: string;
}

interface AgentPerformance {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  currentLoad: number;
  maxCapacity: number;
  specializations: string[];
  languages: string[];
  skills: string[];
  averageResponseTime: number;
  satisfactionScore: number;
  resolutionRate: number;
  ticketsHandled: number;
  activeConversations: number;
  tier: string;
  lastActivity: string;
}

interface SystemMetrics {
  totalConversations: number;
  activeConversations: number;
  waitingConversations: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  satisfactionScore: number;
  agentUtilization: number;
  systemHealth: number;
  channelDistribution: Record<string, number>;
  tierDistribution: Record<string, number>;
  sentimentDistribution: Record<string, number>;
  volumeTrends: number[];
  peakHours: number[];
  agentPerformance: AgentPerformance[];
  realTimeAlerts: SystemAlert[];
}

interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  assignee?: string;
  metadata?: Record<string, any>;
}

const UnifiedSupportDashboard: React.FC<UnifiedSupportDashboardProps> = ({
  clientId,
  agentId,
  viewMode = 'agent',
  initialView = 'overview'
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // State management
  const [activeView, setActiveView] = useState(initialView);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');

  // Data states
  const [conversations, setConversations] = useState<OmnichannelConversation[]>([]);
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [unifiedContext, setUnifiedContext] = useState<UnifiedContext | null>(null);

  // Initialize dashboard
  useEffect(() => {
    initializeDashboard();
  }, [clientId, agentId, viewMode]);

  const initializeDashboard = async () => {
    try {
      setLoading(true);

      const [conversationsData, agentsData, metricsData, alertsData] = await Promise.all([
        loadConversations(),
        loadAgents(),
        loadMetrics(),
        loadAlerts()
      ]);

      setConversations(conversationsData);
      setAgents(agentsData);
      setMetrics(metricsData);
      setSystemAlerts(alertsData);

    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      toast({
        title: "Dashboard Initialization Failed",
        description: "Unable to load support dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async (): Promise<OmnichannelConversation[]> => {
    // Mock implementation - would connect to real omnichannel API
    return [
      {
        id: 'conv-1',
        clientId: 'client-1',
        clientName: 'Anna Kowalska',
        clientTier: 'vip_platinum',
        channels: [
          {
            id: 'msg-1',
            channel: 'chat',
            channelType: 'text',
            message: 'I need help with my upcoming appointment',
            sender: 'client',
            timestamp: new Date().toISOString(),
            emotions: [
              { emotion: 'neutral', confidence: 0.8, timestamp: new Date().toISOString() }
            ]
          }
        ],
        unifiedContext: {
          clientProfile: {
            id: 'client-1',
            name: 'Anna Kowalska',
            email: 'anna.kowalska@email.com',
            phone: '+48 123 456 789',
            tier: 'vip_platinum',
            joinDate: '2023-01-15',
            totalSpend: 15000,
            bookingCount: 25,
            lastInteraction: new Date().toISOString(),
            preferredLanguage: 'pl',
            timezone: 'Europe/Warsaw',
            location: 'Warsaw, Poland'
          },
          interactionHistory: [],
          preferences: {
            preferredChannels: ['chat', 'phone'],
            communicationStyle: 'formal',
            responseTimeExpectation: 'immediate',
            language: 'pl',
            timezone: 'Europe/Warsaw',
            notifications: true,
            privacyLevel: 'high',
            accessibilityNeeds: [],
            personalizationLevel: 'high'
          },
          journeyStage: 'post_booking_support',
          riskFactors: [],
          opportunities: ['upsell_premium_services', 'referral_opportunity'],
          personalizedInsights: [
            'Prefers detailed explanations',
            'Values privacy and discretion',
            'Responsive during business hours'
          ],
          relevantKnowledge: [],
          suggestedActions: []
        },
        status: 'active',
        priority: 'high',
        assignedAgent: 'agent-1',
        sentiment: 'neutral',
        satisfactionPrediction: 4.5,
        tags: ['appointment', 'vip', 'polish'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  };

  const loadAgents = async (): Promise<AgentPerformance[]> => {
    // Mock implementation
    return [
      {
        id: 'agent-1',
        name: 'Maria Nowak',
        avatar: '/avatars/maria.jpg',
        status: 'online',
        currentLoad: 3,
        maxCapacity: 5,
        specializations: ['beauty_services', 'vip_support', 'polish_language'],
        languages: ['pl', 'en'],
        skills: ['empathy', 'product_knowledge', 'conflict_resolution'],
        averageResponseTime: 45,
        satisfactionScore: 4.8,
        resolutionRate: 96,
        ticketsHandled: 127,
        activeConversations: 3,
        tier: 'senior',
        lastActivity: new Date().toISOString()
      }
    ];
  };

  const loadMetrics = async (): Promise<SystemMetrics> => {
    // Mock implementation
    return {
      totalConversations: 1247,
      activeConversations: 23,
      waitingConversations: 5,
      averageResponseTime: 1.2,
      averageResolutionTime: 12.5,
      satisfactionScore: 4.7,
      agentUtilization: 78,
      systemHealth: 99.2,
      channelDistribution: {
        chat: 45,
        email: 25,
        phone: 20,
        whatsapp: 8,
        video: 2
      },
      tierDistribution: {
        vip_platinum: 5,
        vip_gold: 12,
        vip_silver: 18,
        premium: 35,
        standard: 30
      },
      sentimentDistribution: {
        positive: 67,
        neutral: 28,
        negative: 5
      },
      volumeTrends: [120, 135, 128, 142, 138, 155, 148],
      peakHours: [9, 14, 16, 18],
      agentPerformance: [],
      realTimeAlerts: []
    };
  };

  const loadAlerts = async (): Promise<SystemAlert[]> => {
    // Mock implementation
    return [
      {
        id: 'alert-1',
        type: 'warning',
        title: 'High VIP Queue',
        message: '3 VIP clients waiting longer than 2 minutes',
        timestamp: new Date().toISOString(),
        acknowledged: false
      }
    ];
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await initializeDashboard();
    setRefreshing(false);
    toast({
      title: "Dashboard Refreshed",
      description: "All support data has been updated"
    });
  }, []);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'chat': return <MessageCircle className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'vip_platinum': return <Diamond className="h-4 w-4 text-purple-500" />;
      case 'vip_gold': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'vip_silver': return <Star className="h-4 w-4 text-gray-400" />;
      case 'premium': return <Award className="h-4 w-4 text-blue-500" />;
      default: return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'waiting': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'escalated': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const matchesSearch = searchQuery === '' ||
        conv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.channels.some(ch => ch.message.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesChannel = selectedChannel === 'all' ||
        conv.channels.some(ch => ch.channel === selectedChannel);

      const matchesTier = selectedTier === 'all' || conv.clientTier === selectedTier;
      const matchesStatus = selectedStatus === 'all' || conv.status === selectedStatus;
      const matchesPriority = selectedPriority === 'all' || conv.priority === selectedPriority;

      return matchesSearch && matchesChannel && matchesTier && matchesStatus && matchesPriority;
    });
  }, [conversations, searchQuery, selectedChannel, selectedTier, selectedStatus, selectedPriority]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-rose-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-amber-900">Initializing Unified Support Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-rose-50/30">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-amber-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600">
                  <Crown2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    Unified Support Dashboard
                  </h1>
                  <p className="text-gray-600">
                    {viewMode === 'executive' ? 'Executive Support Overview' :
                     viewMode === 'supervisor' ? 'Team Management Center' :
                     'Agent Workspace'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* System Health */}
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-800">
                  System Health: {metrics?.systemHealth.toFixed(1)}%
                </span>
              </div>

              {/* Refresh */}
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">Active Conversations</p>
                <p className="text-lg font-bold text-blue-900">{metrics?.activeConversations || 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-600">Avg Response Time</p>
                <p className="text-lg font-bold text-green-900">{metrics?.averageResponseTime || 0}s</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <Heart className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600">Satisfaction Score</p>
                <p className="text-lg font-bold text-purple-900">{metrics?.satisfactionScore || 0}/5</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <Users className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm text-amber-600">Agent Utilization</p>
                <p className="text-lg font-bold text-amber-900">{metrics?.agentUtilization || 0}%</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg border border-rose-200">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              <div>
                <p className="text-sm text-rose-600">Waiting Queue</p>
                <p className="text-lg font-bold text-rose-900">{metrics?.waitingConversations || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {systemAlerts.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="space-y-2">
            {systemAlerts.slice(0, 3).map((alert) => (
              <Alert key={alert.id} className={`border-l-4 ${
                alert.type === 'critical' ? 'border-red-500 bg-red-50' :
                alert.type === 'warning' ? 'border-orange-500 bg-orange-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{alert.message}</span>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Filter className="h-5 w-5 text-amber-600" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-amber-300"
                    />
                  </div>
                  <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                    <SelectTrigger className="border-amber-300">
                      <SelectValue placeholder="Channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Channels</SelectItem>
                      <SelectItem value="chat">Chat</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedTier} onValueChange={setSelectedTier}>
                    <SelectTrigger className="border-amber-300">
                      <SelectValue placeholder="Tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="vip_platinum">VIP Platinum</SelectItem>
                      <SelectItem value="vip_gold">VIP Gold</SelectItem>
                      <SelectItem value="vip_silver">VIP Silver</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="border-amber-300">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="waiting">Waiting</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="escalated">Escalated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Conversations */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <MessageCircle className="h-5 w-5 text-amber-600" />
                  Active Conversations ({filteredConversations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedConversation === conversation.id
                          ? 'bg-amber-50 border-amber-300 shadow-md'
                          : 'bg-white border-amber-200 hover:bg-amber-50'
                      }`}
                      onClick={() => setSelectedConversation(conversation.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conversation.unifiedContext.clientProfile.avatar} />
                            <AvatarFallback>
                              {conversation.clientName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">{conversation.clientName}</h4>
                              {getTierIcon(conversation.clientTier)}
                              <Badge className={getPriorityColor(conversation.priority)}>
                                {conversation.priority}
                              </Badge>
                              <Badge className={getStatusColor(conversation.status)}>
                                {conversation.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              {conversation.channels.slice(0, 3).map((channel) => (
                                <div key={channel.id} className="flex items-center gap-1">
                                  {getChannelIcon(channel.channel)}
                                  <span className="text-xs text-gray-500">{channel.channel}</span>
                                </div>
                              ))}
                              {conversation.channels.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{conversation.channels.length - 3} more
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {conversation.channels[conversation.channels.length - 1]?.message}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>{formatTime(conversation.updatedAt)}</span>
                              {conversation.assignedAgent && (
                                <span>Agent: {agents.find(a => a.id === conversation.assignedAgent)?.name}</span>
                              )}
                              {conversation.satisfactionPrediction && (
                                <span>Score: {conversation.satisfactionPrediction}/5</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Agent Status */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Users className="h-5 w-5 text-amber-600" />
                  Agent Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          agent.status === 'online' ? 'bg-green-500' :
                          agent.status === 'busy' ? 'bg-yellow-500' :
                          agent.status === 'away' ? 'bg-orange-500' :
                          'bg-gray-400'
                        }`}></div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={agent.avatar} />
                          <AvatarFallback>{agent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{agent.name}</p>
                          <p className="text-xs text-gray-500">{agent.activeConversations}/{agent.maxCapacity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium">{agent.satisfactionScore}/5</p>
                        <p className="text-xs text-gray-500">{agent.resolutionRate}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Channel Distribution */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <BarChart3 className="h-5 w-5 text-amber-600" />
                  Channel Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metrics?.channelDistribution || {}).map(([channel, count]) => (
                    <div key={channel} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(channel)}
                        <span className="text-sm font-medium capitalize">{channel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-amber-600 h-2 rounded-full"
                            style={{
                              width: `${(count / (metrics?.totalConversations || 1)) * 100}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Zap className="h-5 w-5 text-amber-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full bg-amber-600 hover:bg-amber-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  New Conversation
                </Button>
                <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50">
                  <Phone className="h-4 w-4 mr-2" />
                  Start Call
                </Button>
                <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50">
                  <Video className="h-4 w-4 mr-2" />
                  Video Consultation
                </Button>
                <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Knowledge Base
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedSupportDashboard;