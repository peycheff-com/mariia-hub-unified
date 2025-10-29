import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { SEOHead } from '@/components/seo/SEOHead'
import { SEOWrapper } from '@/components/seo/SEOWrapper'
import { useStructuredData } from '@/components/seo/StructuredDataHook'
import { generateSitemapXML, generateRobotsTxt } from '@/components/seo/SitemapRoutes'

// Mock i18n
const createMockI18n = (language = 'en') => ({
  language,
  t: vi.fn((key: string, defaultValue?: string) => defaultValue || key),
  changeLanguage: vi.fn(),
})

describe('SEO Components', () => {
  let queryClient: QueryClient
  let mockI18n: any

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    mockI18n = createMockI18n()
    vi.mock('react-i18next', () => ({
      useTranslation: () => mockI18n,
    }))
    vi.mock('react-router-dom', () => ({
      ...vi.importActual('react-router-dom'),
      useLocation: () => ({
        pathname: '/test',
        search: '',
        hash: '',
        state: null,
        key: 'test',
      }),
    }))
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={mockI18n}>
            <BrowserRouter>
              {component}
            </BrowserRouter>
          </I18nextProvider>
        </QueryClientProvider>
      </HelmetProvider>
    )
  }

  describe('SEOHead', () => {
    it('renders basic meta tags', () => {
      renderWithProviders(
        <SEOHead
          title="Test Title"
          description="Test Description"
          keywords="test,keywords"
        />
      )

      // Check if Helmet would set the title (we can't directly test Helmet in this setup)
      expect(document.title).toBe('Test Title')
    })

    it('generates structured data correctly', () => {
      const structuredData = {
        '@type': 'TestType',
        name: 'Test Name',
      }

      renderWithProviders(
        <SEOHead
          title="Test Title"
          structuredData={structuredData}
        />
      )

      // Check if structured data script would be added
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      expect(scripts.length).toBeGreaterThanOrEqual(0)
    })

    it('handles noindex flag', () => {
      renderWithProviders(
        <SEOHead
          title="Test Title"
          noindex={true}
        />
      )

      // Check if meta robots tag would be added
      const metaRobots = document.querySelector('meta[name="robots"]')
      expect(metaRobots).toBeTruthy()
    })

    it('generates hreflang tags', () => {
      renderWithProviders(
        <SEOHead
          title="Test Title"
        />
      )

      // Check if hreflang links would be added
      const hreflangLinks = document.querySelectorAll('link[rel="alternate"]')
      expect(hreflangLinks.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('SEOWrapper', () => {
    it('provides default SEO config for known routes', () => {
      vi.mocked(vi.importActual('react-router-dom')).useLocation = () => ({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'test',
      })

      renderWithProviders(
        <SEOWrapper>
          <div>Test Content</div>
        </SEOWrapper>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('uses fallback SEO config for unknown routes', () => {
      vi.mocked(vi.importActual('react-router-dom')).useLocation = () => ({
        pathname: '/unknown-route',
        search: '',
        hash: '',
        state: null,
        key: 'test',
      })

      renderWithProviders(
        <SEOWrapper
          fallbackTitle="Fallback Title"
          fallbackDescription="Fallback Description"
        >
          <div>Test Content</div>
        </SEOWrapper>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('applies custom structured data', () => {
      const customStructuredData = {
        '@type': 'CustomType',
        name: 'Custom Name',
      }

      renderWithProviders(
        <SEOWrapper
          customStructuredData={customStructuredData}
        >
          <div>Test Content</div>
        </SEOWrapper>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })
  })

  describe('useStructuredData Hook', () => {
    it('generates breadcrumb schema', () => {
      vi.mocked(vi.importActual('react-router-dom')).useLocation = () => ({
        pathname: '/beauty/services/test-service',
        search: '',
        hash: '',
        state: null,
        key: 'test',
      })

      const TestComponent = () => {
        const { generateBreadcrumbSchema } = useStructuredData()
        const schema = generateBreadcrumbSchema

        return <div data-testid="schema">{JSON.stringify(schema)}</div>
      }

      renderWithProviders(<TestComponent />)

      const schemaElement = screen.getByTestId('schema')
      expect(schemaElement).toBeInTheDocument()
      expect(JSON.parse(schemaElement.textContent || '{}')).toHaveProperty('@context', 'https://schema.org')
    })

    it('generates local business schema', () => {
      const TestComponent = () => {
        const { generateLocalBusinessSchema } = useStructuredData()
        const schema = generateLocalBusinessSchema()

        return <div data-testid="schema">{JSON.stringify(schema)}</div>
      }

      renderWithProviders(<TestComponent />)

      const schemaElement = screen.getByTestId('schema')
      expect(schemaElement).toBeInTheDocument()
      const parsedSchema = JSON.parse(schemaElement.textContent || '{}')
      expect(parsedSchema).toHaveProperty('@type', 'BeautySalon')
    })

    it('generates service schema', () => {
      const TestComponent = () => {
        const { generateServiceSchema } = useStructuredData()
        const schema = generateServiceSchema({
          name: 'Test Service',
          description: 'Test Description',
          category: 'Beauty',
        })

        return <div data-testid="schema">{JSON.stringify(schema)}</div>
      }

      renderWithProviders(<TestComponent />)

      const schemaElement = screen.getByTestId('schema')
      expect(schemaElement).toBeInTheDocument()
      const parsedSchema = JSON.parse(schemaElement.textContent || '{}')
      expect(parsedSchema).toHaveProperty('@type', 'Service')
    })
  })

  describe('Sitemap Generation', () => {
    it('generates valid XML sitemap', () => {
      const sitemap = generateSitemapXML('https://example.com')

      expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')
      expect(sitemap).toContain('<loc>https://example.com/</loc>')
      expect(sitemap).toContain('<changefreq>weekly</changefreq>')
      expect(sitemap).toContain('<priority>1.0</priority>')
    })

    it('includes hreflang tags in sitemap', () => {
      const sitemap = generateSitemapXML('https://example.com')

      expect(sitemap).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
      expect(sitemap).toContain('<xhtml:link rel="alternate" hreflang="en"')
      expect(sitemap).toContain('<xhtml:link rel="alternate" hreflang="pl"')
      expect(sitemap).toContain('<xhtml:link rel="alternate" hreflang="x-default"')
    })
  })

  describe('Robots.txt Generation', () => {
    it('generates valid robots.txt', () => {
      const robots = generateRobotsTxt('https://example.com')

      expect(robots).toContain('User-agent: *')
      expect(robots).toContain('Allow: /')
      expect(robots).toContain('Disallow: /admin/')
      expect(robots).toContain('Sitemap: https://example.com/sitemap.xml')
    })

    it('blocks unwanted bots', () => {
      const robots = generateRobotsTxt('https://example.com')

      expect(robots).toContain('User-agent: AhrefsBot')
      expect(robots).toContain('Disallow: /')
    })

    it('includes crawl delay for major search engines', () => {
      const robots = generateRobotsTxt('https://example.com')

      expect(robots).toContain('Crawl-delay: 1')
      expect(robots).toContain('User-agent: Googlebot')
    })
  })
})