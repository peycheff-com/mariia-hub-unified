import { test, expect } from '@playwright/test';

test.describe('Admin Workflows E2E Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock admin authentication
    await context.addCookies([
      {
        name: 'auth_token',
        value: 'mock_admin_session_token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
      }
    ]);

    // Mock admin user data
    await page.route('**/api/auth/user', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'admin_user_123',
            email: 'admin@mariia-hub.com',
            role: 'admin',
            permissions: ['admin', 'manage_services', 'manage_bookings', 'manage_analytics']
          }
        })
      });
    });
  });

  test('service management workflow - create new service', async ({ page }) => {
    await page.goto('/admin');
    await page.locator('[data-testid="admin-sidebar"]').waitFor({ state: 'visible' });

    // Navigate to services management
    await page.locator('[data-testid="nav-services"]').click();
    await expect(page.locator('h1')).toContainText('Services Management');

    // Create new service
    await page.locator('button:has-text("Add New Service")').click();
    await expect(page.locator('[data-testid="service-form"]')).toBeVisible();

    // Fill service details
    await page.locator('input[name="title"]').fill('Advanced Lip Enhancement');
    await page.locator('textarea[name="description"]').fill('Our most comprehensive lip enhancement treatment with advanced techniques and premium pigments.');
    await page.locator('select[name="service_type"]').selectOption('beauty');
    await page.locator('input[name="duration_minutes"]').fill('120');
    await page.locator('input[name="price_from"]').fill('350');
    await page.locator('input[name="max_group_size"]').fill('1');

    // Add service category
    await page.locator('[data-testid="add-category"]').click();
    await page.locator('input[name="category_name"]').fill('Premium Services');
    await page.locator('button:has-text("Add Category")').click();

    // Upload service image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-assets/lip-enhancement.jpg');

    // Add FAQ
    await page.locator('[data-testid="add-faq"]').click();
    await page.locator('input[name="faq_question"]').fill('How long does the treatment last?');
    await page.locator('textarea[name="faq_answer"]').fill('Results typically last 1-2 years with proper care.');

    // Save service
    await page.locator('button:has-text("Save Service")').click();

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Service created successfully');

    // Verify service appears in list
    await expect(page.locator('[data-testid="service-list"]')).toContainText('Advanced Lip Enhancement');
    await expect(page.locator('[data-testid="service-status-active"]')).toBeVisible();
  });

  test('booking management workflow - view and modify bookings', async ({ page }) => {
    // Mock bookings data
    await page.route('**/api/bookings**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          bookings: [
            {
              id: 'booking_1',
              service: { title: 'Lip Enhancement', service_type: 'beauty' },
              client_name: 'Sarah Johnson',
              client_email: 'sarah.j@example.com',
              date: '2024-12-15',
              time: '10:00',
              status: 'confirmed',
              payment_status: 'paid'
            },
            {
              id: 'booking_2',
              service: { title: 'Personal Training', service_type: 'fitness' },
              client_name: 'Mike Wilson',
              client_email: 'mike.w@example.com',
              date: '2024-12-16',
              time: '14:00',
              status: 'pending',
              payment_status: 'unpaid'
            }
          ]
        })
      });
    });

    await page.goto('/admin');

    // Navigate to bookings
    await page.locator('[data-testid="nav-bookings"]').click();
    await expect(page.locator('h1')).toContainText('Booking Management');

    // Verify booking list
    await expect(page.locator('[data-testid="booking-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-item"]:has-text("Sarah Johnson")')).toBeVisible();
    await expect(page.locator('[data-testid="booking-item"]:has-text("Mike Wilson")')).toBeVisible();

    // Filter bookings by status
    await page.locator('[data-testid="status-filter"]').selectOption('pending');
    await expect(page.locator('[data-testid="booking-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="booking-item"]')).toContainText('Mike Wilson');

    // Modify booking status
    await page.locator('[data-testid="booking-item"]:has-text("Mike Wilson") [data-testid="status-dropdown"]').click();
    await page.locator('[data-testid="status-confirmed"]').click();

    // Verify status change
    await expect(page.locator('[data-testid="status-badge-confirmed"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Booking status updated');

    // View booking details
    await page.locator('[data-testid="booking-item"]:has-text("Sarah Johnson") [data-testid="view-details"]').click();
    await expect(page.locator('[data-testid="booking-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="client-info"]')).toContainText('sarah.j@example.com');
    await expect(page.locator('[data-testid="service-info"]')).toContainText('Lip Enhancement');
  });

  test('availability management workflow - calendar operations', async ({ page }) => {
    // Mock availability data
    await page.route('**/api/availability**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          availability: [
            { date: '2024-12-15', time: '09:00', available: true },
            { date: '2024-12-15', time: '10:00', available: false },
            { date: '2024-12-15', time: '11:00', available: true }
          ]
        })
      });
    });

    await page.goto('/admin');

    // Navigate to availability/calendar
    await page.locator('[data-testid="nav-availability"]').click();
    await expect(page.locator('h1')).toContainText('Availability Management');

    // Switch to week view
    await page.locator('[data-testid="view-toggle-week"]').click();
    await expect(page.locator('[data-testid="week-calendar"]')).toBeVisible();

    // Add available time slot
    await page.locator('[data-testid="date-cell"]:has-text("15")').click();
    await page.locator('[data-testid="add-slot"]').click();

    // Fill slot details
    await page.locator('input[name="start_time"]').fill('13:00');
    await page.locator('input[name="end_time"]').fill('14:00');
    await page.locator('input[name="max_bookings"]').fill('1');
    await page.locator('[data-testid="save-slot"]').click();

    // Verify slot added
    await expect(page.locator('[data-testid="time-slot"]:has-text("13:00")')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Time slot added');

    // Block time slot
    await page.locator('[data-testid="time-slot"]:has-text("09:00") [data-testid="block-slot"]').click();
    await page.locator('textarea[name="block_reason"]').fill('Staff training');
    await page.locator('[data-testid="confirm-block"]').click();

    // Verify slot blocked
    await expect(page.locator('[data-testid="time-slot"]:has-text("09:00")')).toHaveClass(/blocked|unavailable/);

    // Test bulk operations
    await page.locator('[data-testid="bulk-operations"]').click();
    await page.locator('[data-testid="select-multiple"]').click();
    await page.locator('[data-testid="time-slot"]:has-text("11:00")').click();
    await page.locator('[data-testid="time-slot"]:has-text("13:00")').click();
    await page.locator('[data-testid="bulk-block"]').click();
    await page.locator('[data-testid="confirm-bulk-block"]').click();

    // Verify bulk operation
    await expect(page.locator('[data-testid="success-message"]')).toContainText('2 slots blocked');
  });

  test('analytics dashboard workflow - view and export data', async ({ page }) => {
    // Mock analytics data
    await page.route('**/api/analytics/overview**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overview: {
            total_bookings: 1250,
            total_revenue: 125000,
            average_booking_value: 100,
            conversion_rate: 12.5,
            popular_services: [
              { title: 'Lip Enhancement', bookings: 450 },
              { title: 'PMU Brows', bookings: 320 }
            ],
            monthly_growth: [
              { month: 'Jan', bookings: 100 },
              { month: 'Feb', bookings: 120 },
              { month: 'Mar', bookings: 140 }
            ]
          }
        })
      });
    });

    await page.goto('/admin');

    // Navigate to analytics
    await page.locator('[data-testid="nav-analytics"]').click();
    await expect(page.locator('h1')).toContainText('Analytics Dashboard');

    // Verify overview metrics
    await expect(page.locator('[data-testid="total-bookings"]')).toContainText('1,250');
    await expect(page.locator('[data-testid="total-revenue"]')).toContainText('$125,000');
    await expect(page.locator('[data-testid="conversion-rate"]')).toContainText('12.5%');

    // Verify popular services chart
    await expect(page.locator('[data-testid="popular-services-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-item"]:has-text("Lip Enhancement")')).toBeVisible();

    // Test date range filter
    await page.locator('[data-testid="date-range-picker"]').click();
    await page.locator('[data-testid="preset-last-30-days"]').click();
    await page.locator('[data-testid="apply-filter"]').click();

    // Verify data refresh
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();

    // Export data
    await page.locator('[data-testid="export-button"]').click();
    await page.locator('[data-testid="export-csv"]').click();

    // Verify download initiated
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toMatch(/analytics.*\.csv$/);
  });

  test('content management workflow - blog posts', async ({ page }) => {
    // Mock blog posts data
    await page.route('**/api/blog/posts**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          posts: [
            {
              id: 'post_1',
              title: 'Complete Guide to Lip Enhancement',
              status: 'published',
              published_at: '2024-12-01',
              view_count: 1250,
              category: 'Treatments'
            },
            {
              id: 'post_2',
              title: 'Benefits of PMU Brows',
              status: 'draft',
              published_at: null,
              view_count: 0,
              category: 'Treatments'
            }
          ]
        })
      });
    });

    await page.goto('/admin');

    // Navigate to blog management
    await page.locator('[data-testid="nav-cms"]').click();
    await page.locator('[data-testid="blog-management"]').click();
    await expect(page.locator('h1')).toContainText('Blog Management');

    // Create new blog post
    await page.locator('button:has-text("New Post")').click();
    await expect(page.locator('[data-testid="blog-editor"]')).toBeVisible();

    // Fill post details
    await page.locator('input[name="title"]').fill('The Ultimate Guide to Beauty Treatments');
    await page.locator('input[name="slug"]').fill('ultimate-guide-beauty-treatments');
    await page.locator('select[name="category"]').selectOption('Treatments');
    await page.locator('textarea[name="excerpt"]').fill('Comprehensive overview of our most popular beauty treatments.');

    // Add content using rich text editor
    const editorFrame = page.frameLocator('iframe[name="content-editor"]');
    await editorFrame.locator('body').fill('This is the blog post content with detailed information about beauty treatments...');

    // Add featured image
    await page.locator('input[type="file"][name="featured_image"]').setInputFiles('test-assets/blog-cover.jpg');

    // Set SEO metadata
    await page.locator('input[name="seo_title"]').fill('Ultimate Guide to Beauty Treatments | Mariia Hub');
    await page.locator('textarea[name="meta_description"]').fill('Learn about our comprehensive beauty treatments and find the perfect service for you.');

    // Save as draft
    await page.locator('button:has-text("Save Draft")').click();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Draft saved');

    // Publish post
    await page.locator('button:has-text("Publish")').click();
    await page.locator('[data-testid="confirm-publish"]').click();

    // Verify post published
    await expect(page.locator('[data-testid="publish-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="post-status-published"]')).toBeVisible();

    // Verify post appears in list
    await expect(page.locator('[data-testid="post-list"]')).toContainText('The Ultimate Guide to Beauty Treatments');
  });

  test('user management workflow - customer accounts', async ({ page }) => {
    // Mock users data
    await page.route('**/api/users**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [
            {
              id: 'user_1',
              email: 'sarah.johnson@example.com',
              name: 'Sarah Johnson',
              phone: '+1234567890',
              booking_count: 5,
              total_spent: 750,
              loyalty_points: 500,
              status: 'active'
            },
            {
              id: 'user_2',
              email: 'mike.wilson@example.com',
              name: 'Mike Wilson',
              phone: '+1234567891',
              booking_count: 2,
              total_spent: 200,
              loyalty_points: 150,
              status: 'active'
            }
          ]
        })
      });
    });

    await page.goto('/admin');

    // Navigate to user management
    await page.locator('[data-testid="nav-users"]').click();
    await expect(page.locator('h1')).toContainText('User Management');

    // Verify user list
    await expect(page.locator('[data-testid="user-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-item"]:has-text("Sarah Johnson")')).toBeVisible();

    // Search for user
    await page.locator('input[name="search-users"]').fill('mike');
    await expect(page.locator('[data-testid="user-list"]')).toContainText('Mike Wilson');
    await expect(page.locator('[data-testid="user-list"]')).not.toContainText('Sarah Johnson');

    // Clear search
    await page.locator('input[name="search-users"]').clear();

    // View user details
    await page.locator('[data-testid="user-item"]:has-text("Sarah Johnson") [data-testid="view-profile"]').click();
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-email"]')).toContainText('sarah.johnson@example.com');
    await expect(page.locator('[data-testid="booking-history"]')).toBeVisible();

    // Add loyalty points
    await page.locator('[data-testid="add-loyalty-points"]').click();
    await page.locator('input[name="points"]').fill('100');
    await page.locator('textarea[name="reason"]').fill('Bonus for being a loyal customer');
    await page.locator('[data-testid="confirm-add-points"]').click();

    // Verify points added
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Loyalty points added');
    await expect(page.locator('[data-testid="total-points"]')).toContainText('600');
  });

  test('settings and configuration workflow', async ({ page }) => {
    // Mock settings data
    await page.route('**/api/settings**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          settings: {
            business_name: 'Mariia Beauty Hub',
            contact_email: 'contact@mariia-hub.com',
            contact_phone: '+48 123 456 789',
            address: 'Warsaw, Poland',
            currency: 'PLN',
            timezone: 'Europe/Warsaw',
            booking_lead_time: 24,
            cancellation_policy: '24 hours notice required'
          }
        })
      });
    });

    await page.goto('/admin');

    // Navigate to settings
    await page.locator('[data-testid="nav-settings"]').click();
    await expect(page.locator('h1')).toContainText('Settings');

    // Test business settings
    await expect(page.locator('input[name="business_name"]')).toHaveValue('Mariia Beauty Hub');
    await page.locator('input[name="contact_email"]').fill('updated@mariia-hub.com');

    // Test booking settings
    await page.locator('[data-testid="booking-settings"]').click();
    await page.locator('input[name="booking_lead_time"]').fill('48');
    await page.locator('textarea[name="cancellation_policy"]').fill('Updated cancellation policy: 48 hours notice required');

    // Test integration settings
    await page.locator('[data-testid="integrations"]').click();
    await expect(page.locator('[data-testid="stripe-settings"]')).toBeVisible();
    await page.locator('input[name="stripe_publishable_key"]').fill('pk_test_example');

    // Save settings
    await page.locator('button:has-text("Save Settings")').click();

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Settings saved successfully');

    // Test notification settings
    await page.locator('[data-testid="notifications"]').click();
    await page.locator('input[name="email_notifications"]').check();
    await page.locator('input[name="sms_notifications"]').check();

    // Test email templates
    await page.locator('[data-testid="email-templates"]').click();
    await page.locator('[data-testid="template-booking-confirmation"]').click();
    await expect(page.locator('[data-testid="email-editor"]')).toBeVisible();
    await page.locator('textarea[name="email_body"]').fill('Your booking has been confirmed. We look forward to seeing you!');
    await page.locator('button:has-text("Save Template")').click();
  });
});