import React, { useState } from "react";
import {
  // Workflow Icons - Premium Liquid Glass Design
  Activity,
  BarChart3,
  Bell,
  Brain,
  FileText,
  Globe,
  Home,
  Inbox,
  LayoutDashboard,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Settings,
  Share2,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
  ChevronDown,
  ChevronRight,
  Clock,
  Award,
  Gift,
  PieChart,
  Target,
  Archive,
  Eye,
  Search,
  Plus,
} from "lucide-react";

import { LocalizationSelector } from "@/components/localization";
import {
  Sidebar,
  SidebarContent,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

// Workflow-based navigation structure - 8 main workflows
const workflowItems = [
  {
    id: "daily-operations",
    title: "Daily Operations",
    description: "Today's overview and quick actions",
    icon: Activity,
    color: "from-blue-500 to-cyan-500",
    subItems: [
      { title: "Dashboard", tab: "analytics", icon: LayoutDashboard },
      { title: "Today's Schedule", tab: "availability", icon: Clock },
      { title: "Active Alerts", tab: "alerts", icon: Bell },
      { title: "Quick Actions", tab: "quick-actions", icon: Zap },
    ],
  },
  {
    id: "customer-management",
    title: "Customer Management",
    description: "Client profiles and communication",
    icon: Users,
    color: "from-purple-500 to-pink-500",
    subItems: [
      { title: "Client Profiles", tab: "clients", icon: Users },
      { title: "Communication Hub", tab: "inbox", icon: MessageCircle },
      { title: "Booking History", tab: "history", icon: Clock },
      { title: "WhatsApp Inbox", tab: "whatsapp", icon: Phone },
    ],
  },
  {
    id: "service-operations",
    title: "Service Operations",
    description: "Services, availability, and resources",
    icon: Sparkles,
    color: "from-amber-500 to-orange-500",
    subItems: [
      { title: "Services", tab: "services", icon: Sparkles },
      { title: "Availability Calendar", tab: "availability", icon: Clock },
      { title: "Resource Management", tab: "resources", icon: Archive },
      { title: "Waitlist", tab: "waitlist", icon: Bell },
    ],
  },
  {
    id: "content-studio",
    title: "Content Studio",
    description: "CMS, AI content, and media",
    icon: FileText,
    color: "from-emerald-500 to-teal-500",
    subItems: [
      { title: "Content Management", tab: "cms", icon: FileText },
      { title: "AI Content Studio", tab: "ai", icon: Brain },
      { title: "Translations", tab: "translations", icon: Globe },
      { title: "Media Library", tab: "media", icon: Eye },
    ],
  },
  {
    id: "marketing-hub",
    title: "Marketing Hub",
    description: "Campaigns, reviews, and social media",
    icon: Share2,
    color: "from-rose-500 to-pink-500",
    subItems: [
      { title: "Reviews", tab: "reviews", icon: Star },
      { title: "Social Media", tab: "social", icon: Share2 },
      { title: "Loyalty Program", tab: "loyalty", icon: Award },
      { title: "Referral Program", tab: "referral", icon: Gift },
      { title: "Campaigns", tab: "campaigns", icon: Target },
    ],
  },
  {
    id: "business-intelligence",
    title: "Business Intelligence",
    description: "Analytics, reports, and insights",
    icon: BarChart3,
    color: "from-indigo-500 to-purple-500",
    subItems: [
      { title: "Analytics Dashboard", tab: "analytics-dashboard", icon: PieChart },
      { title: "Custom Reports", tab: "reports", icon: FileText },
      { title: "Message Analytics", tab: "message-analytics", icon: MessageCircle },
      { title: "Advanced Analytics", tab: "advanced-analytics", icon: TrendingUp },
    ],
  },
  {
    id: "multi-city-management",
    title: "Multi-City",
    description: "Locations and regional management",
    icon: MapPin,
    color: "from-green-500 to-emerald-500",
    subItems: [
      { title: "Cities", tab: "cities", icon: Globe },
      { title: "Locations", tab: "locations", icon: MapPin },
      { title: "Regional Pricing", tab: "pricing", icon: TrendingUp },
      { title: "Compliance", tab: "compliance", icon: Shield },
    ],
  },
  {
    id: "system-configuration",
    title: "System Configuration",
    description: "Settings, users, and integrations",
    icon: Settings,
    color: "from-gray-500 to-slate-500",
    subItems: [
      { title: "Settings", tab: "settings", icon: Settings },
      { title: "User Management", tab: "users", icon: Users },
      { title: "Integrations", tab: "integrations", icon: Zap },
      { title: "Data Import/Export", tab: "import-export", icon: Archive },
    ],
  },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [expandedWorkflows, setExpandedWorkflows] = useState<string[]>(["daily-operations"]);

  const toggleWorkflow = (workflowId: string) => {
    setExpandedWorkflows(prev =>
      prev.includes(workflowId)
        ? prev.filter(id => id !== workflowId)
        : [...prev, workflowId]
    );
  };

  const isWorkflowActive = (workflow: any) => {
    return workflow.subItems.some((item: any) => item.tab === activeTab);
  };

  return (
    <Sidebar className={isCollapsed ? "w-20" : "w-80"} collapsible="icon">
      {/* Premium Header with Liquid Glass branding */}
      <div className="h-16 border-b border-cocoa-200 bg-gradient-to-r from-cocoa-50 to-champagne-50/30 backdrop-blur-md flex items-center px-4 gap-3 relative overflow-hidden">
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-champagne-400/5 to-cocoa-400/5 animate-pulse" />

        {!isCollapsed ? (
          <>
            <div className="relative w-10 h-10 bg-gradient-to-br from-champagne-400 to-cocoa-600 rounded-xl flex items-center justify-center shadow-lg shadow-champagne-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 relative">
              <h1 className="font-bold text-lg text-cocoa-900 bg-gradient-to-r from-cocoa-700 to-champagne-600 bg-clip-text text-transparent">
                Admin Hub
              </h1>
              <p className="text-xs text-cocoa-500">Premium Management Suite</p>
            </div>
          </>
        ) : (
          <div className="relative w-10 h-10 bg-gradient-to-br from-champagne-400 to-cocoa-600 rounded-xl flex items-center justify-center shadow-lg shadow-champagne-500/25 mx-auto">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        )}

        <SidebarTrigger className="relative z-10 ml-auto hover:bg-champagne-400/20 transition-colors duration-200" />
      </div>

      <SidebarContent className="px-2 py-4">
        {/* Quick Search Bar - Liquid Glass Design */}
        {!isCollapsed && (
          <div className="mb-6 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-champagne-400/20 to-cocoa-400/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <div className="relative flex items-center gap-2 px-4 py-3 bg-white/60 backdrop-blur-md border border-cocoa-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <Search className="w-4 h-4 text-cocoa-400" />
              <input
                type="text"
                placeholder="Search workflows..."
                className="flex-1 bg-transparent text-sm text-cocoa-700 placeholder-cocoa-400 outline-none"
              />
            </div>
          </div>
        )}

        {/* Workflow Navigation */}
        <div className="space-y-2">
          {workflowItems.map((workflow) => {
            const isActive = isWorkflowActive(workflow);
            const isExpanded = expandedWorkflows.includes(workflow.id);

            return (
              <div key={workflow.id} className="group">
                {/* Main Workflow Button */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => {
                      if (!isCollapsed) {
                        toggleWorkflow(workflow.id);
                      } else {
                        // On collapsed state, click to go to first sub-item
                        onTabChange(workflow.subItems[0].tab);
                      }
                    }}
                    className={`
                      relative overflow-hidden transition-all duration-300 group/workflow
                      ${isCollapsed ? 'justify-center p-3' : 'justify-start px-4 py-3'}
                      ${isActive
                        ? 'bg-gradient-to-r ' + workflow.color + ' text-white shadow-lg scale-[1.02]'
                        : 'hover:bg-cocoa-100/80 text-cocoa-700'
                      }
                    `}
                  >
                    {/* Glass morphism overlay */}
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover/workflow:opacity-100 transition-opacity duration-200" />

                    {/* Icon with gradient background */}
                    <div className={`
                      relative flex items-center justify-center
                      ${isCollapsed ? 'w-8 h-8' : 'w-6 h-6 mr-3'}
                      ${isActive ? '' : 'bg-gradient-to-r ' + workflow.color + ' rounded-lg'}
                    `}>
                      <workflow.icon className={`
                        ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}
                        ${isActive ? 'text-white' : 'text-white'}
                     `} />
                    </div>

                    {/* Text content */}
                    {!isCollapsed && (
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-sm">{workflow.title}</div>
                        <div className="text-xs opacity-80">{workflow.description}</div>
                      </div>
                    )}

                    {/* Chevron indicator */}
                    {!isCollapsed && (
                      <ChevronRight className={`
                        w-4 h-4 transition-transform duration-200
                        ${isExpanded ? 'rotate-90' : ''}
                        ${isActive ? 'text-white' : 'text-cocoa-400'}
                      `} />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Expanded Sub-items */}
                {!isCollapsed && isExpanded && (
                  <div className="ml-4 mt-1 space-y-1 animate-in slide-in-from-top-1 duration-200">
                    {workflow.subItems.map((subItem) => {
                      const isSubActive = activeTab === subItem.tab;
                      return (
                        <SidebarMenuSubItem key={subItem.tab}>
                          <SidebarMenuSubButton
                            onClick={() => onTabChange(subItem.tab)}
                            className={`
                              relative overflow-hidden transition-all duration-200 group/subitem
                              ${isSubActive
                                ? 'bg-gradient-to-r from-champagne-400/20 to-cocoa-400/20 text-champagne-700 font-medium border-l-2 border-champagne-500'
                                : 'hover:bg-cocoa-50/60 text-cocoa-600 hover:text-cocoa-800'
                              }
                            `}
                          >
                            <subItem.icon className="w-4 h-4 mr-3" />
                            <span className="text-sm">{subItem.title}</span>

                            {/* Active indicator */}
                            {isSubActive && (
                              <div className="absolute right-2 w-2 h-2 bg-champagne-500 rounded-full animate-pulse" />
                            )}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Actions Section */}
        {!isCollapsed && (
          <div className="mt-8 pt-6 border-t border-cocoa-200">
            <div className="px-4 py-2">
              <h3 className="text-xs font-semibold text-cocoa-500 uppercase tracking-wider mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center gap-2 px-3 py-2 bg-champagne-50 hover:bg-champagne-100 text-champagne-700 rounded-lg transition-colors duration-200 text-xs font-medium">
                  <Plus className="w-3 h-3" />
                  New Booking
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-cocoa-50 hover:bg-cocoa-100 text-cocoa-700 rounded-lg transition-colors duration-200 text-xs font-medium">
                  <Users className="w-3 h-3" />
                  Add Client
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Localization controls */}
        {!isCollapsed && (
          <div className="mt-6 px-4">
            <div className="p-3 bg-gradient-to-br from-cocoa-50 to-champagne-50/30 rounded-xl border border-cocoa-200">
              <h3 className="text-xs font-semibold text-cocoa-600 mb-2">Region Settings</h3>
              <LocalizationSelector variant="vertical" showLabels={false} />
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}