import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { LogOut, Home, TrendingUp, Users, Calendar, DollarSign, Activity, Star, Bell, ArrowUp, ArrowDown, Clock, CheckCircle, AlertTriangle, Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

// Admin components
import BlogManagement from "@/components/admin/BlogManagement";
import ReviewManagement from "@/components/admin/ReviewManagement";
import EnhancedReviewManagement from "@/components/admin/EnhancedReviewManagement";
import ReviewVerificationSystem from "@/components/reviews/ReviewVerificationSystem";
import SocialPostsManagement from "@/components/admin/SocialPostsManagement";
import LoyaltyManagement from "@/components/admin/LoyaltyManagement";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import AnalyticsDashboardPage from "@/pages/admin/analytics/Dashboard";
import Reports from "@/pages/admin/analytics/Reports";
import MirrorQueue from "@/components/admin/MirrorQueue";
import EnhancedServicesManagement from "@/components/admin/EnhancedServicesManagement";
import AvailabilityManagement from "@/components/admin/AvailabilityManagement";
import NewsletterManagement from "@/components/admin/NewsletterManagement";
import { EmailManagement } from "@/components/admin/EmailManagement";
import { CommunicationManagement } from "@/components/admin/CommunicationManagement";
import { AdvancedAnalytics } from "@/components/admin/AdvancedAnalytics";
import { UnifiedInbox } from "@/components/admin/UnifiedInbox";
import { WhatsAppInbox } from "@/components/admin/WhatsAppInbox";
import { ReferralProgram } from "@/components/admin/ReferralProgram";
import { CommunicationAnalytics } from "@/components/admin/CommunicationAnalytics";
import UnifiedCMS from "@/components/admin/UnifiedCMS";
// AI components temporarily disabled
// import { AdminAI } from "./AdminAI";
import { IntegrationSettings } from "@/components/admin/IntegrationSettings";
import FeedbackAnalyticsDashboard from "@/components/admin/FeedbackAnalyticsDashboard";
import StaffManagement from "@/components/admin/advanced/StaffManagement";
import ResourceManagement from "@/components/admin/advanced/ResourceManagement";
import ConflictResolution from "@/components/admin/advanced/ConflictResolution";
import BulkOperations from "@/components/admin/advanced/BulkOperations";
import ReportBuilder from "@/components/admin/advanced/ReportBuilder";
import CityManagement from "@/components/admin/CityManagement";
import LocationManagement from "@/components/admin/LocationManagement";
import { RegionalPricingManagement } from "@/components/admin/RegionalPricingManagement";
import { ComplianceManagement } from "@/components/admin/ComplianceManagement";
import { DataImportExport } from "@/components/admin/DataImportExport";
import { WaitlistDashboard } from "@/components/admin/WaitlistDashboard";
import { TMManager } from "@/components/translations/TMManager";
import DailyOperationsDashboard from "@/components/admin/DailyOperationsDashboard";
import CustomerCommunicationHub from "@/components/admin/CustomerCommunicationHub";
import AdvancedSearchAndPowerUser from "@/components/admin/AdvancedSearchAndPowerUser";

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("analytics");
  const navigate = useNavigate();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  // Mock data for luxury dashboard
  const dashboardData = useMemo(() => ({
    kpi: {
      revenue: { value: 284750, change: 12.5, trend: 'up' },
      bookings: { value: 1847, change: 8.2, trend: 'up' },
      clients: { value: 892, change: -2.1, trend: 'down' },
      satisfaction: { value: 4.8, change: 0.3, trend: 'up' },
    },
    today: {
      appointments: 24,
      completed: 18,
      pending: 6,
      revenue: 8450,
    },
    alerts: [
      { type: 'warning', message: 'High waitlist volume for lash extensions', count: 12 },
      { type: 'success', message: 'New 5-star review received', count: 1 },
      { type: 'error', message: 'Payment processing delay detected', count: 3 },
    ],
    recentActivity: [
      { action: 'New booking', client: 'Anna Kowalska', service: 'Lash Extension', time: '2 min ago' },
      { action: 'Payment received', client: 'Maria Nowak', service: 'Brow Lamination', time: '15 min ago' },
      { action: 'Review posted', client: 'Elena Wiśniewska', rating: 5, time: '1 hour ago' },
    ],
  }), []);

  useEffect(() => {
    loadAdminData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAdminData = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return; // ProtectedRoute will handle this
    }

    setUser(session.user);
    setIsAdmin(true);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Premium Dashboard Component
  const LuxuryDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Section with KPIs */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-champagne-100 via-cocoa-50 to-amber-50 p-8 border border-champagne-200">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0iI0Y1REJCMiIgZmlsbC1vcGFjaXR5PSIwLjMiLz4KPGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0iI0Y1REJDMiIgZmlsbC1vcGFjaXR5PSIwLjIiLz4KPGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iMSIgZmlsbD0iI0Y1REJDMiIgZmlsbC1vcGFjaXR5PSIwLjIiLz4KPC9zdmc+')] opacity-20" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-cocoa-900 bg-gradient-to-r from-cocoa-800 to-champagne-600 bg-clip-text text-transparent">
                Welcome back, Admin
              </h1>
              <p className="text-cocoa-600 mt-1">Here's what's happening in your beauty empire today</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md rounded-xl border border-champagne-200">
              <Sparkles className="w-4 h-4 text-champagne-600" />
              <span className="text-sm font-medium text-cocoa-700">Premium Dashboard</span>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key: 'revenue', icon: DollarSign, label: 'Monthly Revenue', prefix: 'zł', color: 'from-emerald-400 to-teal-600' },
              { key: 'bookings', icon: Calendar, label: 'Total Bookings', prefix: '', color: 'from-blue-400 to-indigo-600' },
              { key: 'clients', icon: Users, label: 'Active Clients', prefix: '', color: 'from-purple-400 to-pink-600' },
              { key: 'satisfaction', icon: Star, label: 'Satisfaction Score', prefix: '', color: 'from-amber-400 to-orange-600' },
            ].map(({ key, icon: Icon, label, prefix, color }) => {
              const kpi = dashboardData.kpi[key as keyof typeof dashboardData.kpi];
              return (
                <div key={key} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-white/70 backdrop-blur-sm border border-cocoa-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-xl flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                        kpi.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {kpi.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {Math.abs(kpi.change)}%
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-cocoa-900">
                        {prefix}{typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                      </div>
                      <div className="text-xs text-cocoa-500">{label}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Today's Overview & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-sm border border-cocoa-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-cocoa-900">Today's Overview</h2>
            <Clock className="w-5 h-5 text-cocoa-400" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Appointments', value: dashboardData.today.appointments, color: 'from-blue-400 to-indigo-600', icon: Calendar },
              { label: 'Completed', value: dashboardData.today.completed, color: 'from-emerald-400 to-teal-600', icon: CheckCircle },
              { label: 'Pending', value: dashboardData.today.pending, color: 'from-amber-400 to-orange-600', icon: Clock },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="text-center p-4 bg-gradient-to-br from-cocoa-50 to-champagne-50/30 rounded-xl border border-cocoa-100">
                <div className={`w-10 h-10 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-cocoa-900">{value}</div>
                <div className="text-xs text-cocoa-500">{label}</div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-sm font-semibold text-cocoa-700 mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {dashboardData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-cocoa-50/50 rounded-lg hover:bg-cocoa-100/50 transition-colors duration-200">
                  <div className="w-8 h-8 bg-gradient-to-r from-champagne-400 to-cocoa-500 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-cocoa-900">{activity.action}</div>
                    <div className="text-xs text-cocoa-500">{activity.client} • {activity.service}</div>
                  </div>
                  <div className="text-xs text-cocoa-400">{activity.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className="bg-white/60 backdrop-blur-sm border border-cocoa-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-cocoa-900">Alerts</h2>
              <Bell className="w-5 h-5 text-cocoa-400" />
            </div>

            <div className="space-y-3">
              {dashboardData.alerts.map((alert, index) => {
                const alertColors = {
                  warning: 'from-amber-100 to-amber-50 border-amber-200 text-amber-800',
                  success: 'from-emerald-100 to-emerald-50 border-emerald-200 text-emerald-800',
                  error: 'from-red-100 to-red-50 border-red-200 text-red-800',
                };

                const alertIcons = {
                  warning: AlertTriangle,
                  success: CheckCircle,
                  error: AlertTriangle,
                };

                const Icon = alertIcons[alert.type as keyof typeof alertIcons];

                return (
                  <div key={index} className={`p-3 rounded-xl border ${alertColors[alert.type as keyof typeof alertColors]}`}>
                    <div className="flex items-start gap-2">
                      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{alert.message}</div>
                        <div className="text-xs opacity-75 mt-1">{alert.count} items</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-champagne-100 to-cocoa-50/30 border border-champagne-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-cocoa-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center gap-2 p-3 bg-white/60 backdrop-blur-sm border border-cocoa-200 rounded-xl hover:bg-white/80 transition-all duration-200 hover:scale-105">
                <Plus className="w-5 h-5 text-champagne-600" />
                <span className="text-xs font-medium text-cocoa-700">New Booking</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-3 bg-white/60 backdrop-blur-sm border border-cocoa-200 rounded-xl hover:bg-white/80 transition-all duration-200 hover:scale-105">
                <Users className="w-5 h-5 text-champagne-600" />
                <span className="text-xs font-medium text-cocoa-700">Add Client</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-3 bg-white/60 backdrop-blur-sm border border-cocoa-200 rounded-xl hover:bg-white/80 transition-all duration-200 hover:scale-105">
                <Calendar className="w-5 h-5 text-champagne-600" />
                <span className="text-xs font-medium text-cocoa-700">Schedule</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-3 bg-white/60 backdrop-blur-sm border border-cocoa-200 rounded-xl hover:bg-white/80 transition-all duration-200 hover:scale-105">
                <BarChart3 className="w-5 h-5 text-champagne-600" />
                <span className="text-xs font-medium text-cocoa-700">Reports</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    // Show luxury dashboard for analytics tab
    if (activeTab === "analytics") {
      return <LuxuryDashboard />;
    }

    // Fall back to existing components for other tabs
    switch (activeTab) {
      case "analytics-dashboard":
        return <AnalyticsDashboardPage />;
      case "calendar":
        return <AvailabilityManagement />;
      case "mirror":
        return <MirrorQueue />;
      case "services":
        return <EnhancedServicesManagement />;
      case "availability":
        return <AvailabilityManagement />;
      case "waitlist":
        return <WaitlistDashboard />;
      case "cms":
        return <UnifiedCMS />;
      case "translations":
        return <TMManager />;
      case "ai":
        return <div className="p-6"><h2 className="text-2xl font-bold mb-4">AI Features</h2><p className="text-muted-foreground">AI features are temporarily disabled for maintenance.</p></div>;
      case "staff":
        return <StaffManagement />;
      case "resources":
        return <ResourceManagement />;
      case "conflicts":
        return <ConflictResolution />;
      case "cities":
        return <CityManagement />;
      case "locations":
        return <LocationManagement cityId={undefined} />;
      case "pricing":
        return <RegionalPricingManagement />;
      case "compliance":
        return <ComplianceManagement />;
      case "import-export":
        return <DataImportExport />;
      case "bulk":
        return <BulkOperations />;
      case "reports":
        return <Reports />;
      case "reviews":
        return <EnhancedReviewManagement />;
      case "review-verification":
        return <ReviewVerificationSystem />;
      case "feedback":
        return <FeedbackAnalyticsDashboard />;
      case "social":
        return <SocialPostsManagement />;
      case "loyalty":
        return <LoyaltyManagement />;
      case "newsletter":
        return <EmailManagement />;
      case "communication":
        return <CommunicationManagement />;
      case "inbox":
        return <UnifiedInbox />;
      case "whatsapp":
        return <WhatsAppInbox />;
      case "referral":
        return <ReferralProgram />;
      case "message-analytics":
        return <CommunicationAnalytics />;
      case "advanced-analytics":
        return <AdvancedAnalytics />;
      case "today-overview":
        return <DailyOperationsDashboard />;
      case "quick-actions":
        return <DailyOperationsDashboard />;
      case "communication-hub":
        return <CustomerCommunicationHub />;
      case "advanced-search":
        return <AdvancedSearchAndPowerUser />;
      case "settings":
        return <IntegrationSettings />;
      default:
        return <LuxuryDashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cocoa-50 to-champagne-50/30 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-champagne-400 to-cocoa-600 rounded-2xl flex items-center justify-center shadow-xl shadow-champagne-500/25">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-champagne-400/20 to-cocoa-400/20 rounded-2xl blur-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-cocoa-50 via-champagne-50/30 to-cocoa-100">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 flex flex-col relative">
          {/* Premium Header */}
          <header role="banner" className="h-16 bg-white/80 backdrop-blur-md border-b border-cocoa-200/60 sticky top-0 z-40">
            <div className="h-full px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="lg:hidden hover:bg-champagne-400/20 transition-colors duration-200" />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-champagne-400 to-cocoa-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-cocoa-900 bg-gradient-to-r from-cocoa-700 to-champagne-600 bg-clip-text text-transparent">
                      {activeTab === "analytics" ? "Dashboard" :
                       activeTab.split("-").map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(" ")}
                    </h1>
                    <p className="text-xs text-cocoa-500">Premium Management Interface</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/")}
                  className="hover:bg-champagne-400/20 transition-colors duration-200"
                >
                  <Home className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Back to Site</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="border-champagne-200 hover:bg-champagne-50 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content with premium background */}
          <main role="main" className="flex-1 overflow-auto relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iI0Y1REJDMiIgZmlsbC1vcGFjaXR5PSIwLjEiLz4KPC9zdmc+')] opacity-30" />
            <div className="relative max-w-7xl mx-auto p-6">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;