import React, { useState, useEffect, useMemo } from "react";
import {
  MessageCircle,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Send,
  Reply,
  ReplyAll,
  Forward,
  Archive,
  Trash2,
  Star,
  Flag,
  Search,
  Filter,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Video,
  PhoneCall,
  User,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  Info,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit,
  Copy,
  ExternalLink,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Users,
  UserPlus,
  UserMinus,
  Settings,
  RefreshCw,
  Download,
  Upload,
  FileText,
  Image,
  Calendar,
  MapPin,
  CreditCard,
  Tag,
  Hash,
  AtSign,
  Link2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,
  Zap,
  Target,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart,
  FileDown,
  FileUp,
  Share,
  Share2,
  Heart,
  HeartOff,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  BookmarkOff,
  MessageSquare,
  VideoOff,
  MicOff,
  ScreenShare,
  Camera,
  CameraOff,
  UserCheck,
  UserX,
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  clientEmail?: string;
  clientPhone?: string;
  channel: 'whatsapp' | 'email' | 'instagram' | 'facebook' | 'sms' | 'website';
  subject?: string;
  message: string;
  timestamp: Date;
  status: 'unread' | 'read' | 'replied' | 'archived';
  priority: 'high' | 'medium' | 'low';
  assignedTo?: string;
  tags: string[];
  attachments?: Array<{
    id: string;
    name: string;
    type: 'image' | 'document' | 'video';
    url: string;
    size: number;
  }>;
  thread?: Array<{
    id: string;
    message: string;
    sender: 'client' | 'staff';
    timestamp: Date;
    attachments?: Array<{
      id: string;
      name: string;
      type: 'image' | 'document' | 'video';
      url: string;
      size: number;
    }>;
  }>;
  relatedBookingId?: string;
  relatedServiceId?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  aiSuggestedResponse?: string;
  urgency?: number;
  lastActivity?: Date;
}

interface CommunicationHubProps {
  className?: string;
}

export function CustomerCommunicationHub({ className }: CommunicationHubProps) {
  const { toast } = useToast();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

  // Mock data - in production, this would come from real-time API
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      clientId: "client-1",
      clientName: "Anna Kowalska",
      clientAvatar: "/api/placeholder/32/32",
      clientEmail: "anna.kowalska@email.com",
      clientPhone: "+48 123 456 789",
      channel: "whatsapp",
      subject: "Appointment tomorrow",
      message: "Hi! I need to reschedule my appointment tomorrow at 2 PM. Is it possible to move it to 4 PM instead?",
      timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      status: "unread",
      priority: "high",
      assignedTo: "Maria Nowak",
      tags: ["reschedule", "urgent"],
      relatedBookingId: "booking-123",
      sentiment: "neutral",
      urgency: 8,
      lastActivity: new Date(Date.now() - 2 * 60 * 1000),
      aiSuggestedResponse: "Hi Anna! I'd be happy to help you reschedule. Let me check availability for 4 PM tomorrow and get back to you right away.",
      thread: [
        {
          id: "thread-1-1",
          message: "Hi! I need to reschedule my appointment tomorrow at 2 PM. Is it possible to move it to 4 PM instead?",
          sender: "client",
          timestamp: new Date(Date.now() - 2 * 60 * 1000),
        }
      ]
    },
    {
      id: "2",
      clientId: "client-2",
      clientName: "Elena Wiśniewska",
      clientAvatar: "/api/placeholder/32/32",
      clientEmail: "elena.w@email.com",
      channel: "email",
      subject: "Thank you for the great service!",
      message: "I just wanted to say thank you for the amazing lash extension service today. I absolutely love how they look! The staff was very professional and the atmosphere was wonderful. Will definitely be back!",
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      status: "read",
      priority: "low",
      tags: ["feedback", "positive"],
      sentiment: "positive",
      urgency: 2,
      lastActivity: new Date(Date.now() - 15 * 60 * 1000),
      thread: [
        {
          id: "thread-2-1",
          message: "I just wanted to say thank you for the amazing lash extension service today. I absolutely love how they look! The staff was very professional and the atmosphere was wonderful. Will definitely be back!",
          sender: "client",
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
        }
      ]
    },
    {
      id: "3",
      clientId: "client-3",
      clientName: "Maria Nowak",
      clientAvatar: "/api/placeholder/32/32",
      channel: "instagram",
      message: "Do you have any availability for this weekend? I'd like to book a brow lamination.",
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      status: "unread",
      priority: "medium",
      tags: ["new-booking", "availability"],
      sentiment: "neutral",
      urgency: 5,
      lastActivity: new Date(Date.now() - 60 * 60 * 1000),
      aiSuggestedResponse: "Hi Maria! Thanks for your interest in brow lamination. We have several slots available this weekend. Would you prefer Saturday or Sunday?",
      thread: [
        {
          id: "thread-3-1",
          message: "Do you have any availability for this weekend? I'd like to book a brow lamination.",
          sender: "client",
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
        }
      ]
    },
    {
      id: "4",
      clientId: "client-4",
      clientName: "Katarzyna Dąbrowska",
      clientAvatar: "/api/placeholder/32/32",
      clientEmail: "k.dabrowska@email.com",
      channel: "facebook",
      subject: "Question about aftercare",
      message: "Hi, I had my lash extensions done yesterday and I have a question about aftercare. Can I swim or go to the sauna? Also, when should I come for a refill?",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: "replied",
      priority: "medium",
      assignedTo: "Staff",
      tags: ["aftercare", "refill"],
      relatedServiceId: "service-456",
      sentiment: "neutral",
      urgency: 4,
      lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000),
      thread: [
        {
          id: "thread-4-1",
          message: "Hi, I had my lash extensions done yesterday and I have a question about aftercare. Can I swim or go to the sauna? Also, when should I come for a refill?",
          sender: "client",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          id: "thread-4-2",
          message: "Hi Katarzyna! Great questions. For aftercare, it's best to avoid water, swimming, and sauna for the first 24-48 hours. After that, you can swim but try to rinse your lashes with fresh water afterward. For refills, we recommend coming every 2-3 weeks to maintain the full look. Hope this helps!",
          sender: "staff",
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        }
      ]
    },
  ]);

  const channelConfig = {
    whatsapp: { icon: Phone, color: "from-green-500 to-emerald-600", label: "WhatsApp" },
    email: { icon: Mail, color: "from-blue-500 to-indigo-600", label: "Email" },
    instagram: { icon: Camera, color: "from-pink-500 to-purple-600", label: "Instagram" },
    facebook: { icon: Facebook, color: "from-blue-600 to-indigo-700", label: "Facebook" },
    sms: { icon: MessageSquare, color: "from-amber-500 to-orange-600", label: "SMS" },
    website: { icon: Globe, color: "from-purple-500 to-pink-600", label: "Website" },
  };

  const statusConfig = {
    unread: { color: "bg-red-100 text-red-800 border-red-200", label: "Unread" },
    read: { color: "bg-gray-100 text-gray-800 border-gray-200", label: "Read" },
    replied: { color: "bg-green-100 text-green-800 border-green-200", label: "Replied" },
    archived: { color: "bg-slate-100 text-slate-800 border-slate-200", label: "Archived" },
  };

  const priorityConfig = {
    high: { color: "from-red-500 to-pink-500", label: "High" },
    medium: { color: "from-amber-500 to-orange-500", label: "Medium" },
    low: { color: "from-emerald-500 to-teal-500", label: "Low" },
  };

  const sentimentConfig = {
    positive: { icon: ThumbsUp, color: "text-green-600", label: "Positive" },
    neutral: { icon: Minus, color: "text-yellow-600", label: "Neutral" },
    negative: { icon: ThumbsDown, color: "text-red-600", label: "Negative" },
  };

  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      const matchesSearch = searchQuery === "" ||
        message.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesChannel = selectedChannel === "all" || message.channel === selectedChannel;
      const matchesStatus = selectedStatus === "all" || message.status === selectedStatus;
      const matchesPriority = selectedPriority === "all" || message.priority === selectedPriority;

      return matchesSearch && matchesChannel && matchesStatus && matchesPriority;
    });
  }, [messages, searchQuery, selectedChannel, selectedStatus, selectedPriority]);

  const statistics = useMemo(() => {
    const total = messages.length;
    const unread = messages.filter(m => m.status === "unread").length;
    const highPriority = messages.filter(m => m.priority === "high").length;
    const avgResponseTime = 2.5; // hours - calculated from real data

    return {
      total,
      unread,
      highPriority,
      avgResponseTime,
      responseRate: 87, // percentage
      satisfactionRate: 94, // percentage
    };
  }, [messages]);

  const handleSendMessage = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update messages
    setMessages(prev => prev.map(msg => {
      if (msg.id === selectedMessage.id) {
        const updatedMessage = {
          ...msg,
          status: "replied" as const,
          lastActivity: new Date(),
          thread: [
            ...(msg.thread || []),
            {
              id: `thread-${msg.id}-${Date.now()}`,
              message: replyText,
              sender: "staff" as const,
              timestamp: new Date(),
            }
          ]
        };
        setSelectedMessage(updatedMessage);
        return updatedMessage;
      }
      return msg;
    }));

    setReplyText("");
    setIsLoading(false);

    toast({
      title: "Message sent",
      description: "Your reply has been sent successfully",
    });
  };

  const handleMarkAsRead = (messageId: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, status: "read" } : msg
    ));
  };

  const handleArchive = (messageId: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, status: "archived" } : msg
    ));
    if (selectedMessage?.id === messageId) {
      setSelectedMessage(null);
    }
  };

  const handleAssignTo = (messageId: string, assignee: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, assignedTo: assignee } : msg
    ));
  };

  const handleUseAiSuggestion = () => {
    if (selectedMessage?.aiSuggestedResponse) {
      setReplyText(selectedMessage.aiSuggestedResponse);
      setShowAiSuggestions(false);
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className={cn("flex h-full gap-6", className)}>
      {/* Messages List */}
      <div className="w-full lg:w-2/5 space-y-4">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              <span className="text-2xl font-bold text-cocoa-900">{statistics.total}</span>
            </div>
            <p className="text-xs text-cocoa-500">Total</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-2xl font-bold text-cocoa-900">{statistics.unread}</span>
            </div>
            <p className="text-xs text-cocoa-500">Unread</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-2xl font-bold text-cocoa-900">{statistics.highPriority}</span>
            </div>
            <p className="text-xs text-cocoa-500">High Priority</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-2xl font-bold text-cocoa-900">{statistics.responseRate}%</span>
            </div>
            <p className="text-xs text-cocoa-500">Response Rate</p>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cocoa-400" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Channel Filter */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedChannel === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedChannel("all")}
                >
                  All Channels
                </Button>
                {Object.entries(channelConfig).map(([key, config]) => (
                  <Button
                    key={key}
                    variant={selectedChannel === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedChannel(key)}
                    className="flex items-center gap-2"
                  >
                    <config.icon className="w-3 h-3" />
                    {config.label}
                  </Button>
                ))}
              </div>

              {/* Status and Priority Filters */}
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 text-sm border border-cocoa-200 rounded-lg bg-white"
                >
                  <option value="all">All Status</option>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-3 py-2 text-sm border border-cocoa-200 rounded-lg bg-white"
                >
                  <option value="all">All Priority</option>
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages List */}
        <Card className="flex-1 overflow-hidden">
          <ScrollArea className="h-[600px]">
            <div className="p-4 space-y-3">
              {filteredMessages.map((message) => {
                const ChannelIcon = channelConfig[message.channel].icon;
                const isSelected = selectedMessage?.id === message.id;

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                      isSelected
                        ? "bg-gradient-to-r from-champagne-50 to-cocoa-50 border-champagne-300"
                        : "bg-white hover:bg-gray-50 border-gray-200"
                    )}
                    onClick={() => {
                      setSelectedMessage(message);
                      if (message.status === "unread") {
                        handleMarkAsRead(message.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={message.clientAvatar} />
                        <AvatarFallback>
                          {message.clientName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-cocoa-900 truncate">{message.clientName}</h4>
                          <span className="text-xs text-cocoa-400">{formatTimestamp(message.timestamp)}</span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <ChannelIcon className="w-3 h-3 text-cocoa-400" />
                          <span className="text-xs text-cocoa-500">{channelConfig[message.channel].label}</span>
                          <Badge className={statusConfig[message.status].color} variant="outline">
                            {statusConfig[message.status].label}
                          </Badge>
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${priorityConfig[message.priority].color}`} />
                        </div>

                        {message.subject && (
                          <h5 className="text-sm font-medium text-cocoa-800 mb-1">{message.subject}</h5>
                        )}

                        <p className="text-sm text-cocoa-600 line-clamp-2">{message.message}</p>

                        {message.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {message.assignedTo && (
                          <div className="flex items-center gap-1 mt-2">
                            <User className="w-3 h-3 text-cocoa-400" />
                            <span className="text-xs text-cocoa-500">Assigned to {message.assignedTo}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        {message.sentiment && (
                          <div className="flex items-center gap-1">
                            {React.createElement(sentimentConfig[message.sentiment].icon, {
                              className: `w-3 h-3 ${sentimentConfig[message.sentiment].color}`
                            })}
                          </div>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleArchive(message.id)}>
                              <Archive className="w-4 h-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAssignTo(message.id, "Maria Nowak")}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Assign to Maria
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAssignTo(message.id, "Staff")}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Assign to Staff
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Message Detail */}
      <div className="flex-1 space-y-4">
        {selectedMessage ? (
          <>
            {/* Client Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedMessage.clientAvatar} />
                    <AvatarFallback className="text-lg">
                      {selectedMessage.clientName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-cocoa-900">{selectedMessage.clientName}</h3>
                    <div className="space-y-1 text-sm text-cocoa-600">
                      {selectedMessage.clientEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          {selectedMessage.clientEmail}
                        </div>
                      )}
                      {selectedMessage.clientPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {selectedMessage.clientPhone}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusConfig[selectedMessage.status].color} variant="outline">
                      {statusConfig[selectedMessage.status].label}
                    </Badge>
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${priorityConfig[selectedMessage.priority].color}`} />
                  </div>
                </div>

                {selectedMessage.relatedBookingId && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">Related to booking #{selectedMessage.relatedBookingId}</span>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Message Thread */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Conversation
                </CardTitle>
                {selectedMessage.subject && (
                  <CardDescription>{selectedMessage.subject}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {selectedMessage.thread?.map((threadMessage, index) => (
                      <div
                        key={threadMessage.id}
                        className={cn(
                          "flex gap-3",
                          threadMessage.sender === "client" ? "justify-start" : "justify-end"
                        )}
                      >
                        {threadMessage.sender === "client" && (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={selectedMessage.clientAvatar} />
                            <AvatarFallback className="text-xs">
                              {selectedMessage.clientName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={cn(
                            "max-w-md p-3 rounded-lg",
                            threadMessage.sender === "client"
                              ? "bg-gray-100 text-cocoa-900"
                              : "bg-blue-500 text-white"
                          )}
                        >
                          <p className="text-sm">{threadMessage.message}</p>
                          <div className={cn(
                            "flex items-center gap-1 mt-1 text-xs",
                            threadMessage.sender === "client" ? "text-cocoa-500" : "text-blue-100"
                          )}>
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(threadMessage.timestamp)}
                            {threadMessage.sender === "staff" && (
                              <>
                                <Check className="w-3 h-3 ml-1" />
                                <CheckCheck className="w-3 h-3" />
                              </>
                            )}
                          </div>
                        </div>

                        {threadMessage.sender === "staff" && (
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs bg-blue-500 text-white">ST</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}

                    {/* AI Suggestion */}
                    {selectedMessage.aiSuggestedResponse && showAiSuggestions && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-white" />
                        </div>
                        <div className="max-w-md p-3 rounded-lg border-2 border-purple-200 bg-purple-50">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-purple-700">AI Suggestion</span>
                            <Badge variant="secondary" className="text-xs">AI</Badge>
                          </div>
                          <p className="text-sm text-cocoa-700 mb-3">{selectedMessage.aiSuggestedResponse}</p>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleUseAiSuggestion}>
                              Use Suggestion
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setShowAiSuggestions(false)}>
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Reply Input */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAiSuggestions(true)}
                      className="flex items-center gap-2"
                    >
                      <Zap className="w-3 h-3" />
                      AI Suggest
                    </Button>
                    <Button variant="outline" size="sm">
                      <Paperclip className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Smile className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        className={cn(isRecording ? "bg-red-500 hover:bg-red-600" : "")}
                        onClick={() => setIsRecording(!isRecording)}
                      >
                        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!replyText.trim() || isLoading}
                        size="sm"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-cocoa-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-cocoa-900 mb-2">Select a conversation</h3>
              <p className="text-sm text-cocoa-500">Choose a message from the list to start responding</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default CustomerCommunicationHub;