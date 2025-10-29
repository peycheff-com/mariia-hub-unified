import { useState, useEffect } from "react";
import { Save, Eye, EyeOff, Key, RefreshCw, ExternalLink, Shield, Lock } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { logger } from "@/lib/logger";

interface Setting {
  id: string;
  key: string;
  value: string | null;
  description: string;
  is_configured: boolean;
}

interface SettingCardProps {
  setting: Setting;
  onSave: (key: string, value: string) => Promise<void>;
  saving: boolean;
}

function SettingCard({ setting, onSave, saving }: SettingCardProps) {
  const [localValue, setLocalValue] = useState(setting.value || "");
  const [isVisible, setIsVisible] = useState(false);

  const isSecret = (key: string) => {
    return key.includes("key") || key.includes("token") || key.includes("secret");
  };

  const isSecretField = isSecret(setting.key);

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{setting.key.replace(/_/g, " ").toUpperCase()}</CardTitle>
            {setting.is_configured && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Configured</span>
            )}
          </div>
          {isSecretField && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsVisible(!isVisible)}
            >
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
        </div>
        <CardDescription>{setting.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type={isSecretField && !isVisible ? "password" : "text"}
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              placeholder={`Enter ${setting.key.replace(/_/g, " ")}`}
            />
          </div>
          <Button
            onClick={() => onSave(setting.key, localValue)}
            disabled={saving || localValue === setting.value}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function IntegrationSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("integration_settings")
        .select("*")
        .order("key");

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      logger.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("integration_settings")
        .update({ 
          value, 
          is_configured: !!value,
          updated_at: new Date().toISOString() 
        })
        .eq("key", key);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Setting saved successfully",
      });

      await fetchSettings();
    } catch (error) {
      logger.error("Error saving setting:", error);
      toast({
        title: "Error",
        description: "Failed to save setting",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const paymentSettings = settings.filter(s => s.key.includes("stripe"));
  const booksySettings = settings.filter(s => s.key.includes("booksy"));
  const communicationSettings = settings.filter(s => s.key.includes("whatsapp") || s.key.includes("smtp"));
  const analyticsSettings = settings.filter(s => 
    s.key.includes("analytics") || s.key.includes("pixel") || s.key.includes("tag_manager")
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Integration Settings</h2>
        <p className="text-muted-foreground mt-2">
          Configure third-party services and API integrations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Public Configuration</AlertTitle>
          <AlertDescription>
            Settings below are public identifiers safe to store in the database (business IDs, publishable keys, tracking IDs).
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>Sensitive API Keys & Tokens</AlertTitle>
          <AlertDescription>
            Secret keys (Stripe Secret, Booksy API, WhatsApp Token, etc.) must be managed in Supabase Edge Function Secrets for security.
            <a 
              href="https://supabase.com/dashboard/project/lckxvimdqnfjzkbrusgu/settings/functions"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 mt-2 text-xs underline hover:no-underline"
            >
              Manage Secrets in Supabase <ExternalLink className="h-3 w-3" />
            </a>
          </AlertDescription>
        </Alert>
      </div>

      <Tabs defaultValue="payment" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="booksy">Booksy</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Stripe Configuration
              </CardTitle>
              <CardDescription>
                <strong>Public Key:</strong> Configure below (safe for frontend use)
                <br />
                <strong>Secret Key:</strong> Already configured in Supabase Secrets (STRIPE_SECRET_KEY)
              </CardDescription>
            </CardHeader>
          </Card>
          {paymentSettings.map((setting) => (
            <SettingCard key={setting.id} setting={setting} onSave={handleSave} saving={saving} />
          ))}
        </TabsContent>

        <TabsContent value="booksy" className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Booksy Integration
              </CardTitle>
              <CardDescription>
                <strong>Business ID:</strong> Configure below (public identifier)
                <br />
                <strong>API Key:</strong> Must be added to Supabase Secrets (BOOKSY_API_KEY) for mirror queue functionality
              </CardDescription>
            </CardHeader>
          </Card>
          {booksySettings.map((setting) => (
            <SettingCard key={setting.id} setting={setting} onSave={handleSave} saving={saving} />
          ))}
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Communication Settings
              </CardTitle>
              <CardDescription>
                <strong>Phone Number:</strong> Configure below (public, for display)
                <br />
                <strong>WhatsApp API Token:</strong> Must be added to Supabase Secrets (WHATSAPP_API_TOKEN)
                <br />
                <strong>Email Service:</strong> Already configured in Supabase Secrets (RESEND_API_KEY)
              </CardDescription>
            </CardHeader>
          </Card>
          {communicationSettings.map((setting) => (
            <SettingCard key={setting.id} setting={setting} onSave={handleSave} saving={saving} />
          ))}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Analytics & Tracking
              </CardTitle>
              <CardDescription>
                Configure public tracking IDs (safe to expose in frontend code). These are not sensitive secrets.
              </CardDescription>
            </CardHeader>
          </Card>
          {analyticsSettings.map((setting) => (
            <SettingCard key={setting.id} setting={setting} onSave={handleSave} saving={saving} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}