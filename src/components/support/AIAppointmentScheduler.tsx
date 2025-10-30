import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format, addDays, addMinutes, isAfter, isBefore, startOfDay, endOfDay, setHours, setMinutes, isToday, isTomorrow, isThisWeek } from 'date-fns';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Check,
  X,
  AlertCircle,
  Info,
  Zap,
  Brain,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Timer,
  RefreshCw,
  Settings,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock3,
  UserCheck,
  MessageSquare,
  Video,
  PhoneCall,
  MapPin as MapPinIcon,
  CreditCard,
  DollarSign,
  Star,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  Activity,
  Award,
  Bell,
  BellOff,
  Repeat,
  Edit,
  Trash2,
  Plus,
  Filter,
  Search,
  Download,
  Upload,
  Share2,
  Link as LinkIcon,
  ExternalLink,
  Copy,
  Send,
  MessageCircle,
  Bot,
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
  Timer as TimerIcon,
  Map as MapIcon,
  User as UserIcon,
  Globe,
  Languages,
  Smartphone,
  Laptop,
  Tablet,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Signal,
  SignalHigh,
  SignalLow,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  Headphones,
  Settings as SettingsIcon,
  MoreHorizontal,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  Minimize2,
  Maximize2,
  Expand,
  Shrink,
  RotateCcw,
  RotateCw,
  Save,
  FileText,
  Image,
  Paperclip,
  Scissors,
  Type,
  Palette,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Undo,
  Redo,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,
  ShieldOff,
  Key,
  KeyOff,
  Fingerprint,
  UserPlus,
  UserMinus,
  UserX,
  UserCheck as UserCheckIcon,
  Users as UsersIcon,
  Crown,
  Gem,
  Gift,
  Heart,
  Star as StarIcon,
  Zap as ZapIcon,
  Flame,
  Snowflake,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  Umbrella,
  Wind,
  Sunrise,
  Sunset,
  Mountain,
  Trees,
  Home,
  Building,
  Building2,
  Store,
  ShoppingCart,
  Package,
  Truck,
  Plane,
  Car,
  Train,
  Ship,
  Bike,
  Bus,
  Train as TrainIcon,
  Anchor,
  Compass,
  MapPin as MapPinIcon2,
  Navigation,
  Navigation2,
  Navigation3,
  Radar,
  Radio,
  Tv,
  RadioIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Laptop as LaptopIcon,
  Monitor as MonitorIcon,
  Camera,
  CameraOff,
  Image as ImageIcon,
  ImageOff,
  File,
  FileText as FileTextIcon,
  FilePlus,
  FileMinus,
  FileCheck,
  FileX,
  FileSearch,
  FileQuestion,
  FileWarning,
  FileLock,
  FileUnlock,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  FolderLock,
  FolderUnlock,
  Archive,
  ArchiveRestore,
  ArchiveLock,
  ArchiveUnlock,
  Inbox,
  InboxOff,
  Send as SendIcon,
  SendHorizontal,
  SendVertical,
  SendToBack,
  BringToFront,
  FlipHorizontal,
  FlipVertical,
  RotateCw as RotateCwIcon,
  RotateCcw as RotateCcwIcon,
  ZoomIn,
  ZoomOut,
  Maximize as MaximizeIcon,
  Minimize as MinimizeIcon,
  Fullscreen,
  FullscreenExit,
  PictureInPicture,
  PictureInPicture2,
  Pipette,
  Droplet,
  Droplets,
  DropletIcon,
  DropletsIcon,
  Thermometer,
  ThermometerSnowflake,
  ThermometerSun,
  Wind as WindIcon,
  Cloud as CloudIcon,
  CloudRain as CloudRainIcon,
  CloudSnow as CloudSnowIcon,
  CloudDrizzle,
  CloudLightning,
  CloudMoon,
  CloudSun,
  CloudMoonRain,
  CloudSunRain,
  CloudFog,
  CloudHail,
  CloudRainWind,
  CloudSnowWind,
  CloudLightningRain,
  CloudRainSun,
  CloudSnowSun,
  CloudRainMoon,
  CloudSnowMoon,
  CloudLightningSun,
  CloudLightningMoon,
  Sun as SunIcon,
  Moon as MoonIcon,
  Sunrise as SunriseIcon,
  Sunset as SunsetIcon,
  Mountain as MountainIcon,
  Trees as TreesIcon,
  Home as HomeIcon,
  Building as BuildingIcon,
  Building2 as Building2Icon,
  Store as StoreIcon,
  ShoppingCart as ShoppingCartIcon,
  Package as PackageIcon,
  Truck as TruckIcon,
  Plane as PlaneIcon,
  Car as CarIcon,
  Train as TrainIcon2,
  Ship as ShipIcon,
  Bike as BikeIcon,
  Bus as BusIcon,
  Anchor as AnchorIcon,
  Compass as CompassIcon,
  Navigation as NavigationIcon,
  Navigation2 as Navigation2Icon,
  Navigation3 as Navigation3Icon,
  Radar as RadarIcon,
  Radio as RadioIcon,
  Tv as TvIcon,
  Radio as RadioIcon2,
  Smartphone as SmartphoneIcon2,
  Tablet as TabletIcon2,
  Laptop as LaptopIcon2,
  Monitor as MonitorIcon2,
  Camera as CameraIcon,
  CameraOff as CameraOffIcon,
  Image as ImageIcon2,
  ImageOff as ImageOffIcon,
  File as FileIcon,
  FileText as FileTextIcon2,
  FilePlus as FilePlusIcon,
  FileMinus as FileMinusIcon,
  FileCheck as FileCheckIcon,
  FileX as FileXIcon,
  FileSearch as FileSearchIcon,
  FileQuestion as FileQuestionIcon,
  FileWarning as FileWarningIcon,
  FileLock as FileLockIcon,
  FileUnlock as FileUnlockIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  FolderPlus as FolderPlusIcon,
  FolderMinus as FolderMinusIcon,
  FolderLock as FolderLockIcon,
  FolderUnlock as FolderUnlockIcon,
  Archive as ArchiveIcon,
  ArchiveRestore as ArchiveRestoreIcon,
  ArchiveLock as ArchiveLockIcon,
  ArchiveUnlock as ArchiveUnlockIcon,
  Inbox as InboxIcon,
  InboxOff as InboxOffIcon,
  Send as SendIcon2,
  SendHorizontal as SendHorizontalIcon,
  SendVertical as SendVerticalIcon,
  SendToBack as SendToBackIcon,
  BringToFront as BringToFrontIcon,
  FlipHorizontal as FlipHorizontalIcon,
  FlipVertical as FlipVerticalIcon,
  RotateCw as RotateCwIcon2,
  RotateCcw as RotateCcwIcon2,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Maximize as MaximizeIcon2,
  Minimize as MinimizeIcon2,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  PictureInPicture as PictureInPictureIcon,
  PictureInPicture2 as PictureInPicture2Icon,
  Pipette as PipetteIcon,
  Droplet as DropletIcon2,
  Droplets as DropletsIcon2,
  Thermometer as ThermometerIcon,
  ThermometerSnowflake as ThermometerSnowflakeIcon,
  ThermometerSun as ThermometerSunIcon,
  Wind as WindIcon2,
  Cloud as CloudIcon2,
  CloudRain as CloudRainIcon2,
  CloudSnow as CloudSnowIcon2,
  CloudDrizzle as CloudDrizzleIcon,
  CloudLightning as CloudLightningIcon,
  CloudMoon as CloudMoonIcon,
  CloudSun as CloudSunIcon,
  CloudMoonRain as CloudMoonRainIcon,
  CloudSunRain as CloudSunRainIcon,
  CloudFog as CloudFogIcon,
  CloudHail as CloudHailIcon,
  CloudRainWind as CloudRainWindIcon,
  CloudSnowWind as CloudSnowWindIcon,
  CloudLightningRain as CloudLightningRainIcon,
  CloudRainSun as CloudRainSunIcon,
  CloudSnowSun as CloudSnowSunIcon,
  CloudRainMoon as CloudRainMoonIcon,
  CloudSnowMoon as CloudSnowMoonIcon,
  CloudLightningSun as CloudLightningSunIcon,
  CloudLightningMoon as CloudLightningMoonIcon,
  Sun as SunIcon2,
  Moon as MoonIcon2,
  Sunrise as SunriseIcon2,
  Sunset as SunsetIcon2,
  Mountain as MountainIcon2,
  Trees as TreesIcon2,
  Home as HomeIcon2,
  Building as BuildingIcon2,
  Building2 as Building2Icon2,
  Store as StoreIcon2,
  ShoppingCart as ShoppingCartIcon2,
  Package as PackageIcon2,
  Truck as TruckIcon2,
  Plane as PlaneIcon2,
  Car as CarIcon2,
  Train as TrainIcon3,
  Ship as ShipIcon2,
  Bike as BikeIcon2,
  Bus as BusIcon2,
  Anchor as AnchorIcon2,
  Compass as CompassIcon2,
  Navigation as NavigationIcon2,
  Navigation2 as Navigation2Icon2,
  Navigation3 as Navigation3Icon2,
  Radar as RadarIcon2,
  Radio as RadioIcon3,
  Tv as TvIcon2,
  Radio as RadioIcon4,
  Smartphone as SmartphoneIcon3,
  Tablet as TabletIcon3,
  Laptop as LaptopIcon3,
  Monitor as MonitorIcon3,
  Camera as CameraIcon2,
  CameraOff as CameraOffIcon2,
  Image as ImageIcon3,
  ImageOff as ImageOffIcon2,
  File as FileIcon2,
  FileText as FileTextIcon3,
  FilePlus as FilePlusIcon2,
  FileMinus as FileMinusIcon2,
  FileCheck as FileCheckIcon2,
  FileX as FileXIcon2,
  FileSearch as FileSearchIcon2,
  FileQuestion as FileQuestionIcon2,
  FileWarning as FileWarningIcon2,
  FileLock as FileLockIcon2,
  FileUnlock as FileUnlockIcon2,
  Folder as FolderIcon2,
  FolderOpen as FolderOpenIcon2,
  FolderPlus as FolderPlusIcon2,
  FolderMinus as FolderMinusIcon2,
  FolderLock as FolderLockIcon2,
  FolderUnlock as FolderUnlockIcon2,
  Archive as ArchiveIcon2,
  ArchiveRestore as ArchiveRestoreIcon2,
  ArchiveLock as ArchiveLockIcon2,
  ArchiveUnlock as ArchiveUnlockIcon2,
  Inbox as InboxIcon2,
  InboxOff as InboxOffIcon2,
  Send as SendIcon3,
  SendHorizontal as SendHorizontalIcon2,
  SendVertical as SendVerticalIcon2,
  SendToBack as SendToBackIcon2,
  BringToFront as BringToFrontIcon2,
  FlipHorizontal as FlipHorizontalIcon2,
  FlipVertical as FlipVerticalIcon2,
  RotateCw as RotateCwIcon3,
  RotateCcw as RotateCcwIcon3,
  ZoomIn as ZoomInIcon2,
  ZoomOut as ZoomOutIcon2,
  Maximize as MaximizeIcon3,
  Minimize as MinimizeIcon3,
  Fullscreen as FullscreenIcon2,
  FullscreenExit as FullscreenExitIcon2,
  PictureInPicture as PictureInPictureIcon2,
  PictureInPicture2 as PictureInPicture2Icon2,
  Pipette as PipetteIcon2,
  Droplet as DropletIcon3,
  Droplets as DropletsIcon3,
  Thermometer as ThermometerIcon2,
  ThermometerSnowflake as ThermometerSnowflakeIcon2,
  ThermometerSun as ThermometerSunIcon2,
  Wind as WindIcon3,
  Cloud as CloudIcon3,
  CloudRain as CloudRainIcon3,
  CloudSnow as CloudSnowIcon3,
  CloudDrizzle as CloudDrizzleIcon2,
  CloudLightning as CloudLightningIcon2,
  CloudMoon as CloudMoonIcon2,
  CloudSun as CloudSunIcon2,
  CloudMoonRain as CloudMoonRainIcon2,
  CloudSunRain as CloudSunRainIcon2,
  CloudFog as CloudFogIcon2,
  CloudHail as CloudHailIcon2,
  CloudRainWind as CloudRainWindIcon2,
  CloudSnowWind as CloudSnowWindIcon2,
  CloudLightningRain as CloudLightningRainIcon2,
  CloudRainSun as CloudRainSunIcon2,
  CloudSnowSun as CloudSnowSunIcon2,
  CloudRainMoon as CloudRainMoonIcon2,
  CloudSnowMoon as CloudSnowMoonIcon2,
  CloudLightningSun as CloudLightningSunIcon2,
  CloudLightningMoon as CloudLightningMoonIcon2,
  Sun as SunIcon3,
  Moon as MoonIcon3,
  Sunrise as SunriseIcon3,
  Sunset as SunsetIcon3,
  Mountain as MountainIcon3,
  Trees as TreesIcon3,
  Home as HomeIcon3,
  Building as BuildingIcon3,
  Building2 as Building2Icon3,
  Store as StoreIcon3,
  ShoppingCart as ShoppingCartIcon3,
  Package as PackageIcon3,
  Truck as TruckIcon3,
  Plane as PlaneIcon3,
  Car as CarIcon3,
  Train as TrainIcon4,
  Ship as ShipIcon3,
  Bike as BikeIcon3,
  Bus as BusIcon3,
  Anchor as AnchorIcon3,
  Compass as CompassIcon3,
  Navigation as NavigationIcon3,
  Navigation2 as Navigation2Icon3,
  Navigation3 as Navigation3Icon3,
  Radar as RadarIcon3,
  Radio as RadioIcon5,
  Tv as TvIcon3,
  Radio as RadioIcon6,
  Smartphone as SmartphoneIcon4,
  Tablet as TabletIcon4,
  Laptop as LaptopIcon4,
  Monitor as MonitorIcon4,
  Camera as CameraIcon3,
  CameraOff as CameraOffIcon3,
  Image as ImageIcon4,
  ImageOff as ImageOffIcon3,
  File as FileIcon3,
  FileText as FileTextIcon4,
  FilePlus as FilePlusIcon3,
  FileMinus as FileMinusIcon3,
  FileCheck as FileCheckIcon3,
  FileX as FileXIcon3,
  FileSearch as FileSearchIcon3,
  FileQuestion as FileQuestionIcon3,
  FileWarning as FileWarningIcon3,
  FileLock as FileLockIcon3,
  FileUnlock as FileUnlockIcon3,
  Folder as FolderIcon3,
  FolderOpen as FolderOpenIcon3,
  FolderPlus as FolderPlusIcon3,
  FolderMinus as FolderMinusIcon3,
  FolderLock as FolderLockIcon3,
  FolderUnlock as FolderUnlockIcon3,
  Archive as ArchiveIcon3,
  ArchiveRestore as ArchiveRestoreIcon3,
  ArchiveLock as ArchiveLockIcon3,
  ArchiveUnlock as ArchiveUnlockIcon3,
  Inbox as InboxIcon3,
  InboxOff as InboxOffIcon3,
  Send as SendIcon4,
  SendHorizontal as SendHorizontalIcon3,
  SendVertical as SendVerticalIcon3,
  SendToBack as SendToBackIcon3,
  BringToFront as BringToFrontIcon3,
  FlipHorizontal as FlipHorizontalIcon3,
  FlipVertical as FlipVerticalIcon3,
  RotateCw as RotateCwIcon4,
  RotateCcw as RotateCcwIcon4,
  ZoomIn as ZoomInIcon3,
  ZoomOut as ZoomOutIcon3,
  Maximize as MaximizeIcon4,
  Minimize as MinimizeIcon4,
  Fullscreen as FullscreenIcon3,
  FullscreenExit as FullscreenExitIcon3,
  PictureInPicture as PictureInPictureIcon3,
  PictureInPicture2 as PictureInPicture2Icon3,
  Pipette as PipetteIcon3,
  Droplet as DropletIcon4,
  Droplets as DropletsIcon4,
  Thermometer as ThermometerIcon3,
  ThermometerSnowflake as ThermometerSnowflakeIcon3,
  ThermometerSun as ThermometerSunIcon3,
  Wind as WindIcon4,
  Cloud as CloudIcon4,
  CloudRain as CloudRainIcon4,
  CloudSnow as CloudSnowIcon4,
  CloudDrizzle as CloudDrizzleIcon3,
  CloudLightning as CloudLightningIcon3,
  CloudMoon as CloudMoonIcon3,
  CloudSun as CloudSunIcon3,
  CloudMoonRain as CloudMoonRainIcon3,
  CloudSunRain as CloudSunRainIcon3,
  CloudFog as CloudFogIcon3,
  CloudHail as CloudHailIcon3,
  CloudRainWind as CloudRainWindIcon3,
  CloudSnowWind as CloudSnowWindIcon3,
  CloudLightningRain as CloudLightningRainIcon3,
  CloudRainSun as CloudRainSunIcon3,
  CloudSnowSun as CloudSnowSunIcon3,
  CloudRainMoon as CloudRainMoonIcon3,
  CloudSnowMoon as CloudSnowMoonIcon3,
  CloudLightningSun as CloudLightningSunIcon3,
  CloudLightningMoon as CloudLightningMoonIcon3,
  Sun as SunIcon4,
  Moon as MoonIcon4,
  Sunrise as SunriseIcon4,
  Sunset as SunsetIcon4,
  Mountain as MountainIcon4,
  Trees as TreesIcon4,
  Home as HomeIcon4,
  Building as BuildingIcon4,
  Building2 as Building2Icon4,
  Store as StoreIcon4,
  ShoppingCart as ShoppingCartIcon4,
  Package as PackageIcon4,
  Truck as TruckIcon4,
  Plane as PlaneIcon4,
  Car as CarIcon4,
  Train as TrainIcon5,
  Ship as ShipIcon4,
  Bike as BikeIcon4,
  Bus as BusIcon4,
  Anchor as AnchorIcon4,
  Compass as CompassIcon4,
  Navigation as NavigationIcon4,
  Navigation2 as Navigation2Icon4,
  Navigation3 as Navigation3Icon4,
  Radar as RadarIcon4,
  Radio as RadioIcon7,
  Tv as TvIcon4,
  Radio as RadioIcon8,
  Smartphone as SmartphoneIcon5,
  Tablet as TabletIcon5,
  Laptop as LaptopIcon5,
  Monitor as MonitorIcon5,
  Camera as CameraIcon4,
  CameraOff as CameraOffIcon4,
  Image as ImageIcon5,
  ImageOff as ImageOffIcon4,
  File as FileIcon4,
  FileText as FileTextIcon5,
  FilePlus as FilePlusIcon4,
  FileMinus as FileMinusIcon4,
  FileCheck as FileCheckIcon4,
  FileX as FileXIcon4,
  FileSearch as FileSearchIcon4,
  FileQuestion as FileQuestionIcon4,
  FileWarning as FileWarningIcon4,
  FileLock as FileLockIcon4,
  FileUnlock as FileUnlockIcon4,
  Folder as FolderIcon4,
  FolderOpen as FolderOpenIcon4,
  FolderPlus as FolderPlusIcon4,
  FolderMinus as FolderMinusIcon4,
  FolderLock as FolderLockIcon4,
  FolderUnlock as FolderUnlockIcon4,
  Archive as ArchiveIcon4,
  ArchiveRestore as ArchiveRestoreIcon4,
  ArchiveLock as ArchiveLockIcon4,
  ArchiveUnlock as ArchiveUnlockIcon4,
  Inbox as InboxIcon4,
  InboxOff as InboxOffIcon4,
  Send as SendIcon5,
  SendHorizontal as SendHorizontalIcon4,
  SendVertical as SendVerticalIcon4,
  SendToBack as SendToBackIcon4,
  BringToFront as BringToFrontIcon4,
  FlipHorizontal as FlipHorizontalIcon4,
  FlipVertical as FlipVerticalIcon4,
  RotateCw as RotateCwIcon5,
  RotateCcw as RotateCcwIcon5,
  ZoomIn as ZoomInIcon4,
  ZoomOut as ZoomOutIcon4,
  Maximize as MaximizeIcon5,
  Minimize as MinimizeIcon5,
  Fullscreen as FullscreenIcon4,
  FullscreenExit as FullscreenExitIcon4,
  PictureInPicture as PictureInPictureIcon4,
  PictureInPicture2 as PictureInPicture2Icon4,
  Pipette as PipetteIcon4,
  Droplet as DropletIcon5,
  Droplets as DropletsIcon5,
  Thermometer as ThermometerIcon4,
  ThermometerSnowflake as ThermometerSnowflakeIcon4,
  ThermometerSun as ThermometerSunIcon4,
  Wind as WindIcon5,
  Cloud as CloudIcon5,
  CloudRain as CloudRainIcon5,
  CloudSnow as CloudSnowIcon5,
  CloudDrizzle as CloudDrizzleIcon4,
  CloudLightning as CloudLightningIcon4,
  CloudMoon as CloudMoonIcon4,
  CloudSun as CloudSunIcon4,
  CloudMoonRain as CloudMoonRainIcon4,
  CloudSunRain as CloudSunRainIcon4,
  CloudFog as CloudFogIcon4,
  CloudHail as CloudHailIcon4,
  CloudRainWind as CloudRainWindIcon4,
  CloudSnowWind as CloudSnowWindIcon4,
  CloudLightningRain as CloudLightningRainIcon4,
  CloudRainSun as CloudRainSunIcon4,
  CloudSnowSun as CloudSnowSunIcon4,
  CloudRainMoon as CloudRainMoonIcon4,
  CloudSnowMoon as CloudSnowMoonIcon4,
  CloudLightningSun as CloudLightningSunIcon4,
  CloudLightningMoon as CloudLightningMoonIcon4,
  Sun as SunIcon5,
  Moon as MoonIcon5,
  Sunrise as SunriseIcon5,
  Sunset as SunsetIcon5,
  Mountain as MountainIcon5,
  Trees as TreesIcon5,
  Home as HomeIcon5,
  Building as BuildingIcon5,
  Building2 as Building2Icon5,
  Store as StoreIcon5,
  ShoppingCart as ShoppingCartIcon5,
  Package as PackageIcon5,
  Truck as TruckIcon5,
  Plane as PlaneIcon5,
  Car as CarIcon5,
  Train as TrainIcon6,
  Ship as ShipIcon5,
  Bike as BikeIcon5,
  Bus as BusIcon5,
  Anchor as AnchorIcon5,
  Compass as CompassIcon5,
  Navigation as NavigationIcon5,
  Navigation2 as Navigation2Icon5,
  Navigation3 as Navigation3Icon5,
  Radar as RadarIcon5,
  Radio as RadioIcon9,
  Tv as TvIcon5,
  Radio as RadioIcon10,
  Smartphone as SmartphoneIcon6,
  Tablet as TabletIcon6,
  Laptop as LaptopIcon6,
  Monitor as MonitorIcon6,
  Camera as CameraIcon5,
  CameraOff as CameraOffIcon5,
  Image as ImageIcon6,
  ImageOff as ImageOffIcon5,
  File as FileIcon5,
  FileText as FileTextIcon6,
  FilePlus as FilePlusIcon5,
  FileMinus as FileMinusIcon5,
  FileCheck as FileCheckIcon5,
  FileX as FileXIcon5,
  FileSearch as FileSearchIcon5,
  FileQuestion as FileQuestionIcon5,
  FileWarning as FileWarningIcon5,
  FileLock as FileLockIcon5,
  FileUnlock as FileUnlockIcon5,
  Folder as FolderIcon5,
  FolderOpen as FolderOpenIcon5,
  FolderPlus as FolderPlusIcon5,
  FolderMinus as FolderMinusIcon5,
  FolderLock as FolderLockIcon5,
  FolderUnlock as FolderUnlockIcon5,
  Archive as ArchiveIcon5,
  ArchiveRestore as ArchiveRestoreIcon5,
  ArchiveLock as ArchiveLockIcon5,
  ArchiveUnlock as ArchiveUnlockIcon5,
  Inbox as InboxIcon5,
  InboxOff as InboxOffIcon5,
  Send as SendIcon6,
  SendHorizontal as SendHorizontalIcon5,
  SendVertical as SendVerticalIcon5,
  SendToBack as SendToBackIcon5,
  BringToFront as BringToFrontIcon5,
  FlipHorizontal as FlipHorizontalIcon5,
  FlipVertical as FlipVerticalIcon5,
  RotateCw as RotateCwIcon6,
  RotateCcw as RotateCcwIcon6,
  ZoomIn as ZoomInIcon5,
  ZoomOut as ZoomOutIcon5,
  Maximize as MaximizeIcon6,
  Minimize as MinimizeIcon6,
  Fullscreen as FullscreenIcon5,
  FullscreenExit as FullscreenExitIcon5,
  PictureInPicture as PictureInPictureIcon5,
  PictureInPicture2 as PictureInPicture2Icon5,
  Pipette as PipetteIcon5,
  Droplet as DropletIcon6,
  Droplets as DropletsIcon6,
  Thermometer as ThermometerIcon5,
  ThermometerSnowflake as ThermometerSnowflakeIcon5,
  ThermometerSun as ThermometerSunIcon5,
  Wind as WindIcon6,
  Cloud as CloudIcon6,
  CloudRain as CloudRainIcon6,
  CloudSnow as CloudSnowIcon6,
  CloudDrizzle as CloudDrizzleIcon5,
  CloudLightning as CloudLightningIcon5,
  CloudMoon as CloudMoonIcon5,
  CloudSun as CloudSunIcon5,
  CloudMoonRain as CloudMoonRainIcon5,
  CloudSunRain as CloudSunRainIcon5,
  CloudFog as CloudFogIcon5,
  CloudHail as CloudHailIcon5,
  CloudRainWind as CloudRainWindIcon5,
  CloudSnowWind as CloudSnowWindIcon5,
  CloudLightningRain as CloudLightningRainIcon5,
  CloudRainSun as CloudRainSunIcon5,
  CloudSnowSun as CloudSnowSunIcon5,
  CloudRainMoon as CloudRainMoonIcon5,
  CloudSnowMoon as CloudSnowMoonIcon5,
  CloudLightningSun as CloudLightningSunIcon5,
  CloudLightningMoon as CloudLightningMoonIcon5,
  Sun as SunIcon6,
  Moon as MoonIcon6,
  Sunrise as SunriseIcon6,
  Sunset as SunsetIcon6,
  Mountain as MountainIcon6,
  Trees as TreesIcon6,
  Home as HomeIcon6,
  Building as BuildingIcon6,
  Building2 as Building2Icon6,
  Store as StoreIcon6,
  ShoppingCart as ShoppingCartIcon6,
  Package as PackageIcon6,
  Truck as TruckIcon6,
  Plane as PlaneIcon6,
  Car as CarIcon6,
  Train as TrainIcon7,
  Ship as ShipIcon6,
  Bike as BikeIcon6,
  Bus as BusIcon6,
  Anchor as AnchorIcon6,
  Compass as CompassIcon6,
  Navigation as NavigationIcon6,
  Navigation2 as Navigation2Icon6,
  Navigation3 as Navigation3Icon6,
  Radar as RadarIcon6,
  Radio as RadioIcon11,
  Tv as TvIcon6,
  Radio as RadioIcon12,
  Smartphone as SmartphoneIcon7,
  Tablet as TabletIcon7,
  Laptop as LaptopIcon7,
  Monitor as MonitorIcon7,
  Camera as CameraIcon6,
  CameraOff as CameraOffIcon6,
  Image as ImageIcon7,
  ImageOff as ImageOffIcon6,
  File as FileIcon6,
  FileText as FileTextIcon7,
  FilePlus as FilePlusIcon6,
  FileMinus as FileMinusIcon6,
  FileCheck as FileCheckIcon6,
  FileX as FileXIcon6,
  FileSearch as FileSearchIcon6,
  FileQuestion as FileQuestionIcon6,
  FileWarning as FileWarningIcon6,
  FileLock as FileLockIcon6,
  FileUnlock as FileUnlockIcon6,
  Folder as FolderIcon6,
  FolderOpen as FolderOpenIcon6,
  FolderPlus as FolderPlusIcon6,
  FolderMinus as FolderMinusIcon6,
  FolderLock as FolderLockIcon6,
  FolderUnlock as FolderUnlockIcon6,
  Archive as ArchiveIcon6,
  ArchiveRestore as ArchiveRestoreIcon6,
  ArchiveLock as ArchiveLockIcon6,
  ArchiveUnlock as ArchiveUnlockIcon6,
  Inbox as InboxIcon6,
  InboxOff as InboxOffIcon6,
  Send as SendIcon7,
  SendHorizontal as SendHorizontalIcon6,
  SendVertical as SendVerticalIcon6,
  SendToBack as SendToBackIcon6,
  BringToFront as BringToFrontIcon6,
  FlipHorizontal as FlipHorizontalIcon6,
  FlipVertical as FlipVerticalIcon6,
  RotateCw as RotateCwIcon7,
  RotateCcw as RotateCcwIcon7,
  ZoomIn as ZoomInIcon6,
  ZoomOut as ZoomOutIcon6,
  Maximize as MaximizeIcon7,
  Minimize as MinimizeIcon7,
  Fullscreen as FullscreenIcon6,
  FullscreenExit as FullscreenExitIcon6,
  PictureInPicture as PictureInPictureIcon6,
  PictureInPicture2 as PictureInPicture2Icon6,
  Pipette as PipetteIcon6,
  Droplet as DropletIcon7,
  Droplets as DropletsIcon7,
  Thermometer as ThermometerIcon6,
  ThermometerSnowflake as ThermometerSnowflakeIcon6,
  ThermometerSun as ThermometerSunIcon6,
  Wind as WindIcon7,
  Cloud as CloudIcon7,
  CloudRain as CloudRainIcon7,
  CloudSnow as CloudSnowIcon7,
  CloudDrizzle as CloudDrizzleIcon6,
  CloudLightning as CloudLightningIcon6,
  CloudMoon as CloudMoonIcon6,
  CloudSun as CloudSunIcon6,
  CloudMoonRain as CloudMoonRainIcon6,
  CloudSunRain as CloudSunRainIcon6,
  CloudFog as CloudFogIcon6,
  CloudHail as CloudHailIcon6,
  CloudRainWind as CloudRainWindIcon6,
  CloudSnowWind as CloudSnowWindIcon6,
  CloudLightningRain as CloudLightningRainIcon6,
  CloudRainSun as CloudRainSunIcon6,
  CloudSnowSun as CloudSnowSunIcon6,
  CloudRainMoon as CloudRainMoonIcon6,
  CloudSnowMoon as CloudSnowMoonIcon6,
  CloudLightningSun as CloudLightningSunIcon6,
  CloudLightningMoon as CloudLightningMoonIcon6,
  Sun as SunIcon7,
  Moon as MoonIcon7,
  Sunrise as SunriseIcon7,
  Sunset as SunsetIcon7,
  Mountain as MountainIcon7,
  Trees as TreesIcon7,
  Home as HomeIcon7,
  Building as BuildingIcon7,
  Building2 as Building2Icon7,
  Store as StoreIcon7,
  ShoppingCart as ShoppingCartIcon7,
  Package as PackageIcon7,
  Truck as TruckIcon7,
  Plane as PlaneIcon7,
  Car as CarIcon7,
  Train as TrainIcon8,
  Ship as ShipIcon7,
  Bike as BikeIcon7,
  Bus as BusIcon7,
  Anchor as AnchorIcon7,
  Compass as CompassIcon7,
  Navigation as NavigationIcon7,
  Navigation2 as Navigation2Icon7,
  Navigation3 as Navigation3Icon7,
  Radar as RadarIcon7,
  Radio as RadioIcon13,
  Tv as TvIcon7,
  Radio as RadioIcon14,
  Smartphone as SmartphoneIcon8,
  Tablet as TabletIcon8,
  Laptop as LaptopIcon8,
  Monitor as MonitorIcon8,
  Camera as CameraIcon7,
  CameraOff as CameraOffIcon7,
  Image as ImageIcon8,
  ImageOff as ImageOffIcon7,
  File as FileIcon7,
  FileText as FileTextIcon8,
  FilePlus as FilePlusIcon7,
  FileMinus as FileMinusIcon7,
  FileCheck as FileCheckIcon7,
  FileX as FileXIcon7,
  FileSearch as FileSearchIcon7,
  FileQuestion as FileQuestionIcon7,
  FileWarning as FileWarningIcon7,
  FileLock as FileLockIcon7,
  FileUnlock as FileUnlockIcon7,
  Folder as FolderIcon7,
  FolderOpen as FolderOpenIcon7,
  FolderPlus as FolderPlusIcon7,
  FolderMinus as FolderMinusIcon7,
  FolderLock as FolderLockIcon7,
  FolderUnlock as FolderUnlockIcon7,
  Archive as ArchiveIcon7,
  ArchiveRestore as ArchiveRestoreIcon7,
  ArchiveLock as ArchiveLockIcon7,
  ArchiveUnlock as ArchiveUnlockIcon7,
  Inbox as InboxIcon7,
  InboxOff as InboxOffIcon7,
  Send as SendIcon8,
  SendHorizontal as SendHorizontalIcon7,
  SendVertical as SendVerticalIcon7,
  SendToBack as SendToBackIcon7,
  BringToFront as BringToFrontIcon7,
  FlipHorizontal as FlipHorizontalIcon7,
  FlipVertical as FlipVerticalIcon7,
  RotateCw as RotateCwIcon8,
  RotateCcw as RotateCcwIcon8,
  ZoomIn as ZoomInIcon7,
  ZoomOut as ZoomOutIcon7,
  Maximize as MaximizeIcon8,
  Minimize as MinimizeIcon8,
  Fullscreen as FullscreenIcon7,
  FullscreenExit as FullscreenExitIcon7,
  PictureInPicture as PictureInPictureIcon7,
  PictureInPicture2 as PictureInPicture2Icon7,
  Pipette as PipetteIcon7,
  Droplet as DropletIcon8,
  Droplets as DropletsIcon8,
  Thermometer as ThermometerIcon7,
  ThermometerSnowflake as ThermometerSnowflakeIcon7,
  ThermometerSun as ThermometerSunIcon7,
  Wind as WindIcon8,
  Cloud as CloudIcon8,
  CloudRain as CloudRainIcon8,
  CloudSnow as CloudSnowIcon8,
  CloudDrizzle as CloudDrizzleIcon7,
  CloudLightning as CloudLightningIcon7,
  CloudMoon as CloudMoonIcon7,
  CloudSun as CloudSunIcon7,
  CloudMoonRain as CloudMoonRainIcon7,
  CloudSunRain as CloudSunRainIcon7,
  CloudFog as CloudFogIcon7,
  CloudHail as CloudHailIcon7,
  CloudRainWind as CloudRainWindIcon7,
  CloudSnowWind as CloudSnowWindIcon7,
  CloudLightningRain as CloudLightningRainIcon7,
  CloudRainSun as CloudRainSunIcon7,
  CloudSnowSun as CloudSnowSunIcon7,
  CloudRainMoon as CloudRainMoonIcon7,
  CloudSnowMoon as CloudSnowMoonIcon7,
  CloudLightningSun as CloudLightningSunIcon7,
  CloudLightningMoon as CloudLightningMoonIcon7,
  Sun as SunIcon8,
  Moon as MoonIcon8,
  Sunrise as SunriseIcon8,
  Sunset as SunsetIcon8,
  Mountain as MountainIcon8,
  Trees as TreesIcon8,
  Home as HomeIcon8,
  Building as BuildingIcon8,
  Building2 as Building2Icon8,
  Store as StoreIcon8,
  ShoppingCart as ShoppingCartIcon8,
  Package as PackageIcon8,
  Truck as TruckIcon8,
  Plane as PlaneIcon8,
  Car as CarIcon8,
  Train as TrainIcon9,
  Ship as ShipIcon8,
  Bike as BikeIcon8,
  Bus as BusIcon8,
  Anchor as AnchorIcon8,
  Compass as CompassIcon8,
  Navigation as NavigationIcon8,
  Navigation2 as Navigation2Icon8,
  Navigation3 as Navigation3Icon8,
  Radar as RadarIcon8,
  Radio as RadioIcon15,
  Tv as TvIcon8,
  Radio as RadioIcon16,
  Smartphone as SmartphoneIcon9,
  Tablet as TabletIcon9,
  Laptop as LaptopIcon9,
  Monitor as MonitorIcon9,
  Camera as CameraIcon8,
  CameraOff as CameraOffIcon8,
  Image as ImageIcon9,
  ImageOff as ImageOffIcon8,
  File as FileIcon8,
  FileText as FileTextIcon9,
  FilePlus as FilePlusIcon8,
  FileMinus as FileMinusIcon8,
  FileCheck as FileCheckIcon8,
  FileX as FileXIcon8,
  FileSearch as FileSearchIcon8,
  FileQuestion as FileQuestionIcon8,
  FileWarning as FileWarningIcon8,
  FileLock as FileLockIcon8,
  FileUnlock as FileUnlockIcon8,
  Folder as FolderIcon8,
  FolderOpen as FolderOpenIcon8,
  FolderPlus as FolderPlusIcon8,
  FolderMinus as FolderMinusIcon8,
  FolderLock as FolderLockIcon8,
  FolderUnlock as FolderUnlockIcon8,
  Archive as ArchiveIcon8,
  ArchiveRestore as ArchiveRestoreIcon8,
  ArchiveLock as ArchiveLockIcon8,
  ArchiveUnlock as ArchiveUnlockIcon8,
  Inbox as InboxIcon8,
  InboxOff as InboxOffIcon8,
  Send as SendIcon9,
  SendHorizontal as SendHorizontalIcon8,
  SendVertical as SendVerticalIcon8,
  SendToBack as SendToBackIcon8,
  BringToFront as BringToFrontIcon8,
  FlipHorizontal as FlipHorizontalIcon8,
  FlipVertical as FlipVerticalIcon8,
  RotateCw as RotateCwIcon9,
  RotateCcw as RotateCcwIcon9,
  ZoomIn as ZoomInIcon8,
  ZoomOut as ZoomOutIcon8,
  Maximize as MaximizeIcon9,
  Minimize as MinimizeIcon9,
  Fullscreen as FullscreenIcon8,
  FullscreenExit as FullscreenExitIcon8,
  PictureInPicture as PictureInPictureIcon8,
  PictureInPicture2 as PictureInPicture2Icon8,
  Pipette as PipetteIcon8,
  Droplet as DropletIcon9,
  Droplets as DropletsIcon9,
  Thermometer as ThermometerIcon8,
  ThermometerSnowflake as ThermometerSnowflakeIcon8,
  ThermometerSun as ThermometerSunIcon8,
  Wind as WindIcon9,
  Cloud as CloudIcon9,
  CloudRain as CloudRainIcon9,
  CloudSnow as CloudSnowIcon9,
  CloudDrizzle as CloudDrizzleIcon8,
  CloudLightning as CloudLightningIcon8,
  CloudMoon as CloudMoonIcon8,
  CloudSun as CloudSunIcon8,
  CloudMoonRain as CloudMoonRainIcon8,
  CloudSunRain as CloudSunRainIcon8,
  CloudFog as CloudFogIcon8,
  CloudHail as CloudHailIcon8,
  CloudRainWind as CloudRainWindIcon8,
  CloudSnowWind as CloudSnowWindIcon8,
  CloudLightningRain as CloudLightningRainIcon8,
  CloudRainSun as CloudRainSunIcon8,
  CloudSnowSun as CloudSnowSunIcon8,
  CloudRainMoon as CloudRainMoonIcon8,
  CloudSnowMoon as CloudSnowMoonIcon8,
  CloudLightningSun as CloudLightningSunIcon8,
  CloudLightningMoon as CloudLightningMoonIcon8,
  Sun as SunIcon9,
  Moon as MoonIcon9,
  Sunrise as SunriseIcon9,
  Sunset as SunsetIcon9,
  Mountain as MountainIcon9,
  Trees as TreesIcon9,
  Home as HomeIcon9,
  Building as BuildingIcon9,
  Building2 as Building2Icon9,
  Store as StoreIcon9,
  ShoppingCart as ShoppingCartIcon9,
  Package as PackageIcon9,
  Truck as TruckIcon9,
  Plane as PlaneIcon9,
  Car as CarIcon9,
  Train as TrainIcon10,
  Ship as ShipIcon9,
  Bike as BikeIcon9,
  Bus as BusIcon9,
  Anchor as AnchorIcon9,
  Compass as CompassIcon9,
  Navigation as NavigationIcon9,
  Navigation2 as Navigation2Icon9,
  Navigation3 as Navigation3Icon9,
  Radar as RadarIcon9,
  Radio as RadioIcon17,
  Tv as TvIcon9,
  Radio as RadioIcon18,
  Smartphone as SmartphoneIcon10,
  Tablet as TabletIcon10,
  Laptop as LaptopIcon10,
  Monitor as MonitorIcon10,
  Camera as CameraIcon9,
  CameraOff as CameraOffIcon9,
  Image as ImageIcon10,
  ImageOff as ImageOffIcon9,
  File as FileIcon9,
  FileText as FileTextIcon10,
  FilePlus as FilePlusIcon9,
  FileMinus as FileMinusIcon9,
  FileCheck as FileCheckIcon9,
  FileX as FileXIcon9,
  FileSearch as FileSearchIcon9,
  FileQuestion as FileQuestionIcon9,
  FileWarning as FileWarningIcon9,
  FileLock as FileLockIcon9,
  FileUnlock as FileUnlockIcon9,
  Folder as FolderIcon9,
  FolderOpen as FolderOpenIcon9,
  FolderPlus as FolderPlusIcon9,
  FolderMinus as FolderMinusIcon9,
  FolderLock as FolderLockIcon9,
  FolderUnlock as FolderUnlockIcon9,
  Archive as ArchiveIcon9,
  ArchiveRestore as ArchiveRestoreIcon9,
  ArchiveLock as ArchiveLockIcon9,
  ArchiveUnlock as ArchiveUnlockIcon9,
  Inbox as InboxIcon9,
  InboxOff as InboxOffIcon9,
  Send as SendIcon10,
  SendHorizontal as SendHorizontalIcon9,
  SendVertical as SendVerticalIcon9,
  SendToBack as SendToBackIcon9,
  BringToFront as BringToFrontIcon9,
  FlipHorizontal as FlipHorizontalIcon9,
  FlipVertical as FlipVerticalIcon9,
  RotateCw as RotateCwIcon10,
  RotateCcw as RotateCcwIcon10,
  ZoomIn as ZoomInIcon9,
  ZoomOut as ZoomOutIcon9,
  Maximize as MaximizeIcon10,
  Minimize as MinimizeIcon10,
  Fullscreen as FullscreenIcon9,
  FullscreenExit as FullscreenExitIcon9,
  PictureInPicture as PictureInPictureIcon9,
  PictureInPicture2 as PictureInPicture2Icon9,
  Pipette as PipetteIcon9,
  Droplet as DropletIcon10,
  Droplets as DropletsIcon10,
  Thermometer as ThermometerIcon9,
  ThermometerSnowflake as ThermometerSnowflakeIcon9,
  ThermometerSun as ThermometerSunIcon9,
  Wind as WindIcon10,
  Cloud as CloudIcon10,
  CloudRain as CloudRainIcon10,
  CloudSnow as CloudSnowIcon10,
  CloudDrizzle as CloudDrizzleIcon9,
  CloudLightning as CloudLightningIcon9,
  CloudMoon as CloudMoonIcon9,
  CloudSun as CloudSunIcon9,
  CloudMoonRain as CloudMoonRainIcon9,
  CloudSunRain as CloudSunRainIcon9,
  CloudFog as CloudFogIcon9,
  CloudHail as CloudHailIcon9,
  CloudRainWind as CloudRainWindIcon9,
  CloudSnowWind as CloudSnowWindIcon9,
  CloudLightningRain as CloudLightningRainIcon9,
  CloudRainSun as CloudRainSunIcon9,
  CloudSnowSun as CloudSnowSunIcon9,
  CloudRainMoon as CloudRainMoonIcon9,
  CloudSnowMoon as CloudSnowMoonIcon9,
  CloudLightningSun as CloudLightningSunIcon9,
  CloudLightningMoon as CloudLightningMoonIcon9
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import { supportAutomationService } from '@/services/support-automation.service';
import { cn } from '@/lib/utils';
import { toast aria-live="polite" aria-atomic="true" } from 'sonner';

interface AIAppointmentSchedulerProps {
  className?: string;
  onAppointmentBooked?: (appointment: any) => void;
  enableAIRecommendations?: boolean;
  enableSmartScheduling?: boolean;
  enableAutoRescheduling?: boolean;
  defaultLanguage?: string;
  supportedLanguages?: string[];
}

interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  available: boolean;
  providerId?: string;
  providerName?: string;
  price?: number;
  confidence?: number;
  aiRecommended?: boolean;
  reasons?: string[];
}

interface AppointmentRequest {
  serviceId: string;
  serviceType: 'beauty' | 'fitness' | 'lifestyle';
  preferredDate: Date;
  preferredTime: string;
  duration: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  language: string;
  flexibility: 'exact' | 'flexible' | 'very_flexible';
  budgetRange?: {
    min: number;
    max: number;
  };
  specialRequirements?: string[];
}

interface AISchedulingInsight {
  type: 'optimal_time' | 'price_opportunity' | 'availability_pattern' | 'customer_preference' | 'demand_forecast';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendation?: string;
  data?: any;
}

export function AIAppointmentScheduler({
  className,
  onAppointmentBooked,
  enableAIRecommendations = true,
  enableSmartScheduling = true,
  enableAutoRescheduling = true,
  defaultLanguage = 'en',
  supportedLanguages = ['en', 'pl']
}: AIAppointmentSchedulerProps) {
  const { t, i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);

  // Form states
  const [appointmentRequest, setAppointmentRequest] = useState<Partial<AppointmentRequest>>({
    language: defaultLanguage,
    flexibility: 'flexible'
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [aiInsights, setAiInsights] = useState<AISchedulingInsight[]>([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [processingTimeSlots, setProcessingTimeSlots] = useState(false);
  const [showCalendar, setShowCalendar] = useState(true);
  const [showInsights, setShowInsights] = useState(true);
  const [autoSchedulingEnabled, setAutoSchedulingEnabled] = useState(true);
  const [aiRecommendationsEnabled, setAiRecommendationsEnabled] = useState(enableAIRecommendations);

  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // AI Processing states
  const [analyzingPreferences, setAnalyzingPreferences] = useState(false);
  const [generatingRecommendations, setGeneratingRecommendations] = useState(false);
  const [optimizingSchedule, setOptimizingSchedule] = useState(false);

  // Initialize component
  useEffect(() => {
    if (aiRecommendationsEnabled) {
      loadInitialInsights();
    }
    loadAvailableTimeSlots(currentDate);
  }, [currentDate, aiRecommendationsEnabled]);

  // Load AI insights
  const loadInitialInsights = async () => {
    try {
      setGeneratingRecommendations(true);
      // Mock AI insights
      const mockInsights: AISchedulingInsight[] = [
        {
          type: 'optimal_time',
          title: 'Best Time for Your Service',
          description: 'Based on your preferences and availability, Tuesday at 2:00 PM offers the best experience',
          confidence: 0.92,
          impact: 'high',
          actionable: true,
          recommendation: 'Book Tuesday 2:00 PM for optimal results and minimal wait times'
        },
        {
          type: 'price_opportunity',
          title: 'Weekend Special Available',
          description: 'Save 15% on weekend appointments with our current promotion',
          confidence: 0.87,
          impact: 'medium',
          actionable: true,
          recommendation: 'Consider booking Saturday or Sunday for discount'
        },
        {
          type: 'availability_pattern',
          title: 'High Demand Period Detected',
          description: 'Your preferred time slot is in high demand. Book soon to secure your spot.',
          confidence: 0.94,
          impact: 'high',
          actionable: true,
          recommendation: 'Book within 24 hours or consider alternative times'
        }
      ];

      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAiInsights(mockInsights);
    } catch (error) {
      console.error('Error loading AI insights:', error);
    } finally {
      setGeneratingRecommendations(false);
    }
  };

  // Load available time slots
  const loadAvailableTimeSlots = async (date: Date) => {
    try {
      setProcessingTimeSlots(true);

      // Generate mock time slots
      const mockTimeSlots: TimeSlot[] = generateMockTimeSlots(date);

      // Apply AI optimization if enabled
      if (enableSmartScheduling && aiRecommendationsEnabled) {
        const optimizedSlots = await optimizeTimeSlots(mockTimeSlots);
        setAvailableTimeSlots(optimizedSlots);
      } else {
        setAvailableTimeSlots(mockTimeSlots);
      }
    } catch (error) {
      console.error('Error loading time slots:', error);
      toast aria-live="polite" aria-atomic="true".error('Failed to load available times');
    } finally {
      setProcessingTimeSlots(false);
    }
  };

  // Generate mock time slots
  const generateMockTimeSlots = (date: Date): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 18;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = setMinutes(setHours(date, hour), minute);
        const endTime = addMinutes(startTime, 60);

        // Random availability with some patterns
        let available = Math.random() > 0.3; // 70% available

        // Make certain times less available (lunch, end of day)
        if ((hour >= 12 && hour <= 13) || hour >= 17) {
          available = Math.random() > 0.5; // 50% available
        }

        // Weekend patterns
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
          available = Math.random() > 0.4; // 60% available
        }

        slots.push({
          id: `${date.toISOString()}-${hour}-${minute}`,
          startTime,
          endTime,
          available,
          providerId: `provider-${Math.floor(Math.random() * 3) + 1}`,
          providerName: ['Anna K.', 'Maria S.', 'Elena D.'][Math.floor(Math.random() * 3)],
          price: 200 + Math.floor(Math.random() * 300),
          confidence: 0.8 + Math.random() * 0.2,
          aiRecommended: false,
          reasons: []
        });
      }
    }

    return slots;
  };

  // Optimize time slots with AI
  const optimizeTimeSlots = async (slots: TimeSlot[]): Promise<TimeSlot[]> => {
    try {
      setOptimizingSchedule(true);

      // Simulate AI optimization
      await new Promise(resolve => setTimeout(resolve, 1000));

      return slots.map(slot => {
        // AI recommendation logic
        let aiRecommended = false;
        let reasons: string[] = [];
        let confidence = slot.confidence || 0.8;

        // Recommend optimal times
        const hour = slot.startTime.getHours();
        if (hour >= 10 && hour <= 12) {
          aiRecommended = true;
          reasons.push('Optimal morning slot');
          confidence += 0.1;
        }

        if (hour >= 14 && hour <= 16) {
          aiRecommended = true;
          reasons.push('Optimal afternoon slot');
          confidence += 0.1;
        }

        // Consider customer preferences
        if (appointmentRequest.preferredTime) {
          const preferredHour = parseInt(appointmentRequest.preferredTime.split(':')[0]);
          if (Math.abs(hour - preferredHour) <= 1) {
            aiRecommended = true;
            reasons.push('Matches your preferred time');
            confidence += 0.15;
          }
        }

        // Price optimization
        if (slot.price && slot.price < 250) {
          reasons.push('Good value');
          confidence += 0.05;
        }

        return {
          ...slot,
          aiRecommended,
          reasons,
          confidence: Math.min(1, confidence)
        };
      });
    } catch (error) {
      console.error('Error optimizing time slots:', error);
      return slots;
    } finally {
      setOptimizingSchedule(false);
    }
  };

  // Analyze customer preferences
  const analyzeCustomerPreferences = async () => {
    try {
      setAnalyzingPreferences(true);

      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate personalized insights
      const insights: AISchedulingInsight[] = [
        {
          type: 'customer_preference',
          title: 'Personalized Schedule Detected',
          description: `Based on your profile, ${appointmentRequest.serviceType === 'beauty' ? 'morning appointments' : 'evening sessions'} work best for you`,
          confidence: 0.89,
          impact: 'medium',
          actionable: true,
          recommendation: appointmentRequest.serviceType === 'beauty'
            ? 'We recommend morning appointments for beauty services'
            : 'Evening fitness sessions show better results for your profile'
        }
      ];

      setAiInsights(prev => [...prev, ...insights]);
      toast aria-live="polite" aria-atomic="true".success('AI analysis complete! Personalized recommendations available.');
    } catch (error) {
      console.error('Error analyzing preferences:', error);
    } finally {
      setAnalyzingPreferences(false);
    }
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setAppointmentRequest(prev => ({ ...prev, preferredDate: date }));
    loadAvailableTimeSlots(date);
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (!slot.available) {
      toast aria-live="polite" aria-atomic="true".error('This time slot is not available');
      return;
    }

    setSelectedTimeSlot(slot);
    setAppointmentRequest(prev => ({
      ...prev,
      preferredTime: format(slot.startTime, 'HH:mm')
    }));
  };

  // Handle form input changes
  const handleInputChange = (field: keyof AppointmentRequest, value: any) => {
    setAppointmentRequest(prev => ({ ...prev, [field]: value }));
  };

  // Handle appointment booking
  const handleBookAppointment = async () => {
    if (!selectedTimeSlot || !appointmentRequest.customerName || !appointmentRequest.customerEmail) {
      toast aria-live="polite" aria-atomic="true".error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);

      // Create appointment
      const appointment = {
        id: crypto.randomUUID(),
        ...appointmentRequest,
        timeSlot: selectedTimeSlot,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        aiOptimized: aiRecommendationsEnabled,
        confidence: selectedTimeSlot.confidence
      };

      // Simulate booking process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Success feedback
      toast aria-live="polite" aria-atomic="true".success('Appointment booked successfully!');
      onAppointmentBooked?.(appointment);

      // Reset form
      setCurrentStep(1);
      setSelectedTimeSlot(null);
      setAppointmentRequest({
        language: defaultLanguage,
        flexibility: 'flexible'
      });

    } catch (error) {
      console.error('Error booking appointment:', error);
      toast aria-live="polite" aria-atomic="true".error('Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  // Render step indicators
  const renderStepIndicators = () => (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
            currentStep >= step
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}>
            {step}
          </div>
          {step < 4 && (
            <div className={cn(
              "w-16 h-1 mx-2 transition-colors",
              currentStep > step ? "bg-primary" : "bg-muted"
            )} />
          )}
        </div>
      ))}
    </div>
  );

  // Render step 1: Service Selection
  const renderServiceSelection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          {t('scheduler.selectService', 'Select Service')}
        </CardTitle>
        <CardDescription>
          {t('scheduler.selectServiceDesc', 'Choose the service you\'d like to book')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Type Selection */}
        <div className="space-y-3">
          <Label>{t('scheduler.serviceType', 'Service Type')}</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { value: 'beauty', label: 'Beauty Services', icon: '💄', desc: 'Cosmetic treatments and beauty services' },
              { value: 'fitness', label: 'Fitness Programs', icon: '💪', desc: 'Personal training and fitness classes' },
              { value: 'lifestyle', label: 'Lifestyle', icon: '🌟', desc: 'Wellness and lifestyle services' }
            ].map((type) => (
              <div
                key={type.value}
                className={cn(
                  "p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                  appointmentRequest.serviceType === type.value
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
                onClick={() => handleInputChange('serviceType', type.value)}
              >
                <div className="text-2xl mb-2">{type.icon}</div>
                <h3 className="font-semibold mb-1">{type.label}</h3>
                <p className="text-sm text-muted-foreground">{type.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">{t('scheduler.name', 'Name')} *</Label>
            <Input
              id="customerName"
              value={appointmentRequest.customerName || ''}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              placeholder={t('scheduler.namePlaceholder', 'Enter your name')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerEmail">{t('scheduler.email', 'Email')} *</Label>
            <Input
              id="customerEmail"
              type="email"
              value={appointmentRequest.customerEmail || ''}
              onChange={(e) => handleInputChange('customerEmail', e.target.value)}
              placeholder={t('scheduler.emailPlaceholder', 'Enter your email')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerPhone">{t('scheduler.phone', 'Phone')}</Label>
          <Input
            id="customerPhone"
            type="tel"
            value={appointmentRequest.customerPhone || ''}
            onChange={(e) => handleInputChange('customerPhone', e.target.value)}
            placeholder={t('scheduler.phonePlaceholder', 'Enter your phone number')}
          />
        </div>

        {/* Language Preference */}
        <div className="space-y-2">
          <Label>{t('scheduler.language', 'Preferred Language')}</Label>
          <Select
            value={selectedLanguage}
            onValueChange={(value) => {
              setSelectedLanguage(value);
              handleInputChange('language', value);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.map(lang => (
                <SelectItem key={lang} value={lang}>
                  {lang === 'en' ? 'English' : lang === 'pl' ? 'Polski' : lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* AI Analysis Button */}
        {aiRecommendationsEnabled && appointmentRequest.serviceType && (
          <Button
            onClick={analyzeCustomerPreferences}
            disabled={analyzingPreferences}
            className="w-full"
            variant="outline"
          >
            {analyzingPreferences ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                {t('scheduler.analyzing', 'Analyzing your preferences...')}
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                {t('scheduler.analyzePreferences', 'Analyze My Preferences')}
              </>
            )}
          </Button>
        )}

        {/* Continue Button */}
        <Button
          onClick={() => setCurrentStep(2)}
          disabled={!appointmentRequest.serviceType || !appointmentRequest.customerName || !appointmentRequest.customerEmail}
          className="w-full"
        >
          {t('scheduler.continue', 'Continue to Date Selection')}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );

  // Render step 2: Date & Time Selection
  const renderDateTimeSelection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          {t('scheduler.selectDateTime', 'Select Date & Time')}
        </CardTitle>
        <CardDescription>
          {t('scheduler.selectDateTimeDesc', 'Choose your preferred appointment date and time')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calendar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{t('scheduler.selectDate', 'Select Date')}</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(prev => addDays(prev, -7))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(prev => addDays(prev, 7))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Date Grid */}
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}

            {Array.from({ length: 35 }, (_, i) => {
              const date = addDays(startOfDay(currentDate), i - currentDate.getDay());
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = isToday(date);
              const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              const isPast = isBefore(date, startOfDay(new Date()));

              return (
                <button
                  key={i}
                  onClick={() => !isPast && handleDateSelect(date)}
                  disabled={isPast}
                  className={cn(
                    "p-2 text-sm rounded-md transition-colors",
                    isCurrentMonth ? "text-foreground" : "text-muted-foreground",
                    isToday && "bg-primary/10 font-semibold",
                    isSelected && "bg-primary text-primary-foreground",
                    isPast && "opacity-50 cursor-not-allowed",
                    !isPast && !isSelected && "hover:bg-muted"
                  )}
                >
                  {format(date, 'd')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">
                {t('scheduler.availableTimes', 'Available Times for')} {format(selectedDate, 'MMMM d, yyyy')}
              </h3>
              {processingTimeSlots && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  {t('scheduler.findingBestTimes', 'Finding optimal times...')}
                </div>
              )}
            </div>

            {/* AI Recommendations */}
            {aiRecommendationsEnabled && aiInsights.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{t('scheduler.aiRecommendations', 'AI Recommendations')}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {aiInsights.slice(0, 2).map((insight, index) => (
                    <Alert key={index} className="bg-blue-50 border-blue-200">
                      <Brain className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>{insight.title}</strong>
                        <p className="mt-1">{insight.description}</p>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Time Slots Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {availableTimeSlots.map((slot) => {
                const isSelected = selectedTimeSlot?.id === slot.id;
                const isAvailable = slot.available;
                const isAIRecommended = slot.aiRecommended;

                return (
                  <TooltipProvider key={slot.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => isAvailable && handleTimeSlotSelect(slot)}
                          disabled={!isAvailable}
                          className={cn(
                            "p-3 text-sm rounded-md border transition-all relative",
                            isAvailable
                              ? isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                              : "border-border bg-muted opacity-50 cursor-not-allowed",
                            isAIRecommended && "ring-2 ring-blue-500 ring-opacity-50"
                          )}
                        >
                          {isAIRecommended && (
                            <div className="absolute -top-1 -right-1">
                              <Brain className="h-4 w-4 text-blue-500" />
                            </div>
                          )}
                          <div className="text-center">
                            <div className="font-medium">
                              {format(slot.startTime, 'HH:mm')}
                            </div>
                            {slot.price && (
                              <div className="text-xs opacity-80">
                                PLN {slot.price}
                              </div>
                            )}
                            {slot.providerName && (
                              <div className="text-xs opacity-60 mt-1">
                                {slot.providerName}
                              </div>
                            )}
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {format(slot.startTime, 'HH:mm')} - {format(slot.endTime, 'HH:mm')}
                          </div>
                          <div className="text-sm">
                            {slot.providerName && <div>Provider: {slot.providerName}</div>}
                            {slot.price && <div>Price: PLN {slot.price}</div>}
                            {isAIRecommended && (
                              <div className="text-blue-600 font-medium">
                                AI Recommended • {slot.reasons?.join(', ')}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Confidence: {Math.round((slot.confidence || 0) * 100)}%
                            </div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(1)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t('scheduler.back', 'Back')}
          </Button>
          <Button
            onClick={() => setCurrentStep(3)}
            disabled={!selectedTimeSlot}
          >
            {t('scheduler.continue', 'Continue to Details')}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Render step 3: Additional Details
  const renderAdditionalDetails = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          {t('scheduler.additionalDetails', 'Additional Details')}
        </CardTitle>
        <CardDescription>
          {t('scheduler.additionalDetailsDesc', 'Help us prepare for your appointment')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Duration Selection */}
        <div className="space-y-2">
          <Label>{t('scheduler.duration', 'Duration')}</Label>
          <Select
            value={appointmentRequest.duration?.toString() || '60'}
            onValueChange={(value) => handleInputChange('duration', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">60 minutes</SelectItem>
              <SelectItem value="90">90 minutes</SelectItem>
              <SelectItem value="120">120 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Flexibility */}
        <div className="space-y-2">
          <Label>{t('scheduler.flexibility', 'Time Flexibility')}</Label>
          <Select
            value={appointmentRequest.flexibility || 'flexible'}
            onValueChange={(value: 'exact' | 'flexible' | 'very_flexible') => handleInputChange('flexibility', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exact">{t('scheduler.exactTime', 'Exact time only')}</SelectItem>
              <SelectItem value="flexible">{t('scheduler.flexibleTime', 'Same day, flexible time')}</SelectItem>
              <SelectItem value="very_flexible">{t('scheduler.veryFlexible', 'Any day, any time')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Budget Range */}
        <div className="space-y-2">
          <Label>{t('scheduler.budgetRange', 'Budget Range (Optional)')}</Label>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              placeholder={t('scheduler.minBudget', 'Minimum')}
              value={appointmentRequest.budgetRange?.min || ''}
              onChange={(e) => handleInputChange('budgetRange', {
                ...appointmentRequest.budgetRange,
                min: parseInt(e.target.value) || 0
              })}
            />
            <Input
              type="number"
              placeholder={t('scheduler.maxBudget', 'Maximum')}
              value={appointmentRequest.budgetRange?.max || ''}
              onChange={(e) => handleInputChange('budgetRange', {
                ...appointmentRequest.budgetRange,
                max: parseInt(e.target.value) || 0
              })}
            />
          </div>
        </div>

        {/* Special Requirements */}
        <div className="space-y-2">
          <Label htmlFor="notes">{t('scheduler.notes', 'Special Requirements or Notes')}</Label>
          <Textarea
            id="notes"
            value={appointmentRequest.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder={t('scheduler.notesPlaceholder', 'Any special requirements or preferences...')}
            rows={4}
          />
        </div>

        {/* AI Auto-scheduling */}
        {enableAutoRescheduling && (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="font-medium">{t('scheduler.autoScheduling', 'AI Auto-scheduling')}</div>
              <div className="text-sm text-muted-foreground">
                {t('scheduler.autoSchedulingDesc', 'Allow AI to automatically find better slots if your preferred time becomes unavailable')}
              </div>
            </div>
            <Switch
              checked={autoSchedulingEnabled}
              onCheckedChange={setAutoSchedulingEnabled}
            />
          </div>
        )}

        {/* Summary */}
        {selectedTimeSlot && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <h4 className="font-medium">{t('scheduler.appointmentSummary', 'Appointment Summary')}</h4>
            <div className="text-sm space-y-1">
              <div><strong>{t('scheduler.service', 'Service')}:</strong> {appointmentRequest.serviceType}</div>
              <div><strong>{t('scheduler.date', 'Date')}:</strong> {format(selectedTimeSlot.startTime, 'MMMM d, yyyy')}</div>
              <div><strong>{t('scheduler.time', 'Time')}:</strong> {format(selectedTimeSlot.startTime, 'HH:mm')}</div>
              <div><strong>{t('scheduler.duration', 'Duration')}:</strong> {appointmentRequest.duration || 60} minutes</div>
              <div><strong>{t('scheduler.provider', 'Provider')}:</strong> {selectedTimeSlot.providerName}</div>
              {selectedTimeSlot.price && (
                <div><strong>{t('scheduler.price', 'Price')}:</strong> PLN {selectedTimeSlot.price}</div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(2)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t('scheduler.back', 'Back')}
          </Button>
          <Button
            onClick={() => setCurrentStep(4)}
          >
            {t('scheduler.reviewBooking', 'Review Booking')}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Render step 4: Confirmation
  const renderConfirmation = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          {t('scheduler.confirmBooking', 'Confirm Your Booking')}
        </CardTitle>
        <CardDescription>
          {t('scheduler.confirmBookingDesc', 'Review your appointment details and confirm')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Complete Summary */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg">{t('scheduler.bookingDetails', 'Booking Details')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground" htmlFor="t-scheduler-customer-customer">{t('scheduler.customer', 'Customer')}</label>
                <p className="font-medium">{appointmentRequest.customerName}</p>
                <p className="text-sm">{appointmentRequest.customerEmail}</p>
                {appointmentRequest.customerPhone && (
                  <p className="text-sm">{appointmentRequest.customerPhone}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground" htmlFor="t-scheduler-service-service">{t('scheduler.service', 'Service')}</label>
                <p className="font-medium capitalize">{appointmentRequest.serviceType}</p>
                <p className="text-sm">{t('scheduler.duration')}: {appointmentRequest.duration || 60} minutes</p>
              </div>
            </div>

            <div className="space-y-3">
              {selectedTimeSlot && (
                <>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground" htmlFor="t-scheduler-datetime-date-time">{t('scheduler.dateTime', 'Date & Time')}</label>
                    <p className="font-medium">{format(selectedTimeSlot.startTime, 'EEEE, MMMM d, yyyy')}</p>
                    <p className="text-sm">{format(selectedTimeSlot.startTime, 'HH:mm')} - {format(selectedTimeSlot.endTime, 'HH:mm')}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground" htmlFor="t-scheduler-provider-provider">{t('scheduler.provider', 'Provider')}</label>
                    <p className="font-medium">{selectedTimeSlot.providerName}</p>
                  </div>

                  {selectedTimeSlot.price && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground" htmlFor="t-scheduler-price-price">{t('scheduler.price', 'Price')}</label>
                      <p className="font-medium text-lg">PLN {selectedTimeSlot.price}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {appointmentRequest.notes && (
            <div>
              <label className="text-sm font-medium text-muted-foreground" htmlFor="t-scheduler-notes-special-requirements">{t('scheduler.notes', 'Special Requirements')}</label>
              <p className="text-sm">{appointmentRequest.notes}</p>
            </div>
          )}
        </div>

        {/* AI Insights */}
        {aiRecommendationsEnabled && aiInsights.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-500" />
              {t('scheduler.aiInsights', 'AI Insights for Your Appointment')}
            </h3>
            <div className="space-y-2">
              {aiInsights.map((insight, index) => (
                <Alert key={index} className="bg-blue-50 border-blue-200">
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{insight.title}</strong>
                    <p className="mt-1 text-sm">{insight.description}</p>
                    {insight.recommendation && (
                      <p className="mt-2 text-sm font-medium text-blue-600">
                        💡 {insight.recommendation}
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Terms and Conditions */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm">
            <input type="checkbox" required />
            <span>{t('scheduler.termsAccept', 'I accept the terms and conditions and cancellation policy')}</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(3)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t('scheduler.back', 'Back')}
          </Button>
          <Button
            onClick={handleBookAppointment}
            disabled={loading}
            size="lg"
            className="min-w-48"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                {t('scheduler.booking', 'Booking...')}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('scheduler.confirmBooking', 'Confirm Booking')}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("max-w-4xl mx-auto space-y-8", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Zap className="h-8 w-8 text-blue-500" />
          {t('scheduler.aiAppointmentScheduler', 'AI Appointment Scheduler')}
        </h1>
        <p className="text-muted-foreground">
          {t('scheduler.aiSchedulerDesc', 'Intelligent scheduling powered by AI for the perfect appointment experience')}
        </p>
        {aiRecommendationsEnabled && (
          <Badge variant="secondary" className="mt-2">
            <Brain className="h-3 w-3 mr-1" />
            {t('scheduler.aiEnhanced', 'AI Enhanced')}
          </Badge>
        )}
      </div>

      {/* Step Indicators */}
      {renderStepIndicators()}

      {/* Current Step Content */}
      {currentStep === 1 && renderServiceSelection()}
      {currentStep === 2 && renderDateTimeSelection()}
      {currentStep === 3 && renderAdditionalDetails()}
      {currentStep === 4 && renderConfirmation()}

      {/* AI Processing Indicator */}
      {(analyzingPreferences || generatingRecommendations || optimizingSchedule) && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="p-6 text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <div>
                <h3 className="font-semibold">{t('scheduler.aiProcessing', 'AI Processing')}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {analyzingPreferences && t('scheduler.analyzingPreferences', 'Analyzing your preferences...')}
                  {generatingRecommendations && t('scheduler.generatingRecommendations', 'Generating personalized recommendations...')}
                  {optimizingSchedule && t('scheduler.optimizingSchedule', 'Finding optimal appointment times...')}
                </p>
              </div>
              <Progress value={75} className="w-full" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}