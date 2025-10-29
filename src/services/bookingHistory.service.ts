import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { cacheService } from '@/services/cacheService';

export interface BookingHistoryItem {
  id: string;
  bookingId: string;
  serviceId: string;
  serviceTitle: string;
  serviceType: 'beauty' | 'fitness' | 'lifestyle';
  status: 'draft' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  bookingDate: Date;
  bookingTime: string;
  duration: number;
  location: string;
  price: number;
  currency: string;
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid' | 'refunded' | 'partially_refunded';
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  refundAmount?: number;
  rescheduleCount?: number;
  lastRescheduledAt?: Date;
  isGroupBooking?: boolean;
  groupSize?: number;
  specialistName?: string;
  specialistId?: string;
  metadata?: Record<string, any>;
}

export interface BookingHistoryFilters {
  status?: BookingHistoryItem['status'][];
  serviceType?: BookingHistoryItem['serviceType'][];
  dateRange?: {
    from: Date;
    to: Date;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  location?: string[];
  paymentStatus?: BookingHistoryItem['paymentStatus'][];
  searchTerm?: string;
  specialistId?: string;
  isGroupBooking?: boolean;
}

export interface BookingHistoryOptions {
  page?: number;
  limit?: number;
  sortBy?: keyof BookingHistoryItem;
  sortOrder?: 'asc' | 'desc';
  filters?: BookingHistoryFilters;
  includeMetadata?: boolean;
}

export interface BookingHistoryResult {
  items: BookingHistoryItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel';
  includeMetadata?: boolean;
  includePaymentDetails?: boolean;
  includeClientDetails?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
  filters?: BookingHistoryFilters;
}

export interface BookingStatistics {
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  bookingsByStatus: Record<string, number>;
  bookingsByServiceType: Record<string, number>;
  bookingsByMonth: Record<string, number>;
  topServices: Array<{
    serviceId: string;
    serviceTitle: string;
    bookingCount: number;
    totalRevenue: number;
  }>;
  revenueByMonth: Record<string, number>;
  cancellationRate: number;
  noShowRate: number;
  repeatClientRate: number;
  averageTimeBetweenBookings: number; // in days
}

class BookingHistoryService {
    private CACHE_KEY_PREFIX = 'booking_history_';
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getBookingHistory(
    userId: string,
    options: BookingHistoryOptions = {}
  ): Promise<BookingHistoryResult> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${userId}_${JSON.stringify(options)}`;

    try {
      // Check cache first
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const {
        page = 1,
        limit = 20,
        sortBy = 'bookingDate',
        sortOrder = 'desc',
        filters = {},
        includeMetadata = false
      } = options;

      let query = supabase
        .from('bookings')
        .select(`
          *,
          services:service_id (
            title,
            service_type,
            duration_minutes
          ),
          specialists:assigned_specialist_id (
            name:full_name
          )
        `, { count: 'exact' });

      // Apply filters
      query = this.applyFilters(query, filters, userId);

      // Apply sorting
      const dbSortField = this.mapSortField(sortBy);
      query = query.order(dbSortField, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      const items = (data || []).map(this.mapDbToBookingHistoryItem);

      const result: BookingHistoryResult = {
        items,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page,
        hasNextPage: page * limit < (count || 0),
        hasPreviousPage: page > 1
      };

      // Cache result
      await cacheService.set(cacheKey, result, this.CACHE_TTL);

      return result;
    } catch (error) {
      logger.error('Failed to get booking history', { error, userId, options });
      return {
        items: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false
      };
    }
  }

  private applyFilters(query: any, filters: BookingHistoryFilters, userId?: string) {
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    if (filters.serviceType && filters.serviceType.length > 0) {
      query = query.in('services.service_type', filters.serviceType);
    }

    if (filters.dateRange) {
      query = query
        .gte('booking_date', filters.dateRange.from.toISOString().split('T')[0])
        .lte('booking_date', filters.dateRange.to.toISOString().split('T')[0]);
    }

    if (filters.priceRange) {
      query = query
        .gte('amount', filters.priceRange.min)
        .lte('amount', filters.priceRange.max);
    }

    if (filters.location && filters.location.length > 0) {
      query = query.in('location_type', filters.location);
    }

    if (filters.paymentStatus && filters.paymentStatus.length > 0) {
      query = query.in('payment_status', filters.paymentStatus);
    }

    if (filters.searchTerm) {
      const searchTerm = `%${filters.searchTerm}%`;
      query = query.or(`
        services.title.ilike.${searchTerm},
        client_name.ilike.${searchTerm},
        client_email.ilike.${searchTerm}
      `);
    }

    if (filters.specialistId) {
      query = query.eq('assigned_specialist_id', filters.specialistId);
    }

    if (filters.isGroupBooking !== undefined) {
      query = query.eq('is_group_booking', filters.isGroupBooking);
    }

    return query;
  }

  private mapSortField(field: keyof BookingHistoryItem): string {
    const fieldMap: Record<string, string> = {
      bookingDate: 'booking_date',
      bookingTime: 'booking_time',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      status: 'status',
      price: 'amount',
      serviceTitle: 'services.title',
      serviceType: 'services.service_type',
      clientName: 'client_name'
    };

    return fieldMap[field] || field;
  }

  private mapDbToBookingHistoryItem(dbItem: any): BookingHistoryItem {
    return {
      id: dbItem.id,
      bookingId: dbItem.id,
      serviceId: dbItem.service_id,
      serviceTitle: dbItem.services?.title || 'Unknown Service',
      serviceType: dbItem.services?.service_type || 'beauty',
      status: dbItem.status,
      bookingDate: new Date(dbItem.booking_date),
      bookingTime: dbItem.booking_time,
      duration: dbItem.services?.duration_minutes || 60,
      location: dbItem.location_type || 'studio',
      price: dbItem.amount || 0,
      currency: dbItem.currency || 'PLN',
      paymentMethod: dbItem.payment_method,
      paymentStatus: dbItem.payment_status,
      clientName: dbItem.client_name,
      clientEmail: dbItem.client_email,
      clientPhone: dbItem.client_phone,
      notes: dbItem.notes,
      createdAt: new Date(dbItem.created_at),
      updatedAt: new Date(dbItem.updated_at),
      cancelledAt: dbItem.cancelled_at ? new Date(dbItem.cancelled_at) : undefined,
      cancellationReason: dbItem.cancellation_reason,
      refundAmount: dbItem.refund_amount,
      rescheduleCount: dbItem.reschedule_count,
      lastRescheduledAt: dbItem.last_rescheduled_at ? new Date(dbItem.last_rescheduled_at) : undefined,
      isGroupBooking: dbItem.is_group_booking,
      groupSize: dbItem.group_participant_count,
      specialistName: dbItem.specialists?.name,
      specialistId: dbItem.assigned_specialist_id,
      metadata: dbItem.metadata
    };
  }

  async getBookingDetails(bookingId: string, userId?: string): Promise<BookingHistoryItem | null> {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          services:service_id (
            title,
            service_type,
            duration_minutes,
            description,
            image_url
          ),
          specialists:assigned_specialist_id (
            name:full_name,
            email,
            phone
          ),
          booking_changes (
            created_at,
            change_type,
            old_date,
            old_time,
            new_date,
            new_time,
            reason
          )
        `)
        .eq('id', bookingId);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        return null;
      }

      return this.mapDbToBookingHistoryItem(data);
    } catch (error) {
      logger.error('Failed to get booking details', { error, bookingId, userId });
      return null;
    }
  }

  async rebookFromHistory(bookingId: string, userId: string): Promise<{
    success: boolean;
    newBookingId?: string;
    error?: string;
  }> {
    try {
      // Get original booking details
      const originalBooking = await this.getBookingDetails(bookingId, userId);
      if (!originalBooking) {
        return {
          success: false,
          error: 'Original booking not found'
        };
      }

      // Check if service is still available
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', originalBooking.serviceId)
        .eq('is_active', true)
        .single();

      if (serviceError || !service) {
        return {
          success: false,
          error: 'Service is no longer available'
        };
      }

      // Create new booking draft
      const { data: newBooking, error: createError } = await supabase
        .from('booking_drafts')
        .insert({
          user_id: userId,
          service_id: originalBooking.serviceId,
          original_booking_id: bookingId,
          client_name: originalBooking.clientName,
          client_email: originalBooking.clientEmail,
          client_phone: originalBooking.clientPhone,
          notes: `Rebook from previous booking #${bookingId}`,
          metadata: {
            rebookedFrom: bookingId,
            originalDate: originalBooking.bookingDate,
            originalTime: originalBooking.bookingTime
          }
        })
        .select()
        .single();

      if (createError) throw createError;

      logger.info('Booking rebooked from history', {
        originalBookingId: bookingId,
        newDraftId: newBooking.id,
        userId
      });

      return {
        success: true,
        newBookingId: newBooking.id
      };
    } catch (error) {
      logger.error('Failed to rebook from history', { error, bookingId, userId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to rebook'
      };
    }
  }

  async exportBookingHistory(
    userId: string,
    options: ExportOptions
  ): Promise<{
    success: boolean;
    data?: Blob;
    filename?: string;
    error?: string;
  }> {
    try {
      const historyOptions: BookingHistoryOptions = {
        page: 1,
        limit: 10000, // Large limit for export
        sortBy: 'bookingDate',
        sortOrder: 'desc',
        filters: options.filters
      };

      const history = await this.getBookingHistory(userId, historyOptions);

      switch (options.format) {
        case 'csv':
          return this.exportToCSV(history.items, options);
        case 'pdf':
          return this.exportToPDF(history.items, options);
        case 'excel':
          return this.exportToExcel(history.items, options);
        default:
          return {
            success: false,
            error: 'Unsupported export format'
          };
      }
    } catch (error) {
      logger.error('Failed to export booking history', { error, userId, options });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }

  private async exportToCSV(items: BookingHistoryItem[], options: ExportOptions): Promise<{
    success: boolean;
    data?: Blob;
    filename?: string;
    error?: string;
  }> {
    try {
      const headers = [
        'Booking ID',
        'Service',
        'Service Type',
        'Date',
        'Time',
        'Status',
        'Price',
        'Location',
        'Client Name',
        'Created Date'
      ];

      if (options.includePaymentDetails) {
        headers.push('Payment Method', 'Payment Status', 'Refund Amount');
      }

      if (options.includeClientDetails) {
        headers.push('Client Email', 'Client Phone');
      }

      const csvData = items.map(item => {
        const row = [
          item.bookingId,
          item.serviceTitle,
          item.serviceType,
          item.bookingDate.toLocaleDateString(),
          item.bookingTime,
          item.status,
          item.price.toString(),
          item.location,
          item.clientName || '',
          item.createdAt.toLocaleDateString()
        ];

        if (options.includePaymentDetails) {
          row.push(
            item.paymentMethod || '',
            item.paymentStatus || '',
            (item.refundAmount || 0).toString()
          );
        }

        if (options.includeClientDetails) {
          row.push(
            item.clientEmail || '',
            item.clientPhone || ''
          );
        }

        return row;
      });

      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const filename = `booking-history-${new Date().toISOString().split('T')[0]}.csv`;

      return {
        success: true,
        data: blob,
        filename
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'CSV export failed'
      };
    }
  }

  private async exportToPDF(items: BookingHistoryItem[], options: ExportOptions): Promise<{
    success: boolean;
    data?: Blob;
    filename?: string;
    error?: string;
  }> {
    // This would typically use a PDF library like jsPDF or Puppeteer
    // For now, return a placeholder
    try {
      // Placeholder PDF generation
      const pdfContent = `
        <html>
          <head>
            <title>Booking History</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>Booking History Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td>${item.serviceTitle}</td>
                    <td>${item.bookingDate.toLocaleDateString()}</td>
                    <td>${item.bookingTime}</td>
                    <td>${item.status}</td>
                    <td>${item.price} ${item.currency}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const filename = `booking-history-${new Date().toISOString().split('T')[0]}.pdf`;

      return {
        success: true,
        data: blob,
        filename
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF export failed'
      };
    }
  }

  private async exportToExcel(items: BookingHistoryItem[], options: ExportOptions): Promise<{
    success: boolean;
    data?: Blob;
    filename?: string;
    error?: string;
  }> {
    // This would typically use a library like xlsx or SheetJS
    // For now, return CSV as Excel-compatible format
    return this.exportToCSV(items, options);
  }

  async getBookingStatistics(
    userId: string,
    dateRange?: { from: Date; to: Date }
  ): Promise<BookingStatistics> {
    try {
      const filters: BookingHistoryFilters = {
        dateRange
      };

      const history = await this.getBookingHistory(userId, {
        page: 1,
        limit: 10000,
        filters
      });

      const items = history.items;

      // Basic statistics
      const totalBookings = items.length;
      const totalRevenue = items
        .filter(item => item.status === 'completed')
        .reduce((sum, item) => sum + item.price, 0);
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Bookings by status
      const bookingsByStatus = items.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Bookings by service type
      const bookingsByServiceType = items.reduce((acc, item) => {
        acc[item.serviceType] = (acc[item.serviceType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Bookings by month
      const bookingsByMonth = items.reduce((acc, item) => {
        const monthKey = `${item.bookingDate.getFullYear()}-${(item.bookingDate.getMonth() + 1).toString().padStart(2, '0')}`;
        acc[monthKey] = (acc[monthKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Revenue by month
      const revenueByMonth = items
        .filter(item => item.status === 'completed')
        .reduce((acc, item) => {
          const monthKey = `${item.bookingDate.getFullYear()}-${(item.bookingDate.getMonth() + 1).toString().padStart(2, '0')}`;
          acc[monthKey] = (acc[monthKey] || 0) + item.price;
          return acc;
        }, {} as Record<string, number>);

      // Top services
      const serviceStats = items.reduce((acc, item) => {
        if (!acc[item.serviceId]) {
          acc[item.serviceId] = {
            serviceId: item.serviceId,
            serviceTitle: item.serviceTitle,
            bookingCount: 0,
            totalRevenue: 0
          };
        }
        acc[item.serviceId].bookingCount++;
        if (item.status === 'completed') {
          acc[item.serviceId].totalRevenue += item.price;
        }
        return acc;
      }, {} as Record<string, any>);

      const topServices = Object.values(serviceStats)
        .sort((a: any, b: any) => b.bookingCount - a.bookingCount)
        .slice(0, 10);

      // Rates
      const completedCount = bookingsByStatus.completed || 0;
      const cancelledCount = bookingsByStatus.cancelled || 0;
      const noShowCount = bookingsByStatus.no_show || 0;
      const cancellationRate = totalBookings > 0 ? (cancelledCount / totalBookings) * 100 : 0;
      const noShowRate = totalBookings > 0 ? (noShowCount / totalBookings) * 100 : 0;

      // Repeat client rate (simplified - would need more complex analysis)
      const repeatClientRate = 30; // Placeholder

      // Average time between bookings
      const sortedDates = items
        .map(item => item.bookingDate.getTime())
        .sort((a, b) => a - b);

      const timeDiffs = [];
      for (let i = 1; i < sortedDates.length; i++) {
        timeDiffs.push((sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24)); // Convert to days
      }

      const averageTimeBetweenBookings = timeDiffs.length > 0
        ? timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length
        : 0;

      return {
        totalBookings,
        totalRevenue,
        averageBookingValue,
        bookingsByStatus,
        bookingsByServiceType,
        bookingsByMonth,
        topServices,
        revenueByMonth,
        cancellationRate,
        noShowRate,
        repeatClientRate,
        averageTimeBetweenBookings
      };
    } catch (error) {
      logger.error('Failed to get booking statistics', { error, userId, dateRange });
      return {
        totalBookings: 0,
        totalRevenue: 0,
        averageBookingValue: 0,
        bookingsByStatus: {},
        bookingsByServiceType: {},
        bookingsByMonth: {},
        topServices: [],
        revenueByMonth: {},
        cancellationRate: 0,
        noShowRate: 0,
        repeatClientRate: 0,
        averageTimeBetweenBookings: 0
      };
    }
  }

  async clearHistoryCache(userId: string): Promise<void> {
    try {
      // This would clear all cache keys related to the user's booking history
      const cachePattern = `${this.CACHE_KEY_PREFIX}${userId}_*`;
      // Implementation depends on cache service capabilities
      logger.info('Booking history cache cleared', { userId });
    } catch (error) {
      logger.error('Failed to clear booking history cache', { error, userId });
    }
  }
}

export const bookingHistoryService = new BookingHistoryService();