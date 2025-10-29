import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Calendar,
  BarChart3,
  Wrench,
  Layers
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Resource {
  id: string;
  name: string;
  type: 'person' | 'room' | 'equipment' | 'other';
  location_id?: string;
  skills?: string[];
  max_parallel: number;
  capacity: number;
  is_active: boolean;
  status: 'available' | 'busy' | 'maintenance' | 'offline';
  maintenance_schedule?: any;
  locations?: {
    name: string;
    type: string;
  };
  current_usage?: number;
  max_usage?: number;
}

interface Location {
  id: string;
  name: string;
  address?: string;
  type: 'studio' | 'gym' | 'onsite';
  is_active: boolean;
}

const ResourceManagement = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [activeTab, setActiveTab] = useState<'resources' | 'locations' | 'schedule'>('resources');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    type: 'equipment' as 'person' | 'room' | 'equipment' | 'other',
    location_id: '',
    skills: [] as string[],
    max_parallel: '1',
    capacity: '1',
    is_active: true,
    maintenance_schedule: {
      frequency: 'weekly',
      last_maintenance: null,
      next_maintenance: null,
      duration: 60
    }
  });

  const RESOURCE_TYPES = [
    { value: 'person', label: 'Person/Staff', icon: '👤' },
    { value: 'room', label: 'Room/Space', icon: '🏠' },
    { value: 'equipment', label: 'Equipment', icon: '🔧' },
    { value: 'other', label: 'Other', icon: '📦' }
  ];

  const EQUIPMENT_SKILLS = [
    'PMU Machine', 'Microblading Tools', 'Lip Blush Kit',
    'Eyeliner Extensions', 'Massage Table', 'Fitness Equipment',
    'Sound System', 'Lighting', 'Camera Equipment'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resourcesResult, locationsResult] = await Promise.all([
        supabase
          .from('resources')
          .select(`
            *,
            locations (name, type)
          `)
          .order('type', { ascending: true }),
        supabase
          .from('locations')
          .select('*')
          .order('type', { ascending: true })
      ]);

      if (resourcesResult.error) throw resourcesResult.error;
      if (locationsResult.error) throw locationsResult.error;

      setResources(resourcesResult.data || []);
      setLocations(locationsResult.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const saveData = {
        ...formData,
        max_parallel: parseInt(formData.max_parallel),
        capacity: parseInt(formData.capacity),
        skills: formData.type === 'equipment' ? formData.skills : undefined
      };

      let result;
      if (editingResource) {
        result = await supabase
          .from('resources')
          .update(saveData)
          .eq('id', editingResource.id);
      } else {
        result = await supabase
          .from('resources')
          .insert(saveData);
      }

      if (result.error) throw result.error;

      toast({
        title: 'Success',
        description: `Resource ${editingResource ? 'updated' : 'created'} successfully`
      });

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleToggleStatus = async (resourceId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ status: newStatus })
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Resource status updated to ${newStatus}`
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Resource deleted successfully'
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'equipment',
      location_id: '',
      skills: [],
      max_parallel: '1',
      capacity: '1',
      is_active: true,
      maintenance_schedule: {
        frequency: 'weekly',
        last_maintenance: null,
        next_maintenance: null,
        duration: 60
      }
    });
    setEditingResource(null);
  };

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      name: resource.name,
      type: resource.type,
      location_id: resource.location_id || '',
      skills: resource.skills || [],
      max_parallel: resource.max_parallel.toString(),
      capacity: resource.capacity.toString(),
      is_active: resource.is_active,
      maintenance_schedule: resource.maintenance_schedule || {
        frequency: 'weekly',
        last_maintenance: null,
        next_maintenance: null,
        duration: 60
      }
    });
    setDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4 text-sage" />;
      case 'busy': return <Clock className="w-4 h-4 text-champagne" />;
      case 'maintenance': return <Wrench className="w-4 h-4 text-bronze" />;
      case 'offline': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-pearl/40" />;
    }
  };

  const getTypeIcon = (type: string) => {
    const resourceType = RESOURCE_TYPES.find(t => t.value === type);
    return resourceType?.icon || '📦';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-champagne" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-serif text-pearl flex items-center gap-3">
                <Layers className="w-6 h-6 text-champagne" />
                Resource Management
              </CardTitle>
              <p className="text-pearl/60 mt-2">
                Manage equipment, rooms, and resources for optimal scheduling
              </p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              className="bg-champagne text-charcoal hover:bg-champagne/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="glass-card p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Package className="w-5 h-5 text-champagne" />
              <span className="text-2xl font-bold text-pearl">{resources.length}</span>
            </div>
            <p className="text-sm text-pearl/60">Total Resources</p>
            <p className="text-xs text-sage">
              {resources.filter(r => r.is_active).length} active
            </p>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <CheckCircle className="w-5 h-5 text-sage" />
              <span className="text-2xl font-bold text-pearl">
                {resources.filter(r => r.status === 'available').length}
              </span>
            </div>
            <p className="text-sm text-pearl/60">Available</p>
            <p className="text-xs text-pearl/40">Ready for use</p>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Wrench className="w-5 h-5 text-bronze" />
              <span className="text-2xl font-bold text-pearl">
                {resources.filter(r => r.status === 'maintenance').length}
              </span>
            </div>
            <p className="text-sm text-pearl/60">In Maintenance</p>
            <p className="text-xs text-pearl/40">Scheduled service</p>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <MapPin className="w-5 h-5 text-champagne" />
              <span className="text-2xl font-bold text-pearl">{locations.length}</span>
            </div>
            <p className="text-sm text-pearl/60">Locations</p>
            <p className="text-xs text-pearl/40">
              {locations.filter(l => l.is_active).length} active
            </p>
          </div>
        </Card>
      </div>

      {/* Resources List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-pearl">Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-pearl/10">
                <TableHead className="text-pearl">Resource</TableHead>
                <TableHead className="text-pearl">Type</TableHead>
                <TableHead className="text-pearl">Location</TableHead>
                <TableHead className="text-pearl">Capacity</TableHead>
                <TableHead className="text-pearl">Status</TableHead>
                <TableHead className="text-pearl">Utilization</TableHead>
                <TableHead className="text-pearl text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource) => (
                <TableRow key={resource.id} className="border-pearl/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTypeIcon(resource.type)}</span>
                      <div>
                        <div className="font-medium text-pearl">{resource.name}</div>
                        {resource.type === 'equipment' && resource.skills && resource.skills.length > 0 && (
                          <div className="text-sm text-pearl/60">
                            {resource.skills.slice(0, 2).join(', ')}
                            {resource.skills.length > 2 && '...'}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {resource.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-pearl">
                      {resource.locations?.name || 'Unassigned'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-pearl">
                      {resource.capacity} {resource.max_parallel > 1 && `(×${resource.max_parallel})`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(resource.status)}
                      <span className="text-sm capitalize text-pearl">{resource.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-pearl/60">Usage</span>
                        <span className="text-pearl">75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Select
                        value={resource.status}
                        onValueChange={(value) => handleToggleStatus(resource.id, value)}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="busy">Busy</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="offline">Offline</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditResource(resource)}
                        className="text-pearl hover:bg-pearl/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteResource(resource.id)}
                        className="text-red-400 hover:bg-red-400/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Resource Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-pearl">
              {editingResource ? 'Edit Resource' : 'Add New Resource'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveResource} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-pearl/70">Resource Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-cocoa/20 border-pearl/20 text-pearl"
                  placeholder="e.g., PMU Machine #1"
                  required
                />
              </div>
              <div>
                <Label className="text-pearl/70">Type</Label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger className="bg-cocoa/20 border-pearl/20 text-pearl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          {type.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-pearl/70">Location</Label>
              <Select value={formData.location_id} onValueChange={(v) => setFormData({ ...formData, location_id: v })}>
                <SelectTrigger className="bg-cocoa/20 border-pearl/20 text-pearl">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'equipment' && (
              <div>
                <Label className="text-pearl/70">Skills/Services</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {EQUIPMENT_SKILLS.map(skill => (
                    <Badge
                      key={skill}
                      variant={formData.skills.includes(skill) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const newSkills = formData.skills.includes(skill)
                          ? formData.skills.filter(s => s !== skill)
                          : [...formData.skills, skill];
                        setFormData({ ...formData, skills: newSkills });
                      }}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-pearl/70">Capacity</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="bg-cocoa/20 border-pearl/20 text-pearl"
                  required
                />
              </div>
              <div>
                <Label className="text-pearl/70">Max Parallel Usage</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.max_parallel}
                  onChange={(e) => setFormData({ ...formData, max_parallel: e.target.value })}
                  className="bg-cocoa/20 border-pearl/20 text-pearl"
                  required
                />
              </div>
            </div>

            {formData.type === 'equipment' && (
              <Card className="glass-card p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Wrench className="w-4 h-4 text-bronze" />
                  <Label className="text-pearl font-medium">Maintenance Schedule</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-pearl/70 text-sm">Frequency</Label>
                    <Select
                      value={formData.maintenance_schedule.frequency}
                      onValueChange={(v) => setFormData({
                        ...formData,
                        maintenance_schedule: { ...formData.maintenance_schedule, frequency: v }
                      })}
                    >
                      <SelectTrigger className="bg-cocoa/20 border-pearl/20 text-pearl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-pearl/70 text-sm">Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={formData.maintenance_schedule.duration}
                      onChange={(e) => setFormData({
                        ...formData,
                        maintenance_schedule: { ...formData.maintenance_schedule, duration: parseInt(e.target.value) }
                      })}
                      className="bg-cocoa/20 border-pearl/20 text-pearl"
                    />
                  </div>
                </div>
              </Card>
            )}

            <div className="flex items-center justify-between glass-card p-4 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-pearl font-medium">Active Status</Label>
                <p className="text-xs text-pearl/60">Resource can be scheduled for bookings</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1 border-pearl/20 text-pearl hover:bg-cocoa/50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-champagne text-charcoal hover:bg-champagne/90"
              >
                {editingResource ? 'Update Resource' : 'Add Resource'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResourceManagement;