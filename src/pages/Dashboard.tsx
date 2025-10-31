import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, Heart, Settings, Shield, User, Bell, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import BlogManagement from "@/components/admin/BlogManagement";
import ReviewManagement from "@/components/admin/ReviewManagement";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useFavorites } from "@/hooks/useFavorites";
import StandardServiceCard from "@/components/StandardServiceCard";
import { useServices } from "@/hooks/useServices";
import { UserProfile, UserPreferences, UserConsents, ProfileUpdate, PreferencesUpdate, ConsentsUpdate } from "@/types/dashboard";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [consents, setConsents] = useState<UserConsents | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { favorites, loading: favLoading, toggleFavorite, isFavorite, loadFavorites } = useFavorites();
  const { data: allServices = [] } = useServices();

  const activeTab = searchParams.get('tab') || 'bookings';

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Auth check is handled by ProtectedRoute

      setUser(user);
      
      // Check for payment verification from redirect params
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');

      if (sessionId) {
        verifyPayment(sessionId);
      }
      
      // Fetch all user data
      await Promise.all([
        fetchProfile(user.id),
        fetchBookings(user.id),
        fetchPreferences(user.id),
        fetchConsents(user.id),
        checkAdminRole(user.id)
      ]);
      
      setLoading(false);
    };

    loadUserData();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        // ProtectedRoute will handle navigation
        setUser(null);
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    setProfile(profileData);
  };

  const fetchPreferences = async (userId: string) => {
    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    setPreferences(data);
  };

  const fetchConsents = async (userId: string) => {
    const { data } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    setConsents(data || { email_marketing_opt_in: false, sms_opt_in: false, whatsapp_opt_in: false });
  };

  const checkAdminRole = async (userId: string) => {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    setIsAdmin(!!roleData);
  };

  const verifyPayment = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-booking-payment', {
        body: { sessionId }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Payment Successful! ✨",
          description: "Your booking has been confirmed. Check your email for details.",
        });

        if (user) {
          await fetchBookings(user.id);
        }
      } else if (data) {
        toast({
          title: "Payment Status",
          description: data.paymentStatus
            ? `Your payment is marked as ${data.paymentStatus}. Please contact support if this is unexpected.`
            : "We couldn't confirm your payment. Please try again or contact support.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Verification Error",
        description: (error instanceof Error ? error.message : "Failed to verify payment"),
        variant: "destructive",
      });
    }
  };

  const fetchBookings = async (userId: string) => {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        services (
          title,
          price_from,
          duration_minutes,
          is_package,
          package_sessions
        )
      `)
      .eq("user_id", userId)
      .in("status", ["confirmed", "completed", "pending"])
      .or("payment_status.eq.paid,payment_status.eq.pending")
      .order("booking_date", { ascending: false });

    if (!error) {
      setBookings(data || []);
    }
  };

  const updateProfile = async (updates: ProfileUpdate) => {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      await fetchProfile(user.id);
    }
  };

  const updatePreferences = async (updates: PreferencesUpdate) => {
    const { error } = await supabase
      .from('user_preferences')
      .update(updates)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Preferences updated successfully",
      });
      await fetchPreferences(user.id);
    }
  };

  const updateConsents = async (updates: ConsentsUpdate) => {
    if (!user) return;
    try {
      const payload = { user_id: user.id, ...consents, ...updates, updated_at: new Date().toISOString(), consent_given_at: new Date().toISOString() };
      const { error } = await supabase
        .from('user_consents')
        .upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      toast({ title: 'Success', description: 'Consent preferences updated' });
      await fetchConsents(user.id);
    } catch (e: unknown) {
      toast({ title: 'Error', description: (e instanceof Error ? e.message : 'Failed to update consents'), variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-32 pb-24 px-6 md:px-8">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-2">
              {t('dashboard.welcome')}, {profile?.full_name || user?.email}
            </h1>
            <p className="text-foreground/60">{t('dashboard.subtitle')}</p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => navigate(`/dashboard?tab=${v}`)}>
            <TabsList className="mb-8">
              <TabsTrigger value="bookings" className="gap-2">
                <Calendar className="w-4 h-4" />
                My Bookings
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-2">
                <Heart className="w-4 h-4" />
                Favorites
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin" className="gap-2">
                  <Shield className="w-4 h-4" />
                  Admin
                </TabsTrigger>
              )}
            </TabsList>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-6">
              {bookings.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-foreground/70 mb-6">{t('dashboard.noBookings')}</p>
                    <Button onClick={() => navigate("/")}>
                      {t('dashboard.bookNow')}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {bookings.map((booking) => (
                    <Card key={booking.id} className="hover-scale">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle>{booking.services.title}</CardTitle>
                          <div className="flex flex-col items-end gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                booking.payment_status === "paid"
                                  ? "bg-sage/20 text-sage"
                                  : booking.payment_status === "pending"
                                  ? "bg-primary/20 text-primary"
                                  : "bg-muted text-foreground"
                              }`}
                            >
                              {booking.payment_status === "paid" ? "✓ Paid" : booking.payment_status || booking.status}
                            </span>
                            {booking.is_package && booking.sessions_remaining !== null && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                {booking.sessions_remaining} sessions left
                              </span>
                            )}
                          </div>
                        </div>
                        <CardDescription>
                          {new Date(booking.booking_date).toLocaleString(t('common.locale'), {
                            dateStyle: "full",
                            timeStyle: "short",
                          })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-4 text-sm text-foreground/70">
                          <span>{booking.services.duration_minutes} min</span>
                          <span>•</span>
                          <span>{formatPrice(booking.services.price_from)}</span>
                          {booking.services.is_package && (
                            <>
                              <span>•</span>
                              <span className="font-medium">
                                {booking.services.package_sessions}-session pack
                              </span>
                            </>
                          )}
                        </div>
                        {booking.notes && (
                          <p className="text-sm text-foreground/70 mt-4 pt-4 border-t">
                            {t('dashboard.note')}: {booking.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites">
              {favLoading ? (
                <div className="text-center text-foreground/60 py-12">Loading favorites...</div>
              ) : favorites.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-primary/50" />
                    <p className="text-foreground/70 mb-6">No favorites yet. Browse services to add favorites!</p>
                    <Button onClick={() => navigate("/")}>Browse Services</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allServices
                    .filter(s => favorites.includes(s.id))
                    .map(service => (
                      <div key={service.id} className="relative">
                        <button
                          aria-label="Remove from favorites"
                          className="absolute top-3 right-3 z-10 px-3 py-1 text-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                          onClick={() => toggleFavorite(service.id)}
                        >
                          Remove
                        </button>
                        <StandardServiceCard service={service} showQuickBook allServices={allServices} />
                      </div>
                    ))}
                </div>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              {/* Profile Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profile?.full_name || ''}
                        onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                        onBlur={(e) => updateProfile({ full_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profile?.phone || ''}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        onBlur={(e) => updateProfile({ phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive booking confirmations via email</p>
                    </div>
                    <Switch
                      checked={preferences?.email_notification aria-live="polite" aria-atomic="true"s ?? true}
                      onCheckedChange={(checked) => updatePreferences({ email_notifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive booking reminders via SMS</p>
                    </div>
                    <Switch
                      checked={preferences?.sms_notification aria-live="polite" aria-atomic="true"s ?? false}
                      onCheckedChange={(checked) => updatePreferences({ sms_notifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Newsletter</Label>
                      <p className="text-sm text-muted-foreground">Receive tips, offers and updates</p>
                    </div>
                    <Switch
                      checked={preferences?.newsletter_subscribed ?? false}
                      onCheckedChange={(checked) => updatePreferences({ newsletter_subscribed: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Privacy & Consent */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    Privacy & Consent
                  </CardTitle>
                  <CardDescription>Control marketing and messaging consents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Marketing</Label>
                      <p className="text-sm text-muted-foreground">Receive newsletters and offers by email</p>
                    </div>
                    <Switch
                      checked={consents?.email_marketing_opt_in ?? false}
                      onCheckedChange={(checked) => updateConsents({ email_marketing_opt_in: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications (marketing)</Label>
                      <p className="text-sm text-muted-foreground">Allow marketing messages via SMS</p>
                    </div>
                    <Switch
                      checked={consents?.sms_opt_in ?? false}
                      onCheckedChange={(checked) => updateConsents({ sms_opt_in: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>WhatsApp Notifications (marketing)</Label>
                      <p className="text-sm text-muted-foreground">Allow marketing messages via WhatsApp</p>
                    </div>
                    <Switch
                      checked={consents?.whatsapp_opt_in ?? false}
                      onCheckedChange={(checked) => updateConsents({ whatsapp_opt_in: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Admin Tab */}
            {isAdmin && (
              <TabsContent value="admin" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      Admin Panel
                    </CardTitle>
                    <CardDescription>Manage bookings, reviews, and content</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <ReviewManagement />
                    <BlogManagement />
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
