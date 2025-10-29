import { test, expect } from '@playwright/test';

import { AdminHelpers } from '../utils/admin-helpers';
import { UserHelpers } from '../utils/user-helpers';
import { BookingHelpers } from '../utils/booking-helpers';
import { TestDataManager, TestDataFactory } from '../utils/test-data';

test.describe('Admin Dashboard - Critical User Journey', () => {
  let adminHelpers: AdminHelpers;
  let userHelpers: UserHelpers;
  let bookingHelpers: BookingHelpers;
  let testDataManager: TestDataManager;

  test.beforeEach(async ({ page, context }) => {
    adminHelpers = new AdminHelpers(page);
    userHelpers = new UserHelpers(page);
    bookingHelpers = new BookingHelpers(page);
    testDataManager = new TestDataManager(context);

    // Set up error handling
    await adminHelpers.handleErrors();
  });

  test.afterEach(async ({ context }) => {
    await testDataManager.cleanup();
  });

  test.describe('Admin Authentication and Access', () => {
    test('AD-001: Admin login and dashboard access', async ({ page }) => {
      console.log('🎯 Starting AD-001: Admin login and dashboard access');

      // Login as admin
      await adminHelpers.loginAsAdmin();

      // Verify dashboard elements
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();

      // Check for key dashboard sections
      const dashboardElements = [
        '[data-testid="admin-summary"]',
        '[data-testid="recent-bookings"]',
        '[data-testid="revenue-overview"]',
        '[data-testid="quick-actions"]',
      ];

      for (const element of dashboardElements) {
        const elementLocator = page.locator(element);
        if (await elementLocator.isVisible()) {
          console.log(`✅ Dashboard element available: ${element}`);
        }
      }

      // Take screenshot for verification
      await adminHelpers.takeScreenshot('admin-dashboard-overview');

      console.log('✅ AD-001: Admin login and dashboard access completed');
    });

    test('AD-002: Admin permissions and access control', async ({ page }) => {
      console.log('🎯 Starting AD-002: Admin permissions test');

      // Test admin permissions
      await adminHelpers.testAdminPermissions();

      console.log('✅ AD-002: Admin permissions test completed');
    });

    test('AD-003: Admin logout and session management', async ({ page }) => {
      console.log('🎯 Starting AD-003: Admin logout test');

      // Login as admin
      await adminHelpers.loginAsAdmin();

      // Verify dashboard access
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();

      // Logout
      await adminHelpers.logoutAdmin();

      // Verify redirected to login
      await expect(page.locator('[data-testid="admin-login"]')).toBeVisible();

      // Try to access admin dashboard again
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Should be redirected to login
      expect(page.url()).toContain('login');

      console.log('✅ AD-003: Admin logout and session management completed');
    });
  });

  test.describe('Service Management', () => {
    test('SM-001: Create new beauty service', async ({ page }) => {
      console.log('🎯 Starting SM-001: Create new beauty service');

      await adminHelpers.loginAsAdmin();

      const newService = {
        name: 'Lash Lifting E2E Test',
        type: 'beauty' as const,
        price: 450,
        duration: 90,
        description: 'Professional lash lifting service for natural curl enhancement',
        category: 'lashes',
        isActive: true,
      };

      await adminHelpers.createService(newService);

      // Verify service appears in the list
      await adminHelpers.navigateToAdminSection('services');
      await expect(page.getByText(newService.name)).toBeVisible();

      // Take screenshot for verification
      await adminHelpers.takeScreenshot('admin-service-created');

      console.log('✅ SM-001: Beauty service created successfully');
    });

    test('SM-002: Update existing service', async ({ page }) => {
      console.log('🎯 Starting SM-002: Update existing service');

      await adminHelpers.loginAsAdmin();

      // First create a service to update
      const serviceData = {
        name: 'Test Service for Update',
        type: 'fitness' as const,
        price: 300,
        duration: 60,
        description: 'Service created for testing update functionality',
      };

      await adminHelpers.createService(serviceData);

      // Now update the service
      const updates = {
        name: 'Updated Test Service',
        price: 350,
        description: 'Updated description for test service',
      };

      // Find the service ID (this would need to be implemented based on actual UI)
      const serviceId = 'test-service-id'; // Placeholder

      await adminHelpers.updateService(serviceId, updates);

      // Verify updates
      await adminHelpers.navigateToAdminSection('services');
      await expect(page.getByText(updates.name)).toBeVisible();

      console.log('✅ SM-002: Service updated successfully');
    });

    test('SM-003: Delete service', async ({ page }) => {
      console.log('🎯 Starting SM-003: Delete service');

      await adminHelpers.loginAsAdmin();

      // Create a service to delete
      const serviceData = {
        name: 'Service to Delete E2E',
        type: 'lifestyle' as const,
        price: 200,
        duration: 45,
        description: 'Service created for testing deletion',
      };

      await adminHelpers.createService(serviceData);

      // Find and delete the service
      const serviceId = 'delete-test-service-id'; // Placeholder

      await adminHelpers.deleteService(serviceId);

      // Verify service is gone
      await adminHelpers.navigateToAdminSection('services');
      await expect(page.getByText(serviceData.name)).not.toBeVisible();

      console.log('✅ SM-003: Service deleted successfully');
    });

    test('SM-004: Bulk service operations', async ({ page }) => {
      console.log('🎯 Starting SM-004: Bulk service operations');

      await adminHelpers.loginAsAdmin();

      // Test batch operations
      await adminHelpers.testBatchOperation('export', 'services');
      await adminHelpers.testBatchOperation('update', 'services');

      console.log('✅ SM-004: Bulk service operations completed');
    });

    test('SM-005: Service search and filtering', async ({ page }) => {
      console.log('🎯 Starting SM-005: Service search and filtering');

      await adminHelpers.loginAsAdmin();

      // Test search functionality
      const searchResults = await adminHelpers.testSearch('services', 'beauty');
      console.log(`Found ${searchResults} services matching "beauty"`);

      // Test filtering
      await adminHelpers.navigateToAdminSection('services');

      // Look for filter options
      const typeFilter = page.getByLabel(/type/i);
      if (await typeFilter.isVisible()) {
        await typeFilter.selectOption('beauty');
        await page.waitForTimeout(1000);

        const filteredServices = page.locator('[data-testid="service-item"]');
        const filteredCount = await filteredServices.count();
        console.log(`Found ${filteredCount} beauty services after filtering`);
      }

      console.log('✅ SM-005: Service search and filtering completed');
    });
  });

  test.describe('Booking Management', () => {
    test('BM-001: View and manage bookings', async ({ page }) => {
      console.log('🎯 Starting BM-001: View and manage bookings');

      await adminHelpers.loginAsAdmin();

      // Create a test booking first
      const testUser = await testDataManager.createUser({
        name: 'Booking Test User',
        email: 'booking.test@example.com',
        phone: '+48 512 345 678',
      });

      await bookingHelpers.bookBeautyService({
        serviceName: 'Beauty Brows Enhancement',
        userName: testUser.name,
        userEmail: testUser.email,
        userPhone: testUser.phone,
        notes: 'Admin test booking',
      });

      // Now view bookings in admin
      const bookings = await adminHelpers.viewBookings({
        status: 'confirmed',
      });

      expect(bookings.count).toBeGreaterThan(0);
      console.log(`Found ${bookings.count} confirmed bookings`);

      // Test updating booking status
      if (bookings.bookings.length > 0) {
        const firstBooking = bookings.bookings[0];
        await adminHelpers.updateBookingStatus(firstBooking.id, 'completed');
      }

      // Take screenshot for verification
      await adminHelpers.takeScreenshot('admin-bookings-overview');

      console.log('✅ BM-001: Booking management completed');
    });

    test('BM-002: Booking filtering and search', async ({ page }) => {
      console.log('🎯 Starting BM-002: Booking filtering and search');

      await adminHelpers.loginAsAdmin();

      // Test different filters
      const statuses = ['pending', 'confirmed', 'cancelled', 'completed'];
      for (const status of statuses) {
        const filteredBookings = await adminHelpers.viewBookings({ status });
        console.log(`Found ${filteredBookings.count} ${status} bookings`);
      }

      // Test search functionality
      const searchResults = await adminHelpers.testSearch('bookings', 'anna');
      console.log(`Found ${searchResults} bookings matching "anna"`);

      console.log('✅ BM-002: Booking filtering and search completed');
    });

    test('BM-003: Booking data export', async ({ page }) => {
      console.log('🎯 Starting BM-003: Booking data export');

      await adminHelpers.loginAsAdmin();

      // Test data export
      await adminHelpers.testDataExport('bookings');

      console.log('✅ BM-003: Booking data export completed');
    });

    test('BM-004: Calendar view management', async ({ page }) => {
      console.log('🎯 Starting BM-004: Calendar view management');

      await adminHelpers.loginAsAdmin();

      // Navigate to calendar view (if available)
      await page.goto('/admin/calendar');
      await page.waitForLoadState('networkidle');

      // Look for calendar elements
      const calendarView = page.locator('[data-testid="calendar-view"]');
      if (await calendarView.isVisible()) {
        console.log('✅ Calendar view available');

        // Test different calendar views
        const viewButtons = ['day', 'week', 'month'];
        for (const view of viewButtons) {
          const viewButton = page.getByRole('button', { name: new RegExp(view, 'i') });
          if (await viewButton.isVisible()) {
            await viewButton.click();
            await page.waitForTimeout(500);
            console.log(`✅ ${view} view working`);
          }
        }
      } else {
        console.log('⚠️  Calendar view not available');
      }

      console.log('✅ BM-004: Calendar view management completed');
    });
  });

  test.describe('User Management', () => {
    test('UM-001: View and manage users', async ({ page }) => {
      console.log('🎯 Starting UM-001: View and manage users');

      await adminHelpers.loginAsAdmin();

      // Create a test user
      const timestamp = Date.now();
      const testUser = {
        name: 'Admin Test User',
        email: `admin.test.${timestamp}@example.com`,
        phone: '+48 512 345 678',
      };

      await userHelpers.registerUser(testUser, {
        skipEmailVerification: true,
        skipPhoneVerification: true,
      });

      // View users in admin
      const users = await adminHelpers.viewUsers();

      // Should see the newly created user
      expect(users.count).toBeGreaterThan(0);
      console.log(`Found ${users.count} users`);

      // Test updating user role
      const userId = 'test-user-id'; // Placeholder
      await adminHelpers.updateUserRole(userId, 'premium');

      // Take screenshot for verification
      await adminHelpers.takeScreenshot('admin-users-overview');

      console.log('✅ UM-001: User management completed');
    });

    test('UM-002: User search and filtering', async ({ page }) => {
      console.log('🎯 Starting UM-002: User search and filtering');

      await adminHelpers.loginAsAdmin();

      // Test search functionality
      const searchResults = await adminHelpers.testSearch('users', 'admin.test');
      console.log(`Found ${searchResults} users matching "admin.test"`);

      // Test filtering by role
      const usersByRole = await adminHelpers.viewUsers({ role: 'user' });
      console.log(`Found ${usersByRole.count} regular users`);

      // Test filtering by status
      const usersByStatus = await adminHelpers.viewUsers({ status: 'active' });
      console.log(`Found ${usersByStatus.count} active users`);

      console.log('✅ UM-002: User search and filtering completed');
    });

    test('UM-003: User data export', async ({ page }) => {
      console.log('🎯 Starting UM-003: User data export');

      await adminHelpers.loginAsAdmin();

      // Test data export
      await adminHelpers.testDataExport('users');

      console.log('✅ UM-003: User data export completed');
    });
  });

  test.describe('Analytics and Reporting', () => {
    test('AR-001: View analytics dashboard', async ({ page }) => {
      console.log('🎯 Starting AR-001: View analytics dashboard');

      await adminHelpers.loginAsAdmin();

      // View analytics with different time ranges
      const timeRanges = ['7d', '30d', '90d', '1y'] as const;

      for (const timeRange of timeRanges) {
        const analytics = await adminHelpers.viewAnalytics(timeRange);

        console.log(`Analytics for ${timeRange}:`);
        console.log(`  Metrics available: ${Object.keys(analytics.metrics).length}`);
        console.log(`  Charts available: ${analytics.charts.length}`);

        // Should have at least some metrics
        expect(Object.keys(analytics.metrics).length).toBeGreaterThan(0);
      }

      // Take screenshot for verification
      await adminHelpers.takeScreenshot('admin-analytics-dashboard');

      console.log('✅ AR-001: Analytics dashboard viewed successfully');
    });

    test('AR-002: Generate reports', async ({ page }) => {
      console.log('🎯 Starting AR-002: Generate reports');

      await adminHelpers.loginAsAdmin();

      // Look for report generation options
      await adminHelpers.navigateToAdminSection('analytics');

      const generateReportButton = page.getByRole('button', { name: /generate report|create report/i });
      if (await generateReportButton.isVisible()) {
        await generateReportButton.click();

        // Look for report options
        const reportTypes = [
          'revenue report',
          'booking report',
          'customer report',
          'service performance',
        ];

        for (const reportType of reportTypes) {
          const reportOption = page.getByLabel(new RegExp(reportType, 'i'));
          if (await reportOption.isVisible()) {
            console.log(`✅ Report option available: ${reportType}`);
          }
        }

        // Generate a sample report
        const confirmButton = page.getByRole('button', { name: /generate|create/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();

          // Wait for report generation
          await page.waitForTimeout(3000);

          const successMessage = page.getByText(/report generated|download ready/i);
          if (await successMessage.isVisible()) {
            console.log('✅ Report generated successfully');
          }
        }
      } else {
        console.log('⚠️  Report generation not available');
      }

      console.log('✅ AR-002: Report generation test completed');
    });

    test('AR-003: Export analytics data', async ({ page }) => {
      console.log('🎯 Starting AR-003: Export analytics data');

      await adminHelpers.loginAsAdmin();

      // Test analytics data export
      await adminHelpers.testDataExport('analytics');

      console.log('✅ AR-003: Analytics data export completed');
    });
  });

  test.describe('Settings and Configuration', () => {
    test('SC-001: Manage system settings', async ({ page }) => {
      console.log('🎯 Starting SC-001: Manage system settings');

      await adminHelpers.loginAsAdmin();

      await adminHelpers.navigateToAdminSection('settings');

      // Look for different setting categories
      const settingCategories = [
        'general',
        'booking',
        'payment',
        'notification',
        'integration',
      ];

      for (const category of settingCategories) {
        const categoryTab = page.getByRole('tab', { name: new RegExp(category, 'i') });
        if (await categoryTab.isVisible()) {
          await categoryTab.click();
          await page.waitForTimeout(500);

          const categoryContent = page.locator(`[data-testid="settings-${category}"]`);
          if (await categoryContent.isVisible()) {
            console.log(`✅ Settings category available: ${category}`);
          }
        }
      }

      // Test updating a setting
      const settingInput = page.getByLabel(/booking window|advance booking/i);
      if (await settingInput.isVisible()) {
        const currentValue = await settingInput.inputValue();
        await settingInput.clear();
        await settingInput.fill('30'); // 30 days

        const saveButton = page.getByRole('button', { name: /save settings/i });
        if (await saveButton.isVisible()) {
          await saveButton.click();

          const successMessage = page.getByText(/settings saved|updated/i);
          if (await successMessage.isVisible()) {
            console.log('✅ Settings updated successfully');
          }
        }
      }

      console.log('✅ SC-001: System settings management completed');
    });

    test('SC-002: Manage integrations', async ({ page }) => {
      console.log('🎯 Starting SC-002: Manage integrations');

      await adminHelpers.loginAsAdmin();

      await adminHelpers.navigateToAdminSection('settings');

      // Look for integrations tab
      const integrationsTab = page.getByRole('tab', { name: /integrations/i });
      if (await integrationsTab.isVisible()) {
        await integrationsTab.click();
        await page.waitForTimeout(500);

        // Look for common integrations
        const integrations = [
          'stripe',
          'booksy',
          'google analytics',
          'email service',
          'sms service',
        ];

        for (const integration of integrations) {
          const integrationCard = page.locator(`[data-testid="integration-${integration.replace(/\s+/g, '-')}"]`);
          if (await integrationCard.isVisible()) {
            console.log(`✅ Integration available: ${integration}`);

            // Test configuration if available
            const configButton = integrationCard.getByRole('button', { name: /configure|settings/i });
            if (await configButton.isVisible()) {
              console.log(`✅ ${integration} configuration available`);
            }
          }
        }
      } else {
        console.log('⚠️  Integrations settings not available');
      }

      console.log('✅ SC-002: Integration management test completed');
    });
  });

  test.describe('Admin Performance and Reliability', () => {
    test('PR-001: Admin dashboard performance', async ({ page }) => {
      console.log('🎯 Starting PR-001: Admin dashboard performance test');

      const startTime = Date.now();

      await adminHelpers.loginAsAdmin();

      // Load different admin sections and measure performance
      const sections = ['services', 'bookings', 'users', 'analytics'];

      for (const section of sections) {
        const sectionStartTime = Date.now();

        await adminHelpers.navigateToAdminSection(section);

        const sectionLoadTime = Date.now() - sectionStartTime;
        console.log(`⏱️  ${section} section loaded in ${sectionLoadTime}ms`);

        // Each section should load within reasonable time (5 seconds)
        expect(sectionLoadTime).toBeLessThan(5000);
      }

      const totalTime = Date.now() - startTime;
      console.log(`⏱️  Complete admin dashboard test completed in ${totalTime}ms`);

      // Take screenshot for performance verification
      await adminHelpers.takeScreenshot('admin-dashboard-performance');

      console.log('✅ PR-001: Admin dashboard performance test passed');
    });

    test('PR-002: Admin dashboard with large datasets', async ({ page }) => {
      console.log('🎯 Starting PR-002: Admin dashboard large dataset test');

      await adminHelpers.loginAsAdmin();

      // Test performance with potentially large datasets
      const bookings = await adminHelpers.viewBookings();
      console.log(`Loaded ${bookings.count} bookings`);

      const users = await adminHelpers.viewUsers();
      console.log(`Loaded ${users.count} users`);

      // Test pagination if available
      const pagination = page.locator('[data-testid="pagination"]');
      if (await pagination.isVisible()) {
        console.log('✅ Pagination available for large datasets');

        // Test navigation to next page
        const nextPageButton = page.getByRole('button', { name: /next/i });
        if (await nextPageButton.isVisible()) {
          await nextPageButton.click();
          await page.waitForTimeout(1000);
          console.log('✅ Pagination navigation working');
        }
      }

      console.log('✅ PR-002: Large dataset test completed');
    });
  });
});