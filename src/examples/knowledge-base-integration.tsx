import React from 'react';
import KnowledgeBaseHome from '@/components/knowledge-base/KnowledgeBaseHome';
import ArticleViewer from '@/components/knowledge-base/ArticleViewer';
import FAQSection from '@/components/knowledge-base/FAQSection';
import SupportIntegration from '@/components/knowledge-base/SupportIntegration';
import KBWidget from '@/components/knowledge-base/KBWidget';
import KBDashboard from '@/components/admin/knowledge-base/KBDashboard';

/**
 * Example: How to integrate the Knowledge Base system into your application
 *
 * This file demonstrates various ways to use the knowledge base components
 * throughout your beauty and fitness platform.
 */

// 1. Main Knowledge Base Page
export const KnowledgeBasePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <KnowledgeBaseHome />
    </div>
  );
};

// 2. Article Viewer Page
export const ArticlePage: React.FC<{ slug: string }> = ({ slug }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <ArticleViewer slug={slug} />
    </div>
  );
};

// 3. Service Page with Embedded FAQ
export const ServicePage: React.FC<{ serviceId: string; serviceType: 'beauty' | 'fitness' }> = ({
  serviceId,
  serviceType
}) => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Service details section */}
      <section className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Service Details</h1>
        <p className="text-lg text-gray-600 mb-8">
          Service description and booking information...
        </p>
      </section>

      {/* Embedded FAQ Section */}
      <section className="mb-12">
        <FAQSection
          serviceId={serviceId}
          serviceType={serviceType}
          showSearch={true}
          showCategories={false}
          interactive={true}
        />
      </section>

      {/* Support Integration */}
      <section>
        <SupportIntegration
          context="service"
          serviceId={serviceId}
          serviceType={serviceType}
          showContactForm={true}
          onContactSupport={(message, context) => {
            // Handle support ticket creation
            console.log('Support request:', message, context);
          }}
        />
      </section>
    </div>
  );
};

// 4. Booking Page with Context-Aware Help
export const BookingPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Booking wizard */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Book Your Appointment</h1>
        {/* Booking steps would go here */}
      </section>

      {/* Context-aware help widget */}
      <div className="fixed bottom-4 right-4">
        <SupportIntegration
          context="booking"
          compact={true}
          showContactForm={true}
          onContactSupport={(message, context) => {
            // Create support ticket for booking issues
            console.log('Booking support:', message, context);
          }}
        />
      </div>
    </div>
  );
};

// 5. Admin Dashboard
export const AdminDashboard: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your knowledge base content</p>
      </div>

      <KBDashboard userRole="admin" />
    </div>
  );
};

// 6. Global Website Widget
export const WebsiteLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen">
      {/* Header and Navigation */}
      <header role="banner" className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <nav aria-label="Main navigation" className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-blue-600">mariiaborysevych</h1>
              <div className="flex gap-6">
                <a href="/services" className="text-gray-700 hover:text-blue-600">Services</a>
                <a href="/booking" className="text-gray-700 hover:text-blue-600">Book</a>
                <a href="/knowledge-base" className="text-gray-700 hover:text-blue-600">Help</a>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main role="main">{children}</main>

      {/* Global Knowledge Base Widget */}
      <KBWidget
        position="bottom-right"
        theme="light"
        size="medium"
        showCategories={true}
        defaultOpen={false}
        context={{
          page: typeof window !== 'undefined' ? window.location.pathname : '/',
          tags: ['help', 'support'],
        }}
      />

      {/* Footer */}
      <footer role="contentinfo" className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="/knowledge-base" className="hover:text-blue-400">Knowledge Base</a></li>
                <li><a href="/contact" className="hover:text-blue-400">Contact Support</a></li>
                <li><a href="/faq" className="hover:text-blue-400">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2">
                <li><a href="/beauty" className="hover:text-blue-400">Beauty Services</a></li>
                <li><a href="/fitness" className="hover:text-blue-400">Fitness Programs</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="/help" className="hover:text-blue-400">Get Help</a></li>
                <li><a href="/contact" className="hover:text-blue-400">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="/about" className="hover:text-blue-400">About Us</a></li>
                <li><a href="/privacy" className="hover:text-blue-400">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// 7. FAQ Dedicated Page
export const FAQPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600">
            Quick answers to common questions about our services
          </p>
        </div>

        <FAQSection
          showSearch={true}
          showCategories={true}
          interactive={true}
        />
      </div>
    </div>
  );
};

// 8. Beauty Services Page with Integrated Help
export const BeautyServicesPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Beauty Services</h1>
        <p className="text-gray-600 mb-8">
          Professional beauty treatments and services
        </p>
      </div>

      {/* Service Categories */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
        {/* Service cards would go here */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Lip Enhancements</h3>
          <p className="text-gray-600 mb-4">Professional lip treatments...</p>
          <Button className="w-full">Learn More</Button>
        </div>
      </div>

      {/* Beauty-specific FAQ Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Beauty Services FAQ</h2>
        <FAQSection
          serviceType="beauty"
          showSearch={false}
          showCategories={true}
          limit={10}
        />
      </section>

      {/* Support Integration */}
      <section>
        <SupportIntegration
          context="service"
          serviceType="beauty"
          compact={false}
          showContactForm={true}
        />
      </section>
    </div>
  );
};

// 9. Error Page with Help Suggestions
export const ErrorPage: React.FC<{ error?: string }> = ({ error = "Page not found" }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Oops!</h1>
        <p className="text-xl text-gray-600 mb-8">{error}</p>

        <div className="space-y-4">
          <p className="text-gray-600">Can't find what you're looking for?</p>

          {/* Help suggestions */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold mb-4">Try these helpful resources:</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <HelpCircle className="h-4 w-4 mr-2" />
                Browse Knowledge Base
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Search className="h-4 w-4 mr-2" />
                Search for Help
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>

          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

// 10. Contact Page with KB Integration
export const ContactPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600">
            We're here to help! Find answers below or get in touch.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Form */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Send us a message</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="name">Name</label>
                <input type="text" className="w-full p-3 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="email">Email</label>
                <input type="email" className="w-full p-3 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="message">Message</label>
                <textarea className="w-full p-3 border rounded-lg" rows={6} />
              </div>
              <Button className="w-full">Send Message</Button>
            </form>
          </section>

          {/* Help Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Quick Help</h2>

            {/* Compact FAQ Section */}
            <FAQSection
              limit={5}
              showSearch={true}
              showCategories={false}
              compact={true}
            />

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">Still need help?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Our support team is available to assist you.
              </p>
              <div className="flex gap-2">
                <Button size="sm">Start Live Chat</Button>
                <Button variant="outline" size="sm">Email Support</Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

/**
 * Usage Examples:
 *
 * 1. Import the components you need:
 *    import { KnowledgeBasePage, FAQSection, SupportIntegration } from './examples/knowledge-base-integration';
 *
 * 2. Use them in your router:
 *    <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
 *    <Route path="/kb/:slug" element={<ArticlePage />} />
 *
 * 3. Add the global widget to your layout:
 *    <WebsiteLayout>
 *      <YourApp />
 *    </WebsiteLayout>
 *
 * 4. Add context-aware help to specific pages:
 *    <ServicePage serviceId="123" serviceType="beauty" />
 *
 * 5. Include admin dashboard for content management:
 *    <AdminDashboard />
 */