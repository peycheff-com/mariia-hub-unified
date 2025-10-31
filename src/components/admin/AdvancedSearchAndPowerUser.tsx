import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Filter,
  Save,
  Download,
  Upload,
  RefreshCw,
  Keyboard,
  Command,
  Zap,
  Star,
  Bookmark,
  BookmarkOff,
  Clock,
  TrendingUp,
  BarChart3,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Minus,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Copy,
  Share,
  Trash2,
  Edit,
  Calendar,
  User,
  FileText,
  CreditCard,
  MapPin,
  Tag,
  Hash,
  AtSign,
  Link2,
  Globe,
  Mail,
  Phone,
  MessageSquare,
  Camera,
  Video,
  Mic,
  ScreenShare,
  DownloadCloud,
  UploadCloud,
  Database,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Battery,
  Signal,
  Activity,
  Target,
  Award,
  Flag,
  AlertTriangle,
  Info,
  HelpCircle,
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Tablet,
  Maximize2,
  Minimize2,
  Move,
  RotateCw,
  Pause,
  Play,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Diamond,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  ChevronUp,
  ChevronLeft,
  Home,
  End,
  PageUp,
  PageDown,
  Tab,
  Escape,
  Backspace,
  Delete,
  Insert,
  Enter,
  Space,
  Shift,
  Ctrl,
  Alt,
  Meta,
  Fn,
  CapsLock,
  NumLock,
  ScrollLock,
  PrintScreen,
  SysReq,
  PauseBreak,
  F1,
  F2,
  F3,
  F4,
  F5,
  F6,
  F7,
  F8,
  F9,
  F10,
  F11,
  F12,
  Volume2,
  VolumeX,
  Volume1,
  Volume,
  Mute,
  PlayCircle,
  PauseCircle,
  StopCircle,
  SkipForward,
  SkipBack,
  Repeat,
  Repeat1,
  Shuffle,
  Forward,
  Rewind,
  FastForward,
  Rewind,
  Eject,
  Airplay,
  WifiOff,
  Bluetooth,
  BluetoothOff,
  Usb,
  UsbOff,
  Settings2,
  SettingsOff,
  Power,
  PowerOff,
  Sleep,
  Wake,
  Restart,
  Shutdown,
  LogOut,
  LogIn,
  UserCheck,
  UserX,
  UserPlus,
  UserMinus,
  Users,
  Users2,
  UserCircle,
  UserSquare,
  UserRound,
  UsersRound,
  UsersSquare,
  UsersCheck,
  UsersX,
  UsersMinus,
  UsersPlus,
  UsersCog,
  LockOpen,
  LockClosed,
  Key,
  KeyRound,
  EyeDropper,
  MagnifyingGlass,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  SearchCode,
  SearchCheck,
  SearchX,
  FileSearch,
  FileDown,
  FileUp,
  FileSymlink,
  FileSymlinkFile,
  FileSymlinkDirectory,
  FileInput,
  FileOutput,
  FileScan,
  FileDigitize,
  FileStack,
  FileChart,
  FileSpreadsheet,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileJson,
  FileXml,
  FilePdf,
  FileDoc,
  FileSpreadsheet,
  FilePresentation,
  FileSignature,
  FileQuestion,
  FileX2,
  FileCheck,
  FileWarning,
  FileLock,
  FileUnlock,
  FileClock,
  FileHeart,
  FileSearch,
  FileEdit,
  FileCopy,
  FileMove,
  FileRename,
  FileTrash,
  FileRestore,
  FileBackup,
  FileSync,
  FilePlus,
  FileMinus,
  FileX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AdvancedSearchProps {
  className?: string;
}

interface SearchQuery {
  id: string;
  name: string;
  query: string;
  filters: Record<string, any>;
  timestamp: Date;
  isFavorite: boolean;
  useCount: number;
}

interface KeyboardShortcut {
  id: string;
  category: string;
  action: string;
  keys: string[];
  description: string;
  enabled: boolean;
  customizable: boolean;
}

interface PowerUserSetting {
  id: string;
  category: string;
  name: string;
  description: string;
  type: 'boolean' | 'select' | 'slider' | 'text' | 'color';
  value: any;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export function AdvancedSearchAndPowerUser({ className }: AdvancedSearchProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});
  const [savedSearches, setSavedSearches] = useState<SearchQuery[]>([
    {
      id: "1",
      name: "High Priority Clients",
      query: "priority:high status:unread",
      filters: { priority: "high", status: "unread", dateRange: "7d" },
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isFavorite: true,
      useCount: 45,
    },
    {
      id: "2",
      name: "Recent Bookings",
      query: "type:booking date:today",
      filters: { type: "booking", dateRange: "1d" },
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      isFavorite: false,
      useCount: 23,
    },
    {
      id: "3",
      name: "Payment Issues",
      query: "status:failed payment:true",
      filters: { paymentStatus: "failed", hasPaymentIssue: true },
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      isFavorite: true,
      useCount: 12,
    },
  ]);

  const [keyboardShortcuts] = useState<KeyboardShortcut[]>([
    // Navigation
    { id: "nav-1", category: "Navigation", action: "Go to Dashboard", keys: ["Ctrl", "Home"], description: "Navigate to main dashboard", enabled: true, customizable: false },
    { id: "nav-2", category: "Navigation", action: "Open Search", keys: ["Ctrl", "K"], description: "Focus on search bar", enabled: true, customizable: true },
    { id: "nav-3", category: "Navigation", action: "Toggle Sidebar", keys: ["Ctrl", "B"], description: "Show/hide sidebar", enabled: true, customizable: true },
    { id: "nav-4", category: "Navigation", action: "Switch to Today", keys: ["Ctrl", "T"], description: "Jump to today's overview", enabled: true, customizable: true },
    { id: "nav-5", category: "Navigation", action: "Open Calendar", keys: ["Ctrl", "C"], description: "Open calendar view", enabled: true, customizable: true },

    // Actions
    { id: "action-1", category: "Actions", action: "New Booking", keys: ["Ctrl", "Shift", "B"], description: "Create new booking", enabled: true, customizable: true },
    { id: "action-2", category: "Actions", action: "Add Client", keys: ["Ctrl", "Shift", "C"], description: "Register new client", enabled: true, customizable: true },
    { id: "action-3", category: "Actions", action: "Send Message", keys: ["Ctrl", "Shift", "M"], description: "Open messaging interface", enabled: true, customizable: true },
    { id: "action-4", category: "Actions", action: "Generate Report", keys: ["Ctrl", "Shift", "R"], description: "Create new report", enabled: true, customizable: true },
    { id: "action-5", category: "Actions", action: "Process Payment", keys: ["Ctrl", "Shift", "P"], description: "Open payment interface", enabled: true, customizable: true },

    // Quick Actions
    { id: "quick-1", category: "Quick Actions", action: "Refresh Data", keys: ["F5"], description: "Refresh current view", enabled: true, customizable: false },
    { id: "quick-2", category: "Quick Actions", action: "Save Current", keys: ["Ctrl", "S"], description: "Save current work", enabled: true, customizable: true },
    { id: "quick-3", category: "Quick Actions", action: "Export Data", keys: ["Ctrl", "E"], description: "Export current data", enabled: true, customizable: true },
    { id: "quick-4", category: "Quick Actions", action: "Import Data", keys: ["Ctrl", "I"], description: "Import data", enabled: true, customizable: true },
    { id: "quick-5", category: "Quick Actions", action: "Toggle Dark Mode", keys: ["Ctrl", "D"], description: "Switch theme", enabled: true, customizable: true },

    // Advanced
    { id: "adv-1", category: "Advanced", action: "Open Dev Tools", keys: ["F12"], description: "Toggle developer tools", enabled: true, customizable: false },
    { id: "adv-2", category: "Advanced", action: "Debug Mode", keys: ["Ctrl", "Alt", "D"], description: "Toggle debug mode", enabled: false, customizable: true },
    { id: "adv-3", category: "Advanced", action: "Performance Monitor", keys: ["Ctrl", "Alt", "P"], description: "Open performance monitor", enabled: true, customizable: true },
    { id: "adv-4", category: "Advanced", action: "Command Palette", keys: ["Ctrl", "Shift", "P"], description: "Open command palette", enabled: true, customizable: true },
    { id: "adv-5", category: "Advanced", action: "Quick Switch", keys: ["Ctrl", "P"], description: "Quick switch between views", enabled: true, customizable: true },
  ]);

  const [powerUserSettings, setPowerUserSettings] = useState<PowerUserSetting[]>([
    // Performance
    { id: "perf-1", category: "Performance", name: "Auto-refresh", description: "Automatically refresh data", type: "boolean", value: true },
    { id: "perf-2", category: "Performance", name: "Refresh Interval", description: "Data refresh frequency (seconds)", type: "slider", value: 30, min: 10, max: 300, step: 10 },
    { id: "perf-3", category: "Performance", name: "Cache Strategy", description: "Data caching approach", type: "select", value: "aggressive", options: ["conservative", "balanced", "aggressive"] },
    { id: "perf-4", category: "Performance", name: "Lazy Loading", description: "Load data on demand", type: "boolean", value: true },
    { id: "perf-5", category: "Performance", name: "Pre-fetch Data", description: "Load data in background", type: "boolean", value: false },

    // Interface
    { id: "ui-1", category: "Interface", name: "Compact Mode", description: "Use compact layout", type: "boolean", value: false },
    { id: "ui-2", category: "Interface", name: "Animation Speed", description: "Animation duration multiplier", type: "slider", value: 1.0, min: 0.5, max: 2.0, step: 0.1 },
    { id: "ui-3", category: "Interface", name: "Sidebar Width", description: "Sidebar width in pixels", type: "slider", value: 280, min: 200, max: 400, step: 10 },
    { id: "ui-4", category: "Interface", name: "Grid Density", description: "Grid item spacing", type: "select", value: "comfortable", options: ["compact", "comfortable", "spacious"] },
    { id: "ui-5", category: "Interface", name: "Show Tooltips", description: "Display helpful tooltips", type: "boolean", value: true },

    // Advanced Features
    { id: "adv-1", category: "Advanced", name: "Developer Mode", description: "Enable developer features", type: "boolean", value: false },
    { id: "adv-2", category: "Advanced", name: "Beta Features", description: "Enable experimental features", type: "boolean", value: true },
    { id: "adv-3", category: "Advanced", name: "Debug Logging", description: "Log debug information", type: "boolean", value: false },
    { id: "adv-4", category: "Advanced", name: "Performance Monitoring", description: "Track performance metrics", type: "boolean", value: true },
    { id: "adv-5", category: "Advanced", name: "Keyboard Shortcuts", description: "Enable keyboard shortcuts", type: "boolean", value: true },

    // Automation
    { id: "auto-1", category: "Automation", name: "Auto-save", description: "Automatically save changes", type: "boolean", value: true },
    { id: "auto-2", category: "Automation", name: "Auto-resolve", description: "Auto-resolve common issues", type: "boolean", value: false },
    { id: "auto-3", category: "Automation", name: "Smart Suggestions", description: "Show AI-powered suggestions", type: "boolean", value: true },
    { id: "auto-4", category: "Automation", name: "Batch Operations", description: "Enable batch processing", type: "boolean", value: true },
    { id: "auto-5", category: "Automation", name: "Workflow Automation", description: "Automate repetitive tasks", type: "boolean", value: false },
  ]);

  const [searchHistory, setSearchHistory] = useState<string[]>([
    "Anna Kowalska",
    "booking status:confirmed",
    "payments failed",
    "today appointments",
    "high priority clients",
  ]);

  const [isRecordingShortcut, setIsRecordingShortcut] = useState<string | null>(null);
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);

  const filterOptions = [
    { id: "date-range", label: "Date Range", type: "select", options: ["Today", "Yesterday", "This Week", "This Month", "Last 7 Days", "Last 30 Days"] },
    { id: "status", label: "Status", type: "multi-select", options: ["Active", "Pending", "Completed", "Cancelled", "Failed"] },
    { id: "priority", label: "Priority", type: "select", options: ["High", "Medium", "Low"] },
    { id: "client-type", label: "Client Type", type: "select", options: ["New", "Returning", "VIP", "Corporate"] },
    { id: "service-category", label: "Service Category", type: "multi-select", options: ["Beauty", "Fitness", "Lifestyle", "Wellness"] },
    { id: "payment-status", label: "Payment Status", type: "select", options: ["Paid", "Pending", "Failed", "Refunded"] },
    { id: "staff", label: "Staff Member", type: "select", options: ["All Staff", "Maria Nowak", "Katarzyna Kowalska", "Anna Wiśniewska"] },
    { id: "location", label: "Location", type: "select", options: ["All Locations", "Main Salon", "Downtown", "Airport"] },
  ];

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    // Mock search results - in production, this would be real API calls
    return [
      { type: "client", name: "Anna Kowalska", email: "anna.k@email.com", phone: "+48 123 456 789", status: "active" },
      { type: "booking", id: "B12345", client: "Elena Wiśniewska", service: "Lash Extension", date: "2024-01-15", status: "confirmed" },
      { type: "payment", id: "P67890", client: "Maria Nowak", amount: 250, status: "completed", method: "card" },
      { type: "service", name: "Classic Lash Extensions", category: "Beauty", price: 250, duration: "120 min" },
      { type: "staff", name: "Katarzyna Kowalska", role: "Senior Lash Artist", availability: "Available" },
    ].filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery]);

  const handleSaveSearch = useCallback(() => {
    if (!searchQuery.trim()) return;

    const newSearch: SearchQuery = {
      id: Date.now().toString(),
      name: `Search ${savedSearches.length + 1}`,
      query: searchQuery,
      filters: { ...selectedFilters },
      timestamp: new Date(),
      isFavorite: false,
      useCount: 1,
    };

    setSavedSearches(prev => [newSearch, ...prev]);
    toast({
      title: "Search saved",
      description: "Your search query has been saved for future use",
    });
  }, [searchQuery, selectedFilters, savedSearches.length, toast]);

  const handleLoadSavedSearch = useCallback((savedSearch: SearchQuery) => {
    setSearchQuery(savedSearch.query);
    setSelectedFilters(savedSearch.filters);
    setSavedSearches(prev => prev.map(search =>
      search.id === savedSearch.id
        ? { ...search, useCount: search.useCount + 1, timestamp: new Date() }
        : search
    ));
  }, []);

  const handleToggleFavorite = useCallback((searchId: string) => {
    setSavedSearches(prev => prev.map(search =>
      search.id === searchId ? { ...search, isFavorite: !search.isFavorite } : search
    ));
  }, []);

  const handleDeleteSavedSearch = useCallback((searchId: string) => {
    setSavedSearches(prev => prev.filter(search => search.id !== searchId));
    toast({
      title: "Search deleted",
      description: "Saved search has been removed",
    });
  }, [toast]);

  const handleRecordShortcut = useCallback((shortcutId: string) => {
    setIsRecordingShortcut(shortcutId);
    setRecordedKeys([]);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isRecordingShortcut) return;

    const key = e.key;
    if (!recordedKeys.includes(key)) {
      setRecordedKeys(prev => [...prev, key]);
    }

    if (e.ctrlKey && !recordedKeys.includes('Ctrl')) {
      setRecordedKeys(prev => [...prev, 'Ctrl']);
    }
    if (e.altKey && !recordedKeys.includes('Alt')) {
      setRecordedKeys(prev => [...prev, 'Alt']);
    }
    if (e.shiftKey && !recordedKeys.includes('Shift')) {
      setRecordedKeys(prev => [...prev, 'Shift']);
    }
  }, [isRecordingShortcut, recordedKeys]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!isRecordingShortcut) return;

    // Stop recording on Enter or Space
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsRecordingShortcut(null);
      setRecordedKeys([]);
      toast({
        title: "Shortcut recorded",
        description: "Your keyboard shortcut has been updated",
      });
    }
  }, [isRecordingShortcut, toast]);

  const handleSettingChange = useCallback((settingId: string, value: any) => {
    setPowerUserSettings(prev => prev.map(setting =>
      setting.id === settingId ? { ...setting, value } : setting
    ));
  }, []);

  const handleExportSettings = useCallback(() => {
    const settings = powerUserSettings.reduce((acc, setting) => {
      acc[setting.id] = setting.value;
      return acc;
    }, {} as Record<string, any>);

    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = 'admin-settings.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Settings exported",
      description: "Your settings have been exported successfully",
    });
  }, [powerUserSettings, toast]);

  const handleImportSettings = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        setPowerUserSettings(prev => prev.map(setting => ({
          ...setting,
          value: settings[setting.id] !== undefined ? settings[setting.id] : setting.value
        })));

        toast({
          title: "Settings imported",
          description: "Your settings have been imported successfully",
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid settings file format",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  }, [toast]);

  useEffect(() => {
    if (isRecordingShortcut) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, [isRecordingShortcut, handleKeyDown, handleKeyUp]);

  const renderKeyboardKey = (key: string) => {
    return (
      <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded shadow">
        {key}
      </kbd>
    );
  };

  const renderShortcutKeys = (keys: string[]) => {
    return keys.map((key, index) => (
      <React.Fragment key={key}>
        {index > 0 && <span className="mx-1">+</span>}
        {renderKeyboardKey(key)}
      </React.Fragment>
    ));
  };

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Advanced Search
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="flex items-center gap-2">
              <Keyboard className="w-4 h-4" />
              Keyboard Shortcuts
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Power User
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              Saved Searches
            </TabsTrigger>
          </TabsList>

          {/* Advanced Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Search Interface */}
              <div className="lg:col-span-2 space-y-6">
                {/* Search Bar */}
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cocoa-400" />
                        <Input
                          placeholder="Search clients, bookings, payments, services... (use filters for advanced search)"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-24"
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={handleSaveSearch}>
                                <Save className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Save current search</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Filter className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Advanced filters</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {/* Advanced Filters */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-cocoa-900">Advanced Filters</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {filterOptions.map((filter) => (
                            <div key={filter.id} className="space-y-2">
                              <Label className="text-sm font-medium">{filter.label}</Label>
                              {filter.type === 'select' ? (
                                <Select
                                  value={selectedFilters[filter.id] || ''}
                                  onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, [filter.id]: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={`Select ${filter.label}`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {filter.options.map((option) => (
                                      <SelectItem key={option} value={option.toLowerCase().replace(' ', '-')}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : filter.type === 'multi-select' ? (
                                <div className="space-y-2">
                                  {filter.options.map((option) => (
                                    <div key={option} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`${filter.id}-${option}`}
                                        checked={selectedFilters[filter.id]?.includes(option.toLowerCase()) || false}
                                        onCheckedChange={(checked) => {
                                          const currentValues = selectedFilters[filter.id] || [];
                                          if (checked) {
                                            setSelectedFilters(prev => ({
                                              ...prev,
                                              [filter.id]: [...currentValues, option.toLowerCase()]
                                            }));
                                          } else {
                                            setSelectedFilters(prev => ({
                                              ...prev,
                                              [filter.id]: currentValues.filter((v: string) => v !== option.toLowerCase())
                                            }));
                                          }
                                        }}
                                      />
                                      <Label htmlFor={`${filter.id}-${option}`} className="text-sm">
                                        {option}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Search History */}
                      {searchHistory.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-cocoa-900">Recent Searches</h4>
                          <div className="flex flex-wrap gap-2">
                            {searchHistory.map((query, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => setSearchQuery(query)}
                                className="text-xs"
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {query}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Search Results</span>
                        <Badge variant="secondary">{searchResults.length} results</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96">
                        <div className="space-y-3">
                          {searchResults.map((result, index) => (
                            <div key={index} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                  {result.type === 'client' && <User className="w-5 h-5 text-white" />}
                                  {result.type === 'booking' && <Calendar className="w-5 h-5 text-white" />}
                                  {result.type === 'payment' && <CreditCard className="w-5 h-5 text-white" />}
                                  {result.type === 'service' && <Star className="w-5 h-5 text-white" />}
                                  {result.type === 'staff' && <Users className="w-5 h-5 text-white" />}
                                </div>
                                <div>
                                  <h4 className="font-medium text-cocoa-900 capitalize">
                                    {result.type === 'client' ? result.name :
                                     result.type === 'booking' ? `Booking ${result.id}` :
                                     result.type === 'payment' ? `Payment ${result.id}` :
                                     result.type === 'service' ? result.name :
                                     result.type === 'staff' ? result.name : result.type}
                                  </h4>
                                  <p className="text-sm text-cocoa-600">
                                    {result.type === 'client' && `${result.email} • ${result.phone}`}
                                    {result.type === 'booking' && `${result.client} • ${result.service}`}
                                    {result.type === 'payment' && `${result.client} • ${result.amount}zł`}
                                    {result.type === 'service' && `${result.category} • ${result.price}zł`}
                                    {result.type === 'staff' && `${result.role} • ${result.availability}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{result.type}</Badge>
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Saved Searches Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Access</CardTitle>
                    <CardDescription>Save frequently used searches</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button
                        className="w-full"
                        onClick={handleSaveSearch}
                        disabled={!searchQuery.trim()}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Current Search
                      </Button>

                      <div className="space-y-3">
                        {savedSearches
                          .filter(search => search.isFavorite)
                          .map((search) => (
                            <div
                              key={search.id}
                              className="p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => handleLoadSavedSearch(search)}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-medium text-cocoa-900">{search.name}</h4>
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              </div>
                              <p className="text-xs text-cocoa-600 mb-2">{search.query}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-cocoa-400">{search.useCount} uses</span>
                                <span className="text-xs text-cocoa-400">
                                  {new Date(search.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Search Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Search Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-cocoa-900">2,847</div>
                        <div className="text-sm text-cocoa-500">Total Searches</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">89%</div>
                        <div className="text-sm text-cocoa-500">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">2.3s</div>
                        <div className="text-sm text-cocoa-500">Avg Response Time</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Keyboard Shortcuts Tab */}
          <TabsContent value="shortcuts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Keyboard className="w-5 h-5" />
                      Keyboard Shortcuts
                    </CardTitle>
                    <CardDescription>Customize your keyboard shortcuts for faster navigation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-6">
                        {["Navigation", "Actions", "Quick Actions", "Advanced"].map((category) => (
                          <div key={category}>
                            <h4 className="text-sm font-medium text-cocoa-900 mb-3">{category}</h4>
                            <div className="space-y-3">
                              {keyboardShortcuts
                                .filter(shortcut => shortcut.category === category)
                                .map((shortcut) => (
                                  <div key={shortcut.id} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div className="flex-1">
                                      <h5 className="text-sm font-medium text-cocoa-900">{shortcut.action}</h5>
                                      <p className="text-xs text-cocoa-500">{shortcut.description}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {shortcut.customizable ? (
                                        isRecordingShortcut === shortcut.id ? (
                                          <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                              {renderShortcutKeys(recordedKeys)}
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => setIsRecordingShortcut(null)}
                                            >
                                              <X className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRecordShortcut(shortcut.id)}
                                          >
                                            {renderShortcutKeys(shortcut.keys)}
                                          </Button>
                                        )
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          {renderShortcutKeys(shortcut.keys)}
                                        </div>
                                      )}
                                      <Switch
                                        checked={shortcut.enabled}
                                        onCheckedChange={(checked) => {
                                          // Update shortcut enabled state
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Reference */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Reference</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h5 className="text-sm font-medium text-blue-900 mb-1">Global Search</h5>
                        <div className="flex items-center gap-1">
                          {renderKeyboardKey('Ctrl')}
                          <span className="mx-1">+</span>
                          {renderKeyboardKey('K')}
                        </div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <h5 className="text-sm font-medium text-green-900 mb-1">New Booking</h5>
                        <div className="flex items-center gap-1">
                          {renderKeyboardKey('Ctrl')}
                          <span className="mx-1">+</span>
                          {renderKeyboardKey('Shift')}
                          <span className="mx-1">+</span>
                          {renderKeyboardKey('B')}
                        </div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <h5 className="text-sm font-medium text-purple-900 mb-1">Command Palette</h5>
                        <div className="flex items-center gap-1">
                          {renderKeyboardKey('Ctrl')}
                          <span className="mx-1">+</span>
                          {renderKeyboardKey('Shift')}
                          <span className="mx-1">+</span>
                          {renderKeyboardKey('P')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Learning Mode</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Show hints</Label>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Highlight shortcuts</Label>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Display tooltips</Label>
                        <Switch defaultChecked />
                      </div>
                      <Button variant="outline" className="w-full mt-4">
                        <HelpCircle className="w-4 h-4 mr-2" />
                        View Tutorial
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Power User Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Advanced Settings
                    </CardTitle>
                    <CardDescription>Customize your admin experience with advanced options</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-8">
                        {["Performance", "Interface", "Advanced", "Automation"].map((category) => (
                          <div key={category}>
                            <h4 className="text-sm font-medium text-cocoa-900 mb-4">{category}</h4>
                            <div className="space-y-4">
                              {powerUserSettings
                                .filter(setting => setting.category === category)
                                .map((setting) => (
                                  <div key={setting.id} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div className="flex-1">
                                      <h5 className="text-sm font-medium text-cocoa-900">{setting.name}</h5>
                                      <p className="text-xs text-cocoa-500">{setting.description}</p>
                                    </div>
                                    <div className="w-48">
                                      {setting.type === 'boolean' && (
                                        <Switch
                                          checked={setting.value}
                                          onCheckedChange={(checked) => handleSettingChange(setting.id, checked)}
                                        />
                                      )}
                                      {setting.type === 'select' && (
                                        <Select
                                          value={setting.value}
                                          onValueChange={(value) => handleSettingChange(setting.id, value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {setting.options?.map((option) => (
                                              <SelectItem key={option} value={option}>
                                                {option}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      )}
                                      {setting.type === 'slider' && (
                                        <div className="space-y-2">
                                          <Slider
                                            value={[setting.value]}
                                            onValueChange={([value]) => handleSettingChange(setting.id, value)}
                                            min={setting.min}
                                            max={setting.max}
                                            step={setting.step}
                                          />
                                          <div className="text-xs text-cocoa-500 text-center">{setting.value}</div>
                                        </div>
                                      )}
                                      {setting.type === 'text' && (
                                        <Input
                                          value={setting.value}
                                          onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                                          className="w-full"
                                        />
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Settings Actions */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Import/Export</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button className="w-full" onClick={handleExportSettings}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Settings
                      </Button>
                      <div className="relative">
                        <Button variant="outline" className="w-full">
                          <Upload className="w-4 h-4 mr-2" />
                          Import Settings
                        </Button>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportSettings}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Reset Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reset to Defaults
                      </Button>
                      <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Saved Searches Tab */}
          <TabsContent value="saved" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>All Saved Searches</CardTitle>
                    <CardDescription>Manage your saved search queries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {savedSearches.map((search) => (
                          <div key={search.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium text-cocoa-900">{search.name}</h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleFavorite(search.id)}
                                >
                                  {search.isFavorite ? (
                                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                  ) : (
                                    <Star className="w-3 h-3 text-gray-400" />
                                  )}
                                </Button>
                              </div>
                              <p className="text-sm text-cocoa-600 mb-2">{search.query}</p>
                              <div className="flex items-center gap-4 text-xs text-cocoa-400">
                                <span>{search.useCount} uses</span>
                                <span>Last used {new Date(search.timestamp).toLocaleDateString()}</span>
                                {Object.keys(search.filters).length > 0 && (
                                  <span>{Object.keys(search.filters).length} filters</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLoadSavedSearch(search)}
                              >
                                <Search className="w-3 h-3 mr-1" />
                                Load
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Share className="w-4 h-4 mr-2" />
                                    Share
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDeleteSavedSearch(search.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Search Management */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Search Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-cocoa-900">{savedSearches.length}</div>
                        <div className="text-sm text-cocoa-500">Total Saved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {savedSearches.filter(s => s.isFavorite).length}
                        </div>
                        <div className="text-sm text-cocoa-500">Favorites</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.round(savedSearches.reduce((acc, s) => acc + s.useCount, 0) / savedSearches.length)}
                        </div>
                        <div className="text-sm text-cocoa-500">Avg Uses</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bulk Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full">
                        <Star className="w-4 h-4 mr-2" />
                        Mark All as Favorite
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Tag className="w-4 h-4 mr-2" />
                        Add Tags
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Share className="w-4 h-4 mr-2" />
                        Export Searches
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

export default AdvancedSearchAndPowerUser;