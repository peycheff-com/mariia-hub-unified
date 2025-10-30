import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  FileText,
  MessageSquare,
  Send,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  Search,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  GitBranch,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

import { translationService } from '@/lib/translations/TranslationService';

// Types for workflow
interface TranslationProject {
  id: string;
  name: string;
  description?: string;
  source_language: string;
  target_languages: string[];
  status: 'planning' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  priority: number;
  deadline?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  assigned_to?: string;
  total_keys: number;
  completed_keys: number;
  progress_percentage: number;
}

interface TranslationTask {
  id: string;
  project_id: string;
  key_id: string;
  translator_id?: string;
  reviewer_id?: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'review' | 'approved' | 'rejected';
  due_date?: string;
  estimated_effort?: number;
  actual_effort?: number;
  translator_notes?: string;
  reviewer_notes?: string;
  created_at: string;
  updated_at: string;
}

interface WorkflowStats {
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingReviews: number;
  averageCompletionTime: number;
  translatorWorkload: Record<string, number>;
}

export const TranslationWorkflow: React.FC = () => {
  const { t } = useTranslation();

  // State management
  const [projects, setProjects] = useState<TranslationProject[]>([]);
  const [tasks, setTasks] = useState<TranslationTask[]>([]);
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [selectedProject, setSelectedProject] = useState<TranslationProject | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);

  // Form data
  const [newProject, setNewProject] = useState<Partial<TranslationProject>>({});
  const [newTask, setNewTask] = useState<Partial<TranslationTask>>({});

  // Load data
  useEffect(() => {
    loadProjects();
    loadTasks();
    loadStats();
  }, []);

  const loadProjects = async () => {
    try {
      // In a real implementation, this would fetch from the database
      const mockProjects: TranslationProject[] = [
        {
          id: '1',
          name: 'Beauty Services Q4 2024',
          description: 'Update all beauty service descriptions for winter season',
          source_language: 'en',
          target_languages: ['pl'],
          status: 'in_progress',
          priority: 3,
          deadline: '2024-11-30',
          created_at: '2024-11-01',
          updated_at: '2024-11-15',
          created_by: 'user1',
          assigned_to: 'user2',
          total_keys: 150,
          completed_keys: 75,
          progress_percentage: 50
        },
        {
          id: '2',
          name: 'GDPR Compliance Polish',
          description: 'Translate all legal documents for Polish market compliance',
          source_language: 'en',
          target_languages: ['pl'],
          status: 'review',
          priority: 1,
          deadline: '2024-11-25',
          created_at: '2024-11-05',
          updated_at: '2024-11-20',
          created_by: 'user1',
          assigned_to: 'user3',
          total_keys: 45,
          completed_keys: 45,
          progress_percentage: 100
        }
      ];
      setProjects(mockProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      // Mock tasks data
      const mockTasks: TranslationTask[] = [
        {
          id: '1',
          project_id: '1',
          key_id: 'key1',
          translator_id: 'user2',
          status: 'in_progress',
          due_date: '2024-11-28',
          estimated_effort: 30,
          actual_effort: 15,
          created_at: '2024-11-15',
          updated_at: '2024-11-20'
        },
        {
          id: '2',
          project_id: '1',
          key_id: 'key2',
          translator_id: 'user2',
          status: 'submitted',
          due_date: '2024-11-28',
          estimated_effort: 20,
          actual_effort: 25,
          created_at: '2024-11-15',
          updated_at: '2024-11-21'
        }
      ];
      setTasks(mockTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Mock stats
      const mockStats: WorkflowStats = {
        activeProjects: 2,
        completedProjects: 8,
        totalTasks: 195,
        completedTasks: 120,
        pendingReviews: 5,
        averageCompletionTime: 2.5, // days
        translatorWorkload: {
          'user2': 15,
          'user3': 8
        }
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateProject = async () => {
    try {
      // In a real implementation, this would save to the database
      console.log('Creating project:', newProject);
      setShowNewProjectDialog(false);
      setNewProject({});
      await loadProjects();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleCreateTask = async () => {
    try {
      console.log('Creating task:', newTask);
      setShowTaskDialog(false);
      setNewTask({});
      await loadTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      planning: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800',
      submitted: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 2) return 'bg-red-100 text-red-800';
    if (priority <= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      planning: Clock,
      in_progress: Play,
      review: Eye,
      completed: CheckCircle,
      cancelled: AlertCircle,
      pending: Clock,
      submitted: Send,
      approved: CheckCircle,
      rejected: AlertCircle
    };
    return icons[status as keyof typeof icons] || Clock;
  };

  const filteredProjects = projects.filter(project => {
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const projectTasks = selectedProject ? tasks.filter(task => task.project_id === selectedProject.id) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading workflow...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Translation Workflow</h1>
          <p className="text-muted-foreground">Manage translation projects and approval processes</p>
        </div>

        <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Translation Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Project Name</Label>
                <Input
                  value={newProject.name || ''}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Enter project name..."
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={newProject.description || ''}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Describe the project..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Source Language</Label>
                  <Select
                    value={newProject.source_language || 'en'}
                    onValueChange={(value) => setNewProject({ ...newProject, source_language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="pl">Polish</SelectItem>
                      <SelectItem value="ua">Ukrainian</SelectItem>
                      <SelectItem value="ru">Russian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Target Languages</Label>
                  <Select
                    value={newProject.target_languages?.[0] || ''}
                    onValueChange={(value) => setNewProject({ ...newProject, target_languages: [value] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="pl">Polish</SelectItem>
                      <SelectItem value="ua">Ukrainian</SelectItem>
                      <SelectItem value="ru">Russian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={newProject.priority?.toString() || '5'}
                    onValueChange={(value) => setNewProject({ ...newProject, priority: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Highest</SelectItem>
                      <SelectItem value="2">2 - High</SelectItem>
                      <SelectItem value="3">3 - Medium-High</SelectItem>
                      <SelectItem value="4">4 - Medium</SelectItem>
                      <SelectItem value="5">5 - Medium</SelectItem>
                      <SelectItem value="6">6 - Medium-Low</SelectItem>
                      <SelectItem value="7">7 - Low</SelectItem>
                      <SelectItem value="8">8 - Very Low</SelectItem>
                      <SelectItem value="9">9 - Lowest</SelectItem>
                      <SelectItem value="10">10 - Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Deadline</Label>
                  <Input
                    type="date"
                    value={newProject.deadline || ''}
                    onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProject}>
                  Create Project
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-bold">{stats.activeProjects}</p>
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed Projects</p>
                  <p className="text-2xl font-bold">{stats.completedProjects}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Reviews</p>
                  <p className="text-2xl font-bold">{stats.pendingReviews}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Completion</p>
                  <p className="text-2xl font-bold">{stats.averageCompletionTime}d</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects list */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Projects</span>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {filteredProjects.map((project) => (
                    <Card
                      key={project.id}
                      className={`cursor-pointer transition-colors ${
                        selectedProject?.id === project.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedProject(project)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{project.name}</h3>
                              <Badge className={getPriorityColor(project.priority)}>
                                Priority {project.priority}
                              </Badge>
                              <Badge className={getStatusColor(project.status)}>
                                {getStatusIcon(project.status) && (
                                  <getStatusIcon(project.status) className="w-3 h-3 mr-1" />
                                )}
                                {project.status.replace('_', ' ')}
                              </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground mb-3">
                              {project.description}
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Languages:</span>
                                <div className="font-medium">
                                  {project.source_language.toUpperCase()} → {project.target_languages.join(', ').toUpperCase()}
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Progress:</span>
                                <div className="font-medium">{project.progress_percentage}%</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Keys:</span>
                                <div className="font-medium">{project.completed_keys}/{project.total_keys}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Deadline:</span>
                                <div className="font-medium">
                                  {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
                                </div>
                              </div>
                            </div>

                            <div className="mt-3">
                              <Progress value={project.progress_percentage} className="h-2" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Project details */}
        <div className="space-y-4">
          {selectedProject ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Project Details</span>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={selectedProject.status}
                      onValueChange={(value: any) => {
                        // Update project status
                        console.log('Updating status:', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Assigned Translator</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>JD</Avatar>
                      </Avatar>
                      <span>John Doe</span>
                    </div>
                  </div>

                  <div>
                    <Label>Created</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedProject.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Users className="w-4 h-4 mr-1" />
                      Assign
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Tasks</span>
                    <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Task</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Task Description</Label>
                            <Textarea
                              value={newTask.translator_notes || ''}
                              onChange={(e) => setNewTask({ ...newTask, translator_notes: e.target.value })}
                              placeholder="Describe the task..."
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Estimated Effort (minutes)</Label>
                              <Input
                                type="number"
                                value={newTask.estimated_effort || ''}
                                onChange={(e) => setNewTask({ ...newTask, estimated_effort: parseInt(e.target.value) })}
                              />
                            </div>
                            <div>
                              <Label>Due Date</Label>
                              <Input
                                type="date"
                                value={newTask.due_date || ''}
                                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleCreateTask}>
                              Create Task
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {projectTasks.map((task) => (
                        <div key={task.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getStatusColor(task.status)} variant="outline">
                              {task.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {task.estimated_effort}min est.
                            </span>
                          </div>

                          {task.translator_notes && (
                            <p className="text-sm mb-2">{task.translator_notes}</p>
                          )}

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
                            {task.actual_effort && (
                              <span>Actual: {task.actual_effort}min</span>
                            )}
                          </div>
                        </div>
                      ))}

                      {projectTasks.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No tasks created yet</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a project to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranslationWorkflow;