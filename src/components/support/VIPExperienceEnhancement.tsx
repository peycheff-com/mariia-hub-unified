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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
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
  Wine,
  Music,
  Flower2,
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
  Gift,
  PartyPopper,
  Champagne,
  Car,
  Plane,
  Hotel,
  Utensils,
  Coffee,
  Cake,
  Camera,
  Palette,
  Brush,
  Scissors,
  SparklesIcon,
  HeartHandshake,
  Handshake,
  Users2,
  UserCheck2,
  StarIcon,
  AwardIcon,
  TrophyIcon,
  MedalIcon,
  GemIcon,
  Crown2Icon,
  DiamondIcon,
  Flame,
  Fire,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  ZapIcon,
  Bolt,
  Lightning,
  Power,
  PowerOff,
  Battery,
  BatteryCharging,
  Cpu,
  HardDrive,
  MemoryStick,
  Database,
  CloudIcon,
  Server,
  Router,
  Network,
  Signal,
  SignalHigh,
  SignalLow,
  Radio,
  Bluetooth,
  Wifi,
  Smartphone,
  Tablet,
  Monitor,
  Laptop,
  Desktop,
  Tv,
  Watch,
  Headphones,
  Speaker,
  Microphone,
  Webcam,
  Keyboard,
  Mouse,
  Printer,
  Scanner,
  Usb,
  Hdmi,
  LanPort,
  SdCard,
  SimCard,
  Memory,
  Storage,
  CloudDrizzle,
  SunIcon,
  MoonIcon,
  Wind,
  Thermometer,
  Droplets,
  Gauge,
  Speed,
  TachometerAlt,
  Timer,
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
  SpeakerIcon,
  SpeakerOff,
  Mic,
  MicOff,
  Mic2,
  VideoOff,
  VideoIcon2,
  CameraIcon,
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
  ScissorsIcon,
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
  HandScissors2,
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
  ArrowUp,
  ArrowDown,
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
  ArrowDownRightToGreaterThanEqual,
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
  ArrowDownRightToNu,
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
  ArrowDownRightToPhi,
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

interface VIPExperienceEnhancementProps {
  clientId?: string;
  agentId?: string;
  viewMode?: 'client' | 'concierge' | 'manager';
}

interface VIPClientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: 'vip_platinum' | 'vip_gold' | 'vip_silver';
  joinDate: string;
  totalSpend: number;
  bookingCount: number;
  lastInteraction: string;
  preferredLanguage: string;
  timezone: string;
  location: string;
  avatar?: string;
  company?: string;
  personalInfo: {
    birthday?: string;
    anniversary?: string;
    preferences: string[];
    allergies?: string[];
    dietaryRestrictions?: string[];
    accessibilityNeeds?: string[];
  };
  lifestyle: {
    interests: string[];
    hobbies: string[];
    travelFrequency: string;
    diningPreferences: string[];
    entertainmentPreferences: string[];
  };
  communication: {
    preferredChannels: string[];
    contactFrequency: string;
    communicationStyle: string;
    privacyLevel: string;
    notificationPreferences: Record<string, boolean>;
  };
  businessInfo?: {
    industry: string;
    position: string;
    companySize: string;
    businessNeeds: string[];
  };
  familyInfo?: {
    spouse?: string;
    children?: string[];
    familyEvents: string[];
  };
}

interface VIPService {
  id: string;
  name: string;
  description: string;
  category: 'concierge' | 'wellness' | 'beauty' | 'lifestyle' | 'travel' | 'dining' | 'shopping' | 'entertainment';
  tier: 'vip_platinum' | 'vip_gold' | 'vip_silver' | 'all';
  pricing: {
    type: 'complimentary' | 'premium' | 'credits' | 'custom';
    amount?: number;
    credits?: number;
  };
  duration?: number;
  availability: string[];
  bookingRequired: boolean;
  customizations: ServiceCustomization[];
  providerInfo: {
    name: string;
    specialty: string;
    rating: number;
    languages: string[];
  };
}

interface ServiceCustomization {
  id: string;
  name: string;
  type: 'text' | 'select' | 'multiselect' | 'boolean' | 'number' | 'date' | 'time';
  options?: string[];
  required: boolean;
  defaultValue?: any;
}

interface VIPExperience {
  id: string;
  clientId: string;
  serviceId: string;
  type: 'personalized' | 'exclusive' | 'surprise_delight' | 'proactive' | 'celebration';
  title: string;
  description: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  scheduledDate?: string;
  duration?: number;
  location?: string;
  participants: string[];
  specialRequirements: string[];
  budget?: number;
  actualCost?: number;
  satisfaction?: number;
  feedback?: string;
  photos?: string[];
  memories?: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface VIPPreference {
  id: string;
  clientId: string;
  category: 'service' | 'communication' | 'timing' | 'location' | 'ambiance' | 'staff' | 'pricing';
  preference: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  context?: string;
  lastUpdated: string;
}

interface VIPInsight {
  id: string;
  clientId: string;
  type: 'behavioral' | 'preference' | 'opportunity' | 'risk' | 'celebration' | 'milestone';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionable: boolean;
  suggestedActions: string[];
  dueDate?: string;
  automated: boolean;
  category: string;
  createdAt: string;
}

interface VIPMilestone {
  id: string;
  clientId: string;
  type: 'booking_count' | 'spending' | 'loyalty' | 'referral' | 'anniversary' | 'birthday' | 'special_event';
  title: string;
  description: string;
  target?: number;
  current?: number;
  achieved: boolean;
  achievedDate?: string;
  reward?: string;
  celebration: CelebrationPlan;
  progress?: number;
}

interface CelebrationPlan {
  type: 'automatic' | 'manual' | 'hybrid';
  actions: CelebrationAction[];
  budget?: number;
  personalization: string;
}

interface CelebrationAction {
  type: 'message' | 'gift' | 'service' | 'experience' | 'discount' | 'recognition';
  title: string;
  description: string;
  scheduled?: string;
  automated: boolean;
  cost?: number;
}

const VIPExperienceEnhancement: React.FC<VIPExperienceEnhancementProps> = ({
  clientId,
  agentId,
  viewMode = 'concierge'
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // State management
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(clientId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');

  // Data states
  const [vipClients, setVipClients] = useState<VIPClientProfile[]>([]);
  const [clientProfile, setClientProfile] = useState<VIPClientProfile | null>(null);
  const [availableServices, setAvailableServices] = useState<VIPService[]>([]);
  const [clientExperiences, setClientExperiences] = useState<VIPExperience[]>([]);
  const [clientPreferences, setClientPreferences] = useState<VIPPreference[]>([]);
  const [clientInsights, setClientInsights] = useState<VIPInsight[]>([]);
  const [clientMilestones, setClientMilestones] = useState<VIPMilestone[]>([]);

  // Form states
  const [newExperience, setNewExperience] = useState<Partial<VIPExperience>>({});
  const [preferenceForm, setPreferenceForm] = useState<Partial<VIPPreference>>({});
  const [celebrationForm, setCelebrationForm] = useState<Partial<CelebrationPlan>>({});

  // Initialize component
  useEffect(() => {
    initializeVIPSystem();
  }, [selectedClient, viewMode]);

  const initializeVIPSystem = async () => {
    try {
      setLoading(true);

      const [
        clientsData,
        profileData,
        servicesData,
        experiencesData,
        preferencesData,
        insightsData,
        milestonesData
      ] = await Promise.all([
        loadVIPClients(),
        selectedClient ? loadClientProfile(selectedClient) : Promise.resolve(null),
        loadAvailableServices(),
        selectedClient ? loadClientExperiences(selectedClient) : Promise.resolve([]),
        selectedClient ? loadClientPreferences(selectedClient) : Promise.resolve([]),
        selectedClient ? loadClientInsights(selectedClient) : Promise.resolve([]),
        selectedClient ? loadClientMilestones(selectedClient) : Promise.resolve([])
      ]);

      setVipClients(clientsData);
      setClientProfile(profileData);
      setAvailableServices(servicesData);
      setClientExperiences(experiencesData);
      setClientPreferences(preferencesData);
      setClientInsights(insightsData);
      setClientMilestones(milestonesData);

    } catch (error) {
      console.error('Failed to initialize VIP system:', error);
      toast({
        title: "VIP System Initialization Failed",
        description: "Unable to load VIP experience data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVIPClients = async (): Promise<VIPClientProfile[]> => {
    // Mock implementation - would connect to real VIP management API
    return [
      {
        id: 'vip-1',
        name: 'Anna Kowalska',
        email: 'anna.kowalska@vip.com',
        phone: '+48 123 456 789',
        tier: 'vip_platinum',
        joinDate: '2023-01-15',
        totalSpend: 50000,
        bookingCount: 45,
        lastInteraction: new Date().toISOString(),
        preferredLanguage: 'pl',
        timezone: 'Europe/Warsaw',
        location: 'Warsaw, Poland',
        avatar: '/avatars/anna-vip.jpg',
        company: 'Elegance Group',
        personalInfo: {
          birthday: '1985-06-15',
          anniversary: '2015-09-20',
          preferences: ['champagne', 'classical_music', 'spa_treatments'],
          allergies: ['nuts'],
          dietaryRestrictions: ['vegetarian'],
          accessibilityNeeds: []
        },
        lifestyle: {
          interests: ['art', 'opera', 'fine_dining', 'luxury_travel'],
          hobbies: ['yoga', 'painting', 'reading'],
          travelFrequency: 'monthly',
          diningPreferences: ['michelin_star', 'organic', 'farm_to_table'],
          entertainmentPreferences: ['theater', 'concerts', 'galleries']
        },
        communication: {
          preferredChannels: ['phone', 'whatsapp', 'email'],
          contactFrequency: 'weekly',
          communicationStyle: 'formal',
          privacyLevel: 'high',
          notificationPreferences: {
            appointments: true,
            promotions: false,
            birthday: true,
            newsletter: true,
            exclusive_offers: true
          }
        },
        businessInfo: {
          industry: 'Fashion',
          position: 'CEO',
          companySize: '50-100',
          businessNeeds: ['corporate_events', 'employee_wellness', 'client_entertainment']
        },
        familyInfo: {
          spouse: 'Jan Kowalski',
          children: ['Zofia', 'Antoni'],
          familyEvents: ['birthdays', 'anniversaries', 'graduations']
        }
      }
    ];
  };

  const loadClientProfile = async (clientId: string): Promise<VIPClientProfile | null> => {
    // Mock implementation
    const clients = await loadVIPClients();
    return clients.find(c => c.id === clientId) || null;
  };

  const loadAvailableServices = async (): Promise<VIPService[]> => {
    // Mock implementation
    return [
      {
        id: 'service-1',
        name: 'Personal Beauty Concierge',
        description: 'Dedicated beauty consultant available 24/7 for personalized recommendations and bookings',
        category: 'concierge',
        tier: 'vip_platinum',
        pricing: {
          type: 'complimentary'
        },
        availability: ['24/7'],
        bookingRequired: false,
        customizations: [
          {
            id: 'pref-contact',
            name: 'Preferred Contact Method',
            type: 'select',
            options: ['phone', 'whatsapp', 'video', 'email'],
            required: true,
            defaultValue: 'whatsapp'
          },
          {
            id: 'focus-areas',
            name: 'Focus Areas',
            type: 'multiselect',
            options: ['skincare', 'makeup', 'hair', 'nails', 'wellness'],
            required: false
          }
        ],
        providerInfo: {
          name: 'Maria Nowak',
          specialty: 'Luxury Beauty Consulting',
          rating: 5.0,
          languages: ['pl', 'en', 'fr']
        }
      },
      {
        id: 'service-2',
        name: 'Exclusive Spa Experience',
        description: 'Private spa session with premium treatments and champagne service',
        category: 'wellness',
        tier: 'vip_gold',
        pricing: {
          type: 'premium',
          amount: 1500
        },
        duration: 180,
        availability: ['weekdays', 'saturdays'],
        bookingRequired: true,
        customizations: [
          {
            id: 'treatments',
            name: 'Selected Treatments',
            type: 'multiselect',
            options: ['facial', 'massage', 'body_treatment', 'manicure', 'pedicure'],
            required: true
          },
          {
            id: 'champagne',
            name: 'Champagne Service',
            type: 'boolean',
            required: false,
            defaultValue: true
          }
        ],
        providerInfo: {
          name: 'Luxury Spa Team',
          specialty: 'Premium Wellness Services',
          rating: 4.9,
          languages: ['pl', 'en']
        }
      },
      {
        id: 'service-3',
        name: 'Personal Shopping Experience',
        description: 'Private shopping session with personal stylist at luxury boutiques',
        category: 'shopping',
        tier: 'all',
        pricing: {
          type: 'credits',
          credits: 500
        },
        duration: 240,
        availability: ['weekdays_evenings', 'weekends'],
        bookingRequired: true,
        customizations: [
          {
            id: 'style-preferences',
            name: 'Style Preferences',
            type: 'multiselect',
            options: ['classic', 'modern', 'avant_garde', 'minimalist', 'bohemian'],
            required: true
          },
          {
            id: 'budget-range',
            name: 'Budget Range',
            type: 'select',
            options: ['1000-5000', '5000-10000', '10000-25000', '25000+'],
            required: true
          }
        ],
        providerInfo: {
          name: 'Ewa Nowak',
          specialty: 'Luxury Personal Styling',
          rating: 4.8,
          languages: ['pl', 'en', 'it']
        }
      }
    ];
  };

  const loadClientExperiences = async (clientId: string): Promise<VIPExperience[]> => {
    // Mock implementation
    return [
      {
        id: 'exp-1',
        clientId: clientId,
        serviceId: 'service-1',
        type: 'personalized',
        title: 'Anniversary Beauty Makeover',
        description: 'Complete beauty transformation for 10th anniversary celebration',
        status: 'completed',
        scheduledDate: '2024-01-20T14:00:00Z',
        duration: 240,
        location: 'Luxury Studio Warsaw',
        participants: ['Anna Kowalska', 'Jan Kowalski'],
        specialRequirements: ['hypoallergenic_products', 'champagne_service'],
        budget: 3000,
        actualCost: 2850,
        satisfaction: 5,
        feedback: 'Absolutely perfect! Made our anniversary unforgettable.',
        photos: ['/photos/anniversary1.jpg', '/photos/anniversary2.jpg'],
        memories: ['Champagne toast', 'Personalized music playlist', 'Surprise gift'],
        tags: ['anniversary', 'couple', 'celebration', 'makeover'],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T18:00:00Z'
      }
    ];
  };

  const loadClientPreferences = async (clientId: string): Promise<VIPPreference[]> => {
    // Mock implementation
    return [
      {
        id: 'pref-1',
        clientId: clientId,
        category: 'service',
        preference: 'Prefers morning appointments',
        importance: 'high',
        context: 'Work schedule - evenings busy',
        lastUpdated: '2024-01-10T09:00:00Z'
      },
      {
        id: 'pref-2',
        clientId: clientId,
        category: 'communication',
        preference: 'WhatsApp preferred for quick updates',
        importance: 'critical',
        context: 'Always responds within minutes on WhatsApp',
        lastUpdated: '2024-01-08T14:30:00Z'
      }
    ];
  };

  const loadClientInsights = async (clientId: string): Promise<VIPInsight[]> => {
    // Mock implementation
    return [
      {
        id: 'insight-1',
        clientId: clientId,
        type: 'milestone',
        title: '10th Anniversary Approaching',
        description: 'Client\'s 10th wedding anniversary is on September 20th. Perfect opportunity for special celebration package.',
        confidence: 0.95,
        priority: 'high',
        actionable: true,
        suggestedActions: [
          'Prepare anniversary beauty package',
          'Arrange romantic spa experience',
          'Coordinate with spouse for surprise element'
        ],
        dueDate: '2024-09-01T00:00:00Z',
        automated: true,
        category: 'celebration',
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'insight-2',
        clientId: clientId,
        type: 'opportunity',
        title: 'Increased Interest in Wellness',
        description: 'Client has been booking more wellness services lately. Consider upselling premium wellness packages.',
        confidence: 0.87,
        priority: 'medium',
        actionable: true,
        suggestedActions: [
          'Recommend monthly wellness membership',
          'Introduce meditation and yoga services',
          'Offer corporate wellness package for her company'
        ],
        automated: true,
        category: 'business',
        createdAt: '2024-01-12T15:30:00Z'
      }
    ];
  };

  const loadClientMilestones = async (clientId: string): Promise<VIPMilestone[]> => {
    // Mock implementation
    return [
      {
        id: 'milestone-1',
        clientId: clientId,
        type: 'booking_count',
        title: '50th Booking Milestone',
        description: 'Celebrate client\'s 50th booking with exclusive rewards',
        target: 50,
        current: 45,
        achieved: false,
        celebration: {
          type: 'hybrid',
          actions: [
            {
              type: 'gift',
              title: 'Luxury Product Set',
              description: 'Curated set of premium beauty products',
              automated: true,
              cost: 500
            },
            {
              type: 'service',
              title: 'Complimentary Spa Day',
              description: 'Full day spa experience with all treatments',
              automated: false,
              cost: 1500
            }
          ],
          budget: 2000,
          personalization: 'Client prefers organic products and champagne'
        },
        progress: 90
      }
    ];
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await initializeVIPSystem();
    setRefreshing(false);
    toast({
      title: "VIP Data Refreshed",
      description: "All VIP experience data has been updated"
    });
  }, [selectedClient]);

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'vip_platinum': return <Diamond className="h-5 w-5 text-purple-500" />;
      case 'vip_gold': return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'vip_silver': return <Star className="h-5 w-5 text-gray-400" />;
      default: return <Award className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'vip_platinum': return 'from-purple-600 to-pink-600';
      case 'vip_gold': return 'from-yellow-600 to-amber-600';
      case 'vip_silver': return 'from-gray-400 to-gray-600';
      default: return 'from-blue-600 to-indigo-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const filteredClients = useMemo(() => {
    return vipClients.filter(client => {
      const matchesSearch = searchQuery === '' ||
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTier = selectedTier === 'all' || client.tier === selectedTier;

      return matchesSearch && matchesTier;
    });
  }, [vipClients, searchQuery, selectedTier]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-pink-50/20 to-rose-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-900">Initializing VIP Experience Enhancement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-pink-50/20 to-rose-50/30">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-purple-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    VIP Experience Enhancement
                  </h1>
                  <p className="text-gray-600">
                    {viewMode === 'manager' ? 'VIP Program Management' :
                     viewMode === 'client' ? 'Your VIP Experience' :
                     'VIP Concierge Dashboard'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Client Selector */}
              {viewMode !== 'client' && (
                <Select value={selectedClient || ''} onValueChange={setSelectedClient}>
                  <SelectTrigger className="w-64 border-purple-300">
                    <SelectValue placeholder="Select VIP Client">
                      {selectedClient && clientProfile ? clientProfile.name : 'All VIP Clients'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All VIP Clients</SelectItem>
                    {vipClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          {getTierIcon(client.tier)}
                          {client.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Refresh */}
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* VIP Stats Bar */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <Diamond className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600">Total VIP Clients</p>
                <p className="text-lg font-bold text-purple-900">{vipClients.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <Crown className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm text-amber-600">VIP Platinum</p>
                <p className="text-lg font-bold text-amber-900">
                  {vipClients.filter(c => c.tier === 'vip_platinum').length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <Gift className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">Experiences Created</p>
                <p className="text-lg font-bold text-blue-900">
                  {clientExperiences.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <Heart className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-600">Avg Satisfaction</p>
                <p className="text-lg font-bold text-green-900">4.9/5</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {clientProfile ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className={`grid w-full grid-cols-6 bg-gradient-to-r ${getTierColor(clientProfile.tier)} bg-opacity-10 border border-purple-200`}>
              <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                <UserCheck className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="experiences" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                <Sparkles className="h-4 w-4 mr-2" />
                Experiences
              </TabsTrigger>
              <TabsTrigger value="services" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                <ConciergeBell className="h-4 w-4 mr-2" />
                Services
              </TabsTrigger>
              <TabsTrigger value="insights" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                <Brain className="h-4 w-4 mr-2" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="milestones" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                <Trophy className="h-4 w-4 mr-2" />
                Milestones
              </TabsTrigger>
              <TabsTrigger value="preferences" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Client Overview */}
                <Card className="lg:col-span-2 border-purple-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-900">
                      <UserCheck className="h-5 w-5 text-purple-600" />
                      VIP Client Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Basic Info */}
                      <div className="flex items-start gap-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={clientProfile.avatar} />
                          <AvatarFallback className="text-lg">
                            {clientProfile.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold text-gray-900">{clientProfile.name}</h3>
                            {getTierIcon(clientProfile.tier)}
                            <Badge className={`bg-gradient-to-r ${getTierColor(clientProfile.tier)} text-white`}>
                              {clientProfile.tier.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-3">{clientProfile.email} • {clientProfile.phone}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Member Since</p>
                              <p className="font-medium">{formatDate(clientProfile.joinDate)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Total Bookings</p>
                              <p className="font-medium">{clientProfile.bookingCount}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Total Spend</p>
                              <p className="font-medium">{formatCurrency(clientProfile.totalSpend)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Location</p>
                              <p className="font-medium">{clientProfile.location}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Personal Information */}
                      <div>
                        <h4 className="font-medium text-purple-900 mb-3">Personal Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {clientProfile.personalInfo.birthday && (
                            <div className="p-3 bg-purple-50 rounded-lg">
                              <p className="text-sm text-purple-600">Birthday</p>
                              <p className="font-medium text-purple-900">{formatDate(clientProfile.personalInfo.birthday)}</p>
                            </div>
                          )}
                          {clientProfile.personalInfo.anniversary && (
                            <div className="p-3 bg-pink-50 rounded-lg">
                              <p className="text-sm text-pink-600">Anniversary</p>
                              <p className="font-medium text-pink-900">{formatDate(clientProfile.personalInfo.anniversary)}</p>
                            </div>
                          )}
                          {clientProfile.personalInfo.preferences.length > 0 && (
                            <div className="p-3 bg-amber-50 rounded-lg">
                              <p className="text-sm text-amber-600">Preferences</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {clientProfile.personalInfo.preferences.map((pref, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {pref.replace('_', ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {clientProfile.personalInfo.allergies.length > 0 && (
                            <div className="p-3 bg-red-50 rounded-lg">
                              <p className="text-sm text-red-600">Allergies</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {clientProfile.personalInfo.allergies.map((allergy, index) => (
                                  <Badge key={index} variant="destructive" className="text-xs">
                                    {allergy}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lifestyle */}
                      <div>
                        <h4 className="font-medium text-purple-900 mb-3">Lifestyle & Interests</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-600 mb-2">Interests</p>
                            <div className="flex flex-wrap gap-1">
                              {clientProfile.lifestyle.interests.map((interest, index) => (
                                <Badge key={index} variant="outline" className="text-xs border-blue-200 text-blue-700">
                                  {interest.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-600 mb-2">Hobbies</p>
                            <div className="flex flex-wrap gap-1">
                              {clientProfile.lifestyle.hobbies.map((hobby, index) => (
                                <Badge key={index} variant="outline" className="text-xs border-green-200 text-green-700">
                                  {hobby}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <p className="text-sm text-purple-600 mb-2">Dining Preferences</p>
                            <div className="flex flex-wrap gap-1">
                              {clientProfile.lifestyle.diningPreferences.map((pref, index) => (
                                <Badge key={index} variant="outline" className="text-xs border-purple-200 text-purple-700">
                                  {pref.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-purple-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-900">
                      <Zap className="h-5 w-5 text-purple-600" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      <ConciergeBell className="h-4 w-4 mr-2" />
                      Create VIP Experience
                    </Button>
                    <Button variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50">
                      <Phone className="h-4 w-4 mr-2" />
                      Schedule Consultation
                    </Button>
                    <Button variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50">
                      <Gift className="h-4 w-4 mr-2" />
                      Send Surprise Gift
                    </Button>
                    <Button variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send Personal Message
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Experiences Tab */}
            <TabsContent value="experiences" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Experience History */}
                <Card className="lg:col-span-2 border-purple-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-900">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      VIP Experience History
                    </CardTitle>
                    <CardDescription>
                      Curated experiences and special moments created for {clientProfile.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {clientExperiences.map((experience) => (
                        <div key={experience.id} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-purple-900">{experience.title}</h4>
                              <p className="text-sm text-purple-700 mt-1">{experience.description}</p>
                            </div>
                                    <Badge className={
                                      experience.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      experience.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                      experience.status === 'planned' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }>
                                      {experience.status}
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                    <div>
                                      <p className="text-gray-500">Date</p>
                                      <p className="font-medium">{experience.scheduledDate ? formatDate(experience.scheduledDate) : 'Not scheduled'}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Duration</p>
                                      <p className="font-medium">{experience.duration ? `${experience.duration} min` : 'N/A'}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Type</p>
                                      <p className="font-medium capitalize">{experience.type.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Satisfaction</p>
                                      <p className="font-medium">{experience.satisfaction ? `${experience.satisfaction}/5` : 'N/A'}</p>
                                    </div>
                                  </div>

                                  {experience.feedback && (
                                    <div className="p-3 bg-white rounded border border-purple-200">
                                      <p className="text-sm text-gray-600 mb-1">Client Feedback:</p>
                                      <p className="text-sm italic text-purple-900">"{experience.feedback}"</p>
                                    </div>
                                  )}

                                  {experience.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-3">
                                      {experience.tags.map((tag, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          #{tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Create New Experience */}
                        <Card className="border-purple-200 shadow-lg">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-purple-900">
                              <Plus className="h-5 w-5 text-purple-600" />
                              Create New VIP Experience
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-purple-900" htmlFor="experience-type">Experience Type</label>
                              <Select value={newExperience.type} onValueChange={(value) => setNewExperience({...newExperience, type: value})}>
                                <SelectTrigger className="border-purple-300">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="personalized">Personalized</SelectItem>
                                  <SelectItem value="exclusive">Exclusive</SelectItem>
                                  <SelectItem value="surprise_delight">Surprise & Delight</SelectItem>
                                  <SelectItem value="proactive">Proactive</SelectItem>
                                  <SelectItem value="celebration">Celebration</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-purple-900" htmlFor="title">Title</label>
                              <Input
                                value={newExperience.title || ''}
                                onChange={(e) => setNewExperience({...newExperience, title: e.target.value})}
                                placeholder="Experience title"
                                className="border-purple-300"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium text-purple-900" htmlFor="description">Description</label>
                              <Textarea
                                value={newExperience.description || ''}
                                onChange={(e) => setNewExperience({...newExperience, description: e.target.value})}
                                placeholder="Describe the VIP experience"
                                className="border-purple-300"
                                rows={3}
                              />
                            </div>

                            <Button className="w-full bg-purple-600 hover:bg-purple-700">
                              <Sparkles className="h-4 w-4 mr-2" />
                              Create Experience
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    {/* Services Tab */}
                    <TabsContent value="services" className="space-y-6">
                      <Card className="border-purple-200 shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-purple-900">
                            <ConciergeBell className="h-5 w-5 text-purple-600" />
                            Available VIP Services
                          </CardTitle>
                          <CardDescription>
                            Premium services available for {clientProfile.name}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {availableServices.map((service) => (
                              <div key={service.id} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium text-purple-900">{service.name}</h4>
                                  <Badge className={
                                    service.tier === clientProfile.tier || service.tier === 'all'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-600'
                                  }>
                                    {service.tier === 'all' ? 'Available' : service.tier.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                </div>
                                <p className="text-sm text-purple-700 mb-3">{service.description}</p>

                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3 text-purple-500" />
                                    <span className="text-purple-700">
                                      {service.duration ? `${service.duration} minutes` : 'Flexible duration'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-3 w-3 text-purple-500" />
                                    <span className="text-purple-700">
                                      {service.pricing.type === 'complimentary' ? 'Complimentary' :
                                       service.pricing.type === 'premium' ? formatCurrency(service.pricing.amount || 0) :
                                       service.pricing.type === 'credits' ? `${service.pricing.credits} credits` :
                                       'Custom pricing'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <UserCheck className="h-3 w-3 text-purple-500" />
                                    <span className="text-purple-700">{service.providerInfo.name}</span>
                                  </div>
                                </div>

                                <Button
                                  className="w-full mt-3 bg-purple-600 hover:bg-purple-700"
                                  disabled={service.tier !== 'all' && service.tier !== clientProfile.tier}
                                >
                                  Book Service
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Insights Tab */}
                    <TabsContent value="insights" className="space-y-6">
                      <Card className="border-purple-200 shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-purple-900">
                            <Brain className="h-5 w-5 text-purple-600" />
                            AI-Generated Insights
                          </CardTitle>
                          <CardDescription>
                            Intelligent insights and recommendations for {clientProfile.name}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {clientInsights.map((insight) => (
                              <div key={insight.id} className={`p-4 rounded-lg border ${
                                insight.priority === 'urgent' ? 'bg-red-50 border-red-200' :
                                insight.priority === 'high' ? 'bg-orange-50 border-orange-200' :
                                insight.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                                'bg-blue-50 border-blue-200'
                              }`}>
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Brain className="h-4 w-4 text-purple-600" />
                                    <h4 className="font-medium text-purple-900">{insight.title}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      {insight.type}
                                    </Badge>
                                  </div>
                                  <Badge className={
                                    insight.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                    insight.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                    insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }>
                                    {insight.priority}
                                  </Badge>
                                </div>

                                <p className="text-sm text-purple-700 mb-3">{insight.description}</p>

                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
                                    {insight.dueDate && <span>• Due: {formatDate(insight.dueDate)}</span>}
                                  </div>
                                  {insight.automated && (
                                    <Badge variant="secondary" className="text-xs">
                                      AI Generated
                                    </Badge>
                                  )}
                                </div>

                                {insight.suggestedActions.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-purple-900 mb-2">Suggested Actions:</p>
                                    <div className="space-y-1">
                                      {insight.suggestedActions.map((action, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm text-purple-700">
                                          <CheckCircle className="h-3 w-3 text-green-500" />
                                          <span>{action}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Milestones Tab */}
                    <TabsContent value="milestones" className="space-y-6">
                      <Card className="border-purple-200 shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-purple-900">
                            <Trophy className="h-5 w-5 text-purple-600" />
                            VIP Milestones & Achievements
                          </CardTitle>
                          <CardDescription>
                            Track {clientProfile.name}'s journey and celebrate special moments
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {clientMilestones.map((milestone) => (
                              <div key={milestone.id} className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h4 className="font-medium text-amber-900">{milestone.title}</h4>
                                    <p className="text-sm text-amber-700 mt-1">{milestone.description}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {milestone.achieved ? (
                                      <Badge className="bg-green-100 text-green-800">
                                        <Trophy className="h-3 w-3 mr-1" />
                                        Achieved
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-blue-100 text-blue-800">
                                        In Progress
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {!milestone.achieved && milestone.progress !== undefined && (
                                  <div className="mb-3">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                      <span className="text-amber-700">Progress</span>
                                      <span className="font-medium text-amber-900">{milestone.progress}%</span>
                                    </div>
                                    <Progress value={milestone.progress} className="h-2" />
                                  </div>
                                )}

                                {milestone.celebration.actions.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-amber-900 mb-2">Celebration Plan:</p>
                                    <div className="space-y-1">
                                      {milestone.celebration.actions.map((action, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm text-amber-700">
                                          <Gift className="h-3 w-3 text-amber-500" />
                                          <span>{action.title}: {action.description}</span>
                                          {action.automated && (
                                            <Badge variant="secondary" className="text-xs">Auto</Badge>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Preferences Tab */}
                    <TabsContent value="preferences" className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Current Preferences */}
                        <Card className="border-purple-200 shadow-lg">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-purple-900">
                              <Settings className="h-5 w-5 text-purple-600" />
                              Client Preferences
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {clientPreferences.map((preference) => (
                                <div key={preference.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {preference.category}
                                      </Badge>
                                      <Badge className={
                                        preference.importance === 'critical' ? 'bg-red-100 text-red-800' :
                                        preference.importance === 'high' ? 'bg-orange-100 text-orange-800' :
                                        preference.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-blue-100 text-blue-800'
                                      }>
                                        {preference.importance}
                                      </Badge>
                                    </div>
                                  </div>
                                  <p className="text-sm font-medium text-purple-900">{preference.preference}</p>
                                  {preference.context && (
                                    <p className="text-xs text-purple-700 mt-1">{preference.context}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Add New Preference */}
                        <Card className="border-purple-200 shadow-lg">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-purple-900">
                              <Plus className="h-5 w-5 text-purple-600" />
                              Add Preference
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-purple-900" htmlFor="category">Category</label>
                              <Select value={preferenceForm.category} onValueChange={(value) => setPreferenceForm({...preferenceForm, category: value})}>
                                <SelectTrigger className="border-purple-300">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="service">Service</SelectItem>
                                  <SelectItem value="communication">Communication</SelectItem>
                                  <SelectItem value="timing">Timing</SelectItem>
                                  <SelectItem value="location">Location</SelectItem>
                                  <SelectItem value="ambiance">Ambiance</SelectItem>
                                  <SelectItem value="staff">Staff</SelectItem>
                                  <SelectItem value="pricing">Pricing</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-purple-900" htmlFor="preference">Preference</label>
                              <Input
                                value={preferenceForm.preference || ''}
                                onChange={(e) => setPreferenceForm({...preferenceForm, preference: e.target.value})}
                                placeholder="Enter preference"
                                className="border-purple-300"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium text-purple-900" htmlFor="importance">Importance</label>
                              <Select value={preferenceForm.importance} onValueChange={(value: any) => setPreferenceForm({...preferenceForm, importance: value})}>
                                <SelectTrigger className="border-purple-300">
                                  <SelectValue placeholder="Select importance" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-purple-900" htmlFor="context-optional">Context (Optional)</label>
                              <Textarea
                                value={preferenceForm.context || ''}
                                onChange={(e) => setPreferenceForm({...preferenceForm, context: e.target.value})}
                                placeholder="Additional context or notes"
                                className="border-purple-300"
                                rows={2}
                              />
                            </div>

                            <Button className="w-full bg-purple-600 hover:bg-purple-700">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Preference
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  /* Client Selection View */
                  <div className="text-center py-12">
                    <Crown className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-purple-900 mb-2">Select a VIP Client</h2>
                    <p className="text-purple-600 mb-6">Choose a VIP client to view their enhanced experience dashboard</p>

                    <div className="max-w-2xl mx-auto">
                      <Input
                        placeholder="Search VIP clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mb-4 border-purple-300"
                      />

                      <Select value={selectedTier} onValueChange={setSelectedTier}>
                        <SelectTrigger className="mb-6 border-purple-300">
                          <SelectValue placeholder="Filter by tier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tiers</SelectItem>
                          <SelectItem value="vip_platinum">VIP Platinum</SelectItem>
                          <SelectItem value="vip_gold">VIP Gold</SelectItem>
                          <SelectItem value="vip_silver">VIP Silver</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredClients.map((client) => (
                          <div
                            key={client.id}
                            className="p-4 bg-white rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-50 transition-colors"
                            onClick={() => setSelectedClient(client.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={client.avatar} />
                                <AvatarFallback>
                                  {client.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-purple-900">{client.name}</h3>
                                  {getTierIcon(client.tier)}
                                </div>
                                <p className="text-sm text-purple-600">{client.email}</p>
                                <p className="text-xs text-purple-500">{client.totalSpend.toLocaleString()} PLN • {client.bookingCount} bookings</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        };

        export default VIPExperienceEnhancement;