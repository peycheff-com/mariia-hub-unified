import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Settings, TrendingUp, AlertCircle, Save, Edit2, Check, X } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { bookingCapacityService } from '@/services/bookingCapacity.service';
import { servicesService } from '@/services/services.service';
import { useAuth } from '@/contexts/AuthContext';


interface Service {
  id: string;
  title: string;
  service_type: 'beauty' | 'fitness';
  duration_minutes: number;
}

interface CapacitySlot {
  id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  current_bookings: number;
  available_spots: number;
  is_fully_booked: boolean;
  service_type: string;
}

export const CapacityManagement = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<CapacitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [tempCapacity, setTempCapacity] = useState<number>(1);
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
  const [bulkCapacity, setBulkCapacity] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [weeksAhead, setWeeksAhead] = useState<number>(12);
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Load services
  useEffect(() => {
    const loadServices = async () => {
      try {
        const { data } = await servicesService.getServices({ status: 'active' });
        if (data) {
          setServices(data);
          if (data.length > 0 && !selectedService) {
            setSelectedService(data[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load services:', error);
      }
    };
    loadServices();
  }, [selectedService]);

  // Load slots for selected service and date
  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedService) return;

      try {
        setLoading(true);
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const { data, error } = await bookingCapacityService.getAvailableSlotsWithCapacity(
          selectedService,
          dateStr
        );

        if (error) {
          toast.error('Failed to load capacity data');
          return;
        }

        // Get all slots for the day (not just available ones)
        const allSlots = data || [];
        setSlots(allSlots);
      } catch (error) {
        toast.error('Failed to load capacity data');
      } finally {
        setLoading(false);
      }
    };

    loadSlots();
  }, [selectedService, selectedDate]);

  // Load analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!selectedService) return;

      try {
        setAnalyticsLoading(true);
        const analytics = await bookingCapacityService.getCapacityAnalytics(
          selectedService,
          7
        );
        setAnalytics(analytics);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedService]);

  const handleCapacityChange = async (slotId: string, newCapacity: number) => {
    try {
      const { success, error } = await bookingCapacityService.setSlotCapacity(
        slotId,
        newCapacity,
        user?.id
      );

      if (error) {
        toast.error('Failed to update capacity');
        return;
      }

      if (success) {
        toast.success('Capacity updated successfully');
        setEditingSlot(null);
        // Reload slots
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const { data } = await bookingCapacityService.getAvailableSlotsWithCapacity(
          selectedService,
          dateStr
        );
        if (data) setSlots(data);
      }
    } catch (error) {
      toast.error('Failed to update capacity');
    }
  };

  const handleBulkUpdate = async () => {
    if (!selectedService) return;

    try {
      const { updatedCount, error } = await bookingCapacityService.bulkUpdateCapacity(
        selectedService,
        selectedDay,
        startTime,
        endTime,
        bulkCapacity,
        user?.id,
        weeksAhead
      );

      if (error) {
        toast.error('Failed to update capacity');
        return;
      }

      toast.success(`Updated ${updatedCount} slots successfully`);
      setBulkUpdateOpen(false);
      // Reload slots
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data } = await bookingCapacityService.getAvailableSlotsWithCapacity(
        selectedService,
        dateStr
      );
      if (data) setSlots(data);
    } catch (error) {
      toast.error('Failed to update capacity');
    }
  };

  const getCapacityColor = (slot: CapacitySlot) => {
    const utilization = ((slot.capacity - slot.available_spots) / slot.capacity) * 100;
    if (slot.is_fully_booked) return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (utilization >= 75) return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    if (utilization >= 50) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
    return 'text-green-500 bg-green-500/10 border-green-500/30';
  };

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return addDays(start, i);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pearl">Capacity Management</h2>
          <p className="text-pearl/60">Manage booking capacity for your time slots</p>
        </div>
        <Dialog open={bulkUpdateOpen} onOpenChange={setBulkUpdateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-champagne text-cocoa hover:bg-champagne/90">
              <Settings className="w-4 h-4 mr-2" />
              Bulk Update
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-champagne/20">
            <DialogHeader>
              <DialogTitle className="text-pearl">Bulk Update Capacity</DialogTitle>
              <DialogDescription className="text-pearl/60">
                Update capacity for recurring time slots
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-pearl/80 text-sm">Day of Week</Label>
                <Select value={selectedDay.toString()} onValueChange={(v) => setSelectedDay(parseInt(v))}>
                  <SelectTrigger className="glass-subtle border-champagne/20 text-pearl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-champagne/20">
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                    <SelectItem value="0">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-pearl/80 text-sm">Start Time</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="glass-subtle border-champagne/20 text-pearl"
                  />
                </div>
                <div>
                  <Label className="text-pearl/80 text-sm">End Time</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="glass-subtle border-champagne/20 text-pearl"
                  />
                </div>
              </div>
              <div>
                <Label className="text-pearl/80 text-sm">Capacity</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={bulkCapacity}
                  onChange={(e) => setBulkCapacity(parseInt(e.target.value))}
                  className="glass-subtle border-champagne/20 text-pearl"
                />
              </div>
              <div>
                <Label className="text-pearl/80 text-sm">Weeks Ahead</Label>
                <Input
                  type="number"
                  min="1"
                  max="52"
                  value={weeksAhead}
                  onChange={(e) => setWeeksAhead(parseInt(e.target.value))}
                  className="glass-subtle border-champagne/20 text-pearl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBulkUpdateOpen(false)}
                className="border-champagne/20 text-pearl hover:bg-champagne/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkUpdate}
                className="bg-champagne text-cocoa hover:bg-champagne/90"
              >
                Update Slots
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="glass-subtle border-champagne/20">
          <TabsTrigger value="daily" className="text-pearl/80 data-[state=active]:text-pearl">
            <Calendar className="w-4 h-4 mr-2" />
            Daily View
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-pearl/80 data-[state=active]:text-pearl">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          {/* Service selector */}
          <div className="flex items-center gap-4">
            <Label className="text-pearl/80">Service:</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="w-80 glass-subtle border-champagne/20 text-pearl">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent className="glass-card border-champagne/20">
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.title} ({service.service_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Week view */}
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date) => (
              <Card
                key={date.toISOString()}
                className={cn(
                  "glass-subtle border transition-all cursor-pointer hover:border-champagne/30",
                  isSameDay(date, selectedDate)
                    ? "border-champagne/50 shadow-luxury"
                    : "border-champagne/15"
                )}
                onClick={() => setSelectedDate(date)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-pearl/80">
                    {format(date, 'EEE')}
                  </CardTitle>
                  <CardDescription className="text-lg font-bold text-pearl">
                    {format(date, 'd')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {slots
                    .filter(s => isSameDay(new Date(s.start_time), date))
                    .slice(0, 3)
                    .map((slot) => (
                      <div
                        key={slot.id}
                        className={cn(
                          "text-xs p-1 mb-1 rounded border flex justify-between items-center",
                          getCapacityColor(slot)
                        )}
                      >
                        <span>{format(new Date(slot.start_time), 'HH:mm')}</span>
                        <span className="font-bold">
                          {slot.available_spots}/{slot.capacity}
                        </span>
                      </div>
                    ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected date slots */}
          <Card className="glass-subtle border-champagne/20">
            <CardHeader>
              <CardTitle className="text-pearl flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {format(selectedDate, 'EEEE, MMMM d')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-champagne" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8 text-pearl/60">
                  No slots scheduled for this day
                </div>
              ) : (
                <div className="grid gap-2">
                  {slots
                    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                    .map((slot) => (
                      <div
                        key={slot.id}
                        className={cn(
                          "p-3 rounded-lg border flex items-center justify-between group",
                          getCapacityColor(slot)
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="font-medium text-pearl">
                              {format(new Date(slot.start_time), 'HH:mm')} -{' '}
                              {format(new Date(slot.end_time), 'HH:mm')}
                            </div>
                            <div className="text-sm opacity-80">
                              {slot.current_bookings} booked, {slot.available_spots} available
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "border-current",
                              slot.is_fully_booked
                                ? "text-red-500"
                                : slot.available_spots >= slot.capacity / 2
                                ? "text-green-500"
                                : "text-orange-500"
                            )}
                          >
                            {Math.round(((slot.capacity - slot.available_spots) / slot.capacity) * 100)}% full
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {editingSlot === slot.id ? (
                            <>
                              <Input
                                type="number"
                                min="1"
                                max="50"
                                value={tempCapacity}
                                onChange={(e) => setTempCapacity(parseInt(e.target.value))}
                                className="w-20 h-8 text-center glass-subtle border-champagne/20"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleCapacityChange(slot.id, tempCapacity)}
                                className="h-8 bg-green-500 hover:bg-green-600"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingSlot(null);
                                  setTempCapacity(1);
                                }}
                                className="h-8 border-champagne/20 text-pearl hover:bg-champagne/10"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-1 text-pearl/80">
                                <Users className="w-4 h-4" />
                                <span className="font-bold">{slot.capacity}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingSlot(slot.id);
                                  setTempCapacity(slot.capacity);
                                }}
                                className="h-8 border-champagne/20 text-pearl hover:bg-champagne/10 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analyticsLoading ? (
            <Card className="glass-subtle border-champagne/20">
              <CardContent className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-champagne" />
              </CardContent>
            </Card>
          ) : analytics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-subtle border-champagne/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-pearl/80">Total Slots</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-pearl">{analytics.totalSlots}</div>
                </CardContent>
              </Card>
              <Card className="glass-subtle border-champagne/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-pearl/80">Avg Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-champagne">
                    {analytics.averageUtilization}%
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-subtle border-champagne/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-pearl/80">Fully Booked</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-400">{analytics.fullyBookedSlots}</div>
                </CardContent>
              </Card>
              <Card className="glass-subtle border-champagne/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-pearl/80">Available Slots</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">{analytics.emptySlots}</div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="glass-subtle border-champagne/20">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-pearl/60">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>No analytics data available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};