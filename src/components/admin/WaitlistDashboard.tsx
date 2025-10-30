import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Bell, TrendingUp, Mail, Phone, UserCheck, UserX, RefreshCw, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast aria-live="polite" aria-atomic="true"';
import { waitlistService } from '@/services/waitlist.service';
import { WaitlistEntry } from '@/types/booking';
import { logger } from '@/lib/logger';

interface WaitlistStats {
  totalActive: number;
  totalPromoted: number;
  averageWaitTime: number;
  serviceBreakdown: Record<string, number>;
  upcomingDates: Array<{ date: string; count: number }>;
}

export function WaitlistDashboard() {
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [stats, setStats] = useState<WaitlistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [isPromoting, setIsPromoting] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadWaitlistData();
  }, [selectedService, statusFilter]);

  const loadWaitlistData = async () => {
    try {
      setLoading(true);

      // Load stats
      const statsData = await waitlistService.getWaitlistStats(
        selectedService === 'all' ? undefined : selectedService
      );
      setStats(statsData);

      // Load entries
      const entries = await waitlistService.getAdminWaitlistEntries({
        serviceId: selectedService,
        status: statusFilter,
        limit: 100
      });

      const filteredEntries = entries.filter(entry => {
        const matchesSearch =
          entry.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.contactPhone?.includes(searchTerm) ||
          entry.notes?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;

        return matchesSearch && matchesStatus;
      });

      setWaitlistEntries(filteredEntries);
    } catch (error) {
      logger.error('Error loading waitlist data:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to load waitlist data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteEntry = async (entryId: string) => {
    try {
      setIsPromoting(entryId);
      const bookingId = await waitlistService.promoteWaitlistEntry(entryId);

      if (bookingId) {
        toast aria-live="polite" aria-atomic="true"({
          title: 'Success',
          description: `Waitlist entry promoted to booking ${bookingId}`,
        });
        await loadWaitlistData();
      } else {
        toast aria-live="polite" aria-atomic="true"({
          title: 'Info',
          description: 'No available slots found for promotion',
        });
      }
    } catch (error) {
      logger.error('Error promoting waitlist entry:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to promote waitlist entry',
        variant: 'destructive',
      });
    } finally {
      setIsPromoting(null);
    }
  };

  const handleRemoveEntry = async (entryId: string) => {
    try {
      await waitlistService.removeFromWaitlist(entryId);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Success',
        description: 'Waitlist entry removed',
      });
      await loadWaitlistData();
    } catch (error) {
      logger.error('Error removing waitlist entry:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to remove waitlist entry',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadWaitlistData();
    setIsRefreshing(false);
    toast aria-live="polite" aria-atomic="true"({
      title: 'Refreshed',
      description: 'Waitlist data updated',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      promoted: 'secondary',
      cancelled: 'outline',
      expired: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (score?: number) => {
    if (!score) return null;

    let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
    let label = 'Low';

    if (score >= 80) {
      variant = 'destructive';
      label = 'High';
    } else if (score >= 50) {
      variant = 'default';
      label = 'Medium';
    }

    return (
      <Badge variant={variant} className="ml-2">
        {label} Priority
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Waitlist Management</h1>
          <p className="text-muted-foreground">
            Manage customer waitlists and promote entries to bookings
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Waitlist</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalActive}</div>
              <p className="text-xs text-muted-foreground">
                Customers waiting
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promoted Today</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPromoted}</div>
              <p className="text-xs text-muted-foreground">
                Successfully promoted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Wait Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageWaitTime.toFixed(1)}d</div>
              <p className="text-xs text-muted-foreground">
                Days on waitlist
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peak Day</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.upcomingDates[0]?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.upcomingDates[0]?.date || 'No upcoming'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Email, phone, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="service">Service</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="All services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {/* Add service options dynamically */}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="promoted">Promoted</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Waitlist Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Waitlist Entries</CardTitle>
          <CardDescription>
            Manage and promote customers from the waitlist
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : waitlistEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No waitlist entries found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Preferred Date</TableHead>
                  <TableHead>Preferred Time</TableHead>
                  <TableHead>Group Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waitlistEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{entry.contactEmail}</span>
                        </div>
                        {entry.contactPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{entry.contactPhone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">Service ID: {entry.serviceId}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.locationType}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(entry.preferredDate, 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p>{entry.preferredTime}</p>
                        {entry.flexibleWithTime && (
                          <Badge variant="outline" className="text-xs">
                            Flexible
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{entry.groupSize}</TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell>
                      {getPriorityBadge(entry.priorityScore)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.status === 'active' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => setSelectedEntry(entry)}
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Promote
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Promote Waitlist Entry</DialogTitle>
                                <DialogDescription>
                                  Promote this customer to a booking. This will create a
                                  booking and notify the customer.
                                </DialogDescription>
                              </DialogHeader>
                              {selectedEntry && (
                                <div className="space-y-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Email</Label>
                                      <p className="text-sm">{selectedEntry.contactEmail}</p>
                                    </div>
                                    <div>
                                      <Label>Phone</Label>
                                      <p className="text-sm">{selectedEntry.contactPhone || 'N/A'}</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Preferred Date</Label>
                                      <p className="text-sm">
                                        {format(selectedEntry.preferredDate, 'PPP')}
                                      </p>
                                    </div>
                                    <div>
                                      <Label>Preferred Time</Label>
                                      <p className="text-sm">{selectedEntry.preferredTime}</p>
                                    </div>
                                  </div>
                                  {selectedEntry.notes && (
                                    <div>
                                      <Label>Notes</Label>
                                      <p className="text-sm">{selectedEntry.notes}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              <DialogFooter>
                                <Button variant="outline">Cancel</Button>
                                <Button
                                  onClick={() => handlePromoteEntry(entry.id)}
                                  disabled={isPromoting === entry.id}
                                >
                                  {isPromoting === entry.id ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  ) : null}
                                  Promote to Booking
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <UserX className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Waitlist Entry</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove this entry from the waitlist?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveEntry(entry.id)}
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}