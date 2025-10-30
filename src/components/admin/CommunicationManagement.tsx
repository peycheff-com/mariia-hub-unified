import { useState, useEffect } from "react";
import {
  MessageSquare,
  Smartphone,
  Send,
  Users,
  TrendingUp,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Mail
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast aria-live="polite" aria-atomic="true" } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";
import { CommunicationService, useCommunication } from "@/lib/communication";

interface CommunicationStats {
  total: number;
  whatsapp: number;
  sms: number;
  email: number;
  sent: number;
  delivered: number;
  failed: number;
  byDate: Record<string, number>;
}

export const CommunicationManagement = () => {
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { sendWhatsAppMessage, sendSMSMessage, getLogs } = useCommunication();

  // WhatsApp form
  const [whatsappForm, setWhatsappForm] = useState({
    phoneNumber: '',
    message: '',
    type: 'custom' as 'template' | 'custom',
    template: 'booking_confirmation'
  });

  // SMS form
  const [smsForm, setSmsForm] = useState({
    phoneNumber: '',
    message: '',
    type: 'appointment' as const,
    priority: 'normal' as const
  });

  // Settings
  const [settings, setSettings] = useState({
    whatsappEnabled: true,
    smsEnabled: true,
    emailEnabled: true,
    autoSendReminders: true,
    sendPromotions: false
  });

  useEffect(() => {
    loadStats();
    loadLogs();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await CommunicationService.getCommunicationStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const { logs: logsData } = await getLogs(50);
      if (logsData.success) {
        setLogs(logsData.logs);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const sendWhatsAppTest = async () => {
    if (!whatsappForm.phoneNumber || !whatsappForm.message) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const result = await sendWhatsAppMessage({
        to: `whatsapp:${whatsappForm.phoneNumber}`,
        customMessage: whatsappForm.message,
        type: 'custom'
      });

      if (result.success) {
        toast aria-live="polite" aria-atomic="true"({
          title: "Success",
          description: "WhatsApp message sent successfully!"
        });
        setWhatsappForm({ ...whatsappForm, message: '' });
        loadLogs();
        loadStats();
      } else {
        throw new Error(result.error?.message || 'Failed to send');
      }
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message || "Failed to send WhatsApp message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const sendSMSTest = async () => {
    if (!smsForm.phoneNumber || !smsForm.message) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const result = await sendSMSMessage({
        to: smsForm.phoneNumber,
        message: smsForm.message,
        type: smsForm.type,
        priority: smsForm.priority
      });

      if (result.success) {
        toast aria-live="polite" aria-atomic="true"({
          title: "Success",
          description: "SMS sent successfully!"
        });
        setSmsForm({ ...smsForm, message: '' });
        loadLogs();
        loadStats();
      } else {
        throw new Error(result.error?.message || 'Failed to send');
      }
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message || "Failed to send SMS",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4 text-green-600" />;
      case 'sms':
        return <Smartphone className="w-4 h-4 text-blue-600" />;
      case 'email':
        return <Mail className="w-4 h-4 text-purple-600" />;
      default:
        return <Mail className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Communication Hub</h2>
          <p className="text-muted-foreground">Manage WhatsApp, SMS, and email communications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { loadStats(); loadLogs(); }} variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">WhatsApp</CardTitle>
              <MessageSquare className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.whatsapp}</div>
              <p className="text-xs text-muted-foreground">{((stats.whatsapp / stats.total) * 100).toFixed(1)}% of total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SMS</CardTitle>
              <Smartphone className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sms}</div>
              <p className="text-xs text-muted-foreground">{((stats.sms / stats.total) * 100).toFixed(1)}% of total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total > 0 ? ((stats.sent + stats.delivered) / stats.total * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Delivered messages</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="whatsapp" className="w-full">
        <TabsList>
          <TabsTrigger value="whatsapp">
            <MessageSquare className="w-4 h-4 mr-2" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="sms">
            <Smartphone className="w-4 h-4 mr-2" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="logs">
            <BarChart3 className="w-4 h-4 mr-2" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Users className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send WhatsApp Message</CardTitle>
              <CardDescription>Send a custom WhatsApp message to a customer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="whatsapp-phone">Phone Number</Label>
                <Input
                  id="whatsapp-phone"
                  placeholder="+48123456789"
                  value={whatsappForm.phoneNumber}
                  onChange={(e) => setWhatsappForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Include country code (e.g., +48)
                </p>
              </div>

              <div>
                <Label htmlFor="whatsapp-message">Message</Label>
                <Textarea
                  id="whatsapp-message"
                  placeholder="Type your message here..."
                  className="min-h-[100px]"
                  value={whatsappForm.message}
                  onChange={(e) => setWhatsappForm(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>

              <Button
                onClick={sendWhatsAppTest}
                disabled={sending || !whatsappForm.phoneNumber || !whatsappForm.message}
                className="w-full"
              >
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send WhatsApp Message
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send SMS</CardTitle>
              <CardDescription>Send an SMS message to a customer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sms-phone">Phone Number</Label>
                <Input
                  id="sms-phone"
                  placeholder="+48123456789"
                  value={smsForm.phoneNumber}
                  onChange={(e) => setSmsForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sms-type">Type</Label>
                  <Select
                    value={smsForm.type}
                    onValueChange={(value: any) => setSmsForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appointment">Appointment</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="verification">Verification</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sms-priority">Priority</Label>
                  <Select
                    value={smsForm.priority}
                    onValueChange={(value: any) => setSmsForm(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="sms-message">Message</Label>
                <Textarea
                  id="sms-message"
                  placeholder="Type your SMS here..."
                  className="min-h-[100px]"
                  value={smsForm.message}
                  onChange={(e) => setSmsForm(prev => ({ ...prev, message: e.target.value }))}
                  maxLength={1600}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {smsForm.message.length}/1600 characters
                </p>
              </div>

              <Button
                onClick={sendSMSTest}
                disabled={sending || !smsForm.phoneNumber || !smsForm.message}
                className="w-full"
              >
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send SMS
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication Logs</CardTitle>
              <CardDescription>Recent message history</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No communications sent yet</p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(log.type)}
                        <div>
                          <p className="font-medium">{log.recipient}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{log.type}</Badge>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(log.status)}
                          <span className="text-sm capitalize">{log.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication Settings</CardTitle>
              <CardDescription>Configure your communication preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable WhatsApp</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow sending WhatsApp messages
                  </p>
                </div>
                <Switch
                  checked={settings.whatsappEnabled}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, whatsappEnabled: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable SMS</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow sending SMS messages
                  </p>
                </div>
                <Switch
                  checked={settings.smsEnabled}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, smsEnabled: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow sending email messages
                  </p>
                </div>
                <Switch
                  checked={settings.emailEnabled}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, emailEnabled: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Send Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically send appointment reminders
                  </p>
                </div>
                <Switch
                  checked={settings.autoSendReminders}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, autoSendReminders: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Send Promotions</Label>
                  <p className="text-sm text-muted-foreground">
                    Send promotional messages to customers
                  </p>
                </div>
                <Switch
                  checked={settings.sendPromotions}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, sendPromotions: checked }))
                  }
                />
              </div>

              <div className="pt-4">
                <h3 className="font-semibold mb-2">API Configuration</h3>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Make sure to configure your API keys in Supabase Edge Functions:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>• TWILIO_ACCOUNT_SID</li>
                    <li>• TWILIO_AUTH_TOKEN</li>
                    <li>• TWILIO_WHATSAPP_NUMBER</li>
                    <li>• TWILIO_SMS_NUMBER</li>
                    <li>• TWILIO_MESSAGING_SERVICE_SID</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};