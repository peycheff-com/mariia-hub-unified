# Knowledge Base and FAQ System

A comprehensive knowledge base and FAQ system for the luxury beauty/fitness platform, featuring smart search, content management, analytics, and seamless integration capabilities.

## 🚀 Features

### Core Functionality
- **Article Management System**: Rich text editor with multimedia support, version control, and multilingual content
- **Dynamic FAQ Management**: Smart FAQ recommendations, performance tracking, and automated suggestions
- **Smart Search**: AI-powered search with natural language processing, auto-suggestions, and fuzzy matching
- **Analytics & Performance**: Comprehensive tracking, content performance metrics, and user engagement analytics
- **Multi-language Support**: Full English/Polish language support throughout the system

### Advanced Features
- **Context-Aware Help**: Smart suggestions based on user location and behavior
- **Support Integration**: Seamless integration with support ticket systems
- **Content Personalization**: Recommended content based on service history
- **Real-time Updates**: Live search suggestions and content updates
- **Mobile-Optimized**: Fully responsive design for all devices
- **Luxury Experience**: Premium design consistent with brand aesthetic

## 📋 Table of Contents

- [Installation](#installation)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Components](#components)
- [Services](#services)
- [Integration Examples](#integration-examples)
- [API Reference](#api-reference)
- [Analytics](#analytics)
- [Testing](#testing)
- [Performance](#performance)
- [Security](#security)

## 🛠 Installation

### Prerequisites
- Node.js 18+
- Supabase account and project
- TypeScript support in your project

### Database Setup

1. **Run the migration**:
```bash
# Apply the knowledge base migration
npx supabase db push

# Or if using local Supabase
supabase db push
```

2. **Update types**:
```bash
# Generate updated TypeScript types
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Component Installation

All components are built with shadcn/ui and Tailwind CSS. Ensure you have these dependencies installed:

```bash
npm install @radix-ui/react-collapsible @radix-ui/react-popover @radix-ui/react-separator @radix-ui/react-tabs
```

## ⚙️ Configuration

### Environment Variables

Add these to your `.env.local`:

```env
# Knowledge Base Settings
VITE_KB_ENABLED=true
VITE_KB_ANALYTICS_ENABLED=true
VITE_KB_SEARCH_ENABLED=true

# Optional: Custom settings
VITE_KB_DEFAULT_LANGUAGE=en
VITE_KB_MAX_SEARCH_RESULTS=20
```

### Supabase Setup

The system uses these Supabase tables:
- `kb_articles` - Knowledge base articles
- `kb_categories` - Article categories
- `faq_items` - FAQ items
- `faq_categories` - FAQ categories
- `kb_search_analytics` - Search analytics
- `kb_content_performance` - Performance metrics
- And several supporting tables...

See the migration file for complete schema details.

## 🧩 Components

### Main Components

#### `KnowledgeBaseHome`
Main knowledge base landing page with search, categories, and popular content.

```tsx
import KnowledgeBaseHome from '@/components/knowledge-base/KnowledgeBaseHome';

function App() {
  return <KnowledgeBaseHome serviceType="beauty" />;
}
```

#### `ArticleViewer`
Displays individual articles with table of contents, related content, and feedback.

```tsx
import ArticleViewer from '@/components/knowledge-base/ArticleViewer';

function ArticlePage() {
  return <ArticleViewer slug="your-article-slug" />;
}
```

#### `FAQSection`
Interactive FAQ section with expandable questions and feedback.

```tsx
import FAQSection from '@/components/knowledge-base/FAQSection';

function HelpSection() {
  return (
    <FAQSection
      serviceType="beauty"
      showSearch={true}
      interactive={true}
      limit={10}
    />
  );
}
```

#### `SupportIntegration`
Context-aware help widget for support integration.

```tsx
import SupportIntegration from '@/components/knowledge-base/SupportIntegration';

function BookingPage() {
  return (
    <SupportIntegration
      context="booking"
      onContactSupport={(message, context) => {
        // Handle support request
      }}
    />
  );
}
```

#### `KBWidget`
Floating help widget for website-wide integration.

```tsx
import KBWidget from '@/components/knowledge-base/KBWidget';

function Layout() {
  return (
    <>
      <YourApp />
      <KBWidget
        position="bottom-right"
        theme="light"
        size="medium"
      />
    </>
  );
}
```

#### `KBDashboard`
Admin dashboard for content management and analytics.

```tsx
import KBDashboard from '@/components/admin/knowledge-base/KBDashboard';

function AdminPage() {
  return <KBDashboard userRole="admin" />;
}
```

## 🔧 Services

### KnowledgeBaseService

Main service for article and category management.

```tsx
import KnowledgeBaseService from '@/services/knowledge-base.service';

// Get articles
const { articles, total } = await KnowledgeBaseService.getArticles({
  category_id: 'cat-123',
  limit: 10,
  featured: true
});

// Create article
const article = await KnowledgeBaseService.createArticle({
  title: 'New Article',
  content: 'Article content...',
  category_id: 'cat-123'
}, 'user-id');

// Track article view
await KnowledgeBaseService.trackArticleView('article-id');
```

### FAQManagementService

Service for FAQ management and analytics.

```tsx
import FAQManagementService from '@/services/faq-management.service';

// Get FAQs
const { faqs, total } = await FAQManagementService.getFAQs({
  category_id: 'faq-cat-123',
  featured: true
});

// Create FAQ
const faq = await FAQManagementService.createFAQ({
  question: 'How to book?',
  answer: 'You can book through our website...'
}, 'user-id');

// Get smart suggestions
const suggestions = await FAQManagementService.getSmartFAQSuggestions('booking appointment');
```

### SmartSearchService

Advanced search with AI-powered features.

```tsx
import SmartSearchService from '@/services/smart-search.service';

// Smart search
const results = await SmartSearchService.smartSearch('lip enhancement', {
  category_id: 'beauty'
}, {
  includeSuggestions: true,
  enableFuzzyMatching: true,
  maxResults: 10
});

// Auto-complete
const suggestions = await SmartSearchService.getAutoCompleteSuggestions('lip');

// Search insights
const insights = await SmartSearchService.getSearchInsights(30);
```

### AnalyticsService

Comprehensive analytics and performance tracking.

```tsx
import AnalyticsService from '@/services/analytics.service';

// Track content view
await AnalyticsService.trackContentView('article', 'article-id', 'user-id', {
  timeOnPage: 180,
  source: 'search'
});

// Generate analytics report
const report = await AnalyticsService.generateAnalyticsReport(
  new Date('2024-01-01'),
  new Date('2024-01-31')
);

// Real-time metrics
const realTime = await AnalyticsService.getRealTimeMetrics();

// Export data
const blob = await AnalyticsService.exportAnalyticsData(startDate, endDate, 'csv');
```

## 🌐 Integration Examples

### Basic Knowledge Base Page

```tsx
import KnowledgeBaseHome from '@/components/knowledge-base/KnowledgeBaseHome';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <KnowledgeBaseHome serviceType="beauty" />
    </div>
  );
}
```

### Service Page with Integrated FAQ

```tsx
import FAQSection from '@/components/knowledge-base/FAQSection';
import SupportIntegration from '@/components/knowledge-base/SupportIntegration';

export default function ServicePage({ serviceId }: { serviceId: string }) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Service content */}

      <FAQSection
        serviceId={serviceId}
        serviceType="beauty"
        showSearch={true}
      />

      <SupportIntegration
        context="service"
        serviceId={serviceId}
        onContactSupport={handleSupportRequest}
      />
    </div>
  );
}
```

### Global Website Integration

```tsx
import KBWidget from '@/components/knowledge-base/KBWidget';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header>{/* Navigation */}</header>
      <main>{children}</main>

      {/* Global help widget */}
      <KBWidget
        position="bottom-right"
        theme="light"
        size="medium"
        context={{
          page: window.location.pathname,
          tags: ['help', 'support']
        }}
      />
    </div>
  );
}
```

### Admin Dashboard Integration

```tsx
import KBDashboard from '@/components/admin/knowledge-base/KBDashboard';

export default function AdminDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <KBDashboard userRole="admin" />
    </div>
  );
}
```

## 📊 Analytics

### Built-in Analytics

The system tracks:
- **Content Performance**: Views, helpfulness ratings, time on page
- **Search Analytics**: Popular queries, failed searches, search success rates
- **User Engagement**: Feedback patterns, content preferences
- **Content Gaps**: Searches with no results for content optimization

### Custom Analytics

```tsx
// Track custom events
await AnalyticsService.trackContentView('article', 'article-id', 'user-id', {
  source: 'booking_flow',
  device: 'mobile',
  timeOnPage: 245
});

// Generate custom reports
const report = await AnalyticsService.generateAnalyticsReport(startDate, endDate);
console.log('Top performing content:', report.overview.topPerformingContent);
console.log('Search insights:', report.searchAnalytics);
```

### Real-time Monitoring

```tsx
// Get real-time metrics
const metrics = await AnalyticsService.getRealTimeMetrics();
console.log('Active users:', metrics.activeUsers);
console.log('Current searches:', metrics.currentSearches);
console.log('Popular searches:', metrics.popularSearches);
```

## 🧪 Testing

### Unit Tests

```bash
# Run knowledge base tests
npm run test knowledge-base

# Run with coverage
npm run test:coverage knowledge-base
```

### Test Examples

See `src/test/knowledge-base.test.ts` for comprehensive test suite covering:
- Service layer functionality
- Component behavior
- Search functionality
- Analytics tracking
- Error handling
- Performance tests

### Integration Tests

```tsx
// Example integration test
import KnowledgeBaseService from '@/services/knowledge-base.service';

test('complete article lifecycle', async () => {
  // Create article
  const article = await KnowledgeBaseService.createArticle({
    title: 'Test Article',
    content: 'Test content'
  }, 'test-user');

  // Get article
  const retrieved = await KnowledgeBaseService.getArticleBySlug(article.slug);
  expect(retrieved.title).toBe('Test Article');

  // Track view
  await KnowledgeBaseService.trackArticleView(article.id);

  // Submit feedback
  await KnowledgeBaseService.submitArticleFeedback(article.id, {
    feedback_type: 'helpful',
    user_id: 'test-user'
  });

  // Update article
  const updated = await KnowledgeBaseService.updateArticle(article.id, {
    title: 'Updated Article'
  });
  expect(updated.title).toBe('Updated Article');
});
```

## ⚡ Performance

### Optimization Features

- **Lazy Loading**: Components load content only when needed
- **Caching**: Search results and content cached for fast access
- **Database Indexing**: Optimized queries with proper indexing
- **Full-Text Search**: PostgreSQL full-text search for fast queries
- **Image Optimization**: Automatic image optimization and CDN delivery

### Performance Metrics

The system is designed to achieve:
- **Search Response**: < 200ms for most queries
- **Page Load**: < 2 seconds for knowledge base pages
- **Mobile Performance**: 95+ Lighthouse scores
- **Database Queries**: Optimized with proper indexing

### Performance Monitoring

```tsx
// Track performance
const startTime = Date.now();
const results = await SmartSearchService.smartSearch(query);
const searchTime = Date.now() - startTime;

if (searchTime > 500) {
  // Log slow search
  console.warn('Slow search detected:', { query, searchTime });
}
```

## 🔒 Security

### Security Features

- **Input Validation**: All inputs sanitized and validated
- **SQL Injection Prevention**: Parameterized queries and ORM usage
- **XSS Protection**: Content sanitization and CSP headers
- **Rate Limiting**: Search and form submission rate limits
- **Authentication**: Row-level security policies in Supabase

### Security Best Practices

```tsx
// Input sanitization
const sanitizedQuery = SmartSearchService.preprocessQuery(userInput);

// Parameterized queries (handled by Supabase)
const results = await supabase
  .from('kb_articles')
  .select('*')
  .eq('id', articleId); // Safe parameterized query

// Content validation
const articleData = validateArticleContent(userInput);
```

### Access Control

The system implements role-based access control:
- **Public Users**: Can view published content
- **Authenticated Users**: Can submit feedback and bookmarks
- **Content Managers**: Can create and edit content
- **Admins**: Full system access and analytics

## 📈 Monitoring and Maintenance

### Health Checks

```tsx
// System health check
const healthCheck = async () => {
  try {
    // Test database connection
    await KnowledgeBaseService.getKBCategories();

    // Test search functionality
    await SmartSearchService.getAutoCompleteSuggestions('test');

    return { status: 'healthy', timestamp: new Date() };
  } catch (error) {
    return { status: 'unhealthy', error, timestamp: new Date() };
  }
};
```

### Content Management

- **Automated Cleanup**: Archive old content automatically
- **Content Review**: Flag content needing updates
- **Performance Alerts**: Notify about underperforming content
- **Backup**: Regular database backups and exports

### Analytics Monitoring

Monitor key metrics:
- **Search Success Rate**: Should be > 80%
- **Content Helpfulness**: Should be > 70%
- **Page Load Time**: Should be < 2 seconds
- **User Engagement**: Track bounce rates and time on page

## 🤝 Contributing

When contributing to the knowledge base system:

1. **Database Changes**: Create migration files for schema changes
2. **Type Safety**: Update TypeScript types for new features
3. **Testing**: Add comprehensive tests for new functionality
4. **Documentation**: Update this README with new features
5. **Performance**: Test performance impact of changes

## 📞 Support

For support with the knowledge base system:

1. **Documentation**: Check this README and code comments
2. **Examples**: See `src/examples/knowledge-base-integration.tsx`
3. **Tests**: Review test files for usage examples
4. **Analytics**: Use built-in analytics for troubleshooting
5. **Logs**: Check browser console and Supabase logs

## 📄 License

This knowledge base system is part of the Mariia Hub platform. See the main project license for details.

---

**Built with ❤️ for the luxury beauty and fitness industry**