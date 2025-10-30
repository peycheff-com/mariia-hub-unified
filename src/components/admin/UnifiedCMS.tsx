import React, { useState, memo } from "react";
import { Sparkles, Image as ImageIcon, FileText, Grid3x3, HelpCircle, BarChart3, Calendar, Globe, Target, TrendingUp, Users, Zap } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import SiteImagesManagement from "./SiteImagesManagement";
import ServiceGalleryManagement from "./ServiceGalleryManagement";
import BlogManagement from "./BlogManagement";
import ServiceContentManagement from "./ServiceContentManagement";
import ServiceFAQManagement from "./ServiceFAQManagement";
import AIContentGenerator from "./AIContentGenerator";
import MediaStudio from "./MediaStudio";
import RichTextEditor from "./content/RichTextEditor";
import ContentWorkflow from "./content/ContentWorkflow";
import AdvancedMediaManager from "./content/AdvancedMediaManager";
import ContentPerformanceDashboard from "./content/ContentPerformanceDashboard";
import AIContentOptimizer from "./content/AIContentOptimizer";
import { ContentManagementDashboard } from "./content/ContentManagementDashboard";
import { AITemplateManager } from "./content/AITemplateManager";
import { ContentScheduler } from "./content/ContentScheduler";
import { AIQualityScorer } from "./content/AIQualityScorer";
import { AITranslationTool } from "./content/AITranslationTool";
import { SEOOptimizer } from "./content/SEOOptimizer";
import { BlogAutomator } from "./content/BlogAutomator";


const UnifiedCMS = () => {
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);

  const CMSHeader = ({ title, description, showAIButton = true }: {
    title: string;
    description: string;
    showAIButton?: boolean;
  }) => (
    <Card className="glass-card border-graphite/20 mb-6">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-2xl font-serif text-pearl mb-2 flex items-center gap-2">
              {title}
            </h3>
            <p className="text-sm text-pearl/70 leading-relaxed">{description}</p>
          </div>
          {showAIButton && (
            <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 hover-scale">
                  <Sparkles className="w-4 h-4" />
                  AI Assistant
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-charcoal/95 backdrop-blur-xl border-graphite/20">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-pearl">
                    <Sparkles className="w-5 h-5 text-champagne" />
                    AI Content Generator
                  </DialogTitle>
                </DialogHeader>
                <AIContentGenerator />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="glass-card border-graphite/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-champagne/10 rounded-xl">
              <FileText className="w-8 h-8 text-champagne" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-serif text-pearl mb-2">World-Class Content Management System</h2>
              <p className="text-pearl/70 leading-relaxed">
                Premium content management with AI-powered tools, advanced workflow automation, and comprehensive analytics. Create, manage, and optimize world-class content for your beauty and fitness business.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main CMS Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <Card className="glass-card border-graphite/20">
          <CardContent className="pt-6">
            <TabsList className="grid w-full grid-cols-4 bg-cocoa/30 p-1 h-auto mb-4">
              <TabsTrigger
                value="dashboard"
                className="flex-col gap-2 py-3 data-[state=active]:bg-champagne/20 data-[state=active]:text-champagne transition-all"
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs font-medium">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger
                value="content"
                className="flex-col gap-2 py-3 data-[state=active]:bg-champagne/20 data-[state=active]:text-champagne transition-all"
              >
                <FileText className="w-5 h-5" />
                <span className="text-xs font-medium">Content</span>
              </TabsTrigger>
              <TabsTrigger
                value="media"
                className="flex-col gap-2 py-3 data-[state=active]:bg-champagne/20 data-[state=active]:text-champagne transition-all"
              >
                <ImageIcon className="w-5 h-5" alt="Image" />
                <span className="text-xs font-medium">Media</span>
              </TabsTrigger>
              <TabsTrigger
                value="advanced"
                className="flex-col gap-2 py-3 data-[state=active]:bg-champagne/20 data-[state=active]:text-champagne transition-all"
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-xs font-medium">AI Tools</span>
              </TabsTrigger>
            </TabsList>

            {/* Sub-tabs for Content section */}
            <Tabs defaultValue="workflow" className="space-y-4">
              <div className="hidden" data-tab-content="content">
                <TabsList className="grid w-full grid-cols-4 bg-cocoa/20 p-1 h-auto">
                  <TabsTrigger value="workflow" className="text-xs data-[state=active]:bg-champagne/20">
                    Workflow
                  </TabsTrigger>
                  <TabsTrigger value="blog" className="text-xs data-[state=active]:bg-champagne/20">
                    Blog
                  </TabsTrigger>
                  <TabsTrigger value="services" className="text-xs data-[state=active]:bg-champagne/20">
                    Services
                  </TabsTrigger>
                  <TabsTrigger value="faqs" className="text-xs data-[state=active]:bg-champagne/20">
                    FAQs
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="hidden" data-tab-content="media">
                <TabsList className="grid w-full grid-cols-3 bg-cocoa/20 p-1 h-auto">
                  <TabsTrigger value="studio" className="text-xs data-[state=active]:bg-champagne/20">
                    Studio
                  </TabsTrigger>
                  <TabsTrigger value="images" className="text-xs data-[state=active]:bg-champagne/20">
                    Images
                  </TabsTrigger>
                  <TabsTrigger value="gallery" className="text-xs data-[state=active]:bg-champagne/20">
                    Gallery
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="hidden" data-tab-content="advanced">
                <TabsList className="grid w-full grid-cols-4 bg-cocoa/20 p-1 h-auto">
                  <TabsTrigger value="optimizer" className="text-xs data-[state=active]:bg-champagne/20">
                    Optimizer
                  </TabsTrigger>
                  <TabsTrigger value="templates" className="text-xs data-[state=active]:bg-champagne/20">
                    Templates
                  </TabsTrigger>
                  <TabsTrigger value="scheduler" className="text-xs data-[state=active]:bg-champagne/20">
                    Scheduler
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="text-xs data-[state=active]:bg-champagne/20">
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Dashboard Content */}
        <TabsContent value="dashboard" className="space-y-4">
          <CMSHeader
            title="Content Management Dashboard"
            description="Comprehensive overview of your content ecosystem with performance metrics and insights"
            showAIButton={false}
          />
          <ContentManagementDashboard />
        </TabsContent>

        {/* Content Workflow */}
        <TabsContent value="content" className="space-y-4">
          <Tabs defaultValue="workflow" className="space-y-4">
            <TabsContent value="workflow">
              <CMSHeader
                title="Content Workflow Management"
                description="Advanced approval workflow with version control, collaboration, and scheduling automation"
                showAIButton={true}
              />
              <ContentWorkflow />
            </TabsContent>

            <TabsContent value="blog">
              <CMSHeader
                title="Blog Management"
                description="Create and manage blog posts with multilingual support and SEO optimization"
              />
              <BlogManagement />
            </TabsContent>

            <TabsContent value="services">
              <CMSHeader
                title="Service Content Management"
                description="Detailed service information with preparation guides and aftercare instructions"
              />
              <ServiceContentManagement />
            </TabsContent>

            <TabsContent value="faqs">
              <CMSHeader
                title="FAQ Management"
                description="Comprehensive FAQ system with smart categorization and search optimization"
              />
              <ServiceFAQManagement />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Media Management */}
        <TabsContent value="media" className="space-y-4">
          <Tabs defaultValue="studio" className="space-y-4">
            <TabsContent value="studio">
              <CMSHeader
                title="AI Media Studio"
                description="Generate and optimize media with AI-powered tools and advanced editing capabilities"
              />
              <MediaStudio />
            </TabsContent>

            <TabsContent value="images">
              <CMSHeader
                title="Advanced Media Manager"
                description="Comprehensive media library with video support, optimization, and CDN integration"
              />
              <AdvancedMediaManager />
            </TabsContent>

            <TabsContent value="gallery">
              <CMSHeader
                title="Service Gallery"
                description="Showcase your work with before/after photos and client testimonials"
              />
              <ServiceGalleryManagement />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Advanced AI Tools */}
        <TabsContent value="advanced" className="space-y-4">
          <Tabs defaultValue="optimizer" className="space-y-4">
            <TabsContent value="optimizer">
              <CMSHeader
                title="AI Content Optimizer"
                description="Advanced AI-powered content optimization with real-time suggestions and quality scoring"
              />
              <AIContentOptimizer />
            </TabsContent>

            <TabsContent value="templates">
              <CMSHeader
                title="AI Template Manager"
                description="Smart content templates with AI-powered customization and industry best practices"
              />
              <AITemplateManager />
            </TabsContent>

            <TabsContent value="scheduler">
              <CMSHeader
                title="Content Scheduler"
                description="Automated content publishing with optimal timing and audience targeting"
              />
              <ContentScheduler />
            </TabsContent>

            <TabsContent value="analytics">
              <CMSHeader
                title="Content Performance Analytics"
                description="Deep insights into content performance, user engagement, and conversion metrics"
              />
              <ContentPerformanceDashboard />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default memo(UnifiedCMS);