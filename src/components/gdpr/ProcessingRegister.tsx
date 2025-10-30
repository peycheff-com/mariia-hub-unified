import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Shield, Database, Clock, Globe, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { ProcessingActivity, ProcessingLog, ProcessingLawfulBasis } from '@/types/gdpr';

const LAWFUL_BASES = {
  consent: { label: 'Consent', color: 'bg-green-100 text-green-800', icon: <Shield className="w-4 h-4" /> },
  contract: { label: 'Contract', color: 'bg-blue-100 text-blue-800', icon: <Database className="w-4 h-4" /> },
  legal_obligation: { label: 'Legal Obligation', color: 'bg-purple-100 text-purple-800', icon: <Lock className="w-4 h-4" /> },
  vital_interests: { label: 'Vital Interests', color: 'bg-red-100 text-red-800', icon: <Shield className="w-4 h-4" /> },
  public_task: { label: 'Public Task', color: 'bg-orange-100 text-orange-800', icon: <Globe className="w-4 h-4" /> },
  legitimate_interests: { label: 'Legitimate Interests', color: 'bg-gray-100 text-gray-800', icon: <Database className="w-4 h-4" /> },
};

export function ProcessingRegister() {
  const [activities, setActivities] = useState<ProcessingActivity[]>([]);
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBasis, setSelectedBasis] = useState<ProcessingLawfulBasis | 'all'>('all');
  const [selectedActivity, setSelectedActivity] = useState<ProcessingActivity | null>(null);
  const [selectedLog, setSelectedLog] = useState<ProcessingLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load processing activities
      const { data: activitiesData } = await supabase
        .from('processing_activities')
        .select('*')
        .order('created_at', { ascending: false });

      // Load processing logs (last 100)
      const { data: logsData } = await supabase
        .from('processing_logs')
        .select(`
          *,
          processing_activities!inner(
            name,
            description,
            lawful_basis
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(100);

      setActivities(activitiesData || []);
      setLogs(logsData || []);
    } catch (error) {
      console.error('Error loading processing register data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBasis = selectedBasis === 'all' || activity.lawful_basis === selectedBasis;
    return matchesSearch && matchesBasis;
  });

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.processing_activities?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const getRetentionPeriodText = (period: string) => {
    switch (period) {
      case 'immediate': return 'Delete immediately';
      case '24_hours': return '24 hours';
      case '7_days': return '7 days';
      case '30_days': return '30 days';
      case '90_days': return '90 days';
      case '6_months': return '6 months';
      case '1_year': return '1 year';
      case '2_years': return '2 years';
      case '5_years': return '5 years';
      case '7_years': return '7 years';
      case 'indefinite': return 'Indefinite';
      default: return period;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Database className="w-8 h-8 mx-auto mb-3 animate-pulse text-muted-foreground" />
          <p className="text-muted-foreground">Loading processing register...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Data Processing Register</h2>
        <p className="text-muted-foreground">
          Transparent record of all personal data processing activities as required by GDPR Article 30.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search activities or logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedBasis} onValueChange={(value) => setSelectedBasis(value as ProcessingLawfulBasis | 'all')}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by lawful basis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bases</SelectItem>
            {Object.entries(LAWFUL_BASES).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={loadData}>
          <Database className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="activities" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="activities">Processing Activities</TabsTrigger>
          <TabsTrigger value="logs">Processing Logs</TabsTrigger>
        </TabsList>

        {/* Processing Activities */}
        <TabsContent value="activities" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActivities.map((activity) => (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base mb-1">{activity.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {activity.description}
                      </CardDescription>
                    </div>
                    <Badge className={LAWFUL_BASES[activity.lawful_basis].color}>
                      {LAWFUL_BASES[activity.lawful_basis].icon}
                      {LAWFUL_BASES[activity.lawful_basis].label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Retention:</span>
                      <span className="font-medium">{getRetentionPeriodText(activity.retention_period)}</span>
                    </div>

                    {activity.automated_decision_making && (
                      <Badge variant="outline" className="text-xs">
                        Automated Decision Making
                      </Badge>
                    )}

                    {activity.international_transfer && (
                      <Badge variant="outline" className="text-xs">
                        International Transfer
                      </Badge>
                    )}
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => setSelectedActivity(activity)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Database className="w-5 h-5" />
                          {activity.name}
                        </DialogTitle>
                        <DialogDescription>
                          Detailed information about this data processing activity
                        </DialogDescription>
                      </DialogHeader>

                      {selectedActivity && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-medium mb-2">Description</h4>
                            <p className="text-sm text-muted-foreground">{selectedActivity.description}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-medium mb-2">Lawful Basis</h4>
                              <Badge className={LAWFUL_BASES[selectedActivity.lawful_basis].color}>
                                {LAWFUL_BASES[selectedActivity.lawful_basis].icon}
                                {LAWFUL_BASES[selectedActivity.lawful_basis].label}
                              </Badge>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Retention Period</h4>
                              <p className="text-sm">{getRetentionPeriodText(selectedActivity.retention_period)}</p>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Data Categories</h4>
                            <div className="flex flex-wrap gap-1">
                              {selectedActivity.data_categories.map((category, index) => (
                                <Badge key={index} variant="outline">
                                  {category}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Purposes</h4>
                            <div className="flex flex-wrap gap-1">
                              {selectedActivity.purposes.map((purpose, index) => (
                                <Badge key={index} variant="outline">
                                  {purpose}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Data Recipients</h4>
                            <div className="flex flex-wrap gap-1">
                              {selectedActivity.recipients.map((recipient, index) => (
                                <Badge key={index} variant="outline">
                                  {recipient}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Security Measures</h4>
                            <div className="bg-muted p-3 rounded-lg">
                              <pre className="text-xs overflow-x-auto">
                                {JSON.stringify(selectedActivity.security_measures, null, 2)}
                              </pre>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Automated Decision Making</h4>
                              <Badge variant={selectedActivity.automated_decision_making ? "default" : "outline"}>
                                {selectedActivity.automated_decision_making ? 'Yes' : 'No'}
                              </Badge>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">International Transfer</h4>
                              <Badge variant={selectedActivity.international_transfer ? "default" : "outline"}>
                                {selectedActivity.international_transfer ? 'Yes' : 'No'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredActivities.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No processing activities found matching your criteria.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Processing Logs */}
        <TabsContent value="logs" className="space-y-4">
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <Card key={log.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{log.action}</span>
                        {log.processing_activities && (
                          <Badge variant="outline" className="text-xs">
                            {log.processing_activities.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(log.timestamp).toLocaleString()}
                        {log.ip_address && (
                          <span> • IP: {log.ip_address}</span>
                        )}
                      </p>
                      {log.data_affected && Object.keys(log.data_affected).length > 0 && (
                        <div className="bg-muted p-2 rounded text-xs">
                          <strong>Data affected:</strong> {JSON.stringify(log.data_affected)}
                        </div>
                      )}
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Processing Log Details
                          </DialogTitle>
                          <DialogDescription>
                            Detailed information about this processing activity
                          </DialogDescription>
                        </DialogHeader>

                        {selectedLog && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-1">Action</h4>
                                <p className="text-sm">{selectedLog.action}</p>
                              </div>
                              <div>
                                <h4 className="font-medium mb-1">Timestamp</h4>
                                <p className="text-sm">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                              </div>
                            </div>

                            {selectedLog.processing_activities && (
                              <div>
                                <h4 className="font-medium mb-1">Processing Activity</h4>
                                <p className="text-sm">{selectedLog.processing_activities.name}</p>
                                <p className="text-xs text-muted-foreground">{selectedLog.processing_activities.description}</p>
                              </div>
                            )}

                            {selectedLog.ip_address && (
                              <div>
                                <h4 className="font-medium mb-1">IP Address</h4>
                                <p className="text-sm">{selectedLog.ip_address}</p>
                              </div>
                            )}

                            {selectedLog.user_agent && (
                              <div>
                                <h4 className="font-medium mb-1">User Agent</h4>
                                <p className="text-xs text-muted-foreground break-all">{selectedLog.user_agent}</p>
                              </div>
                            )}

                            {selectedLog.lawful_basis_at_time && (
                              <div>
                                <h4 className="font-medium mb-1">Lawful Basis at Time</h4>
                                <Badge className={LAWFUL_BASES[selectedLog.lawful_basis_at_time].color}>
                                  {LAWFUL_BASES[selectedLog.lawful_basis_at_time].icon}
                                  {LAWFUL_BASES[selectedLog.lawful_basis_at_time].label}
                                </Badge>
                              </div>
                            )}

                            {selectedLog.data_affected && (
                              <div>
                                <h4 className="font-medium mb-1">Data Affected</h4>
                                <div className="bg-muted p-3 rounded-lg">
                                  <pre className="text-xs overflow-x-auto">
                                    {JSON.stringify(selectedLog.data_affected, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredLogs.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No processing logs found matching your criteria.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Summary Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{activities.length}</div>
              <div className="text-sm text-muted-foreground">Total Processing Activities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{logs.length}</div>
              <div className="text-sm text-muted-foreground">Recent Processing Logs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Object.keys(LAWFUL_BASES).length}
              </div>
              <div className="text-sm text-muted-foreground">Lawful Bases Used</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}