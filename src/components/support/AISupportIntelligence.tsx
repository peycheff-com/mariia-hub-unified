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
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';
import {
  Brain,
  Bot,
  Zap,
  Cpu,
  Network,
  Target,
  TrendingUp,
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
  Users,
  User,
  UserPlus,
  UserCheck,
  Star,
  Award,
  Crown,
  Diamond,
  Shield,
  Eye,
  EyeOff,
  Search,
  Filter,
  RefreshCw,
  Download,
  Upload,
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  FastForward,
  Rewind,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  VideoOff,
  Maximize,
  Minimize,
  Expand,
  Shrink,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowLeftCircle,
  ArrowRightCircle,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  MoreVertical,
  Ellipsis,
  Menu,
  X,
  Plus,
  Minus,
  Edit,
  Trash,
  Save,
  Copy,
  Clipboard,
  Share,
  Link,
  ExternalLink,
  Home,
  Folder,
  FolderOpen,
  File,
  FileText,
  Image,
  Video as VideoIcon,
  Music,
  DownloadCloud,
  UploadCloud,
  Cloud,
  Database,
  Server,
  HardDrive,
  CpuIcon,
  MemoryStick,
  Wifi,
  Signal,
  Battery,
  BatteryCharging,
  Power,
  PowerOff,
  Lock,
  Unlock,
  Key,
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Bug,
  Code,
  Terminal,
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Package,
  Npm,
  Yarn,
  Docker,
  Kubernetes,
  Aws,
  Google,
  Microsoft,
  Apple,
  Linux,
  Windows,
  Android,
  Ios,
  Chrome,
  Firefox,
  Safari,
  Edge,
  Slack,
  Discord,
  Telegram,
  Whatsapp,
  Messenger,
  Wechat,
  Qq,
  Weibo,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Tiktok,
  Spotify,
  Netflix,
  Amazon,
  Ebay,
  Alibaba,
  Shopify,
  Magento,
  WooCommerce,
  Stripe,
  Paypal,
  Visa,
  Mastercard,
  Amex,
  Bitcoin,
  Ethereum,
  DollarSign,
  Euro,
  PoundSterling,
  Yen,
  Rupee,
  Currency,
  Receipt,
  CreditCard,
  Banknote,
  PiggyBank,
  Wallet,
  ShoppingCart,
  ShoppingBag,
  ShoppingBasket,
  PackageOpen,
  PackageCheck,
  PackageX,
  PackagePlus,
  PackageSearch,
  PackageImport,
  PackageExport,
  Archive,
  ArchiveRestore,
  ArchiveBox,
  ArchiveBoxOpen,
  Inbox,
  InboxIcon,
  Send,
  SendHorizontal,
  SendToBack,
  BringToFront,
  SendForward,
  SendToBackIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code2,
  Highlighter,
  Palette,
  Brush,
  Pen,
  PenTool,
  Pencil,
  Eraser,
  Type,
  TypeOutline,
  Subscript,
  Superscript,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  ListChecks,
  ListTodo,
  ListX,
  ListPlus,
  ListMinus,
  Quote,
  Minus,
  Plus,
  Divide,
  Multiply,
  Equal,
  NotEqual,
  LessThan,
  GreaterThan,
  LessEqual,
  GreaterEqual,
  Percent,
  Hash,
  AtSign,
  Slash,
  Backslash,
  Pipe,
  Asterisk,
  Ampersand,
  Underscore,
  Hyphen,
  Tilde,
  Grave,
  Circumflex,
  Bar,
  Braces,
  Brackets,
  Parentheses,
  AngleBracketLeft,
  AngleBracketRight,
  ChevronLeftSquare,
  ChevronRightSquare,
  ChevronUpSquare,
  ChevronDownSquare,
  SquareDot,
  CircleDot,
  DiamondIcon,
  Triangle,
  Pentagon,
  Hexagon,
  Octagon,
  StarIcon,
  Heart,
  HeartHandshake,
  Handshake,
  ThumbsUp,
  ThumbsDown,
  EyeIcon,
  EyeOffIcon,
  Scan,
  ScanLine,
  ScanFace,
  ScanQRCode,
  Barcode,
  QrCode,
  FingerprintIcon,
  Footprints,
  FootprintsIcon,
  Baby,
  Baby2,
  Child,
  UsersIcon,
  Users2,
  UsersRound,
  UserRound,
  UserRoundCheck,
  UserRoundX,
  UserRoundPlus,
  UserRoundMinus,
  UserRoundSearch,
  UserRoundCog,
  UserRoundPen,
  UserRoundSettings,
  UserRoundStar,
  UserRoundHeart,
  UserRoundIcon,
  UserIcon,
  UserCheckIcon,
  UserX,
  UserPlus2,
  UserMinus,
  UserSearch,
  UserCog,
  UserPen,
  UserSettings,
  UserStar,
  UserHeart,
  UserIcon2,
  ID,
  Contact,
  Contact2,
  Contacts,
  AddressBook,
  AddressBookIcon,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  PhoneOutgoing,
  Voicemail,
  MessageSquare,
  MessageSquareQuote,
  MessageSquareCode,
  MessageSquareDashed,
  MessageSquareText,
  MessageSquarePlus,
  MessageSquareMinus,
  MessageSquareX,
  MessageSquareCheck,
  MessageSquareWarning,
  MessageSquareDollarSign,
  MessageSquareMore,
  MessageSquareReply,
  MessageSquareShare,
  MessageSquareDiff,
  MessageSquareIcon,
  MailIcon,
  MailCheck,
  MailMinus,
  MailOpen,
  MailPlus,
  MailQuestion,
  MailSearch,
  MailWarning,
  MailX,
  Forward,
  ForwardIcon,
  Reply,
  ReplyAll,
  Undo,
  Redo,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  FlipHorizontal2,
  FlipVertical2,
  Transform,
  Crop,
  ScissorsIcon,
  Move3d,
  MoveDiagonal,
  MoveDiagonal2,
  MoveHorizontal,
  MoveVertical,
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
  Move,
  MoveIcon,
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
  Navigation,
  Navigation2,
  Navigation2Off,
  Navigation3,
  Navigation3Off,
  Compass,
  Map,
  MapPin,
  MapPinIcon,
  MapPinOff,
  MapPinCheck,
  MapPinX,
  MapPinPlus,
  MapPinMinus,
  MapPinned,
  MapPinInside,
  MapPinHouse,
  MapPinIconInside,
  Route,
  RouteOff,
  ScanLineIcon,
  ScanFaceIcon,
  ScanQRCodeIcon,
  Radar,
  RadarOff,
  Satellite,
  SatelliteDish,
  Radio,
  RadioTower,
  RadioReceiver,
  RadioIcon,
  Tv,
  Tv2,
  TvIcon,
  TvOff,
  Monitor,
  MonitorCheck,
  MonitorDot,
  MonitorDown,
  MonitorIcon,
  MonitorPause,
  MonitorPlay,
  MonitorSmartphone,
  MonitorSpeaker,
  MonitorStop,
  MonitorUp,
  MonitorX,
  Smartphone,
  SmartphoneIcon,
  SmartphoneNfc,
  SmartphoneCharging,
  Tablet,
  TabletIcon,
  TabletSmartphone,
  Laptop,
  Laptop2,
  Desktop,
  DesktopIcon,
  HardDriveIcon,
  DatabaseIcon,
  ServerIcon,
  Server2,
  ServerCrash,
  ServerOff,
  ServerCog,
  ServerCheck,
  ServerX,
  CloudIcon,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudMoon,
  CloudSun,
  CloudCog,
  CloudDownload,
  CloudUpload,
  CloudOff,
  CloudCheck,
  CloudX,
  CloudAlert,
  CloudIcon2,
  Cloud,
  SunIcon,
  MoonIcon,
  StarHalf,
  StarIcon2,
  StarOff,
  ZapIcon,
  ZapOff,
  ZapIcon2,
  Bolt,
  Flashlight,
  FlashlightOff,
  Candle,
  Lamp,
  LampCeiling,
  LampDesk,
  LampFloor,
  LampWallDown,
  LampWallUp,
  Lightbulb,
  LightbulbOff,
  Dimmer,
  SwitchCamera,
  VideoIcon2,
  VideoOffIcon,
  Camera,
  CameraIcon,
  CameraOff,
  CameraSwitch,
  WebCam,
  WebcamIcon,
  ScanIcon,
  ScanLineIcon,
  ScanQRCodeIcon,
  ScanFaceIcon,
  ScanLine,
  ScanFace,
  ScanQRCode,
  Barcode,
  QrCode,
  FingerprintIcon,
  Footprints,
  FootprintsIcon,
  BabyIcon,
  Baby2Icon,
  ChildIcon,
  UsersIcon2,
  UsersRound,
  UserRound,
  UserRoundCheck,
  UserRoundX,
  UserRoundPlus,
  UserRoundMinus,
  UserRoundSearch,
  UserRoundCog,
  UserRoundPen,
  UserRoundSettings,
  UserRoundStar,
  UserRoundHeart,
  UserRoundIcon,
  UserIcon2,
  UserCheckIcon,
  UserXIcon,
  UserPlusIcon,
  UserMinusIcon,
  UserSearchIcon,
  UserCogIcon,
  UserPenIcon,
  UserSettingsIcon,
  UserStarIcon,
  UserHeartIcon,
  UserIcon3,
  IDIcon,
  ContactIcon,
  Contact2Icon,
  ContactsIcon,
  AddressBookIcon,
  AddressBookIcon2,
  PhoneCallIcon,
  PhoneForwardedIcon,
  PhoneIncomingIcon,
  PhoneMissedIcon,
  PhoneOffIcon,
  PhoneOutgoingIcon,
  VoicemailIcon,
  MessageSquareIcon,
  MessageSquareQuoteIcon,
  MessageSquareCodeIcon,
  MessageSquareDashedIcon,
  MessageSquareTextIcon,
  MessageSquarePlusIcon,
  MessageSquareMinusIcon,
  MessageSquareXIcon,
  MessageSquareCheckIcon,
  MessageSquareWarningIcon,
  MessageSquareDollarSignIcon,
  MessageSquareMoreIcon,
  MessageSquareReplyIcon,
  MessageSquareShareIcon,
  MessageSquareDiffIcon,
  MessageSquareIcon2,
  MailIcon2,
  MailCheckIcon,
  MailMinusIcon,
  MailOpenIcon,
  MailPlusIcon,
  MailQuestionIcon,
  MailSearchIcon,
  MailWarningIcon,
  MailXIcon,
  ForwardIcon2,
  ReplyIcon,
  ReplyAllIcon,
  UndoIcon,
  RedoIcon,
  RotateCcwIcon,
  RotateCwIcon,
  FlipHorizontalIcon,
  FlipVerticalIcon,
  FlipHorizontal2Icon,
  FlipVertical2Icon,
  TransformIcon,
  CropIcon,
  ScissorsIcon2,
  Move3dIcon,
  MoveDiagonalIcon,
  MoveDiagonal2Icon,
  MoveHorizontalIcon,
  MoveVerticalIcon,
  ResizeIcon,
  ResizeHorizontalIcon,
  ResizeVerticalIcon,
  ResizeLeftIcon,
  ResizeRightIcon,
  ResizeUpIcon,
  ResizeDownIcon,
  ExpandHorizontalIcon,
  ExpandVerticalIcon,
  ShrinkHorizontalIcon,
  ShrinkVerticalIcon,
  MoveIcon2,
  GrabIcon,
  GrabHorizontalIcon,
  GrabVerticalIcon,
  HandIcon,
  HandMetalIcon,
  HandPeaceIcon,
  HandSparklesIcon,
  HandHelpingIcon,
  HandHeartIcon,
  HandHoldingHeartIcon,
  HandHoldingIcon,
  HandPointingIcon,
  HandPointUpIcon,
  HandPointDownIcon,
  HandPointLeftIcon,
  HandPointRightIcon,
  HandTapIcon,
  HandMoveIcon,
  HandDollarIcon,
  HandCoinIcon,
  HandPlatterIcon,
  HandMetal2Icon,
  HandPeace2Icon,
  HandRockIcon,
  HandPaperIcon,
  HandScissorsIcon3,
  HandLizardIcon,
  HandSpockIcon,
  OkIcon,
  PointerIcon,
  PointerOffIcon,
  MousePointerIcon,
  MousePointer2Icon,
  MousePointerClickIcon,
  TouchIcon,
  SwipeIcon,
  SwipeLeftIcon,
  SwipeRightIcon,
  SwipeUpIcon,
  SwipeDownIcon,
  DragHorizontalIcon,
  DragVerticalIcon,
  DragLeftIcon,
  DragRightIcon,
  DragUpIcon,
  DragDownIcon,
  NavigationIcon,
  Navigation2Icon,
  Navigation2OffIcon,
  Navigation3Icon,
  Navigation3OffIcon,
  CompassIcon,
  MapIcon,
  MapPinIcon2,
  MapPinOffIcon,
  MapPinCheckIcon,
  MapPinXIcon,
  MapPinPlusIcon,
  MapPinMinusIcon,
  MapPinnedIcon,
  MapPinInsideIcon,
  MapPinHouseIcon,
  MapPinIconInsideIcon,
  RouteIcon,
  RouteOffIcon,
  ScanLineIcon2,
  ScanFaceIcon2,
  ScanQRCodeIcon2,
  RadarIcon,
  RadarOffIcon,
  SatelliteIcon,
  SatelliteDishIcon,
  RadioIcon2,
  RadioTowerIcon,
  RadioReceiverIcon,
  RadioIcon3,
  TvIcon2,
  Tv2Icon,
  TvIcon3,
  TvOffIcon,
  MonitorIcon2,
  MonitorCheckIcon,
  MonitorDotIcon,
  MonitorDownIcon,
  MonitorIcon3,
  MonitorPauseIcon,
  MonitorPlayIcon,
  MonitorSmartphoneIcon,
  MonitorSpeakerIcon,
  MonitorStopIcon,
  MonitorUpIcon,
  MonitorXIcon,
  SmartphoneIcon2,
  SmartphoneIcon3,
  SmartphoneNfcIcon,
  SmartphoneChargingIcon,
  TabletIcon2,
  TabletIcon3,
  TabletSmartphoneIcon,
  LaptopIcon,
  Laptop2Icon,
  DesktopIcon2,
  DesktopIcon3,
  HardDriveIcon2,
  DatabaseIcon2,
  ServerIcon3,
  Server2Icon,
  ServerCrashIcon,
  ServerOffIcon,
  ServerCogIcon,
  ServerCheckIcon,
  ServerXIcon,
  CloudIcon3,
  CloudDrizzleIcon,
  CloudRainIcon,
  CloudSnowIcon,
  CloudLightningIcon,
  CloudMoonIcon,
  CloudSunIcon,
  CloudCogIcon,
  CloudDownloadIcon,
  CloudUploadIcon,
  CloudOffIcon,
  CloudCheckIcon,
  CloudXIcon,
  CloudAlertIcon,
  CloudIcon4
} from 'lucide-react';

interface AISupportIntelligenceProps {
  agentId?: string;
  viewMode?: 'agent' | 'supervisor' | 'admin';
  focusArea?: 'routing' | 'predictions' | 'automation' | 'insights' | 'quality';
}

interface AIRoutingDecision {
  id: string;
  ticketId: string;
  clientId: string;
  clientName: string;
  clientTier: string;
  issueType: string;
  priority: string;
  urgency: number;
  complexity: number;
  sentiment: number;
  language: string;
  availableAgents: AgentMatch[];
  recommendedAgent: string;
  routingReason: string;
  confidence: number;
  estimatedResolutionTime: number;
  escalationRisk: number;
  satisfactionPrediction: number;
  autoAssignment: boolean;
  timestamp: string;
}

interface AgentMatch {
  agentId: string;
  agentName: string;
  matchScore: number;
  matchReasons: string[];
  availability: boolean;
  currentLoad: number;
  maxCapacity: number;
  expertise: string[];
  languages: string[];
  performanceScore: number;
  specializationMatch: number;
  workloadBalance: number;
  responseTimePrediction: number;
}

interface AIPrediction {
  id: string;
  type: 'volume' | 'issue' | 'satisfaction' | 'churn' | 'escalation' | 'resolution_time';
  title: string;
  description: string;
  confidence: number;
  timeframe: string;
  currentValue: number;
  predictedValue: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  actionable: boolean;
  recommendedActions: string[];
  dataPoints: DataPoint[];
  model: string;
  accuracy: number;
  lastUpdated: string;
}

interface DataPoint {
  timestamp: string;
  value: number;
  context?: Record<string, any>;
}

interface AIInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'opportunity' | 'risk' | 'optimization' | 'trend';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  confidence: number;
  actionable: boolean;
  recommendedActions: string[];
  affectedEntities: string[];
  timeWindow: string;
  dataSource: string;
  correlation: number;
  rootCause?: string;
  businessImpact: string;
  createdAt: string;
}

interface AIAutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  priority: number;
  category: string;
  successRate: number;
  lastExecuted: string;
  executionCount: number;
  errors: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface AutomationTrigger {
  type: 'ticket_created' | 'message_received' | 'sentiment_change' | 'time_based' | 'volume_threshold' | 'agent_available';
  parameters: Record<string, any>;
}

interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'and' | 'or';
}

interface AutomationAction {
  type: 'assign_agent' | 'send_response' | 'escalate' | 'create_task' | 'update_status' | 'send_notification aria-live="polite" aria-atomic="true"' | 'tag_ticket' | 'set_priority';
  parameters: Record<string, any>;
  delay?: number;
}

interface AIQualityMetric {
  id: string;
  category: 'response_quality' | 'sentiment_analysis' | 'routing_accuracy' | 'prediction_accuracy' | 'automation_success';
  name: string;
  currentValue: number;
  targetValue: number;
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
  factors: QualityFactor[];
  recommendations: string[];
}

interface QualityFactor {
  name: string;
  impact: number;
  currentValue: number;
  targetValue: number;
  status: 'good' | 'warning' | 'critical';
}

interface AIModel {
  id: string;
  name: string;
  version: string;
  type: 'classification' | 'regression' | 'clustering' | 'nlp' | 'computer_vision' | 'anomaly_detection';
  purpose: string;
  status: 'active' | 'training' | 'inactive' | 'deprecated';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrained: string;
  trainingDataSize: number;
  inferenceTime: number;
  modelSize: number;
  features: string[];
  deployment: 'edge' | 'cloud' | 'hybrid';
  performance: ModelPerformance;
}

interface ModelPerformance {
  throughput: number;
  latency: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage?: number;
}

const AISupportIntelligence: React.FC<AISupportIntelligenceProps> = ({
  agentId,
  viewMode = 'supervisor',
  focusArea = 'routing'
}) => {
  const { t } = useTranslation();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  // State management
  const [activeTab, setActiveTab] = useState(focusArea);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  // Data states
  const [routingDecisions, setRoutingDecisions] = useState<AIRoutingDecision[]>([]);
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [automationRules, setAutomationRules] = useState<AIAutomationRule[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<AIQualityMetric[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);

  // UI states
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [editingRule, setEditingRule] = useState<Partial<AIAutomationRule> | null>(null);

  // Initialize system
  useEffect(() => {
    initializeAISystem();
  }, [selectedTimeRange, viewMode]);

  const initializeAISystem = async () => {
    try {
      setLoading(true);

      const [
        routingData,
        predictionsData,
        insightsData,
        rulesData,
        qualityData,
        modelsData
      ] = await Promise.all([
        loadRoutingDecisions(),
        loadPredictions(),
        loadInsights(),
        loadAutomationRules(),
        loadQualityMetrics(),
        loadModels()
      ]);

      setRoutingDecisions(routingData);
      setPredictions(predictionsData);
      setInsights(insightsData);
      setAutomationRules(rulesData);
      setQualityMetrics(qualityData);
      setModels(modelsData);

    } catch (error) {
      console.error('Failed to initialize AI system:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: "AI System Initialization Failed",
        description: "Unable to load AI intelligence data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRoutingDecisions = async (): Promise<AIRoutingDecision[]> => {
    // Mock implementation - would connect to real AI routing API
    return [
      {
        id: 'route-1',
        ticketId: 'ticket-123',
        clientId: 'client-456',
        clientName: 'Anna Kowalska',
        clientTier: 'vip_platinum',
        issueType: 'appointment_rescheduling',
        priority: 'high',
        urgency: 8,
        complexity: 3,
        sentiment: 0.7,
        language: 'pl',
        availableAgents: [
          {
            agentId: 'agent-1',
            agentName: 'Maria Nowak',
            matchScore: 0.95,
            matchReasons: [
              'Polish language expert',
              'VIP client specialization',
              'Appointment management expertise',
              'Low current workload'
            ],
            availability: true,
            currentLoad: 2,
            maxCapacity: 5,
            expertise: ['vip_support', 'appointment_management', 'polish_language'],
            languages: ['pl', 'en', 'fr'],
            performanceScore: 4.8,
            specializationMatch: 0.92,
            workloadBalance: 0.85,
            responseTimePrediction: 45
          },
          {
            agentId: 'agent-2',
            agentName: 'Jan Kowalski',
            matchScore: 0.78,
            matchReasons: [
              'General support experience',
              'Moderate availability'
            ],
            availability: true,
            currentLoad: 4,
            maxCapacity: 5,
            expertise: ['general_support'],
            languages: ['pl', 'en'],
            performanceScore: 4.2,
            specializationMatch: 0.65,
            workloadBalance: 0.6,
            responseTimePrediction: 120
          }
        ],
        recommendedAgent: 'agent-1',
        routingReason: 'Best match for VIP client with Polish language requirements and appointment expertise',
        confidence: 0.95,
        estimatedResolutionTime: 8,
        escalationRisk: 0.12,
        satisfactionPrediction: 4.7,
        autoAssignment: true,
        timestamp: new Date().toISOString()
      }
    ];
  };

  const loadPredictions = async (): Promise<AIPrediction[]> => {
    // Mock implementation
    return [
      {
        id: 'pred-1',
        type: 'volume',
        title: 'Increased Support Volume Expected',
        description: 'AI predicts 35% increase in ticket volume over the next 3 hours due to marketing campaign launch',
        confidence: 0.87,
        timeframe: '3 hours',
        currentValue: 45,
        predictedValue: 61,
        impact: 'high',
        category: 'capacity_planning',
        actionable: true,
        recommendedActions: [
          'Schedule additional agents for shift',
          'Prepare escalation procedures',
          'Enable automated responses for common queries'
        ],
        dataPoints: [
          { timestamp: '2024-01-15T09:00:00Z', value: 42 },
          { timestamp: '2024-01-15T10:00:00Z', value: 45 },
          { timestamp: '2024-01-15T11:00:00Z', value: 48 }
        ],
        model: 'VolumePrediction_v2.3',
        accuracy: 0.89,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'pred-2',
        type: 'churn',
        title: 'VIP Client Churn Risk',
        description: '3 VIP clients showing increased churn risk based on recent interaction patterns',
        confidence: 0.76,
        timeframe: '7 days',
        currentValue: 2,
        predictedValue: 5,
        impact: 'critical',
        category: 'customer_retention',
        actionable: true,
        recommendedActions: [
          'Proactive outreach to at-risk clients',
          'Offer personalized retention packages',
          'Review recent interaction quality'
        ],
        dataPoints: [],
        model: 'ChurnPrediction_v1.8',
        accuracy: 0.82,
        lastUpdated: new Date().toISOString()
      }
    ];
  };

  const loadInsights = async (): Promise<AIInsight[]> => {
    // Mock implementation
    return [
      {
        id: 'insight-1',
        type: 'pattern',
        title: 'Appointment Rescheduling Pattern Detected',
        description: 'Increased rescheduling requests on Mondays, possibly due to weekend planning',
        severity: 'warning',
        category: 'operational',
        confidence: 0.91,
        actionable: true,
        recommendedActions: [
          'Increase staff availability on Mondays',
          'Implement proactive appointment reminders',
          'Analyze root cause of rescheduling patterns'
        ],
        affectedEntities: ['appointment_system', 'staff_scheduling'],
        timeWindow: 'last_30_days',
        dataSource: 'ticket_analysis',
        correlation: 0.73,
        rootCause: 'Weekend planning conflicts',
        businessImpact: 'Increased operational costs and customer dissatisfaction',
        createdAt: new Date().toISOString()
      }
    ];
  };

  const loadAutomationRules = async (): Promise<AIAutomationRule[]> => {
    // Mock implementation
    return [
      {
        id: 'rule-1',
        name: 'VIP Auto-Escalation',
        description: 'Automatically escalate VIP client tickets with high urgency to senior agents',
        enabled: true,
        trigger: {
          type: 'ticket_created',
          parameters: {
            conditions: ['tier=vip_platinum', 'urgency>7']
          }
        },
        conditions: [
          {
            field: 'clientTier',
            operator: 'equals',
            value: 'vip_platinum'
          },
          {
            field: 'urgency',
            operator: 'greater_than',
            value: 7
          }
        ],
        actions: [
          {
            type: 'assign_agent',
            parameters: {
              agentType: 'senior',
              priority: 'high'
            }
          },
          {
            type: 'send_notification aria-live="polite" aria-atomic="true"',
            parameters: {
              recipient: 'supervisor',
              message: 'VIP ticket escalated: {{ticketId}}'
            }
          }
        ],
        priority: 1,
        category: 'vip_support',
        successRate: 0.94,
        lastExecuted: new Date().toISOString(),
        executionCount: 156,
        errors: 3,
        createdBy: 'system',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString()
      }
    ];
  };

  const loadQualityMetrics = async (): Promise<AIQualityMetric[]> => {
    // Mock implementation
    return [
      {
        id: 'metric-1',
        category: 'routing_accuracy',
        name: 'AI Routing Accuracy',
        currentValue: 94.2,
        targetValue: 95.0,
        trend: 'improving',
        lastUpdated: new Date().toISOString(),
        factors: [
          {
            name: 'Agent specialization matching',
            impact: 0.35,
            currentValue: 92.1,
            targetValue: 95.0,
            status: 'good'
          },
          {
            name: 'Language matching',
            impact: 0.25,
            currentValue: 96.8,
            targetValue: 98.0,
            status: 'good'
          },
          {
            name: 'Workload balancing',
            impact: 0.20,
            currentValue: 88.4,
            targetValue: 90.0,
            status: 'warning'
          }
        ],
        recommendations: [
          'Improve workload balancing algorithm',
          'Add more granular specialization tags'
        ]
      }
    ];
  };

  const loadModels = async (): Promise<AIModel[]> => {
    // Mock implementation
    return [
      {
        id: 'model-1',
        name: 'Smart Routing Engine',
        version: '3.2.1',
        type: 'classification',
        purpose: 'Intelligent ticket routing to optimal agents',
        status: 'active',
        accuracy: 0.94,
        precision: 0.91,
        recall: 0.89,
        f1Score: 0.90,
        lastTrained: '2024-01-10T00:00:00Z',
        trainingDataSize: 125000,
        inferenceTime: 125,
        modelSize: 45.2,
        features: ['client_tier', 'issue_type', 'language', 'urgency', 'sentiment', 'agent_skills'],
        deployment: 'cloud',
        performance: {
          throughput: 1250,
          latency: 125,
          errorRate: 0.02,
          cpuUsage: 67.8,
          memoryUsage: 2.1
        }
      },
      {
        id: 'model-2',
        name: 'Sentiment Analysis',
        version: '2.1.0',
        type: 'nlp',
        purpose: 'Real-time sentiment detection in customer communications',
        status: 'active',
        accuracy: 0.91,
        precision: 0.89,
        recall: 0.87,
        f1Score: 0.88,
        lastTrained: '2024-01-08T00:00:00Z',
        trainingDataSize: 89000,
        inferenceTime: 89,
        modelSize: 23.7,
        features: ['text_content', 'emoji_usage', 'punctuation_patterns', 'language_patterns'],
        deployment: 'edge',
        performance: {
          throughput: 2500,
          latency: 89,
          errorRate: 0.01,
          cpuUsage: 45.2,
          memoryUsage: 1.2
        }
      }
    ];
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await initializeAISystem();
    setRefreshing(false);
    toast aria-live="polite" aria-atomic="true"({
      title: "AI Intelligence Refreshed",
      description: "All AI models and predictions have been updated"
    });
  }, [selectedTimeRange]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'training': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'inactive': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'deprecated': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  const formatAccuracy = (accuracy: number) => {
    return `${(accuracy * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-900">Initializing AI Support Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/30">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-blue-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AI Support Intelligence
                  </h1>
                  <p className="text-gray-600">
                    {viewMode === 'admin' ? 'AI System Administration' :
                     viewMode === 'supervisor' ? 'AI Operations Oversight' :
                     'AI-Powered Support Tools'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Model Status */}
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                <Cpu className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  {models.filter(m => m.status === 'active').length}/{models.length} Models Active
                </span>
              </div>

              {/* Time Range Selector */}
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-32 border-blue-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="6h">6 Hours</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                </SelectContent>
              </Select>

              {/* Refresh */}
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* AI Performance Overview */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <Zap className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-600">Routing Accuracy</p>
                <p className="text-lg font-bold text-green-900">
                  {qualityMetrics.find(m => m.category === 'routing_accuracy')?.currentValue.toFixed(1) || '0'}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <Brain className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">Prediction Accuracy</p>
                <p className="text-lg font-bold text-blue-900">
                  {predictions.length > 0 ? formatAccuracy(predictions.reduce((acc, p) => acc + p.accuracy, 0) / predictions.length) : '0%'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <Bot className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600">Automation Success</p>
                <p className="text-lg font-bold text-purple-900">
                  {automationRules.length > 0 ? formatAccuracy(automationRules.reduce((acc, r) => acc + r.successRate, 0) / automationRules.length) : '0%'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <Activity className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm text-amber-600">Active Insights</p>
                <p className="text-lg font-bold text-amber-900">{insights.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg border border-rose-200">
              <Target className="h-5 w-5 text-rose-600" />
              <div>
                <p className="text-sm text-rose-600">Predictions</p>
                <p className="text-lg font-bold text-rose-900">{predictions.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-blue-600 to-purple-600 bg-opacity-10 border border-blue-200">
            <TabsTrigger value="routing" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Network className="h-4 w-4 mr-2" />
              Smart Routing
            </TabsTrigger>
            <TabsTrigger value="predictions" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <TrendingUp className="h-4 w-4 mr-2" />
              Predictions
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Brain className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="automation" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Bot className="h-4 w-4 mr-2" />
              Automation
            </TabsTrigger>
            <TabsTrigger value="models" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Cpu className="h-4 w-4 mr-2" />
              Models
            </TabsTrigger>
          </TabsList>

          {/* Smart Routing Tab */}
          <TabsContent value="routing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Routing Decisions */}
              <Card className="border-blue-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Network className="h-5 w-5 text-blue-600" />
                    Recent AI Routing Decisions
                  </CardTitle>
                  <CardDescription>
                    Latest intelligent routing decisions made by the AI system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {routingDecisions.map((decision) => (
                      <div key={decision.id} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-blue-900">Ticket #{decision.ticketId}</h4>
                            <p className="text-sm text-blue-700">{decision.clientName} • {decision.clientTier.replace('_', ' ')}</p>
                          </div>
                          <Badge className={
                            decision.confidence > 0.9 ? 'bg-green-100 text-green-800' :
                            decision.confidence > 0.7 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {formatConfidence(decision.confidence)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-500">Issue Type</p>
                            <p className="font-medium">{decision.issueType.replace('_', ' ')}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Recommended Agent</p>
                            <p className="font-medium">{decision.availableAgents.find(a => a.agentId === decision.recommendedAgent)?.agentName}</p>
                          </div>
                        </div>

                        <p className="text-sm text-blue-700 mb-3">{decision.routingReason}</p>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Est. resolution: {decision.estimatedResolutionTime}min</span>
                          <span className="text-gray-500">Satisfaction prediction: {decision.satisfactionPrediction}/5</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Agent Match Analysis */}
              <Card className="border-blue-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Users className="h-5 w-5 text-blue-600" />
                    Agent Match Analysis
                  </CardTitle>
                  <CardDescription>
                    AI-powered agent matching algorithm performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {routingDecisions.slice(0, 1).map((decision) => (
                      <div key={decision.id} className="space-y-3">
                        <h4 className="font-medium text-blue-900">Match Analysis for {decision.clientName}</h4>
                        {decision.availableAgents.map((agent) => (
                          <div key={agent.agentId} className={`p-3 rounded-lg border ${
                            agent.agentId === decision.recommendedAgent
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{agent.agentName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{agent.agentName}</p>
                                  <p className="text-xs text-gray-500">Load: {agent.currentLoad}/{agent.maxCapacity}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">{formatConfidence(agent.matchScore)}</p>
                                {agent.agentId === decision.recommendedAgent && (
                                  <Badge className="bg-green-100 text-green-800 text-xs">Recommended</Badge>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              {agent.matchReasons.slice(0, 2).map((reason, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  <span>{reason}</span>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center gap-4 mt-2 text-xs">
                              <span>Response: {agent.responseTimePrediction}s</span>
                              <span>Specialization: {formatConfidence(agent.specializationMatch)}</span>
                              <span>Workload: {formatConfidence(agent.workloadBalance)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Predictions */}
              <Card className="border-blue-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Active AI Predictions
                  </CardTitle>
                  <CardDescription>
                    Real-time predictions from various AI models
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {predictions.map((prediction) => (
                      <div key={prediction.id} className={`p-4 rounded-lg border ${getImpactColor(prediction.impact)}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{prediction.title}</h4>
                            <p className="text-sm opacity-80 mt-1">{prediction.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatConfidence(prediction.confidence)}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {prediction.type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <p className="opacity-70">Current</p>
                            <p className="font-medium">{prediction.currentValue}</p>
                          </div>
                          <div>
                            <p className="opacity-70">Predicted</p>
                            <p className="font-medium">{prediction.predictedValue}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="opacity-70">Timeframe: {prediction.timeframe}</span>
                          <span className="opacity-70">Model: {prediction.model}</span>
                        </div>

                        {prediction.actionable && prediction.recommendedActions.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                            <p className="text-xs font-medium mb-2">Recommended Actions:</p>
                            <div className="space-y-1">
                              {prediction.recommendedActions.slice(0, 2).map((action, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs">
                                  <ArrowRight className="h-3 w-3" />
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

              {/* Model Performance */}
              <Card className="border-blue-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Prediction Model Performance
                  </CardTitle>
                  <CardDescription>
                    Accuracy and performance metrics of prediction models
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {models.filter(m => m.type === 'regression' || m.type === 'classification').map((model) => (
                      <div key={model.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{model.name}</h4>
                            <p className="text-sm text-gray-600">{model.purpose}</p>
                          </div>
                          <Badge className={getStatusColor(model.status)}>
                            {model.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Accuracy</p>
                            <p className="font-medium">{formatAccuracy(model.accuracy)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">F1 Score</p>
                            <p className="font-medium">{formatAccuracy(model.f1Score)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Inference Time</p>
                            <p className="font-medium">{model.inferenceTime}ms</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Throughput</p>
                            <p className="font-medium">{model.performance.throughput}/s</p>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Last trained: {new Date(model.lastTrained).toLocaleDateString()}</span>
                            <span>Model size: {model.modelSize}MB</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* AI Insights */}
              <Card className="lg:col-span-2 border-blue-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Brain className="h-5 w-5 text-blue-600" />
                    AI-Generated Insights
                  </CardTitle>
                  <CardDescription>
                    Intelligent insights discovered by AI analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.map((insight) => (
                      <div key={insight.id} className={`p-4 rounded-lg border ${
                        insight.severity === 'critical' ? 'bg-red-50 border-red-200' :
                        insight.severity === 'error' ? 'bg-orange-50 border-orange-200' :
                        insight.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {insight.type}
                            </Badge>
                            <Badge className={
                              insight.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              insight.severity === 'error' ? 'bg-orange-100 text-orange-800' :
                              insight.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {insight.severity}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatConfidence(insight.confidence)}</p>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {insight.category}
                            </Badge>
                          </div>
                        </div>

                        <h4 className="font-medium mb-2">{insight.title}</h4>
                        <p className="text-sm opacity-80 mb-3">{insight.description}</p>

                        <div className="flex items-center justify-between text-xs mb-3">
                          <span className="opacity-70">Time window: {insight.timeWindow.replace('_', ' ')}</span>
                          <span className="opacity-70">Correlation: {formatConfidence(insight.correlation)}</span>
                        </div>

                        {insight.actionable && insight.recommendedActions.length > 0 && (
                          <div className="pt-3 border-t border-current border-opacity-20">
                            <p className="text-xs font-medium mb-2">Recommended Actions:</p>
                            <div className="space-y-1">
                              {insight.recommendedActions.map((action, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs">
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

              {/* Quality Metrics */}
              <Card className="border-blue-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    AI Quality Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {qualityMetrics.map((metric) => (
                      <div key={metric.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{metric.name}</h4>
                          <Badge className={
                            metric.trend === 'improving' ? 'bg-green-100 text-green-800' :
                            metric.trend === 'stable' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {metric.trend}
                          </Badge>
                        </div>

                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Current: {metric.currentValue.toFixed(1)}%</span>
                            <span>Target: {metric.targetValue.toFixed(1)}%</span>
                          </div>
                          <Progress value={metric.currentValue} className="h-2" />
                        </div>

                        {metric.recommendations.length > 0 && (
                          <div className="text-xs text-gray-600">
                            <p className="font-medium mb-1">Top recommendation:</p>
                            <p>{metric.recommendations[0]}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Automation Rules */}
              <Card className="lg:col-span-2 border-blue-200 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-blue-900">AI Automation Rules</CardTitle>
                    </div>
                    <Button
                      onClick={() => setShowRuleEditor(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Rule
                    </Button>
                  </div>
                  <CardDescription>
                    Automated workflows powered by AI decision-making
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {automationRules.map((rule) => (
                      <div key={rule.id} className={`p-4 rounded-lg border ${
                        rule.enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{rule.name}</h4>
                              <Badge variant={rule.enabled ? "default" : "secondary"}>
                                {rule.enabled ? 'Active' : 'Inactive'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {rule.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{rule.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={() => {
                                // Toggle rule enabled state
                              }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-500">Success Rate</p>
                            <p className="font-medium">{formatAccuracy(rule.successRate)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Executions</p>
                            <p className="font-medium">{rule.executionCount}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Errors</p>
                            <p className="font-medium text-red-600">{rule.errors}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Last Run</p>
                            <p className="font-medium">{new Date(rule.lastExecuted).toLocaleTimeString()}</p>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500">
                          <span>Trigger: {rule.trigger.type.replace('_', ' ')}</span>
                          <span className="mx-2">•</span>
                          <span>{rule.conditions.length} condition(s)</span>
                          <span className="mx-2">•</span>
                          <span>{rule.actions.length} action(s)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Rule Editor */}
              {showRuleEditor && (
                <Card className="border-blue-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                      <Plus className="h-5 w-5 text-blue-600" />
                      Create Automation Rule
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium" htmlFor="rule-name">Rule Name</label>
                      <Input placeholder="Enter rule name" className="border-blue-300" />
                    </div>

                    <div>
                      <label className="text-sm font-medium" htmlFor="description">Description</label>
                      <Textarea placeholder="Describe what this rule does" className="border-blue-300" rows={2} />
                    </div>

                    <div>
                      <label className="text-sm font-medium" htmlFor="trigger">Trigger</label>
                      <Select>
                        <SelectTrigger className="border-blue-300">
                          <SelectValue placeholder="Select trigger" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ticket_created">Ticket Created</SelectItem>
                          <SelectItem value="message_received">Message Received</SelectItem>
                          <SelectItem value="sentiment_change">Sentiment Change</SelectItem>
                          <SelectItem value="time_based">Time Based</SelectItem>
                          <SelectItem value="volume_threshold">Volume Threshold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowRuleEditor(false)}>
                        Cancel
                      </Button>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        Create Rule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <Card className="border-blue-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Automation Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Active Rules</p>
                    <p className="text-2xl font-bold text-green-900">
                      {automationRules.filter(r => r.enabled).length}
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Total Executions</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {automationRules.reduce((sum, r) => sum + r.executionCount, 0)}
                    </p>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600">Avg Success Rate</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {automationRules.length > 0
                        ? formatAccuracy(automationRules.reduce((sum, r) => sum + r.successRate, 0) / automationRules.length)
                        : '0%'}
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-600">Error Rate</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {automationRules.reduce((sum, r) => sum + r.errors, 0) > 0
                        ? `${((automationRules.reduce((sum, r) => sum + r.errors, 0) /
                            automationRules.reduce((sum, r) => sum + r.executionCount, 0)) * 100).toFixed(1)}%`
                        : '0%'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Models */}
              <Card className="border-blue-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Cpu className="h-5 w-5 text-blue-600" />
                    AI Models
                  </CardTitle>
                  <CardDescription>
                    Machine learning models powering the support intelligence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {models.map((model) => (
                      <div key={model.id} className={`p-4 rounded-lg border ${
                        model.status === 'active' ? 'bg-green-50 border-green-200' :
                        model.status === 'training' ? 'bg-blue-50 border-blue-200' :
                        model.status === 'inactive' ? 'bg-gray-50 border-gray-200' :
                        'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{model.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                v{model.version}
                              </Badge>
                              <Badge className={getStatusColor(model.status)}>
                                {model.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{model.purpose}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{formatAccuracy(model.accuracy)}</p>
                            <p className="text-xs text-gray-500">Accuracy</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-500">Precision</p>
                            <p className="font-medium">{formatAccuracy(model.precision)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Recall</p>
                            <p className="font-medium">{formatAccuracy(model.recall)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Latency</p>
                            <p className="font-medium">{model.performance.latency}ms</p>
                          </div>
                          <div>
                            <p className="text-gray-500">CPU</p>
                            <p className="font-medium">{model.performance.cpuUsage.toFixed(1)}%</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Type: {model.type}</span>
                          <span>Deployment: {model.deployment}</span>
                          <span>Last trained: {new Date(model.lastTrained).toLocaleDateString()}</span>
                        </div>

                        <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Training data: {model.trainingDataSize.toLocaleString()} samples</span>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Retrain
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-3 w-3 mr-1" />
                                Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Model Performance Chart */}
              <Card className="border-blue-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <LineChart className="h-5 w-5 text-blue-600" />
                    Model Performance Trends
                  </CardTitle>
                  <CardDescription>
                    Performance metrics over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Mock performance chart placeholder */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-medium mb-3">Accuracy Trends</h4>
                      <div className="h-48 flex items-center justify-center text-gray-500">
                        <LineChart className="h-16 w-16 opacity-50" />
                        <p className="ml-2">Performance chart visualization</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Key Performance Indicators</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <span className="text-sm">Overall Accuracy</span>
                          <span className="font-medium text-green-700">92.4%</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                          <span className="text-sm">Average Response Time</span>
                          <span className="font-medium text-blue-700">104ms</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                          <span className="text-sm">System Throughput</span>
                          <span className="font-medium text-purple-700">1,847 req/s</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-amber-50 rounded">
                          <span className="text-sm">Error Rate</span>
                          <span className="font-medium text-amber-700">0.8%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AISupportIntelligence;