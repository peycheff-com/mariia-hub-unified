# Comprehensive E2E Testing for Mariia Hub

This directory contains comprehensive end-to-end tests for the Mariia Hub beauty and fitness booking platform. The test suite ensures the luxury booking experience works flawlessly across all platforms and devices.

## 🎯 Test Coverage

### **Critical User Journeys**
- ✅ Complete 4-step booking wizard (service selection → time selection → details → payment)
- ✅ Beauty service booking workflows (brows, lips, lashes, makeup)
- ✅ Fitness program enrollment (personal training, glutes, starter packages)
- ✅ Cross-platform booking (desktop, tablet, mobile)
- ✅ Multi-language booking (English/Polish)
- ✅ Payment processing with Stripe integration

### **Cross-Browser Compatibility**
- ✅ Chrome, Firefox, Safari, Edge compatibility
- ✅ Responsive design testing across devices
- ✅ JavaScript feature detection and fallbacks
- ✅ CSS rendering consistency
- ✅ Performance benchmarking across browsers

### **Visual Regression Testing**
- ✅ Screenshot comparison for critical pages
- ✅ Component-level visual testing
- ✅ Design system compliance verification
- ✅ Luxury UI consistency across screen sizes
- ✅ Animation and transition testing

### **Accessibility Testing (WCAG AA Compliance)**
- ✅ Screen reader compatibility (VoiceOver, TalkBack, NVDA)
- ✅ Keyboard-only navigation testing
- ✅ Focus management and tab order
- ✅ ARIA labels and semantic HTML verification
- ✅ Color contrast and readability testing
- ✅ Touch target size verification (44x44px minimum)

### **Performance & Core Web Vitals**
- ✅ Page load time optimization
- ✅ Core Web Vitals measurement (LCP, FID, CLS)
- ✅ Bundle size optimization verification
- ✅ Image loading and optimization testing
- ✅ Service worker caching verification
- ✅ Memory usage monitoring

### **Mobile & Tablet Testing**
- ✅ Touch interactions and gestures
- ✅ Mobile-specific UI components (modals, dropdowns)
- ✅ Viewport and orientation changes
- ✅ Mobile keyboard interactions
- ✅ App-like experience on mobile devices

## 🏗️ Architecture

### **Page Object Model (POM)**
The test suite uses a robust Page Object Model architecture for maintainable and scalable tests:

```
tests/e2e/
├── page-objects/
│   ├── base-page.ts           # Base functionality for all pages
│   ├── home-page.ts           # Homepage specific interactions
│   ├── beauty-page.ts         # Beauty services page interactions
│   └── booking-wizard.ts      # 4-step booking flow interactions
├── utils/
│   ├── test-data.ts           # Test data and scenarios
│   └── visual-testing.ts      # Visual regression utilities
├── comprehensive-booking-flow.spec.ts
├── visual-regression.spec.ts
├── comprehensive-accessibility.spec.ts
├── cross-browser-responsive.spec.ts
├── performance-core-web-vitals.spec.ts
└── README.md
```

### **Test Data Management**
Comprehensive test data factory with realistic scenarios:
- Polish and international user profiles
- Beauty and fitness service catalogs
- Time slot availability patterns
- Payment card testing (including declined scenarios)
- Mobile device configurations

## 🚀 Running Tests

### **Local Development**
```bash
# Install dependencies
npm install

# Run all E2E tests
npm run test:e2e

# Run specific test suites
npm run test:e2e -- --grep "booking flow"
npm run test:e2e -- --grep "accessibility"
npm run test:e2e -- --grep "visual regression"
npm run test:e2e -- --grep "performance"

# Run with Playwright UI (interactive mode)
npm run test:e2e:ui

# Run with debugging
npm run test:e2e:debug

# Generate test code
npm run test:e2e:codegen
```

### **Browser-Specific Testing**
```bash
# Chrome/Chromium
npm run test:e2e -- --project chromium

# Firefox
npm run test:e2e -- --project firefox

# Safari/WebKit
npm run test:e2e -- --project webkit

# Mobile Chrome
npm run test:e2e -- --project "Mobile Chrome"

# Mobile Safari
npm run test:e2e -- --project "Mobile Safari"
```

### **Visual Testing**
```bash
# Update baseline screenshots
UPDATE_BASELINE_SCREENSHOTS=true npm run test:e2e -- --grep "visual"

# Run visual regression tests only
npm run test:e2e:visual
```

### **Accessibility Testing**
```bash
# Run WCAG AA compliance tests
npm run test:e2e -- --grep "accessibility"

# Generate accessibility report
npm run test:e2e -- --grep "accessibility" --reporter json
```

### **Performance Testing**
```bash
# Measure baseline performance
MEASURE_BASELINE_PERFORMANCE=true npm run test:e2e -- --grep "performance"

# Run Core Web Vitals tests
npm run test:e2e -- tests/e2e/performance-core-web-vitals.spec.ts
```

## 📊 Test Reports

### **HTML Reports**
After running tests, HTML reports are generated in:
- `playwright-report/` - Interactive test results
- `test-results/` - Screenshots, videos, and detailed logs

### **CI/CD Integration**
Tests run automatically on:
- **Push to main/develop**: Full test suite
- **Pull requests**: Critical path tests
- **Daily schedule**: Comprehensive regression testing
- **Manual trigger**: Specific test suites and environments

## 🎨 Visual Testing Strategy

### **Screenshot Comparison**
- **Critical Pages**: Homepage, beauty services, booking wizard
- **Responsive Breakpoints**: Mobile (375px), Tablet (768px), Desktop (1280px+)
- **Interactive States**: Hover, focus, selected, disabled
- **Dark Mode**: High contrast mode compatibility
- **Loading States**: Skeleton loaders and progress indicators

### **Component-Level Testing**
- Navigation consistency across devices
- Service cards layout and information hierarchy
- Form validation states and error handling
- Modal and overlay positioning
- Button and interaction element sizing

## ♿ Accessibility Testing

### **WCAG AA Compliance**
- **Level A**: All critical accessibility requirements
- **Level AA**: Enhanced accessibility standards
- **Screen Readers**: VoiceOver, TalkBack, NVDA compatibility
- **Keyboard Navigation**: Full functionality without mouse
- **Color Contrast**: 4.5:1 minimum ratio for normal text
- **Touch Targets**: 44x44px minimum for mobile devices

### **Accessibility Test Areas**
- Semantic HTML structure and headings
- ARIA labels and descriptions
- Focus management and tab order
- Form labels and error associations
- Skip links and navigation landmarks
- Image alt text and descriptions

## 📈 Performance Benchmarks

### **Core Web Vitals Targets**
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### **Performance Metrics**
- **Page Load Time**: < 3 seconds on 3G
- **Bundle Size**: < 2MB total transferred
- **Image Optimization**: WebP format with lazy loading
- **API Response Time**: < 1 second average
- **Memory Usage**: < 50MB peak on mobile

## 📱 Mobile Testing

### **Device Coverage**
- **Mobile**: iPhone 12, Pixel 5, Galaxy S20
- **Tablet**: iPad Pro, Surface Pro
- **Viewports**: 375px to 2560px width range
- **Orientations**: Portrait and landscape testing
- **Touch Gestures**: Tap, swipe, pinch, zoom

### **Mobile-Specific Tests**
- Touch target accessibility
- Mobile keyboard interactions
- Viewport orientation handling
- App-like navigation patterns
- Offline functionality testing

## 🔧 Configuration

### **Environment Variables**
```bash
# Test environment
TEST_ENVIRONMENT=development|staging|production
BASE_URL=http://localhost:8080

# Feature flags
UPDATE_BASELINE_SCREENSHOTS=true
MEASURE_BASELINE_PERFORMANCE=true
CLEANUP_TEST_DATA=true

# Testing options
CI=true
PARALLEL_WORKERS=4
TEST_TIMEOUT=60000
```

### **Playwright Configuration**
- **Browsers**: Chromium, Firefox, WebKit
- **Devices**: Mobile phones, tablets, desktops
- **Timeouts**: 60s global, 15s action, 30s navigation
- **Retries**: 2 on CI, 0 locally
- **Parallel**: 4 workers for sharded execution

## 🐛 Debugging Failed Tests

### **Screenshots and Videos**
Failed tests automatically capture:
- **Screenshots**: At failure point and full page
- **Videos**: Complete test execution
- **Trace Files**: Detailed execution timeline
- **Console Logs**: Browser console output

### **Debugging Commands**
```bash
# Run single test with debugging
npm run test:e2e:debug -- tests/e2e/comprehensive-booking-flow.spec.ts

# Run with browser UI
npm run test:e2e:ui -- --project chromium

# Generate playwright trace
npx playwright test --trace on

# Run with verbose output
npm run test:e2e -- --reporter=list
```

## 🔄 CI/CD Pipeline

### **GitHub Actions Workflow**
- **Matrix Testing**: Parallel execution across browsers and devices
- **Conditional Execution**: Different test suites based on triggers
- **Artifact Management**: Upload test results, screenshots, and reports
- **Deployment Gates**: Deploy to staging only after critical tests pass
- **Notifications**: Alert on test failures in scheduled runs

### **Test Execution Matrix**
- **Critical Path**: Always runs on push/PR
- **Visual Regression**: Daily scheduled runs
- **Performance**: Weekly performance benchmarks
- **Accessibility**: PR validation + weekly checks
- **Cross-Browser**: Release validation testing

## 📝 Best Practices

### **Test Writing**
1. **Use Page Object Model** for maintainable test code
2. **Write descriptive test names** that explain the user journey
3. **Include accessibility checks** in all critical flows
4. **Test realistic user scenarios** with proper data
5. **Handle async operations** with proper waits
6. **Clean up test data** after each test

### **Test Data**
1. **Use factory patterns** for test data generation
2. **Avoid hardcoded dates/times** - use relative dates
3. **Include edge cases** in test scenarios
4. **Mock external dependencies** for consistent testing
5. **Use realistic user profiles** for different locales

### **Performance**
1. **Run tests in parallel** to reduce execution time
2. **Reuse browser contexts** where possible
3. **Optimize selectors** for faster element location
4. **Minimize unnecessary waits** and page loads
5. **Use sharding** for large test suites

## 🔮 Future Enhancements

### **Planned Improvements**
- [ ] AI-powered visual regression detection
- [ ] Real device cloud integration (BrowserStack, Sauce Labs)
- [ ] Automated performance budget monitoring
- [ ] Cross-browser performance benchmarking
- [ ] Mobile app testing integration
- [ ] API performance testing alongside UI tests

### **Advanced Testing Scenarios**
- [ ] Multi-user booking scenarios
- [ ] Real-time availability testing
- [ ] Payment gateway integration testing
- [ ] Email notification testing
- [ ] Analytics and conversion tracking validation
- [ ] Load testing with concurrent users

## 📞 Support

For questions about the E2E testing setup:
1. Check this README for common usage patterns
2. Review test files for implementation examples
3. Examine Playwright documentation for advanced features
4. Check GitHub Actions workflow logs for CI/CD issues

---

**Note**: This comprehensive E2E testing suite ensures the Mariia Hub platform provides a flawless luxury booking experience across all devices and platforms, meeting the highest standards for beauty and fitness service booking in the premium Warsaw market.