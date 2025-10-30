import { useState, useEffect } from "react";
import DOMPurify from 'dompurify';
import {
  Mail,
  Send,
  Users,
  MessageSquare,
  TrendingUp,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast aria-live="polite" aria-atomic="true" } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";
import { ResendService } from "@/lib/resend";

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  template: 'weekly' | 'promotional' | 'new_service' | 'blog_update';
  content: string;
  status: 'draft' | 'sent' | 'scheduled';
  sentCount?: number;
  createdAt: string;
}

export const EmailManagement = () => {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);

  // Form state
  const [testEmail, setTestEmail] = useState('');
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    template: 'weekly' as const,
    content: ''
  });

  useEffect(() => {
    loadSubscribers();
    loadCampaigns();
  }, []);

  const loadSubscribers = async () => {
    try {
      const count = await ResendService.getSubscriberCount();
      const subs = await ResendService.getAllSubscribers();
      setSubscriberCount(count);
      setSubscribers(subs);
    } catch (error) {
      console.error('Error loading subscribers:', error);
    }
  };

  const loadCampaigns = () => {
    // Load campaigns from localStorage or database
    const saved = localStorage.getItem('email_campaigns');
    if (saved) {
      setCampaigns(JSON.parse(saved));
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive"
      });
      return;
    }

    setSendingTest(true);
    try {
      await ResendService.sendNewsletter({
        to: testEmail,
        subject: campaignForm.subject || 'Test Email from BM Beauty Studio',
        template: campaignForm.template,
        data: {
          content: campaignForm.content || '<h3>Test Email</h3><p>This is a test email from BM Beauty Studio.</p>',
          unsubscribe_url: `${window.location.origin}/unsubscribe?email=${encodeURIComponent(testEmail)}`,
          manage_url: `${window.location.origin}/manage-newsletter`
        }
      });

      toast aria-live="polite" aria-atomic="true"({
        title: "Success",
        description: "Test email sent successfully!"
      });
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive"
      });
    } finally {
      setSendingTest(false);
    }
  };

  const sendCampaign = async () => {
    if (!campaignForm.name || !campaignForm.subject || !campaignForm.content) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "Please fill in all campaign fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const campaignId = crypto.randomUUID();

    try {
      // Send to all subscribers
      const promises = subscribers.map(subscriber =>
        ResendService.sendNewsletter({
          to: subscriber.email,
          subject: campaignForm.subject,
          template: campaignForm.template,
          data: {
            content: campaignForm.content,
            unsubscribe_url: `${window.location.origin}/unsubscribe?email=${encodeURIComponent(subscriber.email)}`,
            manage_url: `${window.location.origin}/manage-newsletter`
          }
        })
      );

      await Promise.all(promises);

      // Save campaign
      const newCampaign: EmailCampaign = {
        id: campaignId,
        name: campaignForm.name,
        subject: campaignForm.subject,
        template: campaignForm.template,
        content: campaignForm.content,
        status: 'sent',
        sentCount: subscribers.length,
        createdAt: new Date().toISOString()
      };

      const updatedCampaigns = [...campaigns, newCampaign];
      setCampaigns(updatedCampaigns);
      localStorage.setItem('email_campaigns', JSON.stringify(updatedCampaigns));

      // Reset form
      setCampaignForm({
        name: '',
        subject: '',
        template: 'weekly',
        content: ''
      });

      toast aria-live="polite" aria-atomic="true"({
        title: "Success",
        description: `Campaign sent to ${subscribers.length} subscribers!`
      });
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message || "Failed to send campaign",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const previewEmail = () => {
    const preview = window.open('', '_blank');
    if (preview) {
      // Sanitize content to prevent XSS attacks
      const sanitizedContent = DOMPurify.sanitize(campaignForm.content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
        FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'button'],
        FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur']
      });

      preview.document.write(`
        <html>
          <head>
            <title>Email Preview</title>
            <style>
              body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #D4A574; }
              .content { padding: 30px 0; }
              .footer { padding-top: 30px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>✨ BM Beauty Studio & Fitness</h1>
              <p>Your Weekly Beauty & Wellness Update</p>
            </div>
            <div class="content">
              ${sanitizedContent}
            </div>
            <div class="footer">
              <p>You're receiving this email because you subscribed to our newsletter.</p>
              <p><a href="#">Unsubscribe</a> | <a href="#">Manage Preferences</a></p>
              <p>© 2024 Mariia Borysevych. All rights reserved.</p>
            </div>
          </body>
        </html>
      `);
      preview.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Email Management</h2>
          <p className="text-muted-foreground">Manage newsletters and email campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Users className="w-4 h-4 mr-1" />
            {subscriberCount} subscribers
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList>
          <TabsTrigger value="campaigns">
            <Mail className="w-4 h-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="subscribers">
            <Users className="w-4 h-4 mr-2" />
            Subscribers
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Campaign</CardTitle>
              <CardDescription>Send an email campaign to all subscribers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    placeholder="e.g., Weekly Newsletter #25"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="campaign-subject">Subject</Label>
                  <Input
                    id="campaign-subject"
                    placeholder="Email subject line"
                    value={campaignForm.subject}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="campaign-template">Template Type</Label>
                <Select
                  value={campaignForm.template}
                  onValueChange={(value: any) => setCampaignForm(prev => ({ ...prev, template: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly Newsletter</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="new_service">New Service</SelectItem>
                    <SelectItem value="blog_update">Blog Update</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="campaign-content">Email Content (HTML)</Label>
                <Textarea
                  id="campaign-content"
                  placeholder="Enter your email content in HTML format"
                  className="min-h-[200px]"
                  value={campaignForm.content}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={previewEmail} variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button
                  onClick={sendTestEmail}
                  variant="outline"
                  disabled={sendingTest}
                >
                  {sendingTest ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Test
                </Button>
                <div className="flex-1" />
                <Input
                  placeholder="Test email address"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  onClick={sendCampaign}
                  disabled={loading || !campaignForm.name || !campaignForm.subject || !campaignForm.content}
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send to All ({subscriberCount})
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No campaigns sent yet</p>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={campaign.status === 'sent' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{campaign.sentCount || 0} sent</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscriber List</CardTitle>
              <CardDescription>Manage your newsletter subscribers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {subscribers.slice(0, 10).map((subscriber) => (
                  <div key={subscriber.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium">{subscriber.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Subscribed {new Date(subscriber.subscribed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{subscriber.status}</Badge>
                  </div>
                ))}
                {subscribers.length > 10 && (
                  <p className="text-center text-muted-foreground pt-2">
                    ... and {subscribers.length - 10} more subscribers
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Analytics</CardTitle>
              <CardDescription>Track your email performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{subscriberCount}</p>
                  <p className="text-sm text-muted-foreground">Total Subscribers</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{campaigns.length}</p>
                  <p className="text-sm text-muted-foreground">Campaigns Sent</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Emails Delivered</p>
                </div>
              </div>

              <div className="mt-8 p-6 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Email Integration Status
                </h3>
                <p className="text-sm text-muted-foreground">
                  Resend integration is active. Make sure to configure your RESEND_API_KEY in Supabase Edge Functions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};