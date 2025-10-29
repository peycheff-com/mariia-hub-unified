import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, FileText, Eye, AlertTriangle, CheckCircle, Users } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ComplianceFormData {
  cityId: string;
  countryCode: string;
  requirementType: string;
  documentUrl: string;
  consentRequired: boolean;
  ageRestriction: number;
  mandatoryDisclaimers: string[];
  integrationConfig: string;
  isActive: boolean;
}

interface TaxFormData {
  cityId: string;
  taxType: string;
  taxRate: number;
  taxCode: string;
  isCompound: boolean;
  applicableServiceTypes: string[];
  exemptionRules: string;
  effectiveDate: string;
  expiresDate: string;
  isActive: boolean;
}

export function ComplianceManagement() {
  const [legalRequirements, setLegalRequirements] = useState<any[]>([]);
  const [taxConfigs, setTaxConfigs] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [complianceLogs, setComplianceLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('requirements');
  const [activeModalTab, setActiveModalTab] = useState('legal');

  const [formData, setFormData] = useState<ComplianceFormData>({
    cityId: '',
    countryCode: 'PL',
    requirementType: 'data_privacy',
    documentUrl: '',
    consentRequired: false,
    ageRestriction: 0,
    mandatoryDisclaimers: [],
    integrationConfig: '{}',
    isActive: true
  });

  const [taxFormData, setTaxFormData] = useState<TaxFormData>({
    cityId: '',
    taxType: 'vat',
    taxRate: 0.23,
    taxCode: '',
    isCompound: false,
    applicableServiceTypes: [],
    exemptionRules: '{}',
    effectiveDate: new Date().toISOString().split('T')[0],
    expiresDate: '',
    isActive: true
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load legal requirements
      const { data: legalData } = await supabase
        .from('legal_requirements')
        .select(`
          *,
          cities!inner(name, country_code)
        `)
        .order('created_at', { ascending: false });

      // Load tax configurations
      const { data: taxData } = await supabase
        .from('city_tax_config')
        .select(`
          *,
          cities!inner(name, country_code)
        `)
        .order('created_at', { ascending: false });

      // Load cities
      const { data: citiesData } = await supabase
        .from('cities')
        .select('id, name, country_code')
        .eq('is_active', true)
        .order('name');

      // Load compliance logs (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: logsData } = await supabase
        .from('compliance_logs')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (legalData) setLegalRequirements(legalData);
      if (taxData) setTaxConfigs(taxData);
      if (citiesData) setCities(citiesData);
      if (logsData) setComplianceLogs(logsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequirement = async () => {
    setSaving(true);
    setError(null);

    try {
      const requirementData = {
        ...formData,
        mandatory_disclaimers: formData.mandatoryDisclaimers,
        integration_config: JSON.parse(formData.integrationConfig || '{}')
      };

      const { error } = await supabase
        .from('legal_requirements')
        .insert(requirementData);

      if (error) throw error;

      setIsCreateModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating requirement:', error);
      setError('Failed to create requirement');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTaxConfig = async () => {
    setSaving(true);
    setError(null);

    try {
      const taxData = {
        ...taxFormData,
        applicable_service_types: taxFormData.applicableServiceTypes,
        exemption_rules: JSON.parse(taxFormData.exemptionRules || '{}')
      };

      const { error } = await supabase
        .from('city_tax_config')
        .insert(taxData);

      if (error) throw error;

      setIsTaxModalOpen(false);
      resetTaxForm();
      loadData();
    } catch (error) {
      console.error('Error creating tax config:', error);
      setError('Failed to create tax configuration');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      cityId: '',
      countryCode: 'PL',
      requirementType: 'data_privacy',
      documentUrl: '',
      consentRequired: false,
      ageRestriction: 0,
      mandatoryDisclaimers: [],
      integrationConfig: '{}',
      isActive: true
    });
    setError(null);
  };

  const resetTaxForm = () => {
    setTaxFormData({
      cityId: '',
      taxType: 'vat',
      taxRate: 0.23,
      taxCode: '',
      isCompound: false,
      applicableServiceTypes: [],
      exemptionRules: '{}',
      effectiveDate: new Date().toISOString().split('T')[0],
      expiresDate: '',
      isActive: true
    });
    setError(null);
  };

  const requirementTypes = [
    { value: 'data_privacy', label: 'Data Privacy (GDPR)' },
    { value: 'consumer_rights', label: 'Consumer Rights' },
    { value: 'health_safety', label: 'Health & Safety' },
    { value: 'age_verification', label: 'Age Verification' },
    { value: 'licensing', label: 'Licensing' }
  ];

  const taxTypes = [
    { value: 'vat', label: 'VAT (Value Added Tax)' },
    { value: 'service_tax', label: 'Service Tax' },
    { value: 'tourism_tax', label: 'Tourism Tax' },
    { value: 'local_tax', label: 'Local Tax' }
  ];

  const serviceTypes = [
    'beauty',
    'fitness',
    'lifestyle',
    'permanent-makeup',
    'brow-lamination',
    'makeup',
    'personal-training',
    'glute-training'
  ];

  const addDisclaimer = () => {
    const newDisclaimer = prompt('Enter disclaimer text:');
    if (newDisclaimer) {
      setFormData({
        ...formData,
        mandatoryDisclaimers: [...formData.mandatoryDisclaimers, newDisclaimer]
      });
    }
  };

  const removeDisclaimer = (index: number) => {
    setFormData({
      ...formData,
      mandatoryDisclaimers: formData.mandatoryDisclaimers.filter((_, i) => i !== index)
    });
  };

  const toggleServiceType = (service: string) => {
    const services = [...taxFormData.applicableServiceTypes];
    const index = services.indexOf(service);
    if (index > -1) {
      services.splice(index, 1);
    } else {
      services.push(service);
    }
    setTaxFormData({ ...taxFormData, applicableServiceTypes: services });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compliance Management</h2>
          <p className="text-muted-foreground">
            Manage legal requirements and tax configurations by location
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsTaxModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Tax Config
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Requirement
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="requirements">Legal Requirements</TabsTrigger>
          <TabsTrigger value="tax">Tax Configuration</TabsTrigger>
          <TabsTrigger value="logs">Compliance Logs</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="requirements">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : legalRequirements.length > 0 ? (
            <div className="space-y-4">
              {legalRequirements.map((req) => (
                <Card key={req.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold capitalize">
                            {req.requirement_type.replace('_', ' ')}
                          </h3>
                          <Badge variant={req.is_active ? 'default' : 'secondary'}>
                            {req.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {req.consent_required && (
                            <Badge variant="outline">Consent Required</Badge>
                          )}
                          {req.age_restriction && (
                            <Badge variant="destructive">18+</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {req.cities?.name}, {req.cities?.country_code}
                        </p>
                        {req.document_url && (
                          <a
                            href={req.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            <FileText className="inline h-3 w-3 mr-1" />
                            View Document
                          </a>
                        )}
                        {req.mandatory_disclaimers && req.mandatory_disclaimers.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Mandatory Disclaimers:</p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
                              {req.mandatory_disclaimers.map((disclaimer: string, i: number) => (
                                <li key={i}>{disclaimer}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No legal requirements configured</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first legal requirement to ensure compliance
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tax">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : taxConfigs.length > 0 ? (
            <div className="space-y-4">
              {taxConfigs.map((tax) => (
                <Card key={tax.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">
                            {tax.tax_type.toUpperCase()} - {tax.cities?.name}
                          </h3>
                          <Badge variant={tax.is_active ? 'default' : 'secondary'}>
                            {tax.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">
                            {(tax.tax_rate * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Tax Code: {tax.tax_code || 'N/A'}
                        </p>
                        <p className="text-sm">
                          Effective: {tax.effective_date}
                          {tax.expires_date && ` to ${tax.expires_date}`}
                        </p>
                        {tax.applicable_service_types && tax.applicable_service_types.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {tax.applicable_service_types.map((service: string) => (
                              <Badge key={service} variant="secondary" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tax configurations found</h3>
                <p className="text-muted-foreground mb-4">
                  Configure tax rules for your cities
                </p>
                <Button onClick={() => setIsTaxModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Configure Tax
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Recent Compliance Events</CardTitle>
              <CardDescription>
                Track consent, verification, and compliance events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {complianceLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complianceLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="capitalize">{log.event_type.replace('_', ' ')}</TableCell>
                        <TableCell>{log.user_id ? 'Authenticated' : 'Guest'}</TableCell>
                        <TableCell>{log.city_id || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <CheckCircle className="h-3 w-3 mr-1 inline" />
                            Completed
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No compliance events logged yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Requirements</p>
                    <p className="text-2xl font-bold">{legalRequirements.length}</p>
                  </div>
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Tax Configs</p>
                    <p className="text-2xl font-bold">
                      {taxConfigs.filter(t => t.is_active).length}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Recent Events</p>
                    <p className="text-2xl font-bold">{complianceLogs.length}</p>
                  </div>
                  <Eye className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Compliance Status by City</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cities.map((city) => {
                  const cityRequirements = legalRequirements.filter(r => r.city_id === city.id || r.city_id === null);
                  const cityTaxConfigs = taxConfigs.filter(t => t.city_id === city.id);

                  return (
                    <div key={city.id} className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <p className="font-medium">{city.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {city.country_code}
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Requirements</p>
                          <p className="font-bold">{cityRequirements.length}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Tax Rules</p>
                          <p className="font-bold">{cityTaxConfigs.length}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Legal Requirements Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Legal Requirement</DialogTitle>
            <DialogDescription>
              Configure a legal requirement for compliance
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Select value={formData.cityId} onValueChange={(value) => setFormData({ ...formData, cityId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city or leave empty for global" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Apply to All Cities</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}, {city.country_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirementType">Requirement Type</Label>
                <Select value={formData.requirementType} onValueChange={(value) => setFormData({ ...formData, requirementType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {requirementTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentUrl">Document URL</Label>
                <Input
                  id="documentUrl"
                  value={formData.documentUrl}
                  onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                  placeholder="https://example.com/document"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ageRestriction">Age Restriction</Label>
                <Input
                  id="ageRestriction"
                  type="number"
                  value={formData.ageRestriction}
                  onChange={(e) => setFormData({ ...formData, ageRestriction: parseInt(e.target.value) || 0 })}
                  placeholder="18"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="consentRequired"
                  checked={formData.consentRequired}
                  onCheckedChange={(checked) => setFormData({ ...formData, consentRequired: checked })}
                />
                <Label htmlFor="consentRequired">Consent Required</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRequirement} disabled={saving}>
                {saving ? 'Creating...' : 'Create Requirement'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tax Configuration Modal */}
      <Dialog open={isTaxModalOpen} onOpenChange={setIsTaxModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure Tax</DialogTitle>
            <DialogDescription>
              Set up tax configuration for a city
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxCity">City *</Label>
                <Select value={taxFormData.cityId} onValueChange={(value) => setTaxFormData({ ...taxFormData, cityId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}, {city.country_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxType">Tax Type *</Label>
                <Select value={taxFormData.taxType} onValueChange={(value) => setTaxFormData({ ...taxFormData, taxType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taxTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (decimal) *</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  value={taxFormData.taxRate}
                  onChange={(e) => setTaxFormData({ ...taxFormData, taxRate: parseFloat(e.target.value) || 0 })}
                  placeholder="0.23"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxCode">Tax Code</Label>
                <Input
                  id="taxCode"
                  value={taxFormData.taxCode}
                  onChange={(e) => setTaxFormData({ ...taxFormData, taxCode: e.target.value })}
                  placeholder="VAT23"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Effective Date *</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={taxFormData.effectiveDate}
                  onChange={(e) => setTaxFormData({ ...taxFormData, effectiveDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresDate">Expires Date</Label>
                <Input
                  id="expiresDate"
                  type="date"
                  value={taxFormData.expiresDate}
                  onChange={(e) => setTaxFormData({ ...taxFormData, expiresDate: e.target.value })}
                  placeholder="Leave empty for permanent"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isCompound"
                  checked={taxFormData.isCompound}
                  onCheckedChange={(checked) => setTaxFormData({ ...taxFormData, isCompound: checked })}
                />
                <Label htmlFor="isCompound">Compound Tax</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="taxActive"
                  checked={taxFormData.isActive}
                  onCheckedChange={(checked) => setTaxFormData({ ...taxFormData, isActive: checked })}
                />
                <Label htmlFor="taxActive">Active</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsTaxModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTaxConfig} disabled={saving}>
                {saving ? 'Creating...' : 'Create Tax Config'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ComplianceManagement;