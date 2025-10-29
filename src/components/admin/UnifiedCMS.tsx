import { useState } from "react";
import { Sparkles, Image as ImageIcon, FileText, Grid3x3, HelpCircle } from "lucide-react";

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


const UnifiedCMS = () => {
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);

  const CMSHeader = ({ title, description }: { title: string; description: string }) => (
    <Card className="glass-card border-graphite/20 mb-6">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-2xl font-serif text-pearl mb-2 flex items-center gap-2">
              {title}
            </h3>
            <p className="text-sm text-pearl/70 leading-relaxed">{description}</p>
          </div>
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
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <Card className="glass-card border-graphite/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-champagne/10 rounded-xl">
              <FileText className="w-8 h-8 text-champagne" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-serif text-pearl mb-2">Content Management System</h2>
              <p className="text-pearl/70 leading-relaxed">
                Manage all website content in one place with AI assistance. Organize images, galleries, blog posts, and service information efficiently.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="site-images" className="space-y-6">
        <Card className="glass-card border-graphite/20">
          <CardContent className="pt-6">
            <TabsList className="grid w-full grid-cols-6 bg-cocoa/30 p-1 h-auto">
              <TabsTrigger 
                value="site-images" 
                className="flex-col gap-2 py-3 data-[state=active]:bg-champagne/20 data-[state=active]:text-champagne transition-all"
              >
                <ImageIcon className="w-5 h-5" />
                <span className="text-xs font-medium">Site Images</span>
              </TabsTrigger>
              <TabsTrigger 
                value="media-studio" 
                className="flex-col gap-2 py-3 data-[state=active]:bg-champagne/20 data-[state=active]:text-champagne transition-all"
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-xs font-medium">Media Studio</span>
              </TabsTrigger>
              <TabsTrigger 
                value="gallery" 
                className="flex-col gap-2 py-3 data-[state=active]:bg-champagne/20 data-[state=active]:text-champagne transition-all"
              >
                <Grid3x3 className="w-5 h-5" />
                <span className="text-xs font-medium">Gallery</span>
              </TabsTrigger>
              <TabsTrigger 
                value="blog" 
                className="flex-col gap-2 py-3 data-[state=active]:bg-champagne/20 data-[state=active]:text-champagne transition-all"
              >
                <FileText className="w-5 h-5" />
                <span className="text-xs font-medium">Blog</span>
              </TabsTrigger>
              <TabsTrigger 
                value="service-content" 
                className="flex-col gap-2 py-3 data-[state=active]:bg-champagne/20 data-[state=active]:text-champagne transition-all"
              >
                <FileText className="w-5 h-5" />
                <span className="text-xs font-medium">Content</span>
              </TabsTrigger>
              <TabsTrigger 
                value="faqs" 
                className="flex-col gap-2 py-3 data-[state=active]:bg-champagne/20 data-[state=active]:text-champagne transition-all"
              >
                <HelpCircle className="w-5 h-5" />
                <span className="text-xs font-medium">FAQs</span>
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>
        <TabsContent value="media-studio" className="space-y-4">
          <CMSHeader 
            title="Media Studio" 
            description="Batch-generate hero and gallery images using AI and upload to Storage"
          />
          <MediaStudio />
        </TabsContent>

        <TabsContent value="site-images" className="space-y-4">
          <CMSHeader 
            title="Site Images" 
            description="Manage hero images, profile photos, logos, and other site-wide images"
          />
          <SiteImagesManagement />
        </TabsContent>

        <TabsContent value="gallery" className="space-y-4">
          <CMSHeader 
            title="Service Gallery" 
            description="Manage before/after photos and service showcase images"
          />
          <ServiceGalleryManagement />
        </TabsContent>

        <TabsContent value="blog" className="space-y-4">
          <CMSHeader 
            title="Blog Posts" 
            description="Create and manage blog posts with multilingual support"
          />
          <BlogManagement />
        </TabsContent>

        <TabsContent value="service-content" className="space-y-4">
          <CMSHeader 
            title="Service Content" 
            description="Add preparation instructions, aftercare, and what to expect"
          />
          <ServiceContentManagement />
        </TabsContent>

        <TabsContent value="faqs" className="space-y-4">
          <CMSHeader 
            title="Service FAQs" 
            description="Manage frequently asked questions for each service"
          />
          <ServiceFAQManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedCMS;