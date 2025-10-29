import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Eye, Clock, Phone, Mail, Globe, Navigation } from 'lucide-react';

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
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Location, City } from '@/lib/types/location';
import { cn } from '@/lib/utils';

interface LocationFormData {
  name: string;
  type: 'studio' | 'gym' | 'online' | 'mobile';
  cityId: string;
  address: string;
  latitude: number;
  longitude: number;
  timezone: string;
  phone: string;
  email: string;
  website: string;
  operatingHours: string;
  servicesOffered: string[];
  isActive: boolean;
  isPrimary: boolean;
  metadata: string;
}

interface OperatingHours {
  [day: string]: {
    open?: string;
    close?: string;
    closed?: boolean;
    breaks?: Array<{
      start: string;
      end: string;
    }>;
  };
}

export function LocationManagement({ cityId }: { cityId?: string }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    type: 'studio',
    cityId: cityId || '',
    address: '',
    latitude: 0,
    longitude: 0,
    timezone: 'Europe/Warsaw',
    phone: '',
    email: '',
    website: '',
    operatingHours: JSON.stringify(getDefaultOperatingHours(), null, 2),
    servicesOffered: [],
    isActive: true,
    isPrimary: false,
    metadata: '{}'
  });

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    if (cityId) {
      setFormData({ ...formData, cityId });
    }
    loadLocations();
    loadCities();
  }, [cityId]);

  const loadLocations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('locations')
        .select('*')
        .order('is_primary_location', { ascending: false })
        .order('name');

      if (cityId) {
        query = query.eq('city_id', cityId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
      setError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async () => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name, country_code')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const handleCreateLocation = async () => {
    setSaving(true);
    setError(null);

    try {
      const locationData = {
        ...formData,
        operating_hours: JSON.parse(formData.operatingHours || '{}'),
        services_offered: formData.servicesOffered,
        location_metadata: JSON.parse(formData.metadata || '{}'),
        launched_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('locations')
        .insert(locationData);

      if (error) throw error;

      setIsCreateModalOpen(false);
      resetForm();
      loadLocations();
    } catch (error) {
      console.error('Error creating location:', error);
      setError('Failed to create location');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLocation = async () => {
    if (!selectedLocation) return;

    setSaving(true);
    setError(null);

    try {
      const updateData = {
        ...formData,
        operating_hours: JSON.parse(formData.operatingHours || '{}'),
        services_offered: formData.servicesOffered,
        location_metadata: JSON.parse(formData.metadata || '{}')
      };

      const { error } = await supabase
        .from('locations')
        .update(updateData)
        .eq('id', selectedLocation.id);

      if (error) throw error;

      setIsEditModalOpen(false);
      setSelectedLocation(null);
      resetForm();
      loadLocations();
    } catch (error) {
      console.error('Error updating location:', error);
      setError('Failed to update location');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId);

      if (error) throw error;

      loadLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      setError('Failed to delete location');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'studio',
      cityId: cityId || '',
      address: '',
      latitude: 0,
      longitude: 0,
      timezone: 'Europe/Warsaw',
      phone: '',
      email: '',
      website: '',
      operatingHours: JSON.stringify(getDefaultOperatingHours(), null, 2),
      servicesOffered: [],
      isActive: true,
      isPrimary: false,
      metadata: '{}'
    });
    setError(null);
  };

  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      type: location.type,
      cityId: location.cityId,
      address: location.address,
      latitude: location.coordinates?.lat || 0,
      longitude: location.coordinates?.lng || 0,
      timezone: location.timezone,
      phone: location.phone,
      email: location.email,
      website: location.website || '',
      operatingHours: JSON.stringify(location.operatingHours || {}, null, 2),
      servicesOffered: location.servicesOffered || [],
      isActive: location.isActive,
      isPrimary: location.isPrimary,
      metadata: JSON.stringify(location.metadata || {}, null, 2)
    });
    setIsEditModalOpen(true);
  };

  const handleGetCoordinates = async () => {
    if (!formData.address) {
      setError('Please enter an address first');
      return;
    }

    try {
      // Use a geocoding service (you'll need to implement this)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'MariiaHub/1.0'
          }
        }
      );

      const data = await response.json();
      if (data && data.length > 0) {
        setFormData({
          ...formData,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        });
      } else {
        setError('Could not find coordinates for this address');
      }
    } catch (error) {
      console.error('Error getting coordinates:', error);
      setError('Failed to get coordinates');
    }
  };

  const locationTypes = [
    { value: 'studio', label: 'Beauty Studio' },
    { value: 'gym', label: 'Fitness Center' },
    { value: 'online', label: 'Online/Remote' },
    { value: 'mobile', label: 'Mobile Service' }
  ];

  const serviceTypes = [
    'permanent-makeup',
    'brow-lamination',
    'makeup',
    'lash-lift',
    'personal-training',
    'glute-training',
    'fitness-classes',
    'yoga',
    'pilates',
    'nutrition'
  ];

  function getDefaultOperatingHours(): OperatingHours {
    return {
      monday: { open: '09:00', close: '20:00' },
      tuesday: { open: '09:00', close: '20:00' },
      wednesday: { open: '09:00', close: '20:00' },
      thursday: { open: '09:00', close: '20:00' },
      friday: { open: '09:00', close: '20:00' },
      saturday: { open: '10:00', close: '18:00' },
      sunday: { closed: true }
    };
  }

  const updateOperatingHours = (day: string, field: string, value: any) => {
    const hours = JSON.parse(formData.operatingHours || '{}');
    hours[day] = { ...hours[day], [field]: value };
    setFormData({ ...formData, operatingHours: JSON.stringify(hours, null, 2) });
  };

  const toggleServiceOffered = (service: string) => {
    const services = [...formData.servicesOffered];
    const index = services.indexOf(service);
    if (index > -1) {
      services.splice(index, 1);
    } else {
      services.push(service);
    }
    setFormData({ ...formData, servicesOffered: services });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Location Management</h2>
          <p className="text-muted-foreground">
            Manage physical and virtual locations where services are offered
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
              <DialogDescription>
                Add a new location where you offer your services
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="hours">Hours</TabsTrigger>
                  <TabsTrigger value="services">Services</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Location Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., BM BEAUTY Studio"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Location Type *</Label>
                      <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {locationTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Select value={formData.cityId} onValueChange={(value) => setFormData({ ...formData, cityId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city.id} value={city.id}>
                              {city.name}, {city.countryCode}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Enter full address"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGetCoordinates}
                          disabled={!formData.address}
                        >
                          <Navigation className="h-4 w-4" />
                        </Button>
                      </div>
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

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input
                        id="timezone"
                        value={formData.timezone}
                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                        placeholder="Europe/Warsaw"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+48 123 456 789"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                        <Label htmlFor="isActive">Active</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isPrimary"
                          checked={formData.isPrimary}
                          onCheckedChange={(checked) => setFormData({ ...formData, isPrimary: checked })}
                        />
                        <Label htmlFor="isPrimary">Primary Location</Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="hours" className="space-y-4">
                  <Label>Operating Hours</Label>
                  <div className="space-y-3">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      <div key={day} className="flex items-center gap-4 p-3 border rounded">
                        <div className="w-24 capitalize">{day}</div>
                        <Checkbox
                          checked={!JSON.parse(formData.operatingHours || '{}')[day]?.closed}
                          onCheckedChange={(checked) => updateOperatingHours(day, 'closed', !checked)}
                        />
                        {!JSON.parse(formData.operatingHours || '{}')[day]?.closed && (
                          <>
                            <Input
                              type="time"
                              value={JSON.parse(formData.operatingHours || '{}')[day]?.open || ''}
                              onChange={(e) => updateOperatingHours(day, 'open', e.target.value)}
                              className="w-32"
                            />
                            <span>to</span>
                            <Input
                              type="time"
                              value={JSON.parse(formData.operatingHours || '{}')[day]?.close || ''}
                              onChange={(e) => updateOperatingHours(day, 'close', e.target.value)}
                              className="w-32"
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="services" className="space-y-4">
                  <Label>Services Offered at This Location</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {serviceTypes.map((service) => (
                      <div key={service} className="flex items-center space-x-2">
                        <Checkbox
                          id={service}
                          checked={formData.servicesOffered.includes(service)}
                          onCheckedChange={() => toggleServiceOffered(service)}
                        />
                        <Label htmlFor={service} className="capitalize">
                          {service.replace('-', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateLocation} disabled={saving}>
                  {saving ? 'Creating...' : 'Create Location'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Locations List */}
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
      ) : locations.length > 0 ? (
        <div className="space-y-4">
          {locations.map((location) => (
            <Card key={location.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{location.name}</h3>
                      <Badge variant="outline">{location.type}</Badge>
                      {location.isPrimary && (
                        <Badge variant="default">Primary</Badge>
                      )}
                      {!location.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{location.address}</p>
                    <div className="flex items-center gap-4 text-sm">
                      {location.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {location.phone}
                        </span>
                      )}
                      {location.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {location.email}
                        </span>
                      )}
                      {location.website && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <a href={location.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Website
                          </a>
                        </span>
                      )}
                    </div>
                    {location.coordinates && (
                      <p className="text-xs text-muted-foreground">
                        <MapPin className="inline h-3 w-3 mr-1" />
                        {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                      </p>
                    )}
                    {location.servicesOffered && location.servicesOffered.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {location.servicesOffered.map((service) => (
                          <Badge key={service} variant="secondary" className="text-xs">
                            {service.replace('-', ' ')}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditLocation(location)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/admin/locations/${location.id}/analytics`, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteLocation(location.id)}
                      disabled={location.isPrimary}
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
            <h3 className="text-lg font-semibold mb-2">No locations added yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first location to start offering services
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Location
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default LocationManagement;