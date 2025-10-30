import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Eye, Download, Bell, CheckCircle, AlertCircle, Clock, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { PrivacyPolicyVersion, PolicyAcceptance } from '@/types/gdpr';

interface PolicyChange {
  version: string;
  title: string;
  summary: string;
  changes: string[];
  effectiveDate: string;
  requiresReconsent: boolean;
}

export function PrivacyPolicyManager() {
  const [policies, setPolicies] = useState<PrivacyPolicyVersion[]>([]);
  const [acceptances, setAcceptances] = useState<PolicyAcceptance[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<PrivacyPolicyVersion | null>(null);
  const [currentPolicy, setCurrentPolicy] = useState<PrivacyPolicyVersion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load all policy versions
      const { data: policiesData } = await supabase
        .from('privacy_policy_versions')
        .select('*')
        .order('effective_date', { ascending: false });

      // Load user's policy acceptances
      const { data: acceptancesData } = await supabase
        .from('policy_acceptances')
        .select(`
          *,
          privacy_policy_versions!inner(
            version,
            title,
            effective_date
          )
        `)
        .order('accepted_at', { ascending: false });

      setPolicies(policiesData || []);
      setAcceptances(acceptancesData || []);
      setCurrentPolicy(policiesData?.find(p => p.is_active) || null);
    } catch (error) {
      console.error('Error loading privacy policy data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptPolicy = async (policyId: string) => {
    try {
      const { error } = await supabase
        .from('policy_acceptances')
        .insert({
          policy_id: policyId,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
        });

      if (error) throw error;

      // Reload acceptances
      const { data: newAcceptances } = await supabase
        .from('policy_acceptances')
        .select(`
          *,
          privacy_policy_versions!inner(
            version,
            title,
            effective_date
          )
        `)
        .order('accepted_at', { ascending: false });

      setAcceptances(newAcceptances || []);
    } catch (error) {
      console.error('Error accepting policy:', error);
      throw error;
    }
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const formatPolicyContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-5 mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mt-4 mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^\* (.*$)/gim, '<li class="ml-6">$1</li>')
      .replace(/\n\n/gim, '</p><p class="mb-4">')
      .replace(/^/, '<p class="mb-4">')
      .replace(/$/, '</p>');
  };

  const hasAcceptedCurrentPolicy = () => {
    if (!currentPolicy) return false;
    return acceptances.some(a => a.policy_id === currentPolicy.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FileText className="w-8 h-8 mx-auto mb-3 animate-pulse text-muted-foreground" />
          <p className="text-muted-foreground">Loading privacy policies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Privacy Policy Management</h2>
        <p className="text-muted-foreground">
          View and manage privacy policy versions and your consent records.
        </p>
      </div>

      {/* Current Policy Alert */}
      {currentPolicy && !hasAcceptedCurrentPolicy() && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Action Required:</strong> Please review and accept the latest privacy policy version {currentPolicy.version} effective {new Date(currentPolicy.effective_date).toLocaleDateString()}.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="current" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current Policy</TabsTrigger>
          <TabsTrigger value="history">Version History</TabsTrigger>
          <TabsTrigger value="acceptances">Your Consents</TabsTrigger>
        </TabsList>

        {/* Current Policy */}
        <TabsContent value="current" className="space-y-4">
          {currentPolicy ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Privacy Policy v{currentPolicy.version}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Calendar className="w-4 h-4" />
                      Effective: {new Date(currentPolicy.effective_date).toLocaleDateString()}
                      <Badge variant="outline" className="ml-2">
                        Active
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Privacy Policy v{currentPolicy.version}
                          </DialogTitle>
                          <DialogDescription>
                            Effective: {new Date(currentPolicy.effective_date).toLocaleDateString()}
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-[60vh] pr-4">
                          <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: formatPolicyContent(currentPolicy.content)
                            }}
                          />
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>

                    {!hasAcceptedCurrentPolicy() && (
                      <Button
                        onClick={() => acceptPolicy(currentPolicy.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept Policy
                      </Button>
                    )}

                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentPolicy.summary && (
                    <div>
                      <h4 className="font-medium mb-2">Summary</h4>
                      <p className="text-sm text-muted-foreground">{currentPolicy.summary}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Created: {new Date(currentPolicy.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Updated: {new Date(currentPolicy.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No active privacy policy found.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Version History */}
        <TabsContent value="history" className="space-y-4">
          <div className="space-y-4">
            {policies.map((policy) => (
              <Card key={policy.id} className={`${policy.is_active ? 'border-primary' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Privacy Policy v{policy.version}
                        {policy.is_active && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Effective: {new Date(policy.effective_date).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPolicy(policy)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <FileText className="w-5 h-5" />
                              Privacy Policy v{policy.version}
                            </DialogTitle>
                            <DialogDescription>
                              Effective: {new Date(policy.effective_date).toLocaleDateString()}
                              {!policy.is_active && (
                                <span className="text-orange-600 ml-2">
                                  (Superseded)
                                </span>
                              )}
                            </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="h-[60vh] pr-4">
                            <div
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: formatPolicyContent(policy.content)
                              }}
                            />
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>

                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {policy.summary && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">{policy.summary}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {policies.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No privacy policy versions found.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* User Acceptances */}
        <TabsContent value="acceptances" className="space-y-4">
          <div className="space-y-4">
            {acceptances.map((acceptance) => (
              <Card key={acceptance.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Privacy Policy v{acceptance.privacy_policy_versions.version}
                      </CardTitle>
                      <CardDescription>
                        Accepted on {new Date(acceptance.accepted_at).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      Accepted
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>Policy: {acceptance.privacy_policy_versions.title}</div>
                    <div>Effective Date: {new Date(acceptance.privacy_policy_versions.effective_date).toLocaleDateString()}</div>
                    {acceptance.ip_address && (
                      <div>IP Address: {acceptance.ip_address}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {acceptances.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>You haven't accepted any privacy policies yet.</p>
                  <p className="text-sm mt-1">Review the current policy and provide your consent.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Policy Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            About Our Privacy Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">What We Cover</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Types of personal data we collect</li>
                <li>• How and why we use your data</li>
                <li>• Who we share your data with</li>
                <li>• How long we keep your data</li>
                <li>• Your rights under GDPR</li>
                <li>• International data transfers</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Your Rights</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Right to access your personal data</li>
                <li>• Right to correct inaccurate data</li>
                <li>• Right to delete your data</li>
                <li>• Right to data portability</li>
                <li>• Right to restrict processing</li>
                <li>• Right to object to processing</li>
              </ul>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> By using our services, you acknowledge that you have read, understood, and agree to our privacy policy.
              We will notify you of any significant changes to the policy and may request your consent when required by law.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}