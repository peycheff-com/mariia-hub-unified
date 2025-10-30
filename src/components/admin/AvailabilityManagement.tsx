import { useState, useEffect } from 'react';
import { Calendar, MapPin, Laptop, Dumbbell, AlertTriangle, Sparkles, RefreshCw, User, Clock, DollarSign, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAvailability, AvailabilitySlot, Booking } from '@/hooks/useAvailability';
import EmptyState from '@/components/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';

import UnifiedAvailabilityCalendar from './UnifiedAvailabilityCalendar';
import AvailabilityMonthCalendar from './AvailabilityMonthCalendar';
import WeekView from './WeekView';
import QuickSlotCreator from './QuickSlotCreator';
import { AutoSlotGenerator } from './AutoSlotGenerator';
import BookingFilters, { BookingFilters as FilterType } from './BookingFilters';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AvailabilityManagement = () => {
  const beautyAvailability = useAvailability('beauty');
  const fitnessAvailability = useAvailability('fitness');
  const [activeTab, setActiveTab] = useState<'beauty' | 'fitness'>('beauty');
  const [viewMode, setViewMode] = useState<'calendar' | 'bookings' | 'week'>('calendar');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [preselectedDay, setPreselectedDay] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterType>({});
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const itemsPerPage = 10;

  const activeAvailability = activeTab === 'beauty' ? beautyAvailability : fitnessAvailability;

  const [formData, setFormData] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    service_type: activeTab,
    location: 'studio' as 'studio' | 'online' | 'fitness',
    is_available: true,
    notes: '',
  });

  // Apply filters to bookings whenever filters or bookings change
  useEffect(() => {
    let filtered = [...activeAvailability.bookings];
    if (filters.status) filtered = filtered.filter(b => b.status === filters.status);
    if (filters.serviceType) filtered = filtered.filter(b => b.services?.service_type === filters.serviceType);
    if (filters.dateFrom) filtered = filtered.filter(b => new Date(b.booking_date) >= filters.dateFrom!);
    if (filters.dateTo) filtered = filtered.filter(b => new Date(b.booking_date) <= filters.dateTo!);
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        b.client_name?.toLowerCase().includes(term) ||
        b.client_email?.toLowerCase().includes(term)
      );
    }
    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [filters, activeAvailability.bookings]);

  const exportToCSV = () => {
    const headers = ['Date', 'Client', 'Email', 'Service', 'Status', 'Price', 'Duration'];
    const rows = filteredBookings.map(b => [
      new Date(b.booking_date).toLocaleDateString(),
      b.client_name || '',
      b.client_email || '',
      b.services?.title || '',
      b.status,
      `${b.amount_paid || b.services?.price_from || 0} ${b.currency || 'PLN'}`,
      `${b.services?.duration_minutes || 0} min`
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast aria-live="polite" aria-atomic="true"({ title: 'Success', description: 'Bookings exported to CSV' });
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    const { error } = await (supabase as any).from('bookings').update({ status: newStatus }).eq('id', bookingId);
    if (error) {
      toast aria-live="polite" aria-atomic="true"({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast aria-live="polite" aria-atomic="true"({ title: 'Success', description: 'Booking status updated' });
      activeAvailability.refreshData();
    }
  };

  const saveAdminNotes = async (bookingId: string) => {
    const { error } = await (supabase as any).from('bookings').update({ admin_notes: adminNotes }).eq('id', bookingId);
    if (error) {
      toast aria-live="polite" aria-atomic="true"({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast aria-live="polite" aria-atomic="true"({ title: 'Success', description: 'Notes saved' });
      setEditingNotes(null);
      setAdminNotes('');
      activeAvailability.refreshData();
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    const { error } = await supabase.from('availability_slots').delete().eq('id', slotId);
    if (error) {
      toast aria-live="polite" aria-atomic="true"({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast aria-live="polite" aria-atomic="true"({ title: 'Success', description: 'Slot deleted' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-sage/20 text-sage border-sage/30';
      case 'pending': return 'bg-champagne/20 text-champagne border-champagne/30';
      case 'cancelled': return 'bg-graphite/20 text-pearl border-graphite/30';
      case 'completed': return 'bg-bronze/20 text-bronze border-bronze/30';
      default: return 'bg-pearl/20 text-pearl border-pearl/30';
    }
  };

  const resetForm = () => {
    setFormData({
      day_of_week: preselectedDay ?? 1,
      start_time: '09:00',
      end_time: '17:00',
      service_type: activeTab,
      location: activeTab === 'beauty' ? 'studio' : 'fitness',
      is_available: true,
      notes: '',
    });
    setEditingSlot(null);
    setPreselectedDay(null);
  };

  const handleOpenDialog = (dayOfWeek?: number) => {
    resetForm();
    if (dayOfWeek !== undefined) {
      setPreselectedDay(dayOfWeek);
      setFormData(prev => ({ ...prev, day_of_week: dayOfWeek }));
    }
    setDialogOpen(true);
  };

  const handleEditSlot = (slot: AvailabilitySlot) => {
    setEditingSlot(slot);
    setFormData({
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      service_type: slot.service_type,
      location: slot.location,
      is_available: slot.is_available,
      notes: slot.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const conflict = activeAvailability.checkConflicts(
      formData.day_of_week,
      formData.start_time,
      formData.end_time,
      formData.location,
      editingSlot?.id
    );

    if (conflict.hasConflict) {
      return;
    }

    let result;
    if (editingSlot) {
      result = await activeAvailability.updateSlot(editingSlot.id, formData);
    } else {
      result = await activeAvailability.createSlot(formData);
    }

    if (result.success) {
      setDialogOpen(false);
      resetForm();
    }
  };

  if (beautyAvailability.loading || fitnessAvailability.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-champagne animate-spin mx-auto" />
          <p className="text-pearl/60">Loading availability...</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-champagne" />
                <h2 className="text-3xl font-serif text-pearl">Unified Availability Calendar</h2>
              </div>
              <p className="text-pearl/60">
                Manage availability, slots, and bookings in one unified interface
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setViewMode('calendar')}
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </Button>
              <Button
                onClick={() => setViewMode('week')}
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
              >
                <Clock className="w-4 h-4 mr-2" />
                Week View
              </Button>
              <Button
                onClick={() => setViewMode('bookings')}
                variant={viewMode === 'bookings' ? 'default' : 'outline'}
                size="sm"
              >
                <User className="w-4 h-4 mr-2" />
                Bookings
              </Button>
              <Button
                onClick={activeAvailability.refreshData}
                variant="outline"
                size="sm"
                className="border-graphite/20 text-pearl hover:bg-cocoa/50"
                title="Refresh data (R)"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="glass-card p-4">
          <div className="space-y-1">
            <p className="text-xs text-pearl/60 uppercase tracking-wider">Total Bookings</p>
            <p className="text-2xl font-bold text-pearl">{activeAvailability.bookings.length}</p>
            <p className="text-xs text-champagne">
              {activeAvailability.bookings.filter(b => b.status === 'pending').length} pending
            </p>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="space-y-1">
            <p className="text-xs text-pearl/60 uppercase tracking-wider">This Week</p>
            <p className="text-2xl font-bold text-pearl">
              {activeAvailability.bookings.filter(b => {
                const date = new Date(b.booking_date);
                const today = new Date();
                const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 7);
                return date >= weekStart && date < weekEnd;
              }).length}
            </p>
            <p className="text-xs text-sage">
              {activeAvailability.bookings.filter(b => {
                const date = new Date(b.booking_date);
                return date.toDateString() === new Date().toDateString();
              }).length} today
            </p>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="space-y-1">
            <p className="text-xs text-pearl/60 uppercase tracking-wider">Available Slots</p>
            <p className="text-2xl font-bold text-pearl">
              {Object.values(activeAvailability.slots).flat().length}
            </p>
            <p className="text-xs text-pearl/60">
              across {Object.keys(activeAvailability.slots).length} days
            </p>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="space-y-1">
            <p className="text-xs text-pearl/60 uppercase tracking-wider">Revenue</p>
            <p className="text-2xl font-bold text-pearl">
              {activeAvailability.bookings
                .filter(b => b.status === 'confirmed' || b.status === 'completed')
                .reduce((sum, b) => sum + (Number(b.amount_paid) || Number(b.services?.price_from) || 0), 0)
                .toFixed(0)} PLN
            </p>
            <p className="text-xs text-bronze">
              {activeAvailability.bookings.filter(b => b.status === 'completed').length} completed
            </p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'beauty' | 'fitness')}>
        <TabsList className="glass-card p-1">
          <TabsTrigger value="beauty" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Beauty Services
            <Badge variant="secondary" className="ml-2">
              {beautyAvailability.bookings.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="fitness" className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4" />
            Fitness Programs
            <Badge variant="secondary" className="ml-2">
              {fitnessAvailability.bookings.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="beauty" className="mt-6 space-y-4">
          {viewMode === 'calendar' ? (
            <>
              <div className="flex justify-end gap-2">
                <QuickSlotCreator serviceType="beauty" onComplete={beautyAvailability.refreshData} />
                <AutoSlotGenerator serviceType="beauty" onComplete={beautyAvailability.refreshData} />
              </div>
              <UnifiedAvailabilityCalendar
                slots={Object.values(beautyAvailability.slots).flat()}
                bookings={beautyAvailability.bookings}
                onSlotUpdate={(slot) => {
                  handleEditSlot(slot);
                  beautyAvailability.refreshData();
                }}
                onSlotDelete={async (slotId) => {
                  if (confirm('Delete this slot?')) {
                    await handleDeleteSlot(slotId);
                    beautyAvailability.refreshData();
                  }
                }}
                onAddSlot={handleOpenDialog}
                onRefresh={beautyAvailability.refreshData}
              />
            </>
          ) : viewMode === 'week' ? (
            <WeekView
              bookings={filteredBookings}
              onBookingClick={(booking) => {
                setSelectedDate(new Date(booking.booking_date));
                setViewMode('calendar');
              }}
            />
          ) : (
            <div className="space-y-4">
              <BookingFilters onFilterChange={setFilters} onExport={exportToCSV} />
              {paginatedBookings.length === 0 ? (
                <EmptyState 
                  icon={Calendar} 
                  title="No Bookings Found" 
                  description={beautyAvailability.bookings.length === 0 ? 'No bookings yet.' : 'No bookings match your filters.'}
                  action={beautyAvailability.bookings.length > 0 ? { label: 'Clear Filters', onClick: () => setFilters({}) } : undefined} 
                />
              ) : (
                <>
                  <div className="grid gap-4">
                    {paginatedBookings.map((booking) => {
                      const bookingDate = new Date(booking.booking_date);
                      const isUpcoming = bookingDate > new Date();
                      const isPast = bookingDate < new Date();
                      const isToday = bookingDate.toDateString() === new Date().toDateString();
                      
                      return (
                        <Card key={booking.id} className={`
                          overflow-hidden transition-all hover:shadow-lg
                          ${isToday ? 'border-champagne/50 bg-champagne/5' : ''}
                          ${booking.status === 'cancelled' ? 'opacity-60' : ''}
                        `}>
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-xl font-semibold">{booking.services.title}</h3>
                                  {isToday && (
                                    <Badge className="bg-champagne text-charcoal">Today</Badge>
                                  )}
                                  {booking.booking_source === 'booksy' && (
                                    <Badge variant="secondary" className="text-xs">Booksy</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-pearl/70">
                                  <User className="w-4 h-4" />
                                  {booking.client_name || 'Guest'}
                                  <span className="text-pearl/40">•</span>
                                  {booking.client_email}
                                  {booking.client_phone && (
                                    <>
                                      <span className="text-pearl/40">•</span>
                                      {booking.client_phone}
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              {/* Quick Status Actions */}
                              <div className="flex gap-2">
                                {booking.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="bg-sage text-white hover:bg-sage/80"
                                      onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                    >
                                      Confirm
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                )}
                                {booking.status === 'confirmed' && isPast && (
                                  <Button
                                    size="sm"
                                    className="bg-bronze text-white hover:bg-bronze/80"
                                    onClick={() => updateBookingStatus(booking.id, 'completed')}
                                  >
                                    Mark Complete
                                  </Button>
                                )}
                                <Select
                                  value={booking.status}
                                  onValueChange={(value) => updateBookingStatus(booking.id, value)}
                                >
                                  <SelectTrigger className={`w-[140px] border ${getStatusColor(booking.status)}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-charcoal/95 backdrop-blur-sm border-graphite/20 z-50">
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-4 gap-4 pb-4 border-b border-pearl/10">
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-pearl/50">Date</span>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <Calendar className="w-4 h-4 text-champagne" />
                                  <span className="text-pearl">
                                    {bookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-pearl/50">Time</span>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <Clock className="w-4 h-4 text-champagne" />
                                  <span className="text-pearl tabular-nums">
                                    {bookingDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-pearl/50">Duration</span>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <Clock className="w-4 h-4 text-champagne" />
                                  <span className="text-pearl">
                                    {booking.services.duration_minutes} min
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-pearl/50">Price</span>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <DollarSign className="w-4 h-4 text-champagne" />
                                  <span className="text-pearl">
                                    {booking.amount_paid || booking.services.price_from} {booking.currency || 'PLN'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {(booking.notes || booking.client_notes) && (
                              <div className="space-y-1 bg-cocoa/20 p-3 rounded-lg">
                                <p className="text-xs text-pearl/50 uppercase tracking-wider font-medium">Client Notes</p>
                                <p className="text-sm text-pearl/80 italic">"{booking.notes || booking.client_notes}"</p>
                              </div>
                            )}

                            <div className="space-y-2">
                              <p className="text-xs text-pearl/50 uppercase tracking-wider font-medium">Admin Notes</p>
                              {editingNotes === booking.id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add admin notes..."
                                    className="bg-cocoa/60 min-h-[80px]"
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => saveAdminNotes(booking.id)} className="bg-champagne text-charcoal hover:bg-champagne/80">
                                      Save Notes
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => {
                                      setEditingNotes(null);
                                      setAdminNotes('');
                                    }}>Cancel</Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start justify-between bg-cocoa/10 p-3 rounded-lg">
                                  <p className="text-sm text-pearl/80 flex-1">{booking.admin_notes || <span className="italic text-pearl/50">No admin notes yet</span>}</p>
                                  <Button size="sm" variant="ghost" className="text-champagne hover:bg-champagne/10" onClick={() => {
                                    setEditingNotes(booking.id);
                                    setAdminNotes(booking.admin_notes || '');
                                  }}>
                                    <Edit2 className="w-3 h-3 mr-1" />
                                    Edit
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                        <ChevronLeft className="w-4 h-4" />Previous
                      </Button>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="sm" 
                            onClick={() => setCurrentPage(page)} className="w-10">{page}</Button>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                        Next<ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="fitness" className="mt-6 space-y-4">
          {viewMode === 'calendar' ? (
            <>
              <div className="flex justify-end gap-2">
                <QuickSlotCreator serviceType="fitness" onComplete={fitnessAvailability.refreshData} />
                <AutoSlotGenerator serviceType="fitness" onComplete={fitnessAvailability.refreshData} />
              </div>
              <UnifiedAvailabilityCalendar
                slots={Object.values(fitnessAvailability.slots).flat()}
                bookings={fitnessAvailability.bookings}
                onSlotUpdate={(slot) => {
                  handleEditSlot(slot);
                  fitnessAvailability.refreshData();
                }}
                onSlotDelete={async (slotId) => {
                  if (confirm('Delete this slot?')) {
                    await handleDeleteSlot(slotId);
                    fitnessAvailability.refreshData();
                  }
                }}
                onAddSlot={handleOpenDialog}
                onRefresh={fitnessAvailability.refreshData}
              />
            </>
          ) : viewMode === 'week' ? (
            <WeekView
              bookings={filteredBookings}
              onBookingClick={(booking) => {
                setSelectedDate(new Date(booking.booking_date));
                setViewMode('calendar');
              }}
            />
          ) : (
            <div className="space-y-4">
              <BookingFilters onFilterChange={setFilters} onExport={exportToCSV} />
              {paginatedBookings.length === 0 ? (
                <EmptyState 
                  icon={Calendar} 
                  title="No Bookings Found" 
                  description={fitnessAvailability.bookings.length === 0 ? 'No bookings yet.' : 'No bookings match your filters.'}
                  action={fitnessAvailability.bookings.length > 0 ? { label: 'Clear Filters', onClick: () => setFilters({}) } : undefined} 
                />
              ) : (
                <>
                  <div className="grid gap-4">
                    {paginatedBookings.map((booking) => (
                      <Card key={booking.id} className="overflow-hidden">
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="text-xl font-semibold">{booking.services.title}</h3>
                              <div className="flex items-center gap-2 text-sm text-pearl/70">
                                <User className="w-4 h-4" />
                                {booking.client_name || 'Guest'}
                                <span className="text-pearl/40">•</span>
                                {booking.client_email}
                              </div>
                            </div>
                            <Select
                              value={booking.status}
                              onValueChange={(value) => updateBookingStatus(booking.id, value)}
                            >
                              <SelectTrigger className={`w-[140px] ${getStatusColor(booking.status)}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-3 gap-4 pb-4 border-b border-pearl/10">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-champagne" />
                              {new Date(booking.booking_date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-champagne" />
                              {booking.services.duration_minutes} min
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="w-4 h-4 text-champagne" />
                              {booking.amount_paid || booking.services.price_from} {booking.currency || 'PLN'}
                            </div>
                          </div>

                          {(booking.notes || booking.client_notes) && (
                            <div className="space-y-1">
                              <p className="text-xs text-pearl/50 uppercase tracking-wider">Client Notes</p>
                              <p className="text-sm text-pearl/80">{booking.notes || booking.client_notes}</p>
                            </div>
                          )}

                          <div className="space-y-2">
                            <p className="text-xs text-pearl/50 uppercase tracking-wider">Admin Notes</p>
                            {editingNotes === booking.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add admin notes..."
                                  className="bg-cocoa/60"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => saveAdminNotes(booking.id)}>Save</Button>
                                  <Button size="sm" variant="outline" onClick={() => {
                                    setEditingNotes(null);
                                    setAdminNotes('');
                                  }}>Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between">
                                <p className="text-sm text-pearl/80">{booking.admin_notes || 'No admin notes'}</p>
                                <Button size="sm" variant="ghost" onClick={() => {
                                  setEditingNotes(booking.id);
                                  setAdminNotes(booking.admin_notes || '');
                                }}>Edit</Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                        <ChevronLeft className="w-4 h-4" />Previous
                      </Button>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="sm" 
                            onClick={() => setCurrentPage(page)} className="w-10">{page}</Button>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                        Next<ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Slot Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="glass-card border-graphite/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-pearl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-champagne" />
              {editingSlot ? 'Edit Time Slot' : 'Add New Time Slot'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-pearl/70 text-sm">Day of Week</Label>
                <Select
                  value={formData.day_of_week.toString()}
                  onValueChange={(value) => setFormData({ ...formData, day_of_week: parseInt(value) })}
                >
                  <SelectTrigger className="glass-card border-graphite/20 text-pearl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-pearl/70 text-sm">Service Type</Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value: any) => setFormData({ ...formData, service_type: value })}
                >
                  <SelectTrigger className="glass-card border-graphite/20 text-pearl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beauty">Beauty Services</SelectItem>
                    <SelectItem value="fitness">Fitness Programs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-pearl/70 text-sm">Location</Label>
              <Select
                value={formData.location}
                onValueChange={(value: any) => setFormData({ ...formData, location: value })}
              >
                <SelectTrigger className="glass-card border-graphite/20 text-pearl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="studio">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />Studio (Smolna 8)
                    </div>
                  </SelectItem>
                  <SelectItem value="online">
                    <div className="flex items-center gap-2">
                      <Laptop className="w-4 h-4" />Online Session
                    </div>
                  </SelectItem>
                  <SelectItem value="fitness">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4" />Fitness Location
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-pearl/50 mt-1.5">
                Prevents double-booking - only one location at a time
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-pearl/70 text-sm">Start Time</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="glass-card border-graphite/20 text-pearl"
                  required
                />
              </div>
              <div>
                <Label className="text-pearl/70 text-sm">End Time</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="glass-card border-graphite/20 text-pearl"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-pearl/70 text-sm">Notes (Optional)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="glass-card border-graphite/20 text-pearl min-h-[80px]"
                placeholder="Any additional notes about this time slot..."
              />
            </div>

            <div className="flex items-center justify-between glass-card p-4 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-pearl font-medium">Available for Booking</Label>
                <p className="text-xs text-pearl/60">Allow clients to book during this time</p>
              </div>
              <Switch
                checked={formData.is_available}
                onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
              />
            </div>

            <div className="bg-sage/10 border border-sage/20 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-sage flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="text-pearl font-medium">Conflict Prevention</p>
                  <p className="text-pearl/70">
                    The system prevents double-booking by checking location conflicts.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1 border-graphite/20 text-pearl hover:bg-cocoa/50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-champagne text-charcoal hover:bg-champagne/90"
              >
                {editingSlot ? 'Update Slot' : 'Create Slot'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AvailabilityManagement;
