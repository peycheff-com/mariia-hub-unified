/**
 * Data Import/Export Service
 *
 * Provides CSV import/export functionality for migrating data from external platforms
 * including Booksy (manual export), Excel spreadsheets, and other booking systems
 */

import { format, parseISO, isValid } from 'date-fns';

import { supabase } from '@/integrations/supabase/client';
import { Booking, Service, WaitlistEntry } from '@/types/booking';
import { logger } from '@/lib/logger';

export interface ImportRow {
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  service_name?: string;
  date?: string;
  time?: string;
  duration?: string;
  price?: string;
  status?: string;
  notes?: string;
  location?: string;
}

export interface ImportResult {
  totalRows: number;
  successful: number;
  failed: number;
  duplicates: number;
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ImportError {
  row: number;
  field: string;
  value: any;
  error: string;
}

export interface ImportWarning {
  row: number;
  field: string;
  value: any;
  warning: string;
}

export interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  includeClients?: boolean;
  includeServices?: boolean;
  includeWaitlist?: boolean;
  format?: 'csv' | 'excel';
}

export class DataImportExportService {
  private readonly FIELD_MAPPINGS = {
    // Client fields
    'Client Name': 'client_name',
    'Client Email': 'client_email',
    'Client Phone': 'client_phone',
    'Contact Name': 'client_name',
    'Email': 'client_email',
    'Phone': 'client_phone',
    'Telefon': 'client_phone',
    'Email Address': 'client_email',

    // Service fields
    'Service': 'service_name',
    'Service Name': 'service_name',
    'Treatment': 'service_name',
    'Zabieg': 'service_name',
    'Usługa': 'service_name',

    // Date/Time fields
    'Date': 'date',
    'Appointment Date': 'date',
    'Data': 'date',
    'Time': 'time',
    'Appointment Time': 'time',
    'Godzina': 'time',
    'Czas': 'time',

    // Other fields
    'Duration': 'duration',
    'Price': 'price',
    'Status': 'status',
    'Notes': 'notes',
    'Location': 'location',
    'Miejsce': 'location',
    'Lokalizacja': 'location',
    'Cena': 'price',
    'Notatki': 'notes',
    'Uwagi': 'notes'
  };

  /**
   * Parse CSV string into array of objects
   */
  private parseCSV(text: string, delimiter: string = ','): ImportRow[] {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // Detect delimiter
    const firstLine = lines[0];
    const possibleDelimiters = [',', ';', '\t'];
    let detectedDelimiter = delimiter;

    for (const d of possibleDelimiters) {
      if (firstLine.split(d).length > firstLine.split(delimiter).length) {
        detectedDelimiter = d;
        break;
      }
    }

    // Get headers
    const headers = lines[0].split(detectedDelimiter).map(h => h.trim().replace(/"/g, ''));

    // Parse data rows
    const data: ImportRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(detectedDelimiter).map(v => v.trim().replace(/"/g, ''));

      if (values.length === headers.length) {
        const row: ImportRow = {};
        headers.forEach((header, index) => {
          const fieldName = this.FIELD_MAPPINGS[header as keyof typeof this.FIELD_MAPPINGS] || header.toLowerCase().replace(/\s+/g, '_');
          (row as any)[fieldName] = values[index] || undefined;
        });
        data.push(row);
      }
    }

    return data;
  }

  /**
   * Validate and clean import data
   */
  private validateRow(row: ImportRow, index: number): {
    isValid: boolean;
    errors: ImportError[];
    warnings: ImportWarning[];
  } {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];

    // Required fields
    if (!row.client_name) {
      errors.push({
        row: index,
        field: 'client_name',
        value: row.client_name,
        error: 'Client name is required'
      });
    }

    if (!row.service_name) {
      errors.push({
        row: index,
        field: 'service_name',
        value: row.service_name,
        error: 'Service name is required'
      });
    }

    if (!row.date) {
      errors.push({
        row: index,
        field: 'date',
        value: row.date,
        error: 'Date is required'
      });
    } else {
      // Validate date format
      const dateFormats = ['yyyy-MM-dd', 'dd/MM/yyyy', 'dd.MM.yyyy', 'MM/dd/yyyy'];
      let validDate = false;

      for (const fmt of dateFormats) {
        try {
          const parsed = new Date(row.date);
          validDate = isValid(parsed);
          if (validDate) break;
        } catch {
          continue;
        }
      }

      if (!validDate) {
        errors.push({
          row: index,
          field: 'date',
          value: row.date,
          error: 'Invalid date format. Use YYYY-MM-DD, DD/MM/YYYY, or DD.MM.YYYY'
        });
      }
    }

    // Email validation
    if (row.client_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.client_email)) {
        errors.push({
          row: index,
          field: 'client_email',
          value: row.client_email,
          error: 'Invalid email format'
        });
      }
    }

    // Phone validation
    if (row.client_phone) {
      const cleanPhone = row.client_phone.replace(/\D/g, '');
      if (cleanPhone.length < 9) {
        warnings.push({
          row: index,
          field: 'client_phone',
          value: row.client_phone,
          warning: 'Phone number seems too short'
        });
      }
    }

    // Price validation
    if (row.price) {
      const price = parseFloat(row.price.replace(/[^\d.]/g, ''));
      if (isNaN(price)) {
        errors.push({
          row: index,
          field: 'price',
          value: row.price,
          error: 'Invalid price format'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Import bookings from CSV file
   */
  async importBookings(file: File, options: {
    skipDuplicates?: boolean;
    updateExisting?: boolean;
    dryRun?: boolean;
  } = {}): Promise<ImportResult> {
    const text = await file.text();
    const rows = this.parseCSV(text);

    const result: ImportResult = {
      totalRows: rows.length,
      successful: 0,
      failed: 0,
      duplicates: 0,
      errors: [],
      warnings: []
    };

    logger.info(`Starting import of ${rows.length} bookings`);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const validation = this.validateRow(row, i + 1);

      if (!validation.isValid) {
        result.errors.push(...validation.errors);
        result.failed++;
        continue;
      }

      result.warnings.push(...validation.warnings);

      try {
        // Check for duplicates
        if (options.skipDuplicates) {
          const existing = await this.checkDuplicate(row);
          if (existing) {
            result.duplicates++;
            result.warnings.push({
              row: i + 1,
              field: 'all',
              value: row,
              warning: 'Duplicate booking found'
            });
            continue;
          }
        }

        if (!options.dryRun) {
          await this.createBooking(row);
          result.successful++;
        }
      } catch (error) {
        result.errors.push({
          row: i + 1,
          field: 'creation',
          value: row,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        result.failed++;
      }
    }

    logger.info('Import completed', {
      total: result.totalRows,
      successful: result.successful,
      failed: result.failed,
      duplicates: result.duplicates
    });

    return result;
  }

  /**
   * Check if booking already exists
   */
  private async checkDuplicate(row: ImportRow): Promise<boolean> {
    if (!row.date || !row.time) return false;

    const { data } = await supabase
      .from('bookings')
      .select('id')
      .eq('booking_date', row.date)
      .eq('booking_time', row.time);

    return !!(data && data.length > 0);
  }

  /**
   * Create booking from import row
   */
  private async createBooking(row: ImportRow): Promise<void> {
    // Find or create client
    let clientId = null;
    if (row.client_email) {
      const { data: client } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', row.client_email)
        .single();

      if (client) {
        clientId = client.id;
      }
    }

    // Find service
    const { data: service } = await supabase
      .from('services')
      .select('id, duration_minutes, price_from')
      .ilike('title', `%${row.service_name}%`)
      .single();

    if (!service) {
      throw new Error(`Service "${row.service_name}" not found`);
    }

    // Parse date and time
    const bookingDate = this.parseDate(row.date!);
    const [hours, minutes] = row.time?.split(':').map(Number) || [0, 0];

    const bookingDateTime = new Date(bookingDate);
    bookingDateTime.setHours(hours, minutes, 0, 0);

    // Create booking
    const { error } = await supabase
      .from('bookings')
      .insert({
        service_id: service.id,
        user_id: clientId,
        booking_date: format(bookingDateTime, 'yyyy-MM-dd'),
        booking_time: format(bookingDateTime, 'HH:mm'),
        duration: parseInt(row.duration || '60'),
        total_amount: parseFloat(row.price?.replace(/[^\d.]/g, '') || service.price_from),
        currency: 'PLN',
        status: 'confirmed',
        notes: row.notes,
        source: 'csv_import'
      });

    if (error) throw error;
  }

  /**
   * Parse date from various formats
   */
  private parseDate(dateStr: string): Date {
    const formats = [
      'yyyy-MM-dd',
      'dd/MM/yyyy',
      'dd.MM.yyyy',
      'MM/dd/yyyy',
      'yyyy/MM/dd'
    ];

    for (const fmt of formats) {
      try {
        const parsed = parseISO(dateStr);
        if (isValid(parsed)) return parsed;
      } catch {
        continue;
      }
    }

    // Fallback to Date constructor
    return new Date(dateStr);
  }

  /**
   * Export bookings to CSV
   */
  async exportBookings(options: ExportOptions = {}): Promise<Blob> {
    // Build query
    let query = supabase
      .from('bookings')
      .select(`
        *,
        services(title, duration_minutes, price_from),
        profiles(email, full_name, phone)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (options.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    const { data: bookings, error } = await query;
    if (error) throw error;

    // Convert to CSV
    const headers = [
      'Booking ID',
      'Client Name',
      'Email',
      'Phone',
      'Service Name',
      'Date',
      'Time',
      'Duration (min)',
      'Price (PLN)',
      'Status',
      'Notes',
      'Created At'
    ];

    const rows = bookings?.map(booking => [
      booking.id,
      booking.profiles?.full_name || '',
      booking.profiles?.email || '',
      booking.profiles?.phone || '',
      booking.services?.title || '',
      booking.booking_date || '',
      booking.booking_time || '',
      booking.duration || '',
      booking.total_amount || '',
      booking.status || '',
      booking.notes || '',
      booking.created_at || ''
    ]) || [];

    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  }

  /**
   * Generate import template CSV
   */
  generateImportTemplate(): Blob {
    const headers = [
      'Client Name',
      'Client Email',
      'Client Phone',
      'Service Name',
      'Date (YYYY-MM-DD)',
      'Time (HH:MM)',
      'Duration (minutes)',
      'Price (PLN)',
      'Status',
      'Notes',
      'Location'
    ];

    const exampleRow = [
      'Anna Nowak',
      'anna.nowak@email.com',
      '+48 123 456 789',
      'Haircut',
      '2024-01-15',
      '14:30',
      '60',
      '150',
      'confirmed',
      'Prefer shorter on sides',
      'Studio Warszawa'
    ];

    const csvContent = [
      headers.join(','),
      exampleRow.map(cell => `"${cell}"`).join(','),
      '',
      '// Instructions:',
      '// 1. Remove this example row',
      '// 2. Fill in your data',
      '// 3. Save as CSV file',
      '// 4. Import using the import tool',
      '',
      '// Date formats supported: YYYY-MM-DD, DD/MM/YYYY, DD.MM.YYYY',
      '// Time format: HH:MM (24-hour)',
      '// Price: Numbers only, will be parsed as PLN'
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  }
}

// Singleton instance
export const dataImportExportService = new DataImportExportService();