import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  Users,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  ArrowRight,
  User,
  Package,
  Timer
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';

interface Conflict {
  id: string;
  type: 'double_booking' | 'resource_conflict' | 'staff_unavailable' | 'location_conflict' | 'overlapping_slots';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  conflicting_items: ConflictItem[];
  suggested_resolution: string;
  auto_resolvable: boolean;
  created_at: string;
  resolved: boolean;
}

interface ConflictItem {
  id: string;
  type: 'booking' | 'availability_slot' | 'staff_assignment';
  title: string;
  time: string;
  duration?: number;
  resource?: string;
  location?: string;
  staff?: string;
}

const ConflictResolution = () => {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved' | 'all'>('pending');
  const [autoResolving, setAutoResolving] = useState(false);
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  useEffect(() => {
    loadConflicts();
  }, []);

  const loadConflicts = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would query a conflicts table
      // For now, we'll simulate detecting conflicts
      const detectedConflicts = await detectConflicts();
      setConflicts(detectedConflicts);
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const detectConflicts = async (): Promise<Conflict[]> => {
    // Simulate conflict detection
    const mockConflicts: Conflict[] = [
      {
        id: '1',
        type: 'double_booking',
        severity: 'high',
        title: 'Double Booking - Studio Smolna',
        description: 'Two clients booked for the same time at Studio Smolna',
        conflicting_items: [
          {
            id: 'b1',
            type: 'booking',
            title: 'Lip Blush - Anna Kowalska',
            time: '2024-01-25 14:00',
            duration: 120,
            resource: 'Mariia',
            location: 'Studio Smolna',
            staff: 'Mariia'
          },
          {
            id: 'b2',
            type: 'booking',
            title: 'Microblading - Ewa Nowak',
            time: '2024-01-25 14:30',
            duration: 90,
            resource: 'Mariia',
            location: 'Studio Smolna',
            staff: 'Mariia'
          }
        ],
        suggested_resolution: 'Move Ewa Nowak appointment to 15:30 or next day',
        auto_resolvable: false,
        created_at: new Date().toISOString(),
        resolved: false
      },
      {
        id: '2',
        type: 'staff_unavailable',
        severity: 'medium',
        title: 'Staff Time Off Conflict',
        description: 'Booking scheduled during staff vacation',
        conflicting_items: [
          {
            id: 'b3',
            type: 'booking',
            title: 'Fitness Training - Jan Wiśniewski',
            time: '2024-01-28 10:00',
            duration: 60,
            resource: 'Mariia',
            location: 'Zdrofit Gym',
            staff: 'Mariia'
          },
          {
            id: 'to1',
            type: 'availability_slot',
            title: 'Vacation - Mariia',
            time: '2024-01-28 00:00',
            resource: 'Mariia',
            staff: 'Mariia'
          }
        ],
        suggested_resolution: 'Reschedule to available date or assign substitute staff',
        auto_resolvable: true,
        created_at: new Date().toISOString(),
        resolved: false
      },
      {
        id: '3',
        type: 'resource_conflict',
        severity: 'critical',
        title: 'PMU Machine Maintenance',
        description: 'PMU Machine #1 scheduled for maintenance during bookings',
        conflicting_items: [
          {
            id: 'b4',
            type: 'booking',
            title: 'Eyeliner Extensions - Maria Dąbrowska',
            time: '2024-01-26 11:00',
            duration: 150,
            resource: 'PMU Machine #1',
            location: 'Studio Smolna',
            staff: 'Mariia'
          },
          {
            id: 'm1',
            type: 'booking',
            title: 'Maintenance - PMU Machine #1',
            time: '2024-01-26 10:00',
            duration: 120,
            resource: 'PMU Machine #1'
          }
        ],
        suggested_resolution: 'Use PMU Machine #2 or reschedule bookings',
        auto_resolvable: false,
        created_at: new Date().toISOString(),
        resolved: true
      }
    ];

    return mockConflicts;
  };

  const handleAutoResolve = async (conflictId: string) => {
    setAutoResolving(true);
    try {
      // Simulate auto-resolution
      await new Promise(resolve => setTimeout(resolve, 2000));

      setConflicts(prev => prev.map(c =>
        c.id === conflictId ? { ...c, resolved: true } : c
      ));

      toast aria-live="polite" aria-atomic="true"({
        title: 'Success',
        description: 'Conflict resolved automatically'
      });
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to resolve conflict',
        variant: 'destructive'
      });
    } finally {
      setAutoResolving(false);
    }
  };

  const handleManualResolve = async (conflictId: string, resolution: string) => {
    try {
      // Simulate manual resolution
      setConflicts(prev => prev.map(c =>
        c.id === conflictId ? { ...c, resolved: true } : c
      ));

      toast aria-live="polite" aria-atomic="true"({
        title: 'Success',
        description: 'Conflict marked as resolved'
      });
      setDialogOpen(false);
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-champagne/20 text-champagne border-champagne/30';
      case 'low': return 'bg-sage/20 text-sage border-sage/30';
      default: return 'bg-pearl/20 text-pearl border-pearl/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'double_booking': return <Users className="w-4 h-4" />;
      case 'resource_conflict': return <Package className="w-4 h-4" />;
      case 'staff_unavailable': return <User className="w-4 h-4" />;
      case 'location_conflict': return <MapPin className="w-4 h-4" />;
      case 'overlapping_slots': return <Clock className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const filteredConflicts = conflicts.filter(conflict => {
    if (activeTab === 'pending') return !conflict.resolved;
    if (activeTab === 'resolved') return conflict.resolved;
    return true;
  });

  const stats = {
    total: conflicts.length,
    pending: conflicts.filter(c => !c.resolved).length,
    critical: conflicts.filter(c => c.severity === 'critical' && !c.resolved).length,
    auto_resolvable: conflicts.filter(c => c.auto_resolvable && !c.resolved).length
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
                <AlertTriangle className="w-6 h-6 text-champagne" />
                Conflict Resolution
              </CardTitle>
              <p className="text-pearl/60 mt-2">
                Detect and resolve scheduling conflicts automatically
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadConflicts}
                className="border-pearl/20 text-pearl hover:bg-cocoa/50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              {stats.auto_resolvable > 0 && (
                <Button
                  onClick={() => {
                    conflicts.filter(c => c.auto_resolvable && !c.resolved).forEach(c => {
                      handleAutoResolve(c.id);
                    });
                  }}
                  className="bg-sage text-white hover:bg-sage/90"
                >
                  Auto-Resolve All ({stats.auto_resolvable})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="glass-card p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <AlertTriangle className="w-5 h-5 text-champagne" />
              <span className="text-2xl font-bold text-pearl">{stats.total}</span>
            </div>
            <p className="text-sm text-pearl/60">Total Conflicts</p>
            <p className="text-xs text-pearl/40">Detected</p>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Clock className="w-5 h-5 text-bronze" />
              <span className="text-2xl font-bold text-pearl">{stats.pending}</span>
            </div>
            <p className="text-sm text-pearl/60">Pending</p>
            <p className="text-xs text-pearl/40">Need resolution</p>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-2xl font-bold text-pearl">{stats.critical}</span>
            </div>
            <p className="text-sm text-pearl/60">Critical</p>
            <p className="text-xs text-pearl/40">Immediate action</p>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <CheckCircle className="w-5 h-5 text-sage" />
              <span className="text-2xl font-bold text-pearl">{stats.auto_resolvable}</span>
            </div>
            <p className="text-sm text-pearl/60">Auto-Resolvable</p>
            <p className="text-xs text-pearl/40">Can fix automatically</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="glass-card p-1">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Resolved ({conflicts.length - stats.pending})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            All ({stats.total})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredConflicts.length === 0 ? (
            <Card className="glass-card p-8 text-center">
              <CheckCircle className="w-12 h-12 text-sage mx-auto mb-4" />
              <h3 className="text-xl font-medium text-pearl mb-2">No Conflicts Found</h3>
              <p className="text-pearl/60">
                {activeTab === 'resolved' ? 'No conflicts have been resolved yet' :
                 activeTab === 'pending' ? 'No pending conflicts at the moment' :
                 'No conflicts detected in the system'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredConflicts.map((conflict) => (
                <Card key={conflict.id} className={`glass-card ${conflict.resolved ? 'opacity-60' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getSeverityColor(conflict.severity)}`}>
                          {getTypeIcon(conflict.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-medium text-pearl">{conflict.title}</h3>
                            <Badge className={getSeverityColor(conflict.severity)}>
                              {conflict.severity.toUpperCase()}
                            </Badge>
                            {conflict.resolved && (
                              <Badge className="bg-sage/20 text-sage border-sage/30">
                                RESOLVED
                              </Badge>
                            )}
                            {conflict.auto_resolvable && !conflict.resolved && (
                              <Badge variant="outline" className="border-champagne/30 text-champagne">
                                AUTO-RESOLVABLE
                              </Badge>
                            )}
                          </div>
                          <p className="text-pearl/60">{conflict.description}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedConflict(conflict);
                          setDialogOpen(true);
                        }}
                        className="text-pearl hover:bg-pearl/10"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Conflicting Items */}
                    <div className="space-y-3 mb-4">
                      {conflict.conflicting_items.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-cocoa/20 rounded-lg">
                          <div className="flex items-center gap-2 text-pearl/40">
                            <span className="text-sm">{index + 1}</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-pearl text-sm">{item.title}</div>
                            <div className="flex items-center gap-3 text-xs text-pearl/60 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {item.time}
                              </span>
                              {item.duration && (
                                <span className="flex items-center gap-1">
                                  <Timer className="w-3 h-3" />
                                  {item.duration}min
                                </span>
                              )}
                              {item.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {item.location}
                                </span>
                              )}
                              {item.staff && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {item.staff}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Suggested Resolution */}
                    <Alert className="bg-champagne/10 border-champagne/20">
                      <AlertTriangle className="w-4 h-4 text-champagne" />
                      <AlertDescription className="text-pearl/80">
                        <strong>Suggested Resolution:</strong> {conflict.suggested_resolution}
                      </AlertDescription>
                    </Alert>

                    {/* Actions */}
                    {!conflict.resolved && (
                      <div className="flex gap-2 mt-4">
                        {conflict.auto_resolvable && (
                          <Button
                            size="sm"
                            onClick={() => handleAutoResolve(conflict.id)}
                            disabled={autoResolving}
                            className="bg-sage text-white hover:bg-sage/90"
                          >
                            {autoResolving ? (
                              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Resolving...</>
                            ) : (
                              <>Auto-Resolve</>
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedConflict(conflict);
                            setDialogOpen(true);
                          }}
                          className="border-pearl/20 text-pearl hover:bg-cocoa/50"
                        >
                          Manual Resolution
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Conflict Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-pearl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-champagne" />
              {selectedConflict?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedConflict && (
            <div className="space-y-6">
              <div>
                <Badge className={getSeverityColor(selectedConflict.severity)}>
                  {selectedConflict.severity.toUpperCase()}
                </Badge>
                <p className="text-pearl/80 mt-2">{selectedConflict.description}</p>
              </div>

              <div>
                <h4 className="font-medium text-pearl mb-3">Conflicting Items</h4>
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {selectedConflict.conflicting_items.map((item, index) => (
                      <div key={item.id} className="p-4 bg-cocoa/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-pearl/40">#{index + 1}</span>
                          <h5 className="font-medium text-pearl">{item.title}</h5>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-pearl/60">
                          {item.time && (
                            <div>Time: {item.time}</div>
                          )}
                          {item.duration && (
                            <div>Duration: {item.duration} minutes</div>
                          )}
                          {item.location && (
                            <div>Location: {item.location}</div>
                          )}
                          {item.staff && (
                            <div>Staff: {item.staff}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div>
                <h4 className="font-medium text-pearl mb-3">Resolution Options</h4>
                <div className="space-y-3">
                  <div className="p-4 bg-sage/10 border border-sage/20 rounded-lg cursor-pointer hover:bg-sage/20">
                    <div className="font-medium text-sage mb-1">Auto-Resolve</div>
                    <div className="text-sm text-pearl/60">
                      Let the system automatically resolve this conflict
                    </div>
                  </div>
                  <div className="p-4 bg-champagne/10 border border-champagne/20 rounded-lg cursor-pointer hover:bg-champagne/20">
                    <div className="font-medium text-champagne mb-1">Manual Resolution</div>
                    <div className="text-sm text-pearl/60">
                      Review and manually resolve this conflict
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1 border-pearl/20 text-pearl hover:bg-cocoa/50"
                >
                  Close
                </Button>
                {selectedConflict.auto_resolvable && !selectedConflict.resolved && (
                  <Button
                    onClick={() => handleAutoResolve(selectedConflict.id)}
                    className="flex-1 bg-sage text-white hover:bg-sage/90"
                  >
                    Auto-Resolve
                  </Button>
                )}
                {!selectedConflict.resolved && (
                  <Button
                    onClick={() => handleManualResolve(selectedConflict.id, 'resolved')}
                    className="flex-1 bg-champagne text-charcoal hover:bg-champagne/90"
                  >
                    Mark as Resolved
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConflictResolution;