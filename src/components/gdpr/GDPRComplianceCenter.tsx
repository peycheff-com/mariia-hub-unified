import React from 'react';
import { Shield, Eye, FileText, Users, Database, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DataSubjectRights } from '@/components/gdpr/DataSubjectRights';
import { ProcessingRegister } from '@/components/gdpr/ProcessingRegister';
import { PrivacyPolicyManager } from '@/components/gdpr/PrivacyPolicyManager';
import { CookieSettingsButton } from '@/components/gdpr/CookieBanner';
import { useGDPR } from '@/contexts/GDPRContext';

export function GDPRComplianceCenter() {
  const { complianceStatus, hasGivenConsent } = useGDPR();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/5 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">GDPR Compliance Center</h1>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Manage your privacy settings, exercise your data rights, and learn how we protect your personal information
            in accordance with the General Data Protection Regulation (GDPR).
          </p>
        </div>
      </div>

      {/* Status Overview */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                {hasGivenConsent ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
                Consent Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge variant={hasGivenConsent ? "default" : "secondary"} className="w-full justify-center py-2">
                  {hasGivenConsent ? 'Consent Given' : 'Action Required'}
                </Badge>
                <p className="text-sm text-green-700">
                  {hasGivenConsent
                    ? 'You have provided consent for data processing activities.'
                    : 'Please review and provide consent for data processing activities.'
                  }
                </p>
                <div className="pt-2">
                  <CookieSettingsButton />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Data Rights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Exercise your GDPR rights to access, correct, port, or delete your personal data.
                </p>
                {complianceStatus?.hasOutstandingRequests && (
                  <Badge variant="outline" className="w-full justify-center py-2">
                    {complianceStatus.pendingRequests.length} Pending Request(s)
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5" />
                Transparency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  View our processing register and understand how we handle your data.
                </p>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>• Processing Activities</span>
                  <span>• Data Logs</span>
                  <span>• Policies</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="rights" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="rights" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Your Rights
            </TabsTrigger>
            <TabsTrigger value="processing" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Processing Register
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Privacy Policies
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Cookie Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rights">
            <DataSubjectRights />
          </TabsContent>

          <TabsContent value="processing">
            <ProcessingRegister />
          </TabsContent>

          <TabsContent value="policies">
            <PrivacyPolicyManager />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Cookie & Consent Settings
                </CardTitle>
                <CardDescription>
                  Manage your cookie preferences and consent settings at any time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Current Consent Preferences</h3>
                    {complianceStatus?.consentCategories ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(complianceStatus.consentCategories).map(([category, granted]) => (
                          <div key={category} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className={`w-3 h-3 rounded-full ${granted ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <div>
                              <div className="font-medium capitalize">{category}</div>
                              <div className="text-sm text-muted-foreground">
                                {granted ? 'Granted' : 'Not granted'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No consent preferences recorded yet.</p>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <CookieSettingsButton />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Information Section */}
        <div className="mt-12 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Your GDPR Rights Explained
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Control Over Your Data</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Access and download copies of your personal data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Request correction of inaccurate personal data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Request deletion of your personal data (right to be forgotten)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Receive your data in a portable, machine-readable format</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Transparency & Security</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Clear information about data processing activities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Granular control over cookie preferences</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Access to privacy policy versions and changes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Right to object to or restrict data processing</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
              <CardDescription>
                If you have questions about GDPR compliance or need assistance with your data rights, our dedicated privacy team is here to help.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Privacy Email</h4>
                  <p className="text-sm text-muted-foreground">privacy@mariaborysevych.com</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Data Protection Officer</h4>
                  <p className="text-sm text-muted-foreground">dpo@mariaborysevych.com</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Response Time</h4>
                  <p className="text-sm text-muted-foreground">Within 30 days of request</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}