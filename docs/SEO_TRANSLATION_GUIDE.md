# SEO Optimization & Translation System Guide

This guide documents the comprehensive SEO optimization and translation management system implemented in Mariia Hub.

## Features Overview

### 1. SEO Optimization

#### Hreflang & Canonical Tags
- Automatic generation of hreflang tags for multilingual SEO
- Canonical URL management to prevent duplicate content issues
- Support for language-specific URLs with proper alternate links

#### Structured Data (Schema.org)
- Local Business schema for beauty and fitness services
- Service schema for individual treatments
- Breadcrumb schema for navigation context
- FAQ schema for common questions
- Article schema for blog posts
- Product schema for e-commerce items

#### Meta Tags Optimization
- Dynamic title generation with localization
- Meta descriptions optimized for search engines
- Open Graph tags for social media sharing
- Twitter Card tags for better social previews
- Robots meta for crawl control

#### URL Management
- SEO-friendly slug generation with Polish character support
- Localized URL generation for multiple languages
- Automatic URL validation and cleanup
- 404 handling with smart suggestions

### 2. Translation Memory System

#### Translation Memory (TM)
- Store and reuse translated segments
- Fuzzy matching with similarity scoring
- Usage tracking and statistics
- Quality assessment and approval workflow

#### Translation Workflow
- Project-based translation management
- Task assignment and tracking
- Review and approval process
- Progress monitoring

#### Translation Assistant
- Real-time TM suggestions
- Custom translation input
- Quality scoring
- Context-aware matching

## Implementation Details

### Core Components

#### SEOHead Component
```typescript
import { SEOHead } from '@/components/seo/SEOHead';

<SEOHead
  title="Page Title"
  description="Page description"
  keywords="keyword1, keyword2"
  ogImage="/image.jpg"
  structuredData={schemaObject}
/>
```

#### Structured Data Hook
```typescript
import { useStructuredData } from '@/components/seo/StructuredDataHook';

const { generateLocalBusinessSchema, generateServiceSchema } = useStructuredData();
```

#### URL Manager Hook
```typescript
import { useUrlManager } from '@/lib/seo/urlManager';

const { getLocalizedUrl, generateServiceUrl } = useUrlManager();
```

#### Translation Assistant
```typescript
import { TranslationAssistant } from '@/components/translations/TranslationAssistant';

<TranslationAssistant
  sourceText="Text to translate"
  onTranslationSelect={setTranslation}
  sourceLang="en"
  targetLang="pl"
/>
```

### Database Schema

#### Translation Memory Tables
- `translation_memory`: Stores translated segments
- `translation_projects`: Manages translation projects
- `translation_tasks`: Individual translation units
- `translations`: Submitted translations
- `translation_comments`: Review comments
- `translation_history`: Change tracking

### Slug Generation

#### Generate SEO-friendly Slugs
```typescript
import { generateSlug } from '@/lib/seo/slugGenerator';

const slug = generateSlug("Premium Beauty Treatment", {
  lang: 'pl',
  maxLength: 50
});
// Returns: "premium-beauty-treatment"
```

#### Validate Slugs
```typescript
import { validateSlug } from '@/lib/seo/slugGenerator';

const validation = validateSlug(slug);
// Returns: { valid: true, errors: [] }
```

## Usage Examples

### Adding SEO to a Page

```typescript
import { SEOHead } from '@/components/seo/SEOHead';
import { useStructuredData } from '@/components/seo/StructuredDataHook';

const BeautyServicePage = () => {
  const { generateServiceSchema } = useStructuredData();

  const schema = generateServiceSchema({
    name: "Lip Enhancement",
    description: "Premium lip enhancement treatment",
    price: 299,
    duration: 60,
    category: "beauty"
  });

  return (
    <>
      <SEOHead
        title="Lip Enhancement - Mariia Hub"
        description="Premium lip enhancement treatment in Warsaw"
        keywords="lips, enhancement, beauty, warsaw"
        structuredData={schema}
      />
      {/* Page content */}
    </>
  );
};
```

### Setting up Translation

```typescript
import { TranslationAssistant } from '@/components/translations/TranslationAssistant';

const AdminTranslationView = () => {
  const [text, setText] = useState('');

  return (
    <TranslationAssistant
      sourceText={text}
      onTranslationSelect={(translation) => {
        console.log('Selected:', translation);
      }}
      context="Service description"
      category="beauty"
    />
  );
};
```

## Demo Page

Visit `/demo/seo` to see all features in action:
- SEO tags generation
- Structured data examples
- Translation memory interface
- URL management tools
- 404 handler demonstration

## Best Practices

### SEO
1. Always include relevant structured data
2. Use descriptive titles and meta descriptions
3. Implement proper hreflang for multilingual sites
4. Generate SEO-friendly URLs
5. Handle 404 errors gracefully

### Translation
1. Maintain consistent terminology
2. Provide context for translators
3. Review and approve translations
4. Track quality metrics
5. Leverage translation memory

## Configuration

### Environment Variables
```env
VITE_DEFAULT_LOCALE=en
VITE_SUPPORTED_LOCALES=en,pl
VITE_SITE_URL=https://mariiahub.com
```

### i18n Configuration
```typescript
// i18n config
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['en', 'pl'],
    // ... other config
  });
```

## Performance Considerations

- SEO components are lightweight and have minimal impact
- Translation memory is cached for fast lookups
- Structured data is generated client-side
- Slug generation is optimized for performance

## Future Enhancements

1. **AI-Powered Translation**
   - Integration with translation APIs
   - Auto-suggestion features
   - Quality scoring improvements

2. **Advanced SEO Features**
   - Automatic sitemap generation
   - Robots.txt management
   - Core Web Vitals monitoring

3. **Translation Analytics**
   - Translation quality metrics
   - Translator performance tracking
   - Cost analysis

## Support

For questions or issues:
1. Check the demo page at `/demo/seo`
2. Review component documentation
3. Contact the development team

---

This system provides a comprehensive solution for SEO optimization and translation management, ensuring the Mariia Hub platform is well-optimized for search engines and supports multilingual content effectively.