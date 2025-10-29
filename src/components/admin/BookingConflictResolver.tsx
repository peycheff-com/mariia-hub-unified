import React, { useState, useEffect, useCallback } from 'react';
import { DateRange } from 'react-day-picker';
import {
  Clock,
  Calendar as CalendarIcon,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  MessageSquare,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Sparkles,
  Download,
  Upload
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

// Types
interface BookingConflict {
  id: string;
  bookingId: string;
  conflictType: 'double_booking' | 'resource_conflict' | 'overlapping_time' | 'capacity_exceeded';
  severity: 'low' | 'medium' | 'high' | 'critical';
  primaryBooking: {
    id: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    serviceName: string;
    serviceType: 'beauty' | 'fitness';
    startTime: Date;
    endTime: Date;
    location: string;
    status: string;
  };
  conflictingBookings: Array<{
    id: string;
    clientName: string;
    serviceName: string;
    serviceType: 'beauty' | 'fitness';
    startTime: Date;
    endTime: Date;
    location: string;
  }>;
  resourceConflicts?: Array<{
    resourceId: string;
    resourceName: string;
    allocatedTo: string[];
    shortage: number;
  }>;
  detectedAt: Date;
  autoResolved: boolean;
  resolutionSuggestions?: Array<{
    type: 'reschedule' | 'relocate' | 'allocate_resource' | 'cancel';
    description: string;
    confidence: number;
    affectedBookings: string[];
  }>;
}

interface CommunicationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp';
  language: 'en' | 'pl';
  subject?: string;
  content: string;
  variables: string[];
}

interface ConflictResolution {
  conflictId: string;
  resolutionType: 'manual_reschedule' | 'auto_reschedule' | 'relocate' | 'allocate_resources' | 'cancel_conflict' | 'merge_bookings';
  selectedAction: string;
  newDateTime?: { date: Date; time: string };
  newLocation?: string;
  allocatedResources?: Record<string, number>;
  communicationTemplate?: string;
  affectedClients: string[];
  notes?: string;
  executedAt?: Date;
  executedBy?: string;
}

interface DraggedBooking {
  bookingId: string;
  originalStart: Date;
  originalEnd: Date;
  newStart?: Date;
  newEnd?: Date;
}

export function BookingConflictResolver() {
  const [conflicts, setConflicts] = useState<BookingConflict[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<BookingConflict | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [resolutionDialog, setResolutionDialog] = useState(false);
  const [currentResolution, setCurrentResolution] = useState<Partial<ConflictResolution>>({});
  const [draggedBooking, setDraggedBooking] = useState<DraggedBooking | null>(null);
  const [resolvingConflicts, setResolvingConflicts] = useState<Record<string, boolean>>({});
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [bulkSelection, setBulkSelection] = useState<string[]>([]);
  const [showTimelineView, setShowTimelineView] = useState(true);
  const [hourHeight] = useState(60); // pixels per hour in timeline

  // Load conflicts and communication templates
  useEffect(() => {
    loadConflicts();
    loadCommunicationTemplates();

    // Set up real-time updates
    const interval = setInterval(loadConflicts, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [selectedDateRange]);

  const loadConflicts = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/bookings/conflicts?' +
        new URLSearchParams({
          from: selectedDateRange?.from?.toISOString() || '',
          to: selectedDateRange?.to?.toISOString() || '',
        }));

      if (!response.ok) throw new Error('Failed to load conflicts');

      const data = await response.json();
      setConflicts(data.conflicts || []);
    } catch (error) {
      console.error('Error loading conflicts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDateRange]);

  const loadCommunicationTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/communication-templates?type=conflict_resolution');
      if (!response.ok) throw new Error('Failed to load templates');

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }, []);

  // Auto-resolution suggestions
  const generateAutoSolutions = useCallback(async (conflictId: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/conflicts/${conflictId}/suggest-solutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to generate solutions');

      const data = await response.json();

      setConflicts(prev => prev.map(conflict =>
        conflict.id === conflictId
          ? { ...conflict, resolutionSuggestions: data.suggestions }
          : conflict
      ));
    } catch (error) {
      console.error('Error generating solutions:', error);
    }
  }, []);

  // Manual conflict resolution
  const resolveConflict = useCallback(async (conflictId: string, resolution: ConflictResolution) => {
    setResolvingConflicts(prev => ({ ...prev, [conflictId]: true }));

    try {
      const response = await fetch(`/api/admin/bookings/conflicts/${conflictId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolution),
      });

      if (!response.ok) throw new Error('Failed to resolve conflict');

      const data = await response.json();

      if (data.success) {
        // Remove resolved conflict or update status
        setConflicts(prev => prev.filter(conflict => conflict.id !== conflictId));
        setResolutionDialog(false);
        setCurrentResolution({});
      }
    } catch (error) {
      console.error('Error resolving conflict:', error);
    } finally {
      setResolvingConflicts(prev => ({ ...prev, [conflictId]: false }));
    }
  }, []);

  // Bulk conflict resolution
  const resolveBulkConflicts = useCallback(async (resolutionType: string) => {
    if (bulkSelection.length === 0) return;

    try {
      const response = await fetch('/api/admin/bookings/conflicts/bulk-resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conflictIds: bulkSelection,
          resolutionType,
          communicationTemplate: templates.find(t => t.name.includes('Bulk Resolution'))?.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to resolve bulk conflicts');

      const data = await response.json();

      if (data.success) {
        setConflicts(prev => prev.filter(conflict => !bulkSelection.includes(conflict.id)));
        setBulkSelection([]);
      }
    } catch (error) {
      console.error('Error resolving bulk conflicts:', error);
    }
  }, [bulkSelection, templates]);

  // Drag and drop handlers
  const handleDragStart = useCallback((booking: any) => {
    setDraggedBooking({
      bookingId: booking.id,
      originalStart: booking.startTime,
      originalEnd: booking.endTime,
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetDate: Date, targetTime: string) => {
    e.preventDefault();

    if (!draggedBooking) return;

    // Calculate new time based on drop position
    const [hours, minutes] = targetTime.split(':').map(Number);
    const duration = draggedBooking.originalEnd.getTime() - draggedBooking.originalStart.getTime();
    const newStart = new Date(targetDate);
    newStart.setHours(hours, minutes, 0, 0);
    const newEnd = new Date(newStart.getTime() + duration);

    setDraggedBooking({
      ...draggedBooking,
      newStart,
      newEnd,
    });
  }, [draggedBooking]);

  // Timeline rendering
  const renderTimeline = useCallback(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="relative overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Hour markers */}
          <div className="flex border-b">
            <div className="w-32 flex-shrink-0 p-2 text-sm font-medium">Time</div>
            <div className="flex-1 flex">
              {hours.map(hour => (
                <div key={hour} className="flex-1 text-center p-2 text-xs text-muted-foreground border-r">
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          {/* Conflicts */}
          {conflicts.map((conflict, index) => (
            <div key={conflict.id} className="flex border-b hover:bg-muted/50">
              <div className="w-32 flex-shrink-0 p-2">
                <Badge variant={conflict.severity === 'critical' ? 'destructive' :
                               conflict.severity === 'high' ? 'destructive' :
                               conflict.severity === 'medium' ? 'default' : 'secondary'}>
                  {conflict.conflictType.replace('_', ' ')}
                </Badge>
                <p className="text-xs mt-1 truncate">{conflict.primaryBooking.clientName}</p>
              </div>

              <div className="flex-1 relative" style={{ height: `${hourHeight}px` }}>
                {/* Primary booking */}
                <div
                  draggable
                  onDragStart={() => handleDragStart(conflict.primaryBooking)}
                  onDragOver={handleDragOver}
                  className="absolute bg-primary/10 border border-primary rounded px-2 py-1 cursor-move"
                  style={{
                    left: `${(conflict.primaryBooking.startTime.getHours() +
                            conflict.primaryBooking.startTime.getMinutes() / 60) * (100 / 24)}%`,
                    width: `${((conflict.primaryBooking.endTime.getTime() - conflict.primaryBooking.startTime.getTime()) /
                             (1000 * 60 * 60)) * (100 / 24)}%`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                >
                  <div className="flex items-center gap-1 text-xs">
                    <GripVertical className="h-3 w-3" />
                    <span className="truncate">{conflict.primaryBooking.serviceName}</span>
                  </div>
                </div>

                {/* Conflicting bookings */}
                {conflict.conflictingBookings.map((booking, idx) => (
                  <div
                    key={booking.id}
                    draggable
                    onDragStart={() => handleDragStart(booking)}
                    className="absolute bg-destructive/10 border border-destructive rounded px-2 py-1 cursor-move"
                    style={{
                      left: `${(booking.startTime.getHours() + booking.startTime.getMinutes() / 60) * (100 / 24)}%`,
                      width: `${((booking.endTime.getTime() - booking.startTime.getTime()) /
                               (1000 * 60 * 60)) * (100 / 24)}%`,
                      top: `${20 + idx * 20}%`,
                    }}
                  >
                    <div className="flex items-center gap-1 text-xs">
                      <GripVertical className="h-3 w-3" />
                      <span className="truncate">{booking.serviceName}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-24 flex-shrink-0 p-2 flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedConflict(conflict);
                    generateAutoSolutions(conflict.id);
                  }}
                >
                  <Sparkles className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedConflict(conflict);
                    setResolutionDialog(true);
                  }}
                >
                  Resolve
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, [conflicts, hourHeight, handleDragStart, handleDragOver, generateAutoSolutions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Booking Conflict Resolution</h2>
          <p className="text-muted-foreground">
            Manage and resolve booking conflicts with intelligent suggestions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowTimelineView(!showTimelineView)}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {showTimelineView ? 'List View' : 'Timeline View'}
          </Button>

          {bulkSelection.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {bulkSelection.length} conflicts selected
              </span>
              <Select onValueChange={(value) => resolveBulkConflicts(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Bulk resolve as..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto_reschedule">Auto Reschedule</SelectItem>
                  <SelectItem value="relocate">Change Location</SelectItem>
                  <SelectItem value="allocate_resources">Allocate Resources</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          <Button variant="outline" onClick={loadConflicts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Calendar
          mode="range"
          selected={selectedDateRange}
          onSelect={setSelectedDateRange}
          className="rounded-md border"
        />

        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Critical: {conflicts.filter(c => c.severity === 'critical').length}
          </Badge>
          <Badge variant="outline">
            High: {conflicts.filter(c => c.severity === 'high').length}
          </Badge>
          <Badge variant="outline">
            Medium: {conflicts.filter(c => c.severity === 'medium').length}
          </Badge>
          <Badge variant="outline">
            Low: {conflicts.filter(c => c.severity === 'low').length}
          </Badge>
        </div>
      </div>

      {/* Conflicts Display */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
      ) : conflicts.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-medium">No conflicts found</p>
              <p className="text-muted-foreground">All bookings are properly scheduled</p>
            </div>
          </CardContent>
        </Card>
      ) : showTimelineView ? (
        <Card>
          <CardHeader>
            <CardTitle>Timeline View</CardTitle>
            <CardDescription>
              Drag bookings to reschedule them to different time slots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {renderTimeline()}
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {conflicts.map(conflict => (
            <Card key={conflict.id} className={cn(
              "border-l-4",
              conflict.severity === 'critical' && "border-l-red-500",
              conflict.severity === 'high' && "border-l-orange-500",
              conflict.severity === 'medium' && "border-l-yellow-500",
              conflict.severity === 'low' && "border-l-blue-500"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn(
                        "h-4 w-4",
                        conflict.severity === 'critical' && "text-red-500",
                        conflict.severity === 'high' && "text-orange-500",
                        conflict.severity === 'medium' && "text-yellow-500",
                        conflict.severity === 'low' && "text-blue-500"
                      )} />
                      <CardTitle className="text-lg">
                        {conflict.conflictType.replace('_', ' ').toUpperCase()}
                      </CardTitle>
                      <Badge variant={
                        conflict.severity === 'critical' ? 'destructive' :
                        conflict.severity === 'high' ? 'destructive' :
                        conflict.severity === 'medium' ? 'default' : 'secondary'
                      }>
                        {conflict.severity}
                      </Badge>
                    </div>
                    <CardDescription>
                      Detected {new Date(conflict.detectedAt).toLocaleString()}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={bulkSelection.includes(conflict.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBulkSelection(prev => [...prev, conflict.id]);
                        } else {
                          setBulkSelection(prev => prev.filter(id => id !== conflict.id));
                        }
                      }}
                      className="rounded"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateAutoSolutions(conflict.id)}
                      disabled={resolvingConflicts[conflict.id]}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Suggest
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedConflict(conflict);
                        setResolutionDialog(true);
                      }}
                      disabled={resolvingConflicts[conflict.id]}
                    >
                      {resolvingConflicts[conflict.id] ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        'Resolve'
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Primary Booking */}
                <div className="p-3 bg-primary/5 rounded-lg">
                  <h4 className="font-medium mb-2">Primary Booking</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Client:</span>
                      <p className="font-medium">{conflict.primaryBooking.clientName}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs truncate">{conflict.primaryBooking.clientEmail}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{conflict.primaryBooking.clientPhone}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Service:</span>
                      <p className="font-medium">{conflict.primaryBooking.serviceName}</p>
                      <Badge variant="outline" className="mt-1">
                        {conflict.primaryBooking.serviceType}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Time:</span>
                      <p className="font-medium">
                        {conflict.primaryBooking.startTime.toLocaleString()} -
                        {conflict.primaryBooking.endTime.toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Location:</span>
                      <p className="font-medium">{conflict.primaryBooking.location}</p>
                      <Badge variant="outline" className="mt-1">
                        {conflict.primaryBooking.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Conflicting Bookings */}
                <div className="p-3 bg-destructive/5 rounded-lg">
                  <h4 className="font-medium mb-2">Conflicting Bookings</h4>
                  <div className="space-y-2">
                    {conflict.conflictingBookings.map((booking, index) => (
                      <div key={booking.id} className="grid grid-cols-4 gap-4 text-sm p-2 bg-background rounded">
                        <div>
                          <p className="font-medium">{booking.clientName}</p>
                          <p className="text-muted-foreground text-xs">{booking.serviceName}</p>
                        </div>
                        <div>
                          <Badge variant="outline">{booking.serviceType}</Badge>
                        </div>
                        <div>
                          <p>{booking.startTime.toLocaleString()} - {booking.endTime.toLocaleTimeString()}</p>
                        </div>
                        <div>
                          <p>{booking.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resource Conflicts */}
                {conflict.resourceConflicts && conflict.resourceConflicts.length > 0 && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <h4 className="font-medium mb-2">Resource Conflicts</h4>
                    <div className="space-y-1">
                      {conflict.resourceConflicts.map((resource, index) => (
                        <div key={resource.resourceId} className="text-sm">
                          <span className="font-medium">{resource.resourceName}:</span>
                          <span className="text-red-600 dark:text-red-400 ml-2">
                            {resource.shortage} units short
                          </span>
                          <span className="text-muted-foreground ml-2">
                            (Allocated to: {resource.allocatedTo.join(', ')})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Suggestions */}
                {conflict.resolutionSuggestions && conflict.resolutionSuggestions.length > 0 && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <h4 className="font-medium mb-2">AI Suggested Solutions</h4>
                    <div className="space-y-2">
                      {conflict.resolutionSuggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-background rounded">
                          <Sparkles className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{suggestion.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Confidence: {Math.round(suggestion.confidence * 100)}%
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCurrentResolution({
                                resolutionType: suggestion.type as any,
                                selectedAction: suggestion.description,
                                affectedClients: suggestion.affectedBookings,
                              });
                              setResolutionDialog(true);
                            }}
                          >
                            Apply
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resolution Dialog */}
      <Dialog open={resolutionDialog} onOpenChange={setResolutionDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resolve Booking Conflict</DialogTitle>
            <DialogDescription>
              Choose how to resolve the selected booking conflict
            </DialogDescription>
          </DialogHeader>

          {selectedConflict && (
            <div className="space-y-6">
              {/* Conflict Summary */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">Conflict Summary</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Type:</strong> {selectedConflict.conflictType.replace('_', ' ')}</p>
                  <p><strong>Severity:</strong> {selectedConflict.severity}</p>
                  <p><strong>Primary:</strong> {selectedConflict.primaryBooking.clientName} - {selectedConflict.primaryBooking.serviceName}</p>
                  <p><strong>Conflicts with:</strong> {selectedConflict.conflictingBookings.map(b => b.clientName).join(', ')}</p>
                </div>
              </div>

              {/* Resolution Options */}
              <Tabs defaultValue="manual_reschedule" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="manual_reschedule">Manual Reschedule</TabsTrigger>
                  <TabsTrigger value="auto_reschedule">Auto Reschedule</TabsTrigger>
                  <TabsTrigger value="other">Other Options</TabsTrigger>
                </TabsList>

                <TabsContent value="manual_reschedule" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Select Action</label>
                    <Select onValueChange={(value) => setCurrentResolution(prev => ({ ...prev, selectedAction: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose resolution action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reschedule_primary">Reschedule Primary Booking</SelectItem>
                        <SelectItem value="reschedule_conflicts">Reschedule Conflicting Bookings</SelectItem>
                        <SelectItem value="change_location">Change Location</SelectItem>
                        <SelectItem value="allocate_resources">Allocate Additional Resources</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {currentResolution.selectedAction?.includes('reschedule') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">New Date</label>
                        <input
                          type="date"
                          className="w-full mt-1 px-3 py-2 border rounded-md"
                          onChange={(e) => setCurrentResolution(prev => ({
                            ...prev,
                            newDateTime: { ...prev.newDateTime, date: new Date(e.target.value) }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">New Time</label>
                        <input
                          type="time"
                          className="w-full mt-1 px-3 py-2 border rounded-md"
                          onChange={(e) => setCurrentResolution(prev => ({
                            ...prev,
                            newDateTime: { ...prev.newDateTime, time: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="auto_reschedule" className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <p className="text-sm">
                      The system will automatically find the best alternative time slots based on:
                    </p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• Client availability preferences</li>
                      <li>• Service resource requirements</li>
                      <li>• Historical booking patterns</li>
                      <li>• Priority and VIP status</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="other" className="space-y-4">
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setCurrentResolution(prev => ({ ...prev, resolutionType: 'allocate_resources' }))}
                    >
                      Allocate Additional Resources
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setCurrentResolution(prev => ({ ...prev, resolutionType: 'merge_bookings' }))}
                    >
                      Merge Compatible Bookings
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600 hover:text-red-700"
                      onClick={() => setCurrentResolution(prev => ({ ...prev, resolutionType: 'cancel_conflict' }))}
                    >
                      Cancel Conflicting Bookings
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Communication Templates */}
              <div>
                <label className="text-sm font-medium">Communication Template</label>
                <Select onValueChange={(value) => setCurrentResolution(prev => ({ ...prev, communicationTemplate: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select notification template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium">Resolution Notes</label>
                <Textarea
                  placeholder="Add any notes about this resolution..."
                  value={currentResolution.notes || ''}
                  onChange={(e) => setCurrentResolution(prev => ({ ...prev, notes: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setResolutionDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedConflict && currentResolution.resolutionType && currentResolution.selectedAction) {
                  resolveConflict(selectedConflict.id, currentResolution as ConflictResolution);
                }
              }}
              disabled={!currentResolution.resolutionType || !currentResolution.selectedAction}
            >
              Resolve Conflict
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}