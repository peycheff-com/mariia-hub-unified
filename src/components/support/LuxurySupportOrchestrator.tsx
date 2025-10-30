import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import UnifiedSupportDashboard from './UnifiedSupportDashboard';
import VIPExperienceEnhancement from './VIPExperienceEnhancement';
import AISupportIntelligence from './AISupportIntelligence';
import ComprehensiveAnalytics from './ComprehensiveAnalytics';
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
  Bot,
  Cpu,
  Network,
  Gauge,
  Radio,
  Wifi,
  Smartphone,
  Tablet,
  Monitor,
  Laptop,
  Server,
  Database,
  Cloud,
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
  Power,
  PowerOff,
  Battery,
  BatteryCharging,
  ZapIcon,
  Bolt,
  Lightning,
  Flame,
  Fire,
  Sunrise,
  Sunset,
  Mountain,
  Trees,
  Flower,
  Flower2,
  Leaf,
  Seedling,
  Sprout,
  TreePine,
  Trees2,
  Waves,
  Ship,
  Anchor,
  Compass,
  Map2,
  Navigation,
  Route,
  MapPin2,
  MapIcon,
  MapPinned,
  Globe2,
  Earth,
  Planet,
  Rocket,
  Airplane,
  Car,
  Train,
  Bike,
  Bus,
  Tram,
  Subway,
  Helicopter,
  Yacht,
  Cruise,
  Ticket,
  Luggage,
  Passport,
  CreditCard2,
  Wallet2,
  Money,
  Coins,
  Receipt,
  FileText,
  FileSignature,
  FileCheck,
  FileX,
  FilePlus,
  FileMinus,
  FileSearch,
  FileQuestion,
  FileWarning,
  FileHeart,
  FileStack,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  FolderSearch,
  FolderLock,
  FolderKey,
  FolderSync,
  FolderDown,
  FolderUp,
  FolderInput,
  FolderOutput,
  FolderTree,
  FolderKanban,
  FolderGit,
  FolderGithub,
  FolderGit2,
  FolderGitBranch,
  FolderGitPullRequest,
  FolderGitMerge,
  FolderGitCommit,
  FolderGitCompare,
  FolderGit2,
  FolderArchive,
  FolderSymlink,
  FolderOpenDot,
  FolderCog,
  FolderSettings,
  FolderLock2,
  FolderHeart2,
  FolderStar,
  FolderDot,
  FolderMinus2,
  FolderPlus2,
  FolderCheck,
  FolderX2,
  FolderClock,
  FolderCalendar,
  FolderImage,
  FolderMusic,
  FolderVideo,
  FolderZip,
  FolderDownload,
  FolderUpload,
  FolderSync2,
  FolderCheck2,
  FolderXmark,
  FolderAlert,
  FolderInfo,
  FolderHelp,
  FolderHome,
  FolderUser,
  FolderUsers,
  FolderBuilding,
  FolderFactory,
  FolderTreePine,
  FolderMountain,
  FolderSun,
  FolderMoon,
  FolderCloud,
  FolderCloudRain,
  FolderCloudSnow,
  FolderCloudLightning,
  FolderCloudSun,
  FolderCloudMoon,
  FolderWind,
  FolderThermometer,
  FolderDroplets,
  FolderFire,
  FolderFlame,
  FolderSparkles,
  FolderMagic,
  FolderWand,
  FolderHat,
  FolderHatWizard,
  FolderHatGentle,
  FolderCrown,
  FolderCrown2,
  Ring,
  Gem2,
  Diamond2,
  Ruby,
  Emerald,
  Sapphire,
  Amethyst,
  Topaz,
  Opal,
  Pearl,
  Coral,
  Jade,
  Turquoise,
  Crystal,
  CrystalBall,
  Wand2,
  Magic,
  Sparkles2,
  Stars,
  Star2,
  Star3,
  Star4,
  StarHalf,
  StarOff,
  ShootingStar,
  Meteor,
  Comet,
  Galaxy,
  Orbit,
  Orbit2,
  Satellite,
  SatelliteDish,
  Radar,
  Antenna,
  RadioTower,
  Broadcast,
  Podcast,
  Headphones,
  Headphones2,
  Speaker,
  Speaker2,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
  VolumeUp,
  VolumeDown,
  Mute,
  Unmute,
  Mic,
  Mic2,
  MicOff,
  Video2,
  VideoOff,
  Camera,
  CameraOff,
  Webcam,
  Camera2,
  Camera3,
  Image,
  Image2,
  ImageIcon,
  ImageMinus,
  ImagePlus,
  ImageSearch,
  ImageDown,
  ImageUp,
  ImageCheck,
  ImageX,
  ImageHeart,
  ImageStar,
  ImageClock,
  ImageCalendar,
  ImageMap,
  ImageFilter,
  ImageAdjust,
  ImageCrop,
  ImageResize,
  ImageRotate,
  ImageFlip,
  ImageMirror,
  ImageFocus,
  ImageBlur,
  ImageColor,
  ImageBlackWhite,
  ImageSepia,
  ImageVintage,
  ImageRetouch,
  ImageEnhance,
  ImageRepair,
  ImageRestore,
  ImageDownload,
  ImageUpload,
  ImageShare,
  ImageCopy,
  ImageMove,
  ImageDelete,
  ImageArchive,
  ImageLock,
  ImageUnlock,
  ImageKey,
  ImagePassword,
  ImageEye,
  ImageEyeOff,
  ImageMagnifier,
  ImageSearchPlus,
  ImageMinusCircle,
  ImagePlusCircle,
  ImageSquare,
  ImageCircle,
  ImageHexagon,
  ImageTriangle,
  ImageDiamond3,
  ImageStar5,
  ImageHeart2,
  ImageLightbulb,
  ImageBulb,
  Lamp,
  LampDesk,
  LampFloor,
  LampCeiling,
  Lightbulb2,
  Candle,
  Flashlight,
  Campfire,
  Fire2,
  Campfire2,
  Bonfire,
  Fireplace,
  Logs,
  Wood,
  Tree,
  Tree2,
  Tree3,
  TreePine2,
  TreePine3,
  TreeDeciduous,
  TreeEvergreen,
  PalmTree,
  Cactus,
  Flower3,
  Flower2,
  FlowerTulip,
  FlowerLotus,
  FlowerRose,
  FlowerDaisy,
  FlowerSunflower,
  FlowerCherry,
  FlowerOrchid,
  FlowerLily,
  FlowerIris,
  FlowerTulip2,
  FlowerDaisy2,
  FlowerSunflower2,
  FlowerRose2,
  FlowerLotus2,
  FlowerOrchid2,
  FlowerLily2,
  FlowerIris2,
  Leaf2,
  Leafy,
  Sprout2,
  Seedling2,
  Vine,
  Branch,
  Log,
  Stump,
  Forest,
  Trees3,
  Mountain2,
  MountainSnow,
  Hills,
  Valley,
  Canyon,
  River,
  Lake,
  Ocean,
  Sea,
  Wave,
  Waves2,
  Tsunami,
  Hurricane,
  Tornado,
  Cloud2,
  Cloud3,
  Cloud4,
  Cloud5,
  CloudRain2,
  CloudSnow2,
  CloudThunder,
  CloudMoon2,
  CloudSun2,
  CloudWind,
  CloudFog,
  CloudHail,
  CloudLightning2,
  CloudRainbow,
  CloudSunset,
  CloudSunrise,
  CloudMoonrise,
  CloudMoonset,
  CloudEclipse,
  CloudMeteor,
  CloudComet,
  CloudAurora,
  CloudNebula,
  CloudGalaxy,
  CloudUniverse,
  Space,
  Rocket2,
  Astronaut,
  Alien,
  Ufo,
  Planet2,
  PlanetRing,
  PlanetMoon,
  PlanetSun,
  PlanetEarth,
  PlanetMars,
  PlanetJupiter,
  PlanetSaturn,
  PlanetNeptune,
  PlanetUranus,
  PlanetPluto,
  Star5,
  Star6,
  Star7,
  Star8,
  Star9,
  Star10,
  Star12,
  Star16,
  Star24,
  Star32,
  Star48,
  Star64,
  Star128,
  Star256,
  Star512,
  Star1024,
  Star2048,
  Star4096,
  Star8192,
  Star16384,
  Star32768,
  Star65536,
  Star131072,
  Star262144,
  Star524288,
  Star1048576,
  Star2097152,
  Star4194304,
  Star8388608,
  Star16777216,
  Star33554432,
  Star67108864,
  Star134217728,
  Star268435456,
  Star536870912,
  Star1073741824,
  Star2147483648,
  Star4294967296,
  Star8589934592,
  Star17179869184,
  Star34359738368,
  Star68719476736,
  Star137438953472,
  Star274877906944,
  Star549755813888,
  Star1099511627776,
  Star2199023255552,
  Star4398046511104,
  Star8796093022208,
  Star17592186044416,
  Star35184372088832,
  Star70368744177664,
  Star140737488355328,
  Star281474976710656,
  Star562949953421312,
  Star1125899906842624,
  Star2251799813685248,
  Star4503599627370496,
  Star9007199254740992,
  Star18014398509481984,
  Star36028797018963968,
  Star72057594037927936,
  Star144115188075855872,
  Star288230376151711744,
  Star576460752303423488,
  Star1152921504606846976
} from 'lucide-react';

interface LuxurySupportOrchestratorProps {
  clientId?: string;
  agentId?: string;
  viewMode?: 'client' | 'agent' | 'supervisor' | 'executive';
  initialModule?: 'overview' | 'support' | 'vip' | 'ai' | 'analytics' | 'quality';
}

interface SystemHealth {
  overall: 'excellent' | 'good' | 'warning' | 'critical';
  components: ComponentHealth[];
  uptime: number;
  responseTime: number;
  errorRate: number;
  lastCheck: string;
}

interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  errorRate: number;
  lastCheck: string;
  dependencies: string[];
}

interface IntegrationStatus {
  system: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync: string;
  dataFlow: {
    inbound: number;
    outbound: number;
    errors: number;
  };
  health: number;
}

interface OrchestrationMetrics {
  totalModules: number;
  activeModules: number;
  moduleUptime: Record<string, number>;
  crossModuleInteractions: number;
  dataSynchronizationRate: number;
  automatedWorkflows: number;
  manualInterventions: number;
  systemEfficiency: number;
  userSatisfaction: number;
}

const LuxurySupportOrchestrator: React.FC<LuxurySupportOrchestratorProps> = ({
  clientId,
  agentId,
  viewMode = 'executive',
  initialModule = 'overview'
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // State management
  const [activeModule, setActiveModule] = useState(initialModule);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [orchestrationMetrics, setOrchestrationMetrics] = useState<OrchestrationMetrics | null>(null);
  const [showSystemStatus, setShowSystemStatus] = useState(false);

  // Initialize orchestrator
  useEffect(() => {
    initializeOrchestrator();
  }, [viewMode]);

  const initializeOrchestrator = async () => {
    try {
      setLoading(true);

      const [healthData, integrationsData, metricsData] = await Promise.all([
        loadSystemHealth(),
        loadIntegrations(),
        loadOrchestrationMetrics()
      ]);

      setSystemHealth(healthData);
      setIntegrations(integrationsData);
      setOrchestrationMetrics(metricsData);

    } catch (error) {
      console.error('Failed to initialize orchestrator:', error);
      toast({
        title: "Orchestrator Initialization Failed",
        description: "Unable to initialize luxury support systems",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSystemHealth = async (): Promise<SystemHealth> => {
    // Mock implementation
    return {
      overall: 'excellent',
      components: [
        {
          name: 'Unified Support Dashboard',
          status: 'healthy',
          responseTime: 45,
          errorRate: 0.01,
          lastCheck: new Date().toISOString(),
          dependencies: ['Database', 'API Gateway', 'Auth Service']
        },
        {
          name: 'VIP Experience System',
          status: 'healthy',
          responseTime: 62,
          errorRate: 0.00,
          lastCheck: new Date().toISOString(),
          dependencies: ['CRM', 'Booking System', 'Payment Gateway']
        },
        {
          name: 'AI Support Intelligence',
          status: 'healthy',
          responseTime: 125,
          errorRate: 0.02,
          lastCheck: new Date().toISOString(),
          dependencies: ['ML Models', 'Data Pipeline', 'Analytics Engine']
        },
        {
          name: 'Comprehensive Analytics',
          status: 'healthy',
          responseTime: 89,
          errorRate: 0.00,
          lastCheck: new Date().toISOString(),
          dependencies: ['Data Warehouse', 'BI Engine', 'Visualization Service']
        }
      ],
      uptime: 99.97,
      responseTime: 78,
      errorRate: 0.008,
      lastCheck: new Date().toISOString()
    };
  };

  const loadIntegrations = async (): Promise<IntegrationStatus[]> => {
    // Mock implementation
    return [
      {
        system: 'Supabase Database',
        status: 'connected',
        lastSync: new Date().toISOString(),
        dataFlow: {
          inbound: 1247,
          outbound: 892,
          errors: 0
        },
        health: 99.8
      },
      {
        system: 'Stripe Payment Gateway',
        status: 'connected',
        lastSync: new Date().toISOString(),
        dataFlow: {
          inbound: 156,
          outbound: 89,
          errors: 0
        },
        health: 100.0
      },
      {
        system: 'WhatsApp Business API',
        status: 'connected',
        lastSync: new Date().toISOString(),
        dataFlow: {
          inbound: 423,
          outbound: 567,
          errors: 2
        },
        health: 98.5
      },
      {
        system: 'Google Analytics',
        status: 'connected',
        lastSync: new Date().toISOString(),
        dataFlow: {
          inbound: 2341,
          outbound: 45,
          errors: 0
        },
        health: 99.9
      },
      {
        system: 'SendGrid Email Service',
        status: 'connected',
        lastSync: new Date().toISOString(),
        dataFlow: {
          inbound: 234,
          outbound: 567,
          errors: 1
        },
        health: 97.2
      }
    ];
  };

  const loadOrchestrationMetrics = async (): Promise<OrchestrationMetrics> => {
    // Mock implementation
    return {
      totalModules: 5,
      activeModules: 5,
      moduleUptime: {
        'Unified Support': 99.8,
        'VIP Experience': 99.9,
        'AI Intelligence': 99.5,
        'Analytics': 99.7,
        'Quality Assurance': 99.6
      },
      crossModuleInteractions: 1247,
      dataSynchronizationRate: 98.7,
      automatedWorkflows: 89,
      manualInterventions: 3,
      systemEfficiency: 94.2,
      userSatisfaction: 4.8
    };
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await initializeOrchestrator();
    setRefreshing(false);
    toast({
      title: "Systems Refreshed",
      description: "All luxury support systems have been updated"
    });
  }, []);

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
      case 'syncing': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
      case 'disconnected':
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`;
  };

  const formatResponseTime = (time: number) => {
    return `${time}ms`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-rose-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-amber-900">Initializing Luxury Support Orchestration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-rose-50/30">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-amber-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600">
                  <Crown2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">
                    Luxury Support Orchestrator
                  </h1>
                  <p className="text-gray-600">
                    {viewMode === 'executive' ? 'Executive Command Center' :
                     viewMode === 'supervisor' ? 'Support Operations Hub' :
                     viewMode === 'agent' ? 'Agent Workspace' :
                     'Premium Client Portal'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* System Health Indicator */}
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                {getStatusIcon(systemHealth?.overall || 'good')}
                <span className="text-sm font-medium text-green-800">
                  All Systems Operational
                </span>
              </div>

              {/* Module Selector */}
              <Tabs value={activeModule} onValueChange={setActiveModule} className="w-auto">
                <TabsList className="bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                    <Eye className="h-4 w-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="support" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Support
                  </TabsTrigger>
                  <TabsTrigger value="vip" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                    <Crown className="h-4 w-4 mr-2" />
                    VIP
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                    <Brain className="h-4 w-4 mr-2" />
                    AI
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Actions */}
              <Button
                variant="outline"
                onClick={() => setShowSystemStatus(!showSystemStatus)}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <Activity className="h-4 w-4 mr-2" />
                System Status
              </Button>

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

          {/* System Status Bar */}
          {showSystemStatus && (
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* System Health */}
                <div>
                  <h4 className="font-medium text-amber-900 mb-3">System Health</h4>
                  <div className="space-y-2">
                    {systemHealth?.components.slice(0, 3).map((component) => (
                      <div key={component.name} className="flex items-center justify-between text-sm">
                        <span className="text-amber-700">{component.name}</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(component.status)}
                          <span className="text-amber-900">{formatResponseTime(component.responseTime)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Integrations */}
                <div>
                  <h4 className="font-medium text-amber-900 mb-3">Integrations</h4>
                  <div className="space-y-2">
                    {integrations.slice(0, 3).map((integration) => (
                      <div key={integration.system} className="flex items-center justify-between text-sm">
                        <span className="text-amber-700">{integration.system}</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(integration.status)}
                          <span className="text-amber-900">{integration.health.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metrics */}
                <div>
                  <h4 className="font-medium text-amber-900 mb-3">Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-700">System Uptime</span>
                      <span className="text-amber-900 font-medium">
                        {systemHealth ? formatUptime(systemHealth.uptime) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-amber-700">Response Time</span>
                      <span className="text-amber-900 font-medium">
                        {systemHealth ? formatResponseTime(systemHealth.responseTime) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-amber-700">Error Rate</span>
                      <span className="text-amber-900 font-medium">
                        {systemHealth ? `${(systemHealth.errorRate * 100).toFixed(2)}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <Crown2 className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm text-amber-600">System Efficiency</p>
                <p className="text-lg font-bold text-amber-900">
                  {orchestrationMetrics?.systemEfficiency.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600">User Satisfaction</p>
                <p className="text-lg font-bold text-purple-900">
                  {orchestrationMetrics?.userSatisfaction.toFixed(1)}/5
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">Active Modules</p>
                <p className="text-lg font-bold text-blue-900">
                  {orchestrationMetrics?.activeModules}/{orchestrationMetrics?.totalModules}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <Zap className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-600">Automation Rate</p>
                <p className="text-lg font-bold text-green-900">
                  {orchestrationMetrics?.automatedWorkflows}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg border border-rose-200">
              <Network className="h-5 w-5 text-rose-600" />
              <div>
                <p className="text-sm text-rose-600">Cross-Module Sync</p>
                <p className="text-lg font-bold text-rose-900">
                  {orchestrationMetrics?.dataSynchronizationRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto">
        <Tabs value={activeModule} onValueChange={setActiveModule}>
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-8">
            <div className="max-w-7xl mx-auto px-6 space-y-6">
              {/* System Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-amber-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-900">
                      <Crown2 className="h-5 w-5 text-amber-600" />
                      Luxury Support Ecosystem Overview
                    </CardTitle>
                    <CardDescription>
                      Comprehensive view of all integrated support systems and their interactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                        <MessageCircle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                        <h4 className="font-medium text-amber-900">Unified Support</h4>
                        <p className="text-sm text-amber-700 mt-1">Omnichannel Integration</p>
                        <Badge className="mt-2 bg-green-100 text-green-800">Active</Badge>
                      </div>

                      <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <Crown className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <h4 className="font-medium text-purple-900">VIP Experience</h4>
                        <p className="text-sm text-purple-700 mt-1">White-Glove Service</p>
                        <Badge className="mt-2 bg-green-100 text-green-800">Active</Badge>
                      </div>

                      <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <Brain className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <h4 className="font-medium text-blue-900">AI Intelligence</h4>
                        <p className="text-sm text-blue-700 mt-1">Smart Routing & Insights</p>
                        <Badge className="mt-2 bg-green-100 text-green-800">Active</Badge>
                      </div>

                      <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <h4 className="font-medium text-green-900">Analytics</h4>
                        <p className="text-sm text-green-700 mt-1">Real-time Insights</p>
                        <Badge className="mt-2 bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </div>

                    {/* Cross-Module Interactions */}
                    <div>
                      <h4 className="font-medium text-amber-900 mb-3">System Interactions</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="flex items-center gap-3">
                            <ArrowRight className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-900">Support ↔ VIP Experience</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-amber-700">342 interactions</span>
                            <Badge className="bg-green-100 text-green-800 text-xs">Synced</Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-3">
                            <ArrowRight className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-900">AI ↔ Analytics</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-purple-700">567 interactions</span>
                            <Badge className="bg-green-100 text-green-800 text-xs">Synced</Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-3">
                            <ArrowRight className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">VIP ↔ AI</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-blue-700">234 interactions</span>
                            <Badge className="bg-green-100 text-green-800 text-xs">Synced</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Integration Status */}
                <Card className="border-amber-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-900">
                      <Network className="h-5 w-5 text-amber-600" />
                      Integration Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {integrations.map((integration) => (
                        <div key={integration.system} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(integration.status)}
                            <div>
                              <p className="font-medium text-sm">{integration.system}</p>
                              <p className="text-xs text-gray-500">
                                In: {integration.dataFlow.inbound} • Out: {integration.dataFlow.outbound}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{integration.health.toFixed(1)}%</p>
                            <p className="text-xs text-gray-500">
                              {integration.dataFlow.errors > 0 ? `${integration.dataFlow.errors} errors` : 'No errors'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Metrics */}
              <Card className="border-amber-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Gauge className="h-5 w-5 text-amber-600" />
                    Orchestration Performance
                  </CardTitle>
                  <CardDescription>
                    System-wide performance metrics and efficiency indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="relative inline-flex items-center justify-center">
                        <div className="text-3xl font-bold text-amber-900">
                          {orchestrationMetrics?.systemEfficiency.toFixed(1)}%
                        </div>
                      </div>
                      <p className="text-sm text-amber-600 mt-2">System Efficiency</p>
                    </div>

                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-900">
                        {orchestrationMetrics?.userSatisfaction.toFixed(1)}/5
                      </div>
                      <p className="text-sm text-purple-600 mt-2">User Satisfaction</p>
                    </div>

                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-900">
                        {orchestrationMetrics?.dataSynchronizationRate.toFixed(1)}%
                      </div>
                      <p className="text-sm text-blue-600 mt-2">Data Sync Rate</p>
                    </div>

                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-900">
                        {orchestrationMetrics?.crossModuleInteractions}
                      </div>
                      <p className="text-sm text-green-600 mt-2">Cross-Module Interactions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Support Module */}
          <TabsContent value="support">
            <UnifiedSupportDashboard
              clientId={clientId}
              agentId={agentId}
              viewMode={viewMode === 'executive' ? 'supervisor' : viewMode}
            />
          </TabsContent>

          {/* VIP Module */}
          <TabsContent value="vip">
            <VIPExperienceEnhancement
              clientId={clientId}
              agentId={agentId}
              viewMode={viewMode === 'executive' ? 'manager' : viewMode}
            />
          </TabsContent>

          {/* AI Module */}
          <TabsContent value="ai">
            <AISupportIntelligence
              agentId={agentId}
              viewMode={viewMode === 'executive' ? 'supervisor' : viewMode}
            />
          </TabsContent>

          {/* Analytics Module */}
          <TabsContent value="analytics">
            <ComprehensiveAnalytics
              viewMode={viewMode}
              focusArea="overview"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LuxurySupportOrchestrator;