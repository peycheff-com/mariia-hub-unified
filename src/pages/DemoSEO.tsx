import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Search, Code, FileText, BarChart3 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/seo/SEOHead';
import { useStructuredData } from '@/components/seo/StructuredDataHook';
import { TranslationAssistant } from '@/components/translations/TranslationAssistant';
import { TranslationManager } from '@/components/translations/TranslationManager';
import { useUrlManager } from '@/lib/seo/urlManager';
import { generateSlug, validateSlug } from '@/lib/seo/slugGenerator';

const DemoSEO: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [demoText, setDemoText] = useState('Book your appointment today for the best beauty treatments in Warsaw');
  const [generatedSlug, setGeneratedSlug] = useState('');
  const [urlInput, setUrlInput] = useState('');

  const { generateBreadcrumbSchema, generateLocalBusinessSchema } = useStructuredData();
  const { getLocalizedUrl, generateServiceUrl, getAlternateUrls } = useUrlManager();

  const breadcrumbSchema = generateBreadcrumbSchema();
  const localBusinessSchema = generateLocalBusinessSchema();

  const handleGenerateSlug = () => {
    const slug = generateSlug(demoText, { lang: i18n.language });
    setGeneratedSlug(slug);
  };

  const handleValidateSlug = () => {
    const validation = validateSlug(generatedSlug);
    console.log('Slug validation:', validation);
  };

  const handleTranslate = (translation: string) => {
    console.log('Selected translation:', translation);
  };

  const structuredDataExample = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "name": "Mariia Hub",
    "description": "Premium beauty and fitness services in Warsaw",
    "url": window.location.origin,
    "telephone": "+48 123 456 789",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "ul. Marszałkowska 123",
      "addressLocality": "Warsaw",
      "addressCountry": "PL"
    },
    "openingHours": "Mo-Fr 09:00-21:00",
    "priceRange": "$$$"
  };

  return (
    <>
      <SEOHead
        title="SEO & Translation Demo - Mariia Hub"
        description="Demo page showcasing SEO optimization and translation management features"
        keywords="SEO, translation, i18n, structured data, hreflang"
        structuredData={structuredDataExample}
      />

      <div className="container mx-auto py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">SEO & Translation System Demo</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore the comprehensive SEO optimization and translation management features implemented in Mariia Hub
          </p>
        </div>

        <Tabs defaultValue="seo" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="seo" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              SEO Features
            </TabsTrigger>
            <TabsTrigger value="structured" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Structured Data
            </TabsTrigger>
            <TabsTrigger value="translation" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Translation
            </TabsTrigger>
            <TabsTrigger value="urls" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              URL Management
            </TabsTrigger>
          </TabsList>

          {/* SEO Features Tab */}
          <TabsContent value="seo" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Hreflang & Canonical Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Current URL</h4>
                    <code className="block p-2 bg-muted rounded text-sm">
                      {window.location.href}
                    </code>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Alternate URLs</h4>
                    <div className="space-y-1">
                      {Object.entries(getAlternateUrls()).map(([lang, url]) => (
                        <div key={lang} className="flex items-center gap-2">
                          <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {lang}
                          </span>
                          <code className="text-sm">{url}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The SEOHead component automatically generates proper hreflang tags and canonical URLs for multilingual SEO.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Meta Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Page Title</h4>
                    <p className="text-sm text-muted-foreground">
                      Dynamically generated titles with language support
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Meta Description</h4>
                    <p className="text-sm text-muted-foreground">
                      Optimized descriptions for search engines
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Open Graph Tags</h4>
                    <p className="text-sm text-muted-foreground">
                      Social media sharing optimization
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => console.log('Check console for meta tags')}
                  >
                    View Meta Tags (Console)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Structured Data Tab */}
          <TabsContent value="structured" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Schema.org Structured Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Breadcrumb Schema</h4>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                      {JSON.stringify(breadcrumbSchema, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Local Business Schema</h4>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                      {JSON.stringify(localBusinessSchema, null, 2)}
                    </pre>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Structured data helps search engines understand your content better and can result in rich snippets in search results.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Schema Example</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                  {JSON.stringify(structuredDataExample, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Translation Tab */}
          <TabsContent value="translation" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <TranslationAssistant
                sourceText={demoText}
                onTranslationSelect={handleTranslate}
                context="Booking call-to-action button"
                category="booking"
              />

              <Card>
                <CardHeader>
                  <CardTitle>Translation Manager</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Full translation management system with memory, workflow, and analytics.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => window.open('/admin/translations', '_blank')}
                  >
                    Open Translation Manager
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Translation Memory Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <TranslationManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* URL Management Tab */}
          <TabsContent value="urls" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Slug Generator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block" htmlFor="input-text">Input Text</label>
                    <input
                      type="text"
                      value={demoText}
                      onChange={(e) => setDemoText(e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Enter text to generate slug"
                    />
                  </div>
                  <Button onClick={handleGenerateSlug}>Generate Slug</Button>
                  {generatedSlug && (
                    <div>
                      <label className="text-sm font-medium mb-2 block" htmlFor="generated-slug">Generated Slug</label>
                      <code className="block p-2 bg-muted rounded">
                        {generatedSlug}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={handleValidateSlug}
                      >
                        Validate Slug
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>URL Manager</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block" htmlFor="service-url-generator">Service URL Generator</label>
                    <p className="text-sm text-muted-foreground">
                      Example: {generateServiceUrl('svc-123', 'Premium Lip Enhancement', 'beauty')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block" htmlFor="localized-urls">Localized URLs</label>
                    <div className="space-y-1">
                      <code className="block text-sm p-2 bg-muted rounded">
                        EN: {getLocalizedUrl('/beauty/lips-enhancement', 'en')}
                      </code>
                      <code className="block text-sm p-2 bg-muted rounded">
                        PL: {getLocalizedUrl('/beauty/lips-enhancement', 'pl')}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>404 Handler Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Automatic redirects for common misspellings</li>
                  <li>• Smart suggestions based on URL path</li>
                  <li>• Search functionality to find content</li>
                  <li>• Analytics tracking for 404 errors</li>
                  <li>• Option to report broken links</li>
                </ul>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.open('/non-existent-page', '_blank')}
                >
                  Test 404 Page
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default DemoSEO;