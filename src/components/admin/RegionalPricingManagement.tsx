import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy, DollarSign, TrendingUp, Calendar } from 'lucide-react';

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

interface PricingFormData {
  serviceId: string;
  cityId: string;
  locationId: string;
  basePrice: number;
  currency: string;
  taxRate: number;
  validFrom: string;
  validUntil: string;
  priceAdjustments: string;
  isActive: boolean;
}

export function RegionalPricingManagement() {
  const [pricingList, setPricingList] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<PricingFormData>({
    serviceId: '',
    cityId: '',
    locationId: '',
    basePrice: 0,
    currency: 'PLN',
    taxRate: 0.23,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    priceAdjustments: '{}',
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load pricing
      const { data: pricingData } = await supabase
        .from('regional_pricing')
        .select(`
          *,
          services!inner(title, service_type),
          cities!inner(name, country_code),
          locations!inner(name, address)
        `)
        .order('created_at', { ascending: false });

      // Load services
      const { data: servicesData } = await supabase
        .from('services')
        .select('id, title, service_type, price_from, price_to')
        .eq('is_active', true)
        .order('title');

      // Load cities
      const { data: citiesData } = await supabase
        .from('cities')
        .select('id, name, country_code')
        .eq('is_active', true)
        .order('name');

      // Load locations
      const { data: locationsData } = await supabase
        .from('locations')
        .select('id, name, city_id, address')
        .eq('is_active', true)
        .order('name');

      if (pricingData) setPricingList(pricingData);
      if (servicesData) setServices(servicesData);
      if (citiesData) setCities(citiesData);
      if (locationsData) setLocations(locationsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePricing = async () => {
    setSaving(true);
    setError(null);

    try {
      const pricingData = {
        ...formData,
        price_adjustments: JSON.parse(formData.priceAdjustments || '{}')
      };

      const { error } = await supabase
        .from('regional_pricing')
        .insert(pricingData);

      if (error) throw error;

      setIsCreateModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating pricing:', error);
      setError('Failed to create pricing rule');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePricing = async (pricingId: string) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('regional_pricing')
        .delete()
        .eq('id', pricingId);

      if (error) throw error;

      loadData();
    } catch (error) {
      console.error('Error deleting pricing:', error);
      setError('Failed to delete pricing rule');
    }
  };

  const handleDuplicatePricing = async (pricing: any) => {
    const duplicateData = {
      service_id: pricing.service_id,
      city_id: pricing.city_id,
      location_id: pricing.location_id,
      base_price: pricing.base_price,
      currency: pricing.currency,
      tax_rate: pricing.tax_rate,
      valid_from: new Date().toISOString().split('T')[0],
      price_adjustments: pricing.price_adjustments,
      is_active: false
    };

    try {
      const { error } = await supabase
        .from('regional_pricing')
        .insert(duplicateData);

      if (error) throw error;

      loadData();
    } catch (error) {
      console.error('Error duplicating pricing:', error);
      setError('Failed to duplicate pricing rule');
    }
  };

  const resetForm = () => {
    setFormData({
      serviceId: '',
      cityId: '',
      locationId: '',
      basePrice: 0,
      currency: 'PLN',
      taxRate: 0.23,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '',
      priceAdjustments: '{}',
      isActive: true
    });
    setError(null);
  };

  const handleCityChange = (cityId: string) => {
    setFormData({
      ...formData,
      cityId,
      locationId: ''
    });
  };

  const filteredLocations = locations.filter(
    loc => !formData.cityId || loc.city_id === formData.cityId
  );

  const currencies = [
    { value: 'PLN', label: 'PLN' },
    { value: 'EUR', label: 'EUR' },
    { value: 'USD', label: 'USD' },
    { value: 'GBP', label: 'GBP' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Regional Pricing</h2>
          <p className="text-muted-foreground">
            Manage pricing rules for different cities and locations
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Pricing Rule
        </Button>
      </div>

      {/* Pricing Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rules</p>
                <p className="text-2xl font-bold">{pricingList.length}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold">
                  {pricingList.filter(p => p.is_active).length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cities Covered</p>
                <p className="text-2xl font-bold">
                  {new Set(pricingList.map(p => p.city_id)).size}
                </p>
              </div>
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Price</p>
                <p className="text-2xl font-bold">
                  {pricingList.length > 0
                    ? Math.round(
                        pricingList.reduce((sum, p) => sum + p.base_price, 0) / pricingList.length
                      )
                    : 0}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing List */}
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
      ) : pricingList.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricingList.map((pricing) => (
                  <TableRow key={pricing.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{pricing.services?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {pricing.services?.service_type}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {pricing.cities?.name}, {pricing.cities?.country_code}
                    </TableCell>
                    <TableCell>
                      {pricing.locations?.name || 'All Locations'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {pricing.currency} {pricing.base_price}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{(pricing.tax_rate * 100).toFixed(0)}%</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>From: {pricing.valid_from}</p>
                        {pricing.valid_until && (
                          <p>Until: {pricing.valid_until}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pricing.is_active ? 'default' : 'secondary'}>
                        {pricing.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicatePricing(pricing)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePricing(pricing.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pricing rules yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first regional pricing rule to get started
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Pricing Rule
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Pricing Rule</DialogTitle>
            <DialogDescription>
              Set pricing for a specific service in a location
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
                <Label htmlFor="service">Service *</Label>
                <Select value={formData.serviceId} onValueChange={(value) => setFormData({ ...formData, serviceId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.title} ({service.service_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Select value={formData.cityId} onValueChange={handleCityChange}>
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
                <Label htmlFor="location">Location</Label>
                <Select
                  value={formData.locationId}
                  onValueChange={(value) => setFormData({ ...formData, locationId: value })}
                  disabled={!formData.cityId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.cityId ? "Select location" : "Select city first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Locations in City</SelectItem>
                    {filteredLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="basePrice">Base Price *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                  placeholder="100.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.value} value={curr.value}>
                        {curr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (decimal)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                  placeholder="0.23"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid From *</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  placeholder="Leave empty for no expiry"
                />
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
              <Button onClick={handleCreatePricing} disabled={saving}>
                {saving ? 'Creating...' : 'Create Rule'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RegionalPricingManagement;