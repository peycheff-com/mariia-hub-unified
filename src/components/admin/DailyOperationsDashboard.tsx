import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Activity,
  Bell,
  Zap,
  MessageCircle,
  Phone,
  Mail,
  Star,
  BarChart3,
  FileText,
  Settings,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  User,
  MapPin,
  CreditCard,
  ShoppingBag,
  Target,
  Award,
  RefreshCw,
  PlayCircle,
  PauseCircle,
  StopCircle,
  HelpCircle,
  Info,
  X,
  Check,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Copy,
  Share2,
  Link,
  MailIcon,
  UserPlus,
  CalendarPlus,
  CalendarCheck,
  CalendarX,
  Timer,
  TimerOff,
  TimerReset,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Signal,
  SignalLow,
  SignalHigh,
  TrendingDown,
  TrendingUp,
  Minus,
  Maximize2,
  Minimize2,
  RotateCw,
  Save,
  FileDown,
  FileUp,
  Send,
  Reply,
  ReplyAll,
  Forward,
  Archive,
  Inbox,
  Flag,
  FlagOff,
  Bookmark,
  BookmarkOff,
  Heart,
  HeartOff,
  ThumbsUp,
  ThumbsDown,
  Share,
  MessageSquare,
  Video,
  VideoOff,
  Mic,
  MicOff,
  ScreenShare,
  ScreenShareOff,
  Camera,
  CameraOff,
  Lock,
  Unlock,
  Shield,
  ShieldOff,
  Key,
  KeyOff,
  UserCheck,
  UserX,
  UserMinus,
  UserPlus,
  Users2,
  UsersX,
  UserCog,
  UsersRound,
  UsersSquare,
  UserCircle,
  UserSquare,
  UserMinus2,
  UserPlus2,
  UsersCheck,
  UsersX2,
  UsersMinus,
  UsersPlus,
  UsersCog,
  UsersRound2,
  UsersSquare2,
  Users2Minus,
  Users2Plus,
  Users2Check,
  Users2X,
  Users2Cog,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DailyOperationsDashboardProps {
  className?: string;
}

export function DailyOperationsDashboard({ className }: DailyOperationsDashboardProps) {
  const { toast } = useToast();
  const [selectedTimeRange, setSelectedTimeRange] = useState("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in production, this would come from real-time API
  const [dashboardData, setDashboardData] = useState({
    kpi: {
      revenue: { value: 8450, change: 12.5, trend: 'up', target: 10000 },
      appointments: { value: 24, change: 8.2, trend: 'up', target: 30 },
      clients: { value: 892, change: -2.1, trend: 'down', target: 1000 },
      satisfaction: { value: 4.8, change: 0.3, trend: 'up', target: 5.0 },
      efficiency: { value: 87, change: 5.2, trend: 'up', target: 95 },
      occupancy: { value: 73, change: 3.1, trend: 'up', target: 85 },
    },
    today: {
      appointments: 24,
      completed: 18,
      pending: 6,
      cancelled: 0,
      noShows: 0,
      revenue: 8450,
      walkIns: 2,
      newClients: 3,
      returningClients: 21,
    },
    alerts: [
      {
        id: 1,
        type: 'urgent',
        title: 'High waitlist volume',
        message: '12 clients waiting for lash extensions',
        count: 12,
        time: '5 min ago',
        action: 'View waitlist',
        priority: 'high'
      },
      {
        id: 2,
        type: 'success',
        title: 'New 5-star review',
        message: 'Anna Kowalska left a glowing review',
        count: 1,
        time: '15 min ago',
        action: 'View review',
        priority: 'medium'
      },
      {
        id: 3,
        type: 'warning',
        title: 'Payment processing delay',
        message: '3 payments pending verification',
        count: 3,
        time: '30 min ago',
        action: 'Review payments',
        priority: 'medium'
      },
      {
        id: 4,
        type: 'info',
        title: 'Staff availability',
        message: '2 team members available for walk-ins',
        count: 2,
        time: '1 hour ago',
        action: 'View schedule',
        priority: 'low'
      },
    ],
    appointments: [
      {
        id: 1,
        client: "Anna Kowalska",
        service: "Lash Extension Classic",
        time: "09:00",
        duration: "120 min",
        status: "completed",
        staff: "Maria Nowak",
        revenue: 250,
        notes: "Client requested extra volume",
        image: "/api/placeholder/32/32"
      },
      {
        id: 2,
        client: "Elena Wiśniewska",
        service: "Brow Lamination",
        time: "10:30",
        duration: "60 min",
        status: "in-progress",
        staff: "Katarzyna Kowalska",
        revenue: 180,
        notes: "First time client",
        image: "/api/placeholder/32/32"
      },
      {
        id: 3,
        client: "Maria Nowak",
        service: "Lash Extension Volume",
        time: "12:00",
        duration: "150 min",
        status: "pending",
        staff: "Anna Wiśniewska",
        revenue: 350,
        notes: "Regular client - 6 month retention",
        image: "/api/placeholder/32/32"
      },
      {
        id: 4,
        client: "Katarzyna Dąbrowska",
        service: "Hybrid Lashes",
        time: "14:00",
        duration: "120 min",
        status: "pending",
        staff: "Maria Nowak",
        revenue: 300,
        notes: "Special occasion - wedding prep",
        image: "/api/placeholder/32/32"
      },
    ],
    tasks: [
      {
        id: 1,
        title: "Confirm tomorrow's appointments",
        status: "pending",
        priority: "high",
        due: "2:00 PM",
        assignee: "Staff",
        category: "operations"
      },
      {
        id: 2,
        title: "Update service pricing",
        status: "in-progress",
        priority: "medium",
        due: "5:00 PM",
        assignee: "Admin",
        category: "pricing"
      },
      {
        id: 3,
        title: "Review staff performance",
        status: "completed",
        priority: "low",
        due: "6:00 PM",
        assignee: "Manager",
        category: "hr"
      },
      {
        id: 4,
        title: "Order supplies",
        status: "pending",
        priority: "high",
        due: "3:00 PM",
        assignee: "Admin",
        category: "inventory"
      },
    ],
    communication: [
      {
        id: 1,
        client: "Joanna Nowak",
        channel: "whatsapp",
        message: "Hi! I need to reschedule my appointment tomorrow",
        time: "2 min ago",
        status: "unread",
        priority: "high"
      },
      {
        id: 2,
        client: "Anna Kowalska",
        channel: "email",
        message: "Thank you for the great service today!",
        time: "15 min ago",
        status: "read",
        priority: "low"
      },
      {
        id: 3,
        client: "Elena Wiśniewska",
        channel: "instagram",
        message: "Do you have any availability for this weekend?",
        time: "1 hour ago",
        status: "unread",
        priority: "medium"
      },
    ],
    staff: [
      {
        id: 1,
        name: "Maria Nowak",
        role: "Senior Lash Artist",
        status: "available",
        currentAppointment: null,
        nextAppointment: "14:00",
        efficiency: 95,
        rating: 4.9,
        image: "/api/placeholder/32/32"
      },
      {
        id: 2,
        name: "Katarzyna Kowalska",
        role: "Brow Specialist",
        status: "busy",
        currentAppointment: "Elena Wiśniewska",
        nextAppointment: "15:30",
        efficiency: 88,
        rating: 4.8,
        image: "/api/placeholder/32/32"
      },
      {
        id: 3,
        name: "Anna Wiśniewska",
        role: "Junior Lash Artist",
        status: "available",
        currentAppointment: null,
        nextAppointment: "16:00",
        efficiency: 82,
        rating: 4.7,
        image: "/api/placeholder/32/32"
      },
    ],
  });

  const quickActions = [
    {
      id: 1,
      title: "New Booking",
      description: "Create appointment",
      icon: CalendarPlus,
      color: "from-blue-500 to-cyan-500",
      action: () => {
        toast({
          title: "Opening booking form...",
          description: "New appointment booking interface",
        });
      },
      shortcut: "Ctrl+B"
    },
    {
      id: 2,
      title: "Add Client",
      description: "Register new client",
      icon: UserPlus,
      color: "from-purple-500 to-pink-500",
      action: () => {
        toast({
          title: "Opening client form...",
          description: "New client registration",
        });
      },
      shortcut: "Ctrl+C"
    },
    {
      id: 3,
      title: "Process Payment",
      description: "Handle payment",
      icon: CreditCard,
      color: "from-emerald-500 to-teal-500",
      action: () => {
        toast({
          title: "Opening payment interface...",
          description: "Payment processing",
        });
      },
      shortcut: "Ctrl+P"
    },
    {
      id: 4,
      title: "Send Message",
      description: "Contact client",
      icon: MessageCircle,
      color: "from-amber-500 to-orange-500",
      action: () => {
        toast({
          title: "Opening messaging...",
          description: "Client communication",
        });
      },
      shortcut: "Ctrl+M"
    },
    {
      id: 5,
      title: "View Schedule",
      description: "Check calendar",
      icon: Calendar,
      color: "from-rose-500 to-pink-500",
      action: () => {
        toast({
          title: "Opening schedule...",
          description: "Daily calendar view",
        });
      },
      shortcut: "Ctrl+S"
    },
    {
      id: 6,
      title: "Generate Report",
      description: "Daily analytics",
      icon: BarChart3,
      color: "from-indigo-500 to-purple-500",
      action: () => {
        toast({
          title: "Generating report...",
          description: "Daily performance report",
        });
      },
      shortcut: "Ctrl+R"
    },
  ];

  const getKPIIcon = (key: string) => {
    const icons = {
      revenue: DollarSign,
      appointments: Calendar,
      clients: Users,
      satisfaction: Star,
      efficiency: TrendingUp,
      occupancy: Target,
    };
    return icons[key as keyof typeof icons] || Activity;
  };

  const getKPIColor = (key: string) => {
    const colors = {
      revenue: "from-emerald-400 to-teal-600",
      appointments: "from-blue-400 to-indigo-600",
      clients: "from-purple-400 to-pink-600",
      satisfaction: "from-amber-400 to-orange-600",
      efficiency: "from-green-400 to-emerald-600",
      occupancy: "from-indigo-400 to-purple-600",
    };
    return colors[key as keyof typeof colors] || "from-gray-400 to-gray-600";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
      "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      available: "bg-green-100 text-green-800 border-green-200",
      busy: "bg-orange-100 text-orange-800 border-orange-200",
      unread: "bg-red-100 text-red-800 border-red-200",
      read: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "from-red-500 to-pink-500",
      medium: "from-amber-500 to-orange-500",
      low: "from-emerald-500 to-teal-500",
    };
    return colors[priority as keyof typeof colors] || "from-gray-500 to-gray-600";
  };

  const getChannelIcon = (channel: string) => {
    const icons = {
      whatsapp: Phone,
      email: Mail,
      instagram: Camera,
      facebook: MessageSquare,
    };
    return icons[channel as keyof typeof icons] || MessageCircle;
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    toast({
      title: "Data refreshed",
      description: "Dashboard updated with latest information",
    });
  };

  const handleAlertAction = (alert: any) => {
    toast({
      title: "Processing action...",
      description: `Opening ${alert.action}`,
    });
  };

  const handleTaskComplete = (taskId: number) => {
    setDashboardData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId
          ? { ...task, status: "completed" as const }
          : task
      )
    }));
    toast({
      title: "Task completed",
      description: "Great job! Task marked as complete",
    });
  };

  const filteredAppointments = useMemo(() => {
    return dashboardData.appointments.filter(apt =>
      activeFilter === "all" || apt.status === activeFilter
    );
  }, [dashboardData.appointments, activeFilter]);

  const progressPercentage = useMemo(() => {
    const total = dashboardData.today.appointments;
    const completed = dashboardData.today.completed;
    return total > 0 ? (completed / total) * 100 : 0;
  }, [dashboardData.today]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Refresh and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-cocoa-900">Daily Operations</h2>
            <p className="text-sm text-cocoa-500">Today's overview and quick actions</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cocoa-400" />
            <Input
              placeholder="Search appointments, clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="hover:bg-champagne-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Object.entries(dashboardData.kpi).map(([key, kpi]) => {
          const Icon = getKPIIcon(key);
          const percentage = (kpi.value / kpi.target) * 100;

          return (
            <Card key={key} className="relative group overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="p-4 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${getKPIColor(key)} rounded-lg flex items-center justify-center shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                    kpi.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {kpi.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {Math.abs(kpi.change)}%
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-2xl font-bold text-cocoa-900">
                    {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                  </div>
                  <div className="text-xs text-cocoa-500 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-cocoa-400">Target</span>
                      <span className="text-xs text-cocoa-600">{percentage.toFixed(0)}%</span>
                    </div>
                    <Progress
                      value={percentage}
                      className="h-1.5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Overview */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-900">Daily Progress</h3>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900">{dashboardData.today.appointments}</div>
                  <div className="text-xs text-blue-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{dashboardData.today.completed}</div>
                  <div className="text-xs text-emerald-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{dashboardData.today.pending}</div>
                  <div className="text-xs text-amber-600">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{dashboardData.today.revenue.toLocaleString()}zł</div>
                  <div className="text-xs text-blue-600">Revenue</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-blue-700">Daily Completion</span>
                  <span className="text-sm font-medium text-blue-900">{progressPercentage.toFixed(0)}%</span>
                </div>
                <Progress
                  value={progressPercentage}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Appointments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Today's Appointments</CardTitle>
                  <CardDescription>Manage daily schedule</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={activeFilter === "all" ? "bg-blue-50 border-blue-200" : ""}
                    onClick={() => setActiveFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={activeFilter === "pending" ? "bg-amber-50 border-amber-200" : ""}
                    onClick={() => setActiveFilter("pending")}
                  >
                    Pending
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={activeFilter === "completed" ? "bg-emerald-50 border-emerald-200" : ""}
                    onClick={() => setActiveFilter("completed")}
                  >
                    Completed
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {filteredAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={appointment.image} />
                        <AvatarFallback>
                          {appointment.client.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-cocoa-900 truncate">{appointment.client}</h4>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-cocoa-600 truncate">{appointment.service}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-cocoa-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {appointment.time} ({appointment.duration})
                          </span>
                          <span className="text-xs text-cocoa-500 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {appointment.staff}
                          </span>
                          <span className="text-xs text-cocoa-500 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {appointment.revenue}zł
                          </span>
                        </div>
                        {appointment.notes && (
                          <p className="text-xs text-cocoa-400 mt-1 italic">"{appointment.notes}"</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Quick Actions
              </CardTitle>
              <CardDescription>Frequently used operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    className="flex flex-col h-auto p-3 hover:bg-gradient-to-r hover:from-white hover:to-gray-50 group"
                    onClick={action.action}
                  >
                    <div className={`w-8 h-8 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-medium text-cocoa-700">{action.title}</span>
                    <span className="text-xs text-cocoa-400">{action.shortcut}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-red-500" />
                Alerts
              </CardTitle>
              <CardDescription>Important notification aria-live="polite" aria-atomic="true"s</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {dashboardData.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleAlertAction(alert)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 bg-gradient-to-r ${getPriorityColor(alert.priority)}`} />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-cocoa-900">{alert.title}</h4>
                          <p className="text-xs text-cocoa-600 mt-1">{alert.message}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-cocoa-400">{alert.time}</span>
                            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800">
                              {alert.action} →
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Tasks
              </CardTitle>
              <CardDescription>Today's priorities</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {dashboardData.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        task.status === "completed" ? "bg-gray-50 opacity-60" : "bg-white hover:bg-gray-50"
                      )}
                      onClick={() => task.status !== "completed" && handleTaskComplete(task.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={cn(
                          "text-sm font-medium",
                          task.status === "completed" ? "line-through text-gray-500" : "text-cocoa-900"
                        )}>
                          {task.title}
                        </h4>
                        <Badge className={getStatusColor(task.priority)} variant="outline">
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-cocoa-500">{task.assignee} • {task.due}</span>
                        {task.status === "completed" && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Staff Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Staff Status
              </CardTitle>
              <CardDescription>Team availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.staff.map((staff) => (
                  <div key={staff.id} className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={staff.image} />
                      <AvatarFallback>
                        {staff.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-cocoa-900 truncate">{staff.name}</h4>
                        <Badge className={getStatusColor(staff.status)} variant="outline">
                          {staff.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-cocoa-600 truncate">{staff.role}</p>
                      {staff.currentAppointment && (
                        <p className="text-xs text-cocoa-500">With: {staff.currentAppointment}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Communication Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-500" />
            Recent Communication
          </CardTitle>
          <CardDescription>Latest messages from clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboardData.communication.map((comm) => {
              const ChannelIcon = getChannelIcon(comm.channel);
              return (
                <div key={comm.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <ChannelIcon className="w-4 h-4 text-cocoa-400" />
                    <Badge className={getStatusColor(comm.status)} variant="outline">
                      {comm.status}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-cocoa-900">{comm.client}</h4>
                      <span className="text-xs text-cocoa-400">{comm.time}</span>
                    </div>
                    <p className="text-sm text-cocoa-600 truncate">{comm.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Reply className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DailyOperationsDashboard;