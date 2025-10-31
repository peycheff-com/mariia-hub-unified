// Wellness Programs Management System
// Comprehensive program creation, management, and tracking for corporate wellness

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  Clock,
  Target,
  Award,
  Heart,
  Brain,
  Activity,
  Apple,
  Shield,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Play,
  Pause,
  Square,
  BarChart3,
  Download,
  Upload,
  FileText,
  Video,
  BookOpen,
  Gift,
  Star,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  XCircle,
  UserPlus,
  UserCheck,
  UserX,
  CalendarDays,
  DollarSign,
  Settings,
  ChevronDown,
  Filter,
  RefreshCw,
  Search,
  Zap,
  Trophy,
    Flame,
    Smile,
    Moon
} from 'lucide-react';
import { format, addDays, differenceInDays, isAfter, isBefore } from 'date-fns';

import { useCorporate } from '@/contexts/CorporateWellnessContext';
import {
  CorporateWellnessProgram,
  ProgramEnrollment,
  CorporateEmployee,
  CreateWellnessProgramRequest,
  ProgramRequirements,
  ProgramRewards,
  ProgramMaterials
} from '@/types/corporate';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Button
} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Input
} from '@/components/ui/input';
import {
  Label
} from '@/components/ui/label';
import {
  Textarea
} from '@/components/ui/textarea';
import {
  Badge
} from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Switch
} from '@/components/ui/switch';
import {
  Progress
} from '@/components/ui/progress';
import {
  ScrollArea
} from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import {
  DatePickerWithRange
} from '@/components/ui/date-picker';


interface WellnessProgramsProps {
  corporateAccountId: string;
  employees: CorporateEmployee[];
  className?: string;
}

interface ProgramFormData extends Omit<CreateWellnessProgramRequest, 'corporate_account_id'> {
  is_recurring: boolean;
  recurrence_pattern?: string;
  auto_enroll_departments: string[];
  program_image?: string;
}

const PROGRAM_TYPES = [
  {
    value: 'fitness_challenge',
    label: 'Fitness Challenge',
    icon: Activity,
    color: '#3b82f6',
    description: 'Physical activity and fitness programs'
  },
  {
    value: 'mental_health',
    label: 'Mental Health',
    icon: Brain,
    color: '#10b981',
    description: 'Mental wellness and stress management'
  },
  {
    value: 'nutrition',
    label: 'Nutrition',
    icon: Apple,
    color: '#f59e0b',
    description: 'Healthy eating and nutrition education'
  },
  {
    value: 'preventive_care',
    label: 'Preventive Care',
    icon: Shield,
    color: '#8b5cf6',
    description: 'Health screenings and preventive services'
  },
  {
    value: 'stress_management',
    label: 'Stress Management',
    icon: Sparkles,
    color: '#ec4899',
    description: 'Stress reduction and mindfulness programs'
  }
] as const;

const PROGRAM_STATUS = {
  draft: { label: 'Draft', icon: FileText, color: 'secondary' },
  active: { label: 'Active', icon: Play, color: 'default' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'outline' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'destructive' }
} as const;

const ENROLLMENT_STATUS = {
  enrolled: { label: 'Enrolled', icon: UserPlus, color: 'default' },
  active: { label: 'Active', icon: UserCheck, color: 'default' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'outline' },
  dropped: { label: 'Dropped', icon: UserX, color: 'destructive' },
  suspended: { label: 'Suspended', icon: Pause, color: 'secondary' }
} as const;

export const WellnessPrograms: React.FC<WellnessProgramsProps> = ({
  corporateAccountId,
  employees,
  className
}) => {
  const { programs, enrollments, createProgram, updateProgram, deleteProgram, enrollEmployee, loadPrograms, loadEnrollments } = useCorporate();
  const { toast } = useToast();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showEnrollmentDialog, setShowEnrollmentDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<CorporateWellnessProgram | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Form state
  const [formData, setFormData] = useState<ProgramFormData>({
    program_name: '',
    program_description: '',
    program_type: 'fitness_challenge',
    duration_weeks: 8,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(addDays(new Date(), 56), 'yyyy-MM-dd'),
    max_participants: 50,
    budget_per_participant: 100,
    total_budget: 5000,
    requirements: {
      minimum_participation: 3,
      health_check_required: false,
      fitness_level: 'all',
      equipment_needed: [],
      time_commitment: '2 hours per week',
      prerequisites: []
    },
    rewards: {
      completion_bonus: 50,
      milestones: [],
      incentives: []
    },
    materials: {
      welcome_kit: '',
      guides: [],
      videos: [],
      resources: [],
      schedules: [],
      tracking_tools: []
    },
    is_recurring: false,
    auto_enroll_departments: []
  });

  // Filter programs
  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.program_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         program.program_description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || program.program_type === selectedType;
    const matchesStatus = selectedStatus === 'all' || program.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    totalPrograms: programs.length,
    activePrograms: programs.filter(p => p.status === 'active').length,
    totalParticipants: programs.reduce((sum, p) => sum + p.current_participants, 0),
    completedPrograms: programs.filter(p => p.status === 'completed').length,
    totalBudget: programs.reduce((sum, p) => sum + (p.total_budget || 0), 0),
    averageParticipation: programs.length > 0
      ? programs.reduce((sum, p) => sum + p.current_participants, 0) / programs.length
      : 0
  };

  // Get program type icon and color
  const getProgramTypeInfo = (type: string) => {
    return PROGRAM_TYPES.find(t => t.value === type) || PROGRAM_TYPES[0];
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusInfo = PROGRAM_STATUS[status as keyof typeof PROGRAM_STATUS];
    if (!statusInfo) return null;

    const Icon = statusInfo.icon;
    return (
      <Badge variant={statusInfo.color as any} className="gap-1">
        <Icon className="w-3 h-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  // Get enrollment status badge
  const getEnrollmentBadge = (status: string) => {
    const statusInfo = ENROLLMENT_STATUS[status as keyof typeof ENROLLMENT_STATUS];
    if (!statusInfo) return null;

    const Icon = statusInfo.icon;
    return (
      <Badge variant={statusInfo.color as any} className="gap-1">
        <Icon className="w-3 h-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  // Handle form changes
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle nested form changes
  const handleNestedChange = (category: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [field]: value
      }
    }));
  };

  // Create or update program
  const handleSaveProgram = async () => {
    try {
      if (!formData.program_name || !formData.program_description) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      const programData = {
        corporate_account_id: corporateAccountId,
        ...formData
      };

      if (selectedProgram) {
        await updateProgram(selectedProgram.id, programData);
        toast({
          title: 'Success',
          description: 'Program updated successfully'
        });
      } else {
        await createProgram(programData);
        toast({
          title: 'Success',
          description: 'Program created successfully'
        });
      }

      setShowCreateDialog(false);
      setShowEditDialog(false);
      setSelectedProgram(null);
      resetForm();
      await loadPrograms(corporateAccountId);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save program',
        variant: 'destructive'
      });
    }
  };

  // Delete program
  const handleDeleteProgram = async (programId: string) => {
    if (!confirm('Are you sure you want to delete this program? This action cannot be undone.')) return;

    try {
      await deleteProgram(programId);
      toast({
        title: 'Success',
        description: 'Program deleted successfully'
      });
      await loadPrograms(corporateAccountId);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete program',
        variant: 'destructive'
      });
    }
  };

  // Bulk enroll employees
  const handleBulkEnroll = async () => {
    if (!selectedProgram || selectedEmployees.length === 0) return;

    try {
      await Promise.all(
        selectedEmployees.map(employeeId => enrollEmployee(selectedProgram.id, employeeId))
      );

      toast({
        title: 'Success',
        description: `${selectedEmployees.length} employees enrolled successfully`
      });

      setShowEnrollmentDialog(false);
      setSelectedEmployees([]);
      setSelectedProgram(null);
      await loadEnrollments({ program_id: selectedProgram.id });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to enroll employees',
        variant: 'destructive'
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      program_name: '',
      program_description: '',
      program_type: 'fitness_challenge',
      duration_weeks: 8,
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(addDays(new Date(), 56), 'yyyy-MM-dd'),
      max_participants: 50,
      budget_per_participant: 100,
      total_budget: 5000,
      requirements: {
        minimum_participation: 3,
        health_check_required: false,
        fitness_level: 'all',
        equipment_needed: [],
        time_commitment: '2 hours per week',
        prerequisites: []
      },
      rewards: {
        completion_bonus: 50,
        milestones: [],
        incentives: []
      },
      materials: {
        welcome_kit: '',
        guides: [],
        videos: [],
        resources: [],
        schedules: [],
        tracking_tools: []
      },
      is_recurring: false,
      auto_enroll_departments: []
    });
  };

  // Edit program
  const handleEditProgram = (program: CorporateWellnessProgram) => {
    setSelectedProgram(program);
    setFormData({
      program_name: program.program_name,
      program_description: program.program_description,
      program_type: program.program_type,
      duration_weeks: program.duration_weeks || 8,
      start_date: program.start_date || format(new Date(), 'yyyy-MM-dd'),
      end_date: program.end_date || format(addDays(new Date(), 56), 'yyyy-MM-dd'),
      max_participants: program.max_participants || 50,
      budget_per_participant: program.budget_per_participant || 100,
      total_budget: program.total_budget || 5000,
      requirements: program.requirements,
      rewards: program.rewards,
      materials: program.materials,
      is_recurring: false,
      auto_enroll_departments: []
    });
    setShowEditDialog(true);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrograms}</div>
            <div className="text-xs text-muted-foreground">
              {stats.activePrograms} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalParticipants}</div>
            <div className="text-xs text-muted-foreground">
              Avg. {stats.averageParticipation.toFixed(0)} per program
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Programs</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedPrograms}</div>
            <div className="text-xs text-muted-foreground">
              This year
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalBudget.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              Allocated for programs
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {programs.length > 0
                ? Math.round(
                    (programs.filter(p => p.status === 'completed').length / programs.length) * 100
                  )
                : 0}%
            </div>
            <div className="text-xs text-muted-foreground">
              Program completion
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Wellness Programs</CardTitle>
              <CardDescription>
                Manage corporate wellness programs and employee participation
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowCreateDialog(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Program
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {PROGRAM_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(PROGRAM_STATUS).map(([value, info]) => (
                  <SelectItem key={value} value={value}>
                    {info.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Program Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrograms.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium">No programs found</h3>
                <p className="text-muted-foreground">
                  Create your first wellness program to get started
                </p>
              </div>
            ) : (
              filteredPrograms.map((program) => {
                const typeInfo = getProgramTypeInfo(program.program_type);
                const Icon = typeInfo.icon;
                const progress = program.max_participants
                  ? (program.current_participants / program.max_participants) * 100
                  : 0;
                const daysLeft = program.end_date
                  ? differenceInDays(new Date(program.end_date), new Date())
                  : 0;

                return (
                  <Card key={program.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${typeInfo.color}20` }}
                          >
                            <Icon className="w-5 h-5" style={{ color: typeInfo.color }} />
                          </div>
                          <div>
                            <CardTitle className="text-base">{program.program_name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{typeInfo.label}</p>
                          </div>
                        </div>
                        {getStatusBadge(program.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {program.program_description}
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Participants
                          </span>
                          <span>
                            {program.current_participants} / {program.max_participants || '∞'}
                          </span>
                        </div>
                        {program.max_participants && (
                          <Progress value={Math.min(progress, 100)} className="h-2" />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {program.start_date && (
                          <div className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3 text-muted-foreground" />
                            <span>{format(new Date(program.start_date), 'MMM d')}</span>
                          </div>
                        )}
                        {program.end_date && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className={daysLeft < 7 ? 'text-orange-600' : ''}>
                              {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
                            </span>
                          </div>
                        )}
                      </div>

                      {program.budget_per_participant && (
                        <div className="flex items-center justify-between text-sm">
                          <span>Budget per participant</span>
                          <span className="font-medium">€{program.budget_per_participant}</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditProgram(program)}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedProgram(program);
                            setShowEnrollmentDialog(true);
                          }}
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Enroll
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="w-4 h-4 mr-2" />
                              View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteProgram(program.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Program Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          setSelectedProgram(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProgram ? 'Edit Program' : 'Create New Program'}
            </DialogTitle>
            <DialogDescription>
              {selectedProgram
                ? 'Update program details and settings'
                : 'Create a new wellness program for employees'
              }
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="program_name">Program Name *</Label>
                  <Input
                    id="program_name"
                    value={formData.program_name}
                    onChange={(e) => handleFormChange('program_name', e.target.value)}
                    placeholder="e.g., 30-Day Fitness Challenge"
                  />
                </div>
                <div>
                  <Label htmlFor="program_type">Program Type *</Label>
                  <Select
                    value={formData.program_type}
                    onValueChange={(value: any) => handleFormChange('program_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROGRAM_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" style={{ color: type.color }} />
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="program_description">Program Description *</Label>
                <Textarea
                  id="program_description"
                  value={formData.program_description}
                  onChange={(e) => handleFormChange('program_description', e.target.value)}
                  placeholder="Describe the program, goals, and what employees will experience..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="duration_weeks">Duration (Weeks)</Label>
                  <Input
                    id="duration_weeks"
                    type="number"
                    value={formData.duration_weeks}
                    onChange={(e) => handleFormChange('duration_weeks', parseInt(e.target.value) || 0)}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="max_participants">Max Participants</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => handleFormChange('max_participants', parseInt(e.target.value) || 0)}
                    min="1"
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div>
                  <Label htmlFor="budget_per_participant">Budget Per Participant (€)</Label>
                  <Input
                    id="budget_per_participant"
                    type="number"
                    value={formData.budget_per_participant}
                    onChange={(e) => handleFormChange('budget_per_participant', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleFormChange('start_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleFormChange('end_date', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="requirements" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minimum_participation">Minimum Participation (Days/Week)</Label>
                  <Input
                    id="minimum_participation"
                    type="number"
                    value={formData.requirements.minimum_participation}
                    onChange={(e) => handleNestedChange('requirements', 'minimum_participation', parseInt(e.target.value) || 0)}
                    min="1"
                    max="7"
                  />
                </div>
                <div>
                  <Label htmlFor="time_commitment">Time Commitment</Label>
                  <Input
                    id="time_commitment"
                    value={formData.requirements.time_commitment}
                    onChange={(e) => handleNestedChange('requirements', 'time_commitment', e.target.value)}
                    placeholder="e.g., 2 hours per week"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fitness_level">Fitness Level</Label>
                <Select
                  value={formData.requirements.fitness_level}
                  onValueChange={(value: any) => handleNestedChange('requirements', 'fitness_level', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="all">All Levels</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="health_check_required">Health Check Required</Label>
                  <Switch
                    id="health_check_required"
                    checked={formData.requirements.health_check_required}
                    onCheckedChange={(checked) =>
                      handleNestedChange('requirements', 'health_check_required', checked)
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Equipment Needed</Label>
                <Input
                  placeholder="Enter equipment separated by commas"
                  value={formData.requirements.equipment_needed.join(', ')}
                  onChange={(e) =>
                    handleNestedChange(
                      'requirements',
                      'equipment_needed',
                      e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    )
                  }
                />
              </div>

              <div>
                <Label>Prerequisites</Label>
                <Textarea
                  placeholder="List any prerequisites or requirements"
                  value={formData.requirements.prerequisites.join('\n')}
                  onChange={(e) =>
                    handleNestedChange(
                      'requirements',
                      'prerequisites',
                      e.target.value.split('\n').filter(Boolean)
                    )
                  }
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="rewards" className="space-y-4">
              <div>
                <Label htmlFor="completion_bonus">Completion Bonus (€)</Label>
                <Input
                  id="completion_bonus"
                  type="number"
                  value={formData.rewards.completion_bonus}
                  onChange={(e) => handleNestedChange('rewards', 'completion_bonus', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <Label>Milestone Rewards</Label>
                <div className="space-y-2 mt-2">
                  {[
                    { key: 'week1', label: 'Week 1 Completion' },
                    { key: 'week2', label: 'Week 2 Completion' },
                    { key: 'week4', label: 'Week 4 Completion' },
                    { key: 'halfway', label: 'Halfway Point' }
                  ].map((milestone) => (
                    <div key={milestone.key} className="flex items-center gap-2">
                      <Label className="flex-1">{milestone.label}</Label>
                      <Input
                        type="text"
                        placeholder="Reward description or amount"
                        className="w-48"
                        onChange={(e) => {
                          const updated = formData.rewards.milestones.filter(m => m.milestone !== milestone.key);
                          if (e.target.value) {
                            updated.push({
                              milestone: milestone.key,
                              reward: e.target.value,
                              achieved_by: 0
                            });
                          }
                          handleNestedChange('rewards', 'milestones', updated);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Additional Incentives</Label>
                <Textarea
                  placeholder="List any additional incentives or recognition"
                  rows={3}
                  onChange={(e) =>
                    handleNestedChange(
                      'rewards',
                      'incentives',
                      e.target.value.split('\n').map(line => ({
                        type: 'custom',
                        value: line,
                        condition: 'Program completion'
                      }))
                    )
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="materials" className="space-y-4">
              <div>
                <Label htmlFor="welcome_kit">Welcome Kit</Label>
                <Input
                  id="welcome_kit"
                  value={formData.materials.welcome_kit}
                  onChange={(e) => handleNestedChange('materials', 'welcome_kit', e.target.value)}
                  placeholder="e.g., Welcome email, program guide"
                />
              </div>

              <div>
                <Label>Program Guides</Label>
                <Textarea
                  placeholder="Enter guides one per line"
                  rows={3}
                  value={formData.materials.guides.join('\n')}
                  onChange={(e) =>
                    handleNestedChange(
                      'materials',
                      'guides',
                      e.target.value.split('\n').filter(Boolean)
                    )
                  }
                />
              </div>

              <div>
                <Label>Video Resources</Label>
                <Textarea
                  placeholder="Enter video URLs or titles one per line"
                  rows={3}
                  value={formData.materials.videos.join('\n')}
                  onChange={(e) =>
                    handleNestedChange(
                      'materials',
                      'videos',
                      e.target.value.split('\n').filter(Boolean)
                    )
                  }
                />
              </div>

              <div>
                <Label>Additional Resources</Label>
                <Textarea
                  placeholder="Enter additional resources one per line"
                  rows={3}
                  value={formData.materials.resources.join('\n')}
                  onChange={(e) =>
                    handleNestedChange(
                      'materials',
                      'resources',
                      e.target.value.split('\n').filter(Boolean)
                    )
                  }
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setShowEditDialog(false);
                setSelectedProgram(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveProgram}>
              {selectedProgram ? 'Update Program' : 'Create Program'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Enrollment Dialog */}
      <Dialog open={showEnrollmentDialog} onOpenChange={setShowEnrollmentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enroll Employees in Program</DialogTitle>
            <DialogDescription>
              Select employees to enroll in "{selectedProgram?.program_name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border rounded-lg max-h-96 overflow-y-auto">
              <div className="p-4 space-y-2">
                {employees
                  .filter(e => e.is_active)
                  .map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployees([...selectedEmployees, employee.id]);
                            } else {
                              setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id));
                            }
                          }}
                          className="rounded"
                        />
                        <div>
                          <div className="font-medium">
                            {employee.first_name} {employee.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {employee.position} • {employee.email}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {employee.department?.department_name || 'Unassigned'}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {selectedEmployees.length} employee(s) selected
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnrollmentDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkEnroll}
              disabled={selectedEmployees.length === 0}
            >
              Enroll {selectedEmployees.length} Employee(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};