import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Eye, Globe, Calendar, Settings, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { City } from '@/lib/types/location';
import { cn } from '@/lib/utils';

interface CityFormData {
  name: string;
  countryCode: string;
  region: string;
  seoSlug: string;
  defaultCurrency: string;
  timezone: string;
  latitude: number;
  longitude: number;
  population: number;
  isActive: boolean;
  launchDate: string;
  marketingConfig: string;
  legalConfig: string;
  taxConfig: string;
  localizationConfig: string;
}

export function CityManagement() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<CityFormData>({
    name: '',
    countryCode: 'PL',
    region: '',
    seoSlug: '',
    defaultCurrency: 'PLN',
    timezone: 'Europe/Warsaw',
    latitude: 0,
    longitude: 0,
    population: 0,
    isActive: false,
    launchDate: '',
    marketingConfig: '{}',
    legalConfig: '{}',
    taxConfig: '{}',
    localizationConfig: '{}'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');

      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
      setError('Failed to load cities');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCity = async () => {
    setSaving(true);
    setError(null);

    try {
      const cityData = {
        ...formData,
        marketing_config: JSON.parse(formData.marketingConfig || '{}'),
        legal_config: JSON.parse(formData.legalConfig || '{}'),
        tax_config: JSON.parse(formData.taxConfig || '{}'),
        localization_config: JSON.parse(formData.localizationConfig || '{}')
      };

      const { error } = await supabase
        .from('cities')
        .insert(cityData);

      if (error) throw error;

      setIsCreateModalOpen(false);
      resetForm();
      loadCities();
    } catch (error) {
      console.error('Error creating city:', error);
      setError('Failed to create city');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCity = async () => {
    if (!selectedCity) return;

    setSaving(true);
    setError(null);

    try {
      const updateData = {
        ...formData,
        marketing_config: JSON.parse(formData.marketingConfig || '{}'),
        legal_config: JSON.parse(formData.legalConfig || '{}'),
        tax_config: JSON.parse(formData.taxConfig || '{}'),
        localization_config: JSON.parse(formData.localizationConfig || '{}')
      };

      const { error } = await supabase
        .from('cities')
        .update(updateData)
        .eq('id', selectedCity.id);

      if (error) throw error;

      setIsEditModalOpen(false);
      setSelectedCity(null);
      resetForm();
      loadCities();
    } catch (error) {
      console.error('Error updating city:', error);
      setError('Failed to update city');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCity = async (cityId: string) => {
    if (!confirm('Are you sure you want to delete this city? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cities')
        .delete()
        .eq('id', cityId);

      if (error) throw error;

      loadCities();
    } catch (error) {
      console.error('Error deleting city:', error);
      setError('Failed to delete city');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      countryCode: 'PL',
      region: '',
      seoSlug: '',
      defaultCurrency: 'PLN',
      timezone: 'Europe/Warsaw',
      latitude: 0,
      longitude: 0,
      population: 0,
      isActive: false,
      launchDate: '',
      marketingConfig: '{}',
      legalConfig: '{}',
      taxConfig: '{}',
      localizationConfig: '{}'
    });
    setError(null);
  };

  const handleEditCity = (city: City) => {
    setSelectedCity(city);
    setFormData({
      name: city.name,
      countryCode: city.countryCode,
      region: city.region || '',
      seoSlug: city.slug,
      defaultCurrency: city.defaultCurrency,
      timezone: city.timezone,
      latitude: city.coordinates?.lat || 0,
      longitude: city.coordinates?.lng || 0,
      population: city.population || 0,
      isActive: city.isActive,
      launchDate: city.launchDate || '',
      marketingConfig: JSON.stringify(city.marketingConfig || {}, null, 2),
      legalConfig: JSON.stringify(city.legalConfig || {}, null, 2),
      taxConfig: JSON.stringify(city.taxConfig || {}, null, 2),
      localizationConfig: JSON.stringify(city.localizationConfig || {}, null, 2)
    });
    setIsEditModalOpen(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      seoSlug: generateSlug(name)
    });
  };

  const timezones = [
    'Europe/Warsaw',
    'Europe/Berlin',
    'Europe/Paris',
    'Europe/London',
    'Europe/Madrid',
    'Europe/Rome',
    'Europe/Amsterdam',
    'Europe/Brussels',
    'Europe/Vienna',
    'Europe/Prague'
  ];

  const currencies = [
    { value: 'PLN', label: 'Polish Złoty (PLN)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'GBP', label: 'British Pound (GBP)' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">City Management</h2>
          <p className="text-muted-foreground">Manage cities where your services are available</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add City
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New City</DialogTitle>
              <DialogDescription>
                Add a new city where you want to offer your services
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
                  <Label htmlFor="name">City Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Warsaw"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seoSlug">SEO Slug *</Label>
                  <Input
                    id="seoSlug"
                    value={formData.seoSlug}
                    onChange={(e) => setFormData({ ...formData, seoSlug: e.target.value })}
                    placeholder="warsaw"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="countryCode">Country Code *</Label>
                  <Select value={formData.countryCode} onValueChange={(value) => setFormData({ ...formData, countryCode: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PL">Poland (PL)</SelectItem>
                      <SelectItem value="DE">Germany (DE)</SelectItem>
                      <SelectItem value="FR">France (FR)</SelectItem>
                      <SelectItem value="GB">United Kingdom (GB)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="e.g., Masovian"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone *</Label>
                  <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency *</Label>
                  <Select value={formData.defaultCurrency} onValueChange={(value) => setFormData({ ...formData, defaultCurrency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((curr) => (
                        <SelectItem key={curr.value} value={curr.value}>{curr.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="population">Population</Label>
                  <Input
                    id="population"
                    type="number"
                    value={formData.population}
                    onChange={(e) => setFormData({ ...formData, population: parseInt(e.target.value) || 0 })}
                    placeholder="1000000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="launchDate">Launch Date</Label>
                  <Input
                    id="launchDate"
                    type="date"
                    value={formData.launchDate}
                    onChange={(e) => setFormData({ ...formData, launchDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Coordinates</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      value={formData.latitude || ''}
                      onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                    />
                    <Input
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      value={formData.longitude || ''}
                      onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
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

              <Tabs defaultValue="marketing" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="marketing">Marketing</TabsTrigger>
                  <TabsTrigger value="legal">Legal</TabsTrigger>
                  <TabsTrigger value="tax">Tax</TabsTrigger>
                  <TabsTrigger value="localization">Localization</TabsTrigger>
                </TabsList>

                <TabsContent value="marketing" className="space-y-2">
                  <Label htmlFor="marketingConfig">Marketing Configuration (JSON)</Label>
                  <Textarea
                    id="marketingConfig"
                    value={formData.marketingConfig}
                    onChange={(e) => setFormData({ ...formData, marketingConfig: e.target.value })}
                    placeholder='{"heroTitle": "Beauty in City", "tagline": "Coming Soon"}'
                    rows={5}
                  />
                </TabsContent>

                <TabsContent value="legal" className="space-y-2">
                  <Label htmlFor="legalConfig">Legal Configuration (JSON)</Label>
                  <Textarea
                    id="legalConfig"
                    value={formData.legalConfig}
                    onChange={(e) => setFormData({ ...formData, legalConfig: e.target.value })}
                    placeholder='{"ageRestrictions": {"minAge": 18}}'
                    rows={5}
                  />
                </TabsContent>

                <TabsContent value="tax" className="space-y-2">
                  <Label htmlFor="taxConfig">Tax Configuration (JSON)</Label>
                  <Textarea
                    id="taxConfig"
                    value={formData.taxConfig}
                    onChange={(e) => setFormData({ ...formData, taxConfig: e.target.value })}
                    placeholder='{"vatRate": 0.23}'
                    rows={5}
                  />
                </TabsContent>

                <TabsContent value="localization" className="space-y-2">
                  <Label htmlFor="localizationConfig">Localization Configuration (JSON)</Label>
                  <Textarea
                    id="localizationConfig"
                    value={formData.localizationConfig}
                    onChange={(e) => setFormData({ ...formData, localizationConfig: e.target.value })}
                    placeholder='{"defaultLanguage": "en", "supportedLanguages": [{"code": "en", "name": "English", "flag": "🇬🇧"}], "supportedCurrencies": [{"code": "PLN", "name": "Polish Złoty", "symbol": "zł"}]}'
                    rows={8}
                  />
                  <p className="text-sm text-muted-foreground">
                    Configure language and currency settings for this city. Include supported languages, currencies, and locale-specific formatting.
                  </p>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCity} disabled={saving}>
                  {saving ? 'Creating...' : 'Create City'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Cities</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : cities.length > 0 ? (
            <div className="space-y-4">
              {cities.map((city) => (
                <Card key={city.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{city.name}</h3>
                          <Badge variant={city.isActive ? 'default' : 'secondary'}>
                            {city.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {city.launchDate && new Date(city.launchDate) > new Date() && (
                            <Badge variant="outline">Launching Soon</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {city.region}, {city.countryCode} • Population: {city.population?.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Currency: {city.defaultCurrency}</span>
                          <span>Timezone: {city.timezone}</span>
                          {city.coordinates && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {city.coordinates.lat.toFixed(4)}, {city.coordinates.lng.toFixed(4)}
                            </span>
                          )}
                        </div>
                        {city.launchDate && (
                          <p className="text-sm">
                            <span className="text-muted-foreground">Launch Date: </span>
                            {new Date(city.launchDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCity(city)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/admin/cities/${city.id}/analytics`, '_blank')}
                        >
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/admin/cities/${city.id}/locations`, '_blank')}
                        >
                          <Globe className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCity(city.id)}
                          disabled={city.isActive}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No cities added yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first city to start offering services in multiple locations
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First City
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>City Analytics</CardTitle>
              <CardDescription>
                Overview of city performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{cities.length}</div>
                    <p className="text-sm text-muted-foreground">Total Cities</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">
                      {cities.filter(c => c.isActive).length}
                    </div>
                    <p className="text-sm text-muted-foreground">Active Cities</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">
                      {cities.filter(c => c.launchDate && new Date(c.launchDate) > new Date()).length}
                    </div>
                    <p className="text-sm text-muted-foreground">Coming Soon</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">
                      {cities.reduce((sum, c) => sum + (c.population || 0), 0).toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Population</p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold mb-4">Cities by Population</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>City</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Population</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Launch Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cities
                      .sort((a, b) => (b.population || 0) - (a.population || 0))
                      .map((city) => (
                        <TableRow key={city.id}>
                          <TableCell className="font-medium">{city.name}</TableCell>
                          <TableCell>{city.countryCode}</TableCell>
                          <TableCell>{city.population?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={city.isActive ? 'default' : 'secondary'}>
                              {city.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {city.launchDate
                              ? new Date(city.launchDate).toLocaleDateString()
                              : 'Not set'}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Global Settings</CardTitle>
              <CardDescription>
                Configure global multi-city settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Global settings for multi-city functionality will be implemented here.
                  This includes default currencies, timezones, and regional settings.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit City</DialogTitle>
            <DialogDescription>
              Update city information and settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Same form fields as create modal */}
            <div className="grid grid-cols-2 gap-4">
              {/* Reuse the same form fields from create modal */}
              <div className="space-y-2">
                <Label htmlFor="edit-name">City Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>

              {/* ... include all other form fields ... */}
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCity} disabled={saving}>
                {saving ? 'Updating...' : 'Update City'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CityManagement;