import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Award,
  Phone,
  Mail,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  EyeOff,
  MoreHorizontal,
  UserCheck,
  UserX
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StaffMember {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role_id: string;
  skills: string[];
  specializations: string[];
  hire_date?: string;
  termination_date?: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'freelance';
  hourly_rate?: number;
  commission_rate?: number;
  max_daily_hours: number;
  work_days: number[];
  avatar_url?: string;
  bio?: string;
  is_active: boolean;
  staff_roles?: {
    name: string;
    level: number;
    permissions: any;
  };
}

interface StaffRole {
  id: string;
  name: string;
  description?: string;
  permissions: any;
  level: number;
  is_system_role: boolean;
}

const StaffManagement = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [activeTab, setActiveTab] = useState<'staff' | 'roles' | 'availability'>('staff');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role_id: '',
    skills: [] as string[],
    specializations: [] as string[],
    employment_type: 'full_time' as const,
    hourly_rate: '',
    commission_rate: '',
    max_daily_hours: '8',
    work_days: [1, 2, 3, 4, 5],
    bio: '',
    is_active: true
  });

  const AVAILABLE_SKILLS = ['beauty', 'fitness', 'massage', 'nutrition', 'yoga', 'pilates'];
  const SPECIALIZATIONS = [
    'PMU', 'Microblading', 'Lip Blush', 'Eyeliner Extensions',
    'Personal Training', 'Group Fitness', 'Nutrition Coaching',
    'Deep Tissue Massage', 'Swedish Massage', 'Sports Massage'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [staffResult, rolesResult] = await Promise.all([
        supabase
          .from('staff_members')
          .select(`
            *,
            staff_roles (
              name,
              level,
              permissions
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('staff_roles')
          .select('*')
          .order('level', { ascending: false })
      ]);

      if (staffResult.error) throw staffResult.error;
      if (rolesResult.error) throw rolesResult.error;

      setStaff(staffResult.data || []);
      setRoles(rolesResult.data || []);
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

  const filteredStaff = staff.filter(member => {
    const matchesSearch = `${member.first_name} ${member.last_name} ${member.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role_id === filterRole;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && member.is_active) ||
      (filterStatus === 'inactive' && !member.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const saveData = {
        ...formData,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        commission_rate: formData.commission_rate ? parseFloat(formData.commission_rate) : null,
        max_daily_hours: parseInt(formData.max_daily_hours)
      };

      let result;
      if (editingStaff) {
        result = await supabase
          .from('staff_members')
          .update(saveData)
          .eq('id', editingStaff.id);
      } else {
        result = await supabase
          .from('staff_members')
          .insert(saveData);
      }

      if (result.error) throw result.error;

      toast({
        title: 'Success',
        description: `Staff member ${editingStaff ? 'updated' : 'created'} successfully`
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

  const handleToggleStatus = async (staffId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('staff_members')
        .update({
          is_active: !currentStatus,
          termination_date: currentStatus ? new Date().toISOString() : null
        })
        .eq('id', staffId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Staff member ${currentStatus ? 'deactivated' : 'activated'}`
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

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('staff_members')
        .delete()
        .eq('id', staffId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Staff member deleted successfully'
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
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role_id: '',
      skills: [],
      specializations: [],
      employment_type: 'full_time',
      hourly_rate: '',
      commission_rate: '',
      max_daily_hours: '8',
      work_days: [1, 2, 3, 4, 5],
      bio: '',
      is_active: true
    });
    setEditingStaff(null);
  };

  const handleEditStaff = (member: StaffMember) => {
    setEditingStaff(member);
    setFormData({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone || '',
      role_id: member.role_id,
      skills: member.skills || [],
      specializations: member.specializations || [],
      employment_type: member.employment_type,
      hourly_rate: member.hourly_rate?.toString() || '',
      commission_rate: member.commission_rate?.toString() || '',
      max_daily_hours: member.max_daily_hours.toString(),
      work_days: member.work_days || [1, 2, 3, 4, 5],
      bio: member.bio || '',
      is_active: member.is_active
    });
    setDialogOpen(true);
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
                <Users className="w-6 h-6 text-champagne" />
                Staff Management
              </CardTitle>
              <p className="text-pearl/60 mt-2">
                Manage team members, roles, and availability
              </p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              className="bg-champagne text-charcoal hover:bg-champagne/90"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Staff Member
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="glass-card p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Users className="w-5 h-5 text-champagne" />
              <span className="text-2xl font-bold text-pearl">{staff.length}</span>
            </div>
            <p className="text-sm text-pearl/60">Total Staff</p>
            <p className="text-xs text-sage">
              {staff.filter(s => s.is_active).length} active
            </p>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <UserCheck className="w-5 h-5 text-sage" />
              <span className="text-2xl font-bold text-pearl">
                {staff.filter(s => s.employment_type === 'full_time').length}
              </span>
            </div>
            <p className="text-sm text-pearl/60">Full-Time</p>
            <p className="text-xs text-pearl/40">Permanent staff</p>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Award className="w-5 h-5 text-bronze" />
              <span className="text-2xl font-bold text-pearl">
                {roles.filter(r => r.level >= 80).length}
              </span>
            </div>
            <p className="text-sm text-pearl/60">Admin Level</p>
            <p className="text-xs text-pearl/40">With privileges</p>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Clock className="w-5 h-5 text-champagne" />
              <span className="text-2xl font-bold text-pearl">
                {staff.reduce((acc, s) => acc + (s.max_daily_hours || 0), 0)}
              </span>
            </div>
            <p className="text-sm text-pearl/60">Daily Hours</p>
            <p className="text-xs text-pearl/40">Total capacity</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="glass-card p-1">
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Staff Members
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Roles & Permissions
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Availability
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-4">
          {/* Filters */}
          <Card className="glass-card p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pearl/40" />
                <Input
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-cocoa/20 border-pearl/20 text-pearl"
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-48 bg-cocoa/20 border-pearl/20 text-pearl">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48 bg-cocoa/20 border-pearl/20 text-pearl">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="border-pearl/20 text-pearl hover:bg-cocoa/50">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </Card>

          {/* Staff Table */}
          <Card className="glass-card">
            <Table>
              <TableHeader>
                <TableRow className="border-pearl/10">
                  <TableHead className="text-pearl">Staff Member</TableHead>
                  <TableHead className="text-pearl">Role</TableHead>
                  <TableHead className="text-pearl">Skills</TableHead>
                  <TableHead className="text-pearl">Employment</TableHead>
                  <TableHead className="text-pearl">Status</TableHead>
                  <TableHead className="text-pearl text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => (
                  <TableRow key={member.id} className="border-pearl/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback className="bg-champagne/20 text-charcoal">
                            {member.first_name[0]}{member.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-pearl">
                            {member.first_name} {member.last_name}
                          </div>
                          <div className="text-sm text-pearl/60 flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </div>
                          {member.phone && (
                            <div className="text-sm text-pearl/40 flex items-center gap-2">
                              <Phone className="w-3 h-3" />
                              {member.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          member.staff_roles?.level >= 80 ? 'bg-bronze/20 text-bronze border-bronze/30' :
                          member.staff_roles?.level >= 60 ? 'bg-sage/20 text-sage border-sage/30' :
                          'bg-pearl/20 text-pearl border-pearl/30'
                        }
                      >
                        {member.staff_roles?.name || 'No Role'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {member.skills.slice(0, 2).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {member.skills.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{member.skills.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-pearl">
                        <div className="capitalize">{member.employment_type.replace('_', ' ')}</div>
                        {member.hourly_rate && (
                          <div className="text-pearl/60">
                            {member.hourly_rate} PLN/hr
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={member.is_active}
                          onCheckedChange={() => handleToggleStatus(member.id, member.is_active)}
                        />
                        <span className={`text-sm ${member.is_active ? 'text-sage' : 'text-pearl/40'}`}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditStaff(member)}
                          className="text-pearl hover:bg-pearl/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteStaff(member.id)}
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
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-pearl">Roles & Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-pearl/10">
                    <TableHead className="text-pearl">Role Name</TableHead>
                    <TableHead className="text-pearl">Description</TableHead>
                    <TableHead className="text-pearl">Level</TableHead>
                    <TableHead className="text-pearl">Permissions</TableHead>
                    <TableHead className="text-pearl text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id} className="border-pearl/5">
                      <TableCell className="font-medium text-pearl">
                        {role.name}
                        {role.is_system_role && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            System
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-pearl/60">
                        {role.description || 'No description'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            role.level >= 80 ? 'bg-bronze/20 text-bronze' :
                            role.level >= 60 ? 'bg-sage/20 text-sage' :
                            'bg-pearl/20 text-pearl'
                          }
                        >
                          Level {role.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-pearl/60">
                          {Object.keys(role.permissions || {}).length} resources
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-pearl hover:bg-pearl/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-pearl">Staff Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-pearl/60">Availability management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Staff Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-pearl">
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveStaff} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-pearl/70">First Name</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="bg-cocoa/20 border-pearl/20 text-pearl"
                  required
                />
              </div>
              <div>
                <Label className="text-pearl/70">Last Name</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="bg-cocoa/20 border-pearl/20 text-pearl"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-pearl/70">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-cocoa/20 border-pearl/20 text-pearl"
                  required
                />
              </div>
              <div>
                <Label className="text-pearl/70">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-cocoa/20 border-pearl/20 text-pearl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-pearl/70">Role</Label>
                <Select value={formData.role_id} onValueChange={(v) => setFormData({ ...formData, role_id: v })}>
                  <SelectTrigger className="bg-cocoa/20 border-pearl/20 text-pearl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name} (Level {role.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-pearl/70">Employment Type</Label>
                <Select value={formData.employment_type} onValueChange={(v: any) => setFormData({ ...formData, employment_type: v })}>
                  <SelectTrigger className="bg-cocoa/20 border-pearl/20 text-pearl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-pearl/70">Skills</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {AVAILABLE_SKILLS.map(skill => (
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

            <div>
              <Label className="text-pearl/70">Specializations</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SPECIALIZATIONS.map(spec => (
                  <Badge
                    key={spec}
                    variant={formData.specializations.includes(spec) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => {
                      const newSpecs = formData.specializations.includes(spec)
                        ? formData.specializations.filter(s => s !== spec)
                        : [...formData.specializations, spec];
                      setFormData({ ...formData, specializations: newSpecs });
                    }}
                  >
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-pearl/70">Hourly Rate (PLN)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                  className="bg-cocoa/20 border-pearl/20 text-pearl"
                />
              </div>
              <div>
                <Label className="text-pearl/70">Commission Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  max="100"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                  className="bg-cocoa/20 border-pearl/20 text-pearl"
                />
              </div>
              <div>
                <Label className="text-pearl/70">Max Daily Hours</Label>
                <Input
                  type="number"
                  value={formData.max_daily_hours}
                  onChange={(e) => setFormData({ ...formData, max_daily_hours: e.target.value })}
                  className="bg-cocoa/20 border-pearl/20 text-pearl"
                />
              </div>
            </div>

            <div>
              <Label className="text-pearl/70">Bio</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="bg-cocoa/20 border-pearl/20 text-pearl min-h-[100px]"
                placeholder="Brief biography..."
              />
            </div>

            <div className="flex items-center justify-between glass-card p-4 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-pearl font-medium">Active Status</Label>
                <p className="text-xs text-pearl/60">Staff member can be assigned to services</p>
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
                {editingStaff ? 'Update Staff' : 'Add Staff'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagement;