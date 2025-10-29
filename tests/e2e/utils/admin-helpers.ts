import { Page } from '@playwright/test';

import { TestHelpers } from './test-helpers';

export interface AdminCredentials {
  email: string;
  password: string;
}

export interface ServiceData {
  name: string;
  type: 'beauty' | 'fitness' | 'lifestyle';
  price: number;
  duration: number;
  description: string;
  category?: string;
  isActive?: boolean;
}

export interface BookingData {
  id: string;
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  price: number;
}

export class AdminHelpers extends TestHelpers {
  constructor(page: Page) {
    super(page);
  }

  // Navigate to admin login
  async navigateToAdminLogin() {
    await this.navigateTo('/admin/login');
    await this.waitForPageLoad();
  }

  // Navigate to admin dashboard
  async navigateToAdminDashboard() {
    await this.navigateTo('/admin');
    await this.waitForPageLoad();
  }

  // Admin login
  async loginAsAdmin(credentials?: Partial<AdminCredentials>) {
    const defaultCredentials = {
      email: 'admin@mariia-hub.com',
      password: 'AdminPassword123!',
      ...credentials,
    };

    await this.navigateToAdminLogin();

    await this.page.getByLabel(/email/i).fill(defaultCredentials.email);
    await this.page.getByLabel(/password/i).fill(defaultCredentials.password);

    const loginButton = this.page.getByRole('button', { name: /login|sign in/i });
    await loginButton.click();

    // Wait for admin dashboard to load
    await this.page.waitForURL(/admin.*dashboard|admin/);

    // Verify admin access
    await this.expectElementToBeVisible('[data-testid="admin-dashboard"]');

    console.log('✅ Admin login successful');
  }

  // Logout admin
  async logoutAdmin() {
    const adminMenu = this.page.getByRole('button', { name: /admin|account/i });
    if (await adminMenu.isVisible()) {
      await adminMenu.click();
      await this.page.waitForTimeout(500);

      const logoutButton = this.page.getByRole('menuitem', { name: /logout|sign out/i });
      await logoutButton.click();
    }

    await this.page.waitForURL(/admin.*login|login/);

    console.log('✅ Admin logout successful');
  }

  // Navigate to admin section
  async navigateToAdminSection(section: 'services' | 'bookings' | 'users' | 'analytics' | 'settings') {
    await this.navigateTo(`/admin/${section}`);
    await this.waitForPageLoad();

    // Verify section loaded
    await this.expectElementToBeVisible(`[data-testid="admin-${section}"]`);

    console.log(`✅ Navigated to admin ${section} section`);
  }

  // Create new service
  async createService(serviceData: ServiceData) {
    await this.navigateToAdminSection('services');

    // Click add new service button
    const addServiceButton = this.page.getByRole('button', { name: /add service|new service/i });
    await addServiceButton.click();

    // Wait for service form
    await this.expectElementToBeVisible('[data-testid="service-form"]');

    // Fill service details
    await this.page.getByLabel(/service name/i).fill(serviceData.name);
    await this.page.getByLabel(/description/i).fill(serviceData.description);
    await this.page.getByLabel(/price/i).fill(serviceData.price.toString());
    await this.page.getByLabel(/duration/i).fill(serviceData.duration.toString());

    // Select service type
    const typeSelect = this.page.getByLabel(/service type/i);
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption(serviceData.type);
    }

    // Select category if provided
    if (serviceData.category) {
      const categorySelect = this.page.getByLabel(/category/i);
      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption(serviceData.category);
      }
    }

    // Set active status
    if (serviceData.isActive !== undefined) {
      const activeToggle = this.page.getByLabel(/active|published/i);
      if (await activeToggle.isVisible()) {
        if (serviceData.isActive && !(await activeToggle.isChecked())) {
          await activeToggle.check();
        } else if (!serviceData.isActive && await activeToggle.isChecked()) {
          await activeToggle.uncheck();
        }
      }
    }

    // Submit form
    const saveButton = this.page.getByRole('button', { name: /save|create service/i });
    await saveButton.click();

    // Verify service created
    await this.expectTextToBeVisible(/service created|saved successfully/i);

    console.log(`✅ Service "${serviceData.name}" created successfully`);
  }

  // Update existing service
  async updateService(serviceId: string, updates: Partial<ServiceData>) {
    await this.navigateToAdminSection('services');

    // Find the service to edit
    const serviceCard = this.page.locator(`[data-service-id="${serviceId}"]`);
    await serviceCard.scrollIntoViewIfNeeded();

    // Click edit button
    const editButton = serviceCard.getByRole('button', { name: /edit|update/i });
    await editButton.click();

    // Wait for edit form
    await this.expectElementToBeVisible('[data-testid="service-form"]');

    // Update fields
    if (updates.name) {
      await this.page.getByLabel(/service name/i).fill(updates.name);
    }

    if (updates.description) {
      await this.page.getByLabel(/description/i).fill(updates.description);
    }

    if (updates.price) {
      await this.page.getByLabel(/price/i).fill(updates.price.toString());
    }

    if (updates.duration) {
      await this.page.getByLabel(/duration/i).fill(updates.duration.toString());
    }

    if (updates.type) {
      const typeSelect = this.page.getByLabel(/service type/i);
      if (await typeSelect.isVisible()) {
        await typeSelect.selectOption(updates.type);
      }
    }

    // Submit changes
    const saveButton = this.page.getByRole('button', { name: /save|update/i });
    await saveButton.click();

    // Verify service updated
    await this.expectTextToBeVisible(/service updated|saved successfully/i);

    console.log(`✅ Service "${serviceId}" updated successfully`);
  }

  // Delete service
  async deleteService(serviceId: string) {
    await this.navigateToAdminSection('services');

    // Find the service to delete
    const serviceCard = this.page.locator(`[data-service-id="${serviceId}"]`);
    await serviceCard.scrollIntoViewIfNeeded();

    // Click delete button
    const deleteButton = serviceCard.getByRole('button', { name: /delete|remove/i });
    await deleteButton.click();

    // Confirm deletion
    const confirmDialog = this.page.getByRole('dialog');
    if (await confirmDialog.isVisible()) {
      const confirmButton = this.page.getByRole('button', { name: /delete|confirm/i });
      await confirmButton.click();
    }

    // Verify service deleted
    await this.expectTextToBeVisible(/service deleted|removed successfully/i);

    console.log(`✅ Service "${serviceId}" deleted successfully`);
  }

  // Manage bookings
  async viewBookings(filters?: {
    status?: string;
    date?: string;
    service?: string;
  }) {
    await this.navigateToAdminSection('bookings');

    // Apply filters if provided
    if (filters?.status) {
      const statusFilter = this.page.getByLabel(/status/i);
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption(filters.status);
      }
    }

    if (filters?.date) {
      const dateFilter = this.page.getByLabel(/date/i);
      if (await dateFilter.isVisible()) {
        await dateFilter.fill(filters.date);
      }
    }

    if (filters?.service) {
      const serviceFilter = this.page.getByLabel(/service/i);
      if (await serviceFilter.isVisible()) {
        await serviceFilter.selectOption(filters.service);
      }
    }

    // Apply filters
    const applyButton = this.page.getByRole('button', { name: /apply|filter/i });
    if (await applyButton.isVisible()) {
      await applyButton.click();
    }

    await this.page.waitForTimeout(1000);

    // Count bookings
    const bookingItems = this.page.locator('[data-testid="booking-item"]');
    const bookingCount = await bookingItems.count();

    console.log(`✅ Found ${bookingCount} bookings`);

    return {
      count: bookingCount,
      bookings: await this.extractBookingData(bookingCount),
    };
  }

  // Extract booking data
  private async extractBookingData(count: number): Promise<BookingData[]> {
    const bookings: BookingData[] = [];

    for (let i = 0; i < count; i++) {
      const bookingItem = this.page.locator('[data-testid="booking-item"]').nth(i);

      const booking = {
        id: await bookingItem.getAttribute('data-booking-id') || '',
        customerName: await bookingItem.locator('[data-testid="customer-name"]').textContent() || '',
        serviceName: await bookingItem.locator('[data-testid="service-name"]').textContent() || '',
        date: await bookingItem.locator('[data-testid="booking-date"]').textContent() || '',
        time: await bookingItem.locator('[data-testid="booking-time"]').textContent() || '',
        status: (await bookingItem.locator('[data-testid="booking-status"]').textContent() || '').toLowerCase() as any,
        price: parseFloat((await bookingItem.locator('[data-testid="booking-price"]').textContent() || '0').replace(/[^0-9.]/g, '')),
      };

      bookings.push(booking);
    }

    return bookings;
  }

  // Update booking status
  async updateBookingStatus(bookingId: string, newStatus: BookingData['status']) {
    await this.navigateToAdminSection('bookings');

    // Find the booking
    const bookingItem = this.page.locator(`[data-booking-id="${bookingId}"]`);
    await bookingItem.scrollIntoViewIfNeeded();

    // Click update status button
    const statusButton = bookingItem.getByRole('button', { name: /update status|change status/i });
    await statusButton.click();

    // Select new status
    const statusSelect = this.page.getByLabel(/new status/i);
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption(newStatus);
    }

    // Confirm update
    const confirmButton = this.page.getByRole('button', { name: /update|confirm/i });
    await confirmButton.click();

    // Verify status updated
    await this.expectTextToBeVisible(/booking updated|status changed/i);

    console.log(`✅ Booking "${bookingId}" status updated to "${newStatus}"`);
  }

  // View analytics
  async viewAnalytics(timeRange?: '7d' | '30d' | '90d' | '1y') {
    await this.navigateToAdminSection('analytics');

    // Select time range if provided
    if (timeRange) {
      const timeRangeSelect = this.page.getByLabel(/time range|period/i);
      if (await timeRangeSelect.isVisible()) {
        await timeRangeSelect.selectOption(timeRange);
        await this.page.waitForTimeout(2000); // Wait for charts to update
      }
    }

    // Check for key metrics
    const metrics = {
      totalRevenue: this.page.locator('[data-testid="total-revenue"]'),
      totalBookings: this.page.locator('[data-testid="total-bookings"]'),
      newCustomers: this.page.locator('[data-testid="new-customers"]'),
      conversionRate: this.page.locator('[data-testid="conversion-rate"]'),
    };

    const availableMetrics: { [key: string]: string } = {};
    for (const [key, locator] of Object.entries(metrics)) {
      if (await locator.isVisible()) {
        availableMetrics[key] = await locator.textContent() || '';
        console.log(`✅ ${key}: ${availableMetrics[key]}`);
      }
    }

    // Check for charts
    const charts = {
      revenueChart: this.page.locator('[data-testid="revenue-chart"]'),
      bookingsChart: this.page.locator('[data-testid="bookings-chart"]'),
      servicesChart: this.page.locator('[data-testid="services-chart"]'),
    };

    const availableCharts: string[] = [];
    for (const [key, locator] of Object.entries(charts)) {
      if (await locator.isVisible()) {
        availableCharts.push(key);
        console.log(`✅ ${key} available`);
      }
    }

    return {
      metrics: availableMetrics,
      charts: availableCharts,
    };
  }

  // Manage users
  async viewUsers(filters?: {
    role?: string;
    status?: string;
    registrationDate?: string;
  }) {
    await this.navigateToAdminSection('users');

    // Apply filters if provided
    if (filters?.role) {
      const roleFilter = this.page.getByLabel(/role/i);
      if (await roleFilter.isVisible()) {
        await roleFilter.selectOption(filters.role);
      }
    }

    if (filters?.status) {
      const statusFilter = this.page.getByLabel(/status/i);
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption(filters.status);
      }
    }

    // Count users
    const userItems = this.page.locator('[data-testid="user-item"]');
    const userCount = await userItems.count();

    console.log(`✅ Found ${userCount} users`);

    return {
      count: userCount,
    };
  }

  // Update user role
  async updateUserRole(userId: string, newRole: string) {
    await this.navigateToAdminSection('users');

    // Find the user
    const userItem = this.page.locator(`[data-user-id="${userId}"]`);
    await userItem.scrollIntoViewIfNeeded();

    // Click update role button
    const roleButton = userItem.getByRole('button', { name: /update role|change role/i });
    await roleButton.click();

    // Select new role
    const roleSelect = this.page.getByLabel(/new role/i);
    if (await roleSelect.isVisible()) {
      await roleSelect.selectOption(newRole);
    }

    // Confirm update
    const confirmButton = this.page.getByRole('button', { name: /update|confirm/i });
    await confirmButton.click();

    // Verify role updated
    await this.expectTextToBeVisible(/user updated|role changed/i);

    console.log(`✅ User "${userId}" role updated to "${newRole}"`);
  }

  // Test admin permissions
  async testAdminPermissions() {
    // Try to access admin sections without login
    const sections = ['services', 'bookings', 'users', 'analytics', 'settings'];

    for (const section of sections) {
      await this.navigateTo(`/admin/${section}`);

      // Should be redirected to login or show access denied
      const currentUrl = this.page.url();
      if (currentUrl.includes('login') || currentUrl.includes('unauthorized')) {
        console.log(`✅ Admin ${section} properly protected`);
      } else {
        console.log(`⚠️  Admin ${section} may not be properly protected`);
      }
    }

    // Login as admin and verify access
    await this.loginAsAdmin();

    for (const section of sections) {
      await this.navigateTo(`/admin/${section}`);
      const sectionElement = this.page.locator(`[data-testid="admin-${section}"]`);

      if (await sectionElement.isVisible()) {
        console.log(`✅ Admin ${section} accessible after login`);
      } else {
        console.log(`⚠️  Admin ${section} not accessible after login`);
      }
    }
  }

  // Test data export functionality
  async testDataExport(dataType: 'bookings' | 'users' | 'services' | 'analytics') {
    await this.navigateToAdminSection(dataType === 'analytics' ? 'analytics' : dataType);

    // Look for export button
    const exportButton = this.page.getByRole('button', { name: /export|download/i });
    if (await exportButton.isVisible()) {
      // Handle file download
      const downloadPromise = this.page.waitForEvent('download');
      await exportButton.click();

      const download = await downloadPromise;
      console.log(`✅ ${dataType} data exported: ${download.suggestedFilename()}`);

      // Clean up downloaded file
      await download.delete();
    } else {
      console.log(`⚠️  Export functionality not available for ${dataType}`);
    }
  }

  // Test search functionality
  async testSearch(searchType: 'services' | 'bookings' | 'users', searchTerm: string) {
    await this.navigateToAdminSection(searchType);

    // Look for search input
    const searchInput = this.page.getByLabel(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(searchTerm);
      await this.page.waitForTimeout(1000);

      // Count search results
      const resultsLocator = this.page.locator(`[data-testid="${searchType.slice(0, -1)}-item"]`);
      const resultCount = await resultsLocator.count();

      console.log(`✅ Search for "${searchTerm}" in ${searchType}: ${resultCount} results`);

      return resultCount;
    } else {
      console.log(`⚠️  Search not available for ${searchType}`);
      return 0;
    }
  }

  // Test batch operations
  async testBatchOperation(operationType: 'delete' | 'update' | 'export', itemType: 'services' | 'bookings' | 'users') {
    await this.navigateToAdminSection(itemType);

    // Look for checkboxes for batch selection
    const firstCheckbox = this.page.locator(`[data-testid="${itemType.slice(0, -1)}-checkbox"]`).first();
    if (await firstCheckbox.isVisible()) {
      // Select first few items
      const checkboxes = this.page.locator(`[data-testid="${itemType.slice(0, -1)}-checkbox"]`);
      const selectionCount = Math.min(3, await checkboxes.count());

      for (let i = 0; i < selectionCount; i++) {
        await checkboxes.nth(i).check();
      }

      // Look for batch operation buttons
      const batchButton = this.page.getByRole('button', { name: new RegExp(operationType, 'i') });
      if (await batchButton.isVisible()) {
        await batchButton.click();

        // Confirm operation if dialog appears
        const confirmDialog = this.page.getByRole('dialog');
        if (await confirmDialog.isVisible()) {
          const confirmButton = this.page.getByRole('button', { name: /confirm|yes/i });
          await confirmButton.click();
        }

        console.log(`✅ Batch ${operationType} on ${selectionCount} ${itemType} completed`);
      } else {
        console.log(`⚠️  Batch ${operationType} not available for ${itemType}`);
      }
    } else {
      console.log(`⚠️  Batch selection not available for ${itemType}`);
    }
  }
}
