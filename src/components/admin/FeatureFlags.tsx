import React, { useState, useEffect } from "react";
import {
  Flag,
  Users,
  TrendingUp,
  Settings,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  BarChart3,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  GitBranch,
  Activity,
  Download,
  Upload,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";


import type {
  FeatureFlag,
  UserFlagAssignment,
  ExperimentStats,
  FeatureFlagStats,
  FeatureFlagFormData,
  ExperimentFormData,
  FlagEvaluationResult,
  FeatureFlagAuditLog
} from "@/types/featureFlags";

const FeatureFlags: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [userAssignments, setUserAssignments] = useState<UserFlagAssignment[]>([]);
  const [experimentStats, setExperimentStats] = useState<ExperimentStats[]>([]);
  const [flagStats, setFlagStats] = useState<FeatureFlagStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<FeatureFlagAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showExperimentDialog, setShowExperimentDialog] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [activeTab, setActiveTab] = useState("flags");
  const { toast } = useToast();

  // Form states
  const [formData, setFormData] = useState<FeatureFlagFormData>({
    flag_key: "",
    description: "",
    is_active: false,
    rollout_percentage: 0,
    target_segments: {},
    environments: ["development", "staging", "production"],
    start_date: null,
    end_date: null,
    metadata: {}
  });

  const [experimentData, setExperimentData] = useState<ExperimentFormData>({
    experiment_key: "",
    description: "",
    variants: [
      { key: "control", name: "Control", description: "Current experience", weight: 50 },
      { key: "variant", name: "Variant", description: "New experience", weight: 50 }
    ],
    traffic_allocation: 100,
    success_metrics: ["conversion"],
    duration_days: 14,
    target_segments: {}
  });

  useEffect(() => {
    loadFeatureFlags();
    loadFlagStats();
    loadExperimentStats();
    loadAuditLogs();
  }, []);

  const loadFeatureFlags = async () => {
    try {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      console.error("Error loading feature flags:", error);
      toast({
        title: "Error",
        description: "Failed to load feature flags",
        variant: "destructive"
      });
    }
  };

  const loadFlagStats = async () => {
    try {
      const stats: FeatureFlagStats = {
        total_flags: flags.length,
        active_flags: flags.filter(f => f.is_active).length,
        experiments_running: flags.filter(f => f.metadata?.isExperiment).length,
        total_users_enrolled: 0, // Would need to be calculated
        conversion_rate: 0, // Would need to be calculated
        last_updated: new Date().toISOString()
      };
      setFlagStats(stats);
    } catch (error) {
      console.error("Error loading flag stats:", error);
    }
  };

  const loadExperimentStats = async () => {
    try {
      // This would typically call an analytics service
      // For now, using mock data
      const mockStats: ExperimentStats[] = [
        {
          experiment_key: "new_booking_flow",
          total_users: 1250,
          variants: [
            { variant: "control", users: 625, conversions: 125, conversion_rate: 20 },
            { variant: "variant", users: 625, conversions: 156, conversion_rate: 24.96 }
          ],
          conversion_rate: 22.48,
          statistical_significance: 0.95,
          winner_variant: "variant",
          start_date: "2024-01-15",
          days_running: 7
        }
      ];
      setExperimentStats(mockStats);
    } catch (error) {
      console.error("Error loading experiment stats:", error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("feature_flag_audit_log")
        .select("*")
        .order("changed_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    }
  };

  const createFeatureFlag = async () => {
    try {
      const { data, error } = await supabase
        .from("feature_flags")
        .insert([{
          ...formData,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      setFlags(prev => [data, ...prev]);
      setShowCreateDialog(false);
      resetFormData();

      toast({
        title: "Success",
        description: "Feature flag created successfully"
      });
    } catch (error) {
      console.error("Error creating feature flag:", error);
      toast({
        title: "Error",
        description: "Failed to create feature flag",
        variant: "destructive"
      });
    }
  };

  const updateFeatureFlag = async (flagKey: string, updates: Partial<FeatureFlag>) => {
    try {
      const { data, error } = await supabase
        .from("feature_flags")
        .update(updates)
        .eq("flag_key", flagKey)
        .select()
        .single();

      if (error) throw error;

      setFlags(prev => prev.map(f => f.flag_key === flagKey ? data : f));

      toast({
        title: "Success",
        description: "Feature flag updated successfully"
      });
    } catch (error) {
      console.error("Error updating feature flag:", error);
      toast({
        title: "Error",
        description: "Failed to update feature flag",
        variant: "destructive"
      });
    }
  };

  const toggleFlag = async (flagKey: string, enabled: boolean) => {
    await updateFeatureFlag(flagKey, { is_active: enabled });
  };

  const updateRolloutPercentage = async (flagKey: string, percentage: number) => {
    await updateFeatureFlag(flagKey, { rollout_percentage: percentage });
  };

  const deleteFlag = async (flagKey: string) => {
    if (!confirm("Are you sure you want to delete this feature flag? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("feature_flags")
        .delete()
        .eq("flag_key", flagKey);

      if (error) throw error;

      setFlags(prev => prev.filter(f => f.flag_key !== flagKey));

      toast({
        title: "Success",
        description: "Feature flag deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting feature flag:", error);
      toast({
        title: "Error",
        description: "Failed to delete feature flag",
        variant: "destructive"
      });
    }
  };

  const createExperiment = async () => {
    try {
      const experimentFlag = {
        flag_key: experimentData.experiment_key,
        description: experimentData.description,
        is_active: true,
        rollout_percentage: experimentData.traffic_allocation,
        target_segments: experimentData.target_segments,
        environments: ["production"],
        metadata: {
          isExperiment: true,
          variants: experimentData.variants.reduce((acc, variant) => ({
            ...acc,
            [variant.key]: variant.config || {}
          }), {}),
          weights: experimentData.variants.reduce((acc, variant) => ({
            ...acc,
            [variant.key]: variant.weight
          }), {}),
          successMetrics: experimentData.success_metrics,
          durationDays: experimentData.duration_days
        }
      };

      const { data, error } = await supabase
        .from("feature_flags")
        .insert([experimentFlag])
        .select()
        .single();

      if (error) throw error;

      setFlags(prev => [data, ...prev]);
      setShowExperimentDialog(false);
      resetExperimentData();

      toast({
        title: "Success",
        description: "Experiment created successfully"
      });
    } catch (error) {
      console.error("Error creating experiment:", error);
      toast({
        title: "Error",
        description: "Failed to create experiment",
        variant: "destructive"
      });
    }
  };

  const resetFormData = () => {
    setFormData({
      flag_key: "",
      description: "",
      is_active: false,
      rollout_percentage: 0,
      target_segments: {},
      environments: ["development", "staging", "production"],
      start_date: null,
      end_date: null,
      metadata: {}
    });
  };

  const resetExperimentData = () => {
    setExperimentData({
      experiment_key: "",
      description: "",
      variants: [
        { key: "control", name: "Control", description: "Current experience", weight: 50 },
        { key: "variant", name: "Variant", description: "New experience", weight: 50 }
      ],
      traffic_allocation: 100,
      success_metrics: ["conversion"],
      duration_days: 14,
      target_segments: {}
    });
  };

  const getFlagStatus = (flag: FeatureFlag) => {
    if (!flag.is_active && flag.rollout_percentage === 0) return "inactive";
    if (flag.is_active && flag.rollout_percentage === 100) return "active";
    if (flag.is_active && flag.rollout_percentage > 0) return "rolling";
    return "inactive";
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      rolling: { color: "bg-blue-100 text-blue-800", icon: Activity },
      inactive: { color: "bg-gray-100 text-gray-800", icon: EyeOff },
      scheduled: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      expired: { color: "bg-red-100 text-red-800", icon: AlertTriangle }
    };

    const variant = variants[status as keyof typeof variants] || variants.inactive;
    const Icon = variant.icon;

    return (
      <Badge className={variant.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const isExperiment = (flag: FeatureFlag) => {
    return flag.metadata?.isExperiment === true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Flag className="w-8 h-8" />
            Feature Flags
          </h1>
          <p className="text-muted-foreground">
            Manage feature flags, A/B tests, and controlled rollouts
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Flag
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Feature Flag</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="flag_key">Flag Key</Label>
                  <Input
                    id="flag_key"
                    value={formData.flag_key}
                    onChange={(e) => setFormData(prev => ({ ...prev, flag_key: e.target.value }))}
                    placeholder="e.g., new_booking_flow"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this flag controls"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div>
                  <Label>Rollout Percentage: {formData.rollout_percentage}%</Label>
                  <Slider
                    value={[formData.rollout_percentage]}
                    onValueChange={([value]) => setFormData(prev => ({ ...prev, rollout_percentage: value }))}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createFeatureFlag}>
                    Create Flag
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showExperimentDialog} onOpenChange={setShowExperimentDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <GitBranch className="w-4 h-4 mr-2" />
                New Experiment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create A/B Test Experiment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="experiment_key">Experiment Key</Label>
                  <Input
                    id="experiment_key"
                    value={experimentData.experiment_key}
                    onChange={(e) => setExperimentData(prev => ({ ...prev, experiment_key: e.target.value }))}
                    placeholder="e.g., checkout_button_test"
                  />
                </div>
                <div>
                  <Label htmlFor="experiment_description">Description</Label>
                  <Textarea
                    id="experiment_description"
                    value={experimentData.description}
                    onChange={(e) => setExperimentData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what you're testing"
                  />
                </div>
                <div>
                  <Label>Traffic Allocation: {experimentData.traffic_allocation}%</Label>
                  <Slider
                    value={[experimentData.traffic_allocation]}
                    onValueChange={([value]) => setExperimentData(prev => ({ ...prev, traffic_allocation: value }))}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Duration (days): {experimentData.duration_days}</Label>
                  <Slider
                    value={[experimentData.duration_days]}
                    onValueChange={([value]) => setExperimentData(prev => ({ ...prev, duration_days: value }))}
                    min={1}
                    max={90}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowExperimentDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createExperiment}>
                    Create Experiment
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      {flagStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Flags</CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{flagStats.total_flags}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Flags</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{flagStats.active_flags}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((flagStats.active_flags / flagStats.total_flags) * 100)}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Running Experiments</CardTitle>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{flagStats.experiments_running}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users Enrolled</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{flagStats.total_users_enrolled}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="flags">Flags</TabsTrigger>
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="flags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rollout</TableHead>
                    <TableHead>Environments</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flags.map((flag) => (
                    <TableRow key={flag.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{flag.flag_key}</div>
                          <div className="text-sm text-muted-foreground">{flag.description}</div>
                          {isExperiment(flag) && (
                            <Badge variant="secondary" className="mt-1">
                              <GitBranch className="w-3 h-3 mr-1" />
                              Experiment
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(getFlagStatus(flag))}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={flag.rollout_percentage} className="w-16" />
                          <span className="text-sm">{flag.rollout_percentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {flag.environments.map((env) => (
                            <Badge key={env} variant="outline" className="text-xs">
                              {env}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(flag.updated_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleFlag(flag.flag_key, !flag.is_active)}
                          >
                            {flag.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedFlag(flag)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteFlag(flag.flag_key)}
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
        </TabsContent>

        <TabsContent value="experiments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>A/B Test Experiments</CardTitle>
            </CardHeader>
            <CardContent>
              {experimentStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No experiments running. Create your first A/B test to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {experimentStats.map((stats) => (
                    <Card key={stats.experiment_key}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{stats.experiment_key}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Running for {stats.days_running} days • {stats.total_users} users
                            </p>
                          </div>
                          {stats.winner_variant && (
                            <Badge className="bg-green-100 text-green-800">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Winner: {stats.winner_variant}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {stats.variants.map((variant) => (
                            <div key={variant.variant} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{variant.variant}</span>
                                <span className="text-sm text-muted-foreground">
                                  {variant.users} users
                                </span>
                              </div>
                              <Progress value={variant.conversion_rate} className="h-2" />
                              <div className="text-sm">
                                {variant.conversions} conversions ({variant.conversion_rate.toFixed(1)}%)
                              </div>
                            </div>
                          ))}
                        </div>
                        {stats.statistical_significance && (
                          <Alert>
                            <TrendingUp className="h-4 w-4" />
                            <AlertDescription>
                              Statistical significance: {(stats.statistical_significance * 100).toFixed(1)}%
                              {stats.statistical_significance >= 0.95 && " - Results are statistically significant!"}
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Analytics dashboard coming soon. Track flag performance, user engagement, and conversion metrics.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Flag</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.changed_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="font-medium">{log.flag_key}</TableCell>
                      <TableCell>
                        <Badge variant={log.action === 'deleted' ? 'destructive' : 'secondary'}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.changed_by}</TableCell>
                      <TableCell>{log.reason || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeatureFlags;