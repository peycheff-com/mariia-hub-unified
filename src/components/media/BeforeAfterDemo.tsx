import React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

import { BeforeAfterImages } from './BeforeAfterSlider'

import { BeforeAfterSlider, BeforeAfterGallery } from './index'

// Sample data for demonstration
const sampleImages: BeforeAfterImages[] = [
  {
    id: '1',
    beforeImage: 'https://images.unsplash.com/photo-1596461402266-10c7766c5ba7?w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1596461402266-10c7766c5ba7?w=800&q=80&auto=format&fit=crop',
    beforeLabel: 'Before Treatment',
    afterLabel: 'After Treatment',
    title: 'Lip Enhancement Transformation',
    description: 'Beautiful lip enhancement procedure with natural-looking results. Patient experienced increased confidence and satisfaction with the subtle yet effective enhancement.',
    date: '2024-01-15',
    tags: ['lips', 'enhancement', 'cosmetic']
  },
  {
    id: '2',
    beforeImage: 'https://images.unsplash.com/photo-1596461402266-10c7766c5ba7?w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1596461402266-10c7766c5ba7?w=800&q=80&auto=format&fit=crop',
    beforeLabel: 'Before',
    afterLabel: 'After',
    title: 'Eyebrow Lamination Results',
    description: 'Complete eyebrow transformation using advanced lamination techniques. Achieved fuller, more defined eyebrows that frame the face beautifully.',
    date: '2024-01-20',
    tags: ['eyebrows', 'lamination', 'transformation']
  },
  {
    id: '3',
    beforeImage: 'https://images.unsplash.com/photo-1596461402266-10c7766c5ba7?w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1596461402266-10c7766c5ba7?w=800&q=80&auto=format&fit=crop',
    beforeLabel: 'Before',
    afterLabel: 'After',
    title: 'Complete Facial Rejuvenation',
    description: 'Comprehensive facial treatment combining multiple procedures for dramatic results. Shows significant improvement in skin texture and appearance.',
    date: '2024-02-01',
    tags: ['facial', 'rejuvenation', 'comprehensive']
  },
  {
    id: '4',
    beforeImage: 'https://images.unsplash.com/photo-1596461402266-10c7766c5ba7?w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1596461402266-10c7766c5ba7?w=800&q=80&auto=format&fit=crop',
    beforeLabel: 'Before',
    afterLabel: 'After',
    title: 'Fitness Body Transformation',
    description: '12-week body transformation program showing impressive muscle definition and weight loss results. Dedicated fitness and nutrition plan.',
    date: '2024-02-15',
    tags: ['fitness', 'body', 'transformation', 'weight-loss']
  },
  {
    id: '5',
    beforeImage: 'https://images.unsplash.com/photo-1596461402266-10c7766c5ba7?w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1596461402266-10c7766c5ba7?w=800&q=80&auto=format&fit=crop',
    beforeLabel: 'Before',
    afterLabel: 'After',
    title: 'PMU Lips Enhancement',
    description: 'Permanent makeup procedure for lips with natural color enhancement. Long-lasting results with minimal maintenance required.',
    date: '2024-02-20',
    tags: ['pmu', 'lips', 'permanent-makeup']
  }
]

// Single image for basic slider demo
const singleImage: BeforeAfterImages = {
  id: 'demo-1',
  beforeImage: 'https://images.unsplash.com/photo-1596461402266-10c7766c5ba7?w=800&q=80',
  afterImage: 'https://images.unsplash.com/photo-1596461402266-10c7766c5ba7?w=800&q=80&auto=format&fit=crop',
  beforeLabel: 'Before Treatment',
  afterLabel: 'After Treatment',
  title: 'Premium Beauty Enhancement',
  description: 'Professional beauty treatment with exceptional results',
  date: '2024-01-15',
  tags: ['beauty', 'premium', 'transformation']
}

export const BeforeAfterDemo: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cocoa-600 to-champagne-600 bg-clip-text text-transparent">
          Before & After Components
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Interactive before/after photo comparison components with zoom, gallery view, and mobile optimization
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge variant="secondary">Touch Optimized</Badge>
          <Badge variant="secondary">Zoom & Pan</Badge>
          <Badge variant="secondary">Gallery View</Badge>
          <Badge variant="secondary">Keyboard Navigation</Badge>
          <Badge variant="secondary">C2PA Verified</Badge>
        </div>
      </div>

      {/* Demo Tabs */}
      <Tabs defaultValue="slider" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="slider">Basic Slider</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Features</TabsTrigger>
          <TabsTrigger value="gallery">Gallery View</TabsTrigger>
        </TabsList>

        {/* Basic Slider Demo */}
        <TabsContent value="slider" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Before/After Slider</CardTitle>
              <p className="text-sm text-muted-foreground">
                Simple drag-to-compare interface with essential controls
              </p>
            </CardHeader>
            <CardContent>
              <BeforeAfterSlider
                images={singleImage}
                showLabels={true}
                showControls={true}
                showProgress={true}
                allowDownload={true}
                allowShare={true}
                className="max-w-4xl mx-auto"
                onSliderChange={(position) => {
                  console.log('Slider position:', position)
                }}
              />
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Minimal Version</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Clean interface with just the essential comparison functionality
                </p>
              </CardHeader>
              <CardContent>
                <BeforeAfterSlider
                  images={singleImage}
                  showLabels={false}
                  showControls={false}
                  showProgress={false}
                  className="max-w-2xl mx-auto"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>With Authenticity Badge</CardTitle>
                <p className="text-sm text-muted-foreground">
                  C2PA verification for enhanced trust and transparency
                </p>
              </CardHeader>
              <CardContent>
                <BeforeAfterSlider
                  images={singleImage}
                  showLabels={true}
                  showControls={true}
                  c2paVerified={true}
                  authenticityInfo={{
                    verified: true,
                    manifestId: 'c2pa-manifest-12345678',
                    verificationDate: '2024-01-16T10:30:00Z'
                  }}
                  className="max-w-2xl mx-auto"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced Features Demo */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Features Showcase</CardTitle>
              <p className="text-sm text-muted-foreground">
                All features enabled including zoom, fullscreen, and multiple image sets
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Drag to Compare</Badge>
                  <Badge variant="outline">Click to Position</Badge>
                  <Badge variant="outline">Double-tap to Reset</Badge>
                  <Badge variant="outline">Pinch to Zoom</Badge>
                  <Badge variant="outline">Pan when Zoomed</Badge>
                  <Badge variant="outline">Keyboard Navigation</Badge>
                  <Badge variant="outline">Fullscreen Mode</Badge>
                  <Badge variant="outline">Download & Share</Badge>
                </div>

                <BeforeAfterSlider
                  images={sampleImages.slice(0, 3)}
                  showLabels={true}
                  showControls={true}
                  showThumbnails={true}
                  showProgress={true}
                  allowDownload={true}
                  allowShare={true}
                  className="max-w-5xl mx-auto"
                  onSliderChange={(position) => {
                    console.log('Advanced slider position:', position)
                  }}
                  onImageChange={(index) => {
                    console.log('Advanced image index:', index)
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mobile-Optimized Experience</CardTitle>
              <p className="text-sm text-muted-foreground">
                Touch gestures and responsive design for mobile devices
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Touch Gestures</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Single finger drag: Move slider</li>
                      <li>• Single finger pan: Move when zoomed</li>
                      <li>• Double tap: Reset zoom</li>
                      <li>• Pinch: Zoom in/out</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Keyboard Controls</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Arrow keys: Navigate images</li>
                      <li>• +/-: Zoom in/out</li>
                      <li>• Escape: Exit fullscreen/zoom</li>
                      <li>• Tab: Navigate controls</li>
                    </ul>
                  </div>
                </div>

                <BeforeAfterSlider
                  images={singleImage}
                  showLabels={true}
                  showControls={true}
                  showProgress={true}
                  className="max-w-3xl mx-auto aspect-video"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gallery Demo */}
        <TabsContent value="gallery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Gallery</CardTitle>
              <p className="text-sm text-muted-foreground">
                Complete gallery experience with filtering, search, and grid/list views
              </p>
            </CardHeader>
            <CardContent>
              <BeforeAfterGallery
                images={sampleImages}
                categories={['beauty', 'fitness', 'cosmetic', 'transformation']}
                tags={['lips', 'eyebrows', 'facial', 'fitness', 'pmu']}
                layout="grid"
                showFilters={true}
                showSearch={true}
                showStats={true}
                allowFavorites={true}
                defaultView="grid"
                itemsPerPage={6}
                onImageSelect={(image, index) => {
                  console.log('Selected image:', image.title, 'Index:', index)
                }}
                onFavorite={(imageId, isFavorite) => {
                  console.log('Image', imageId, isFavorite ? 'favorited' : 'unfavorited')
                }}
              />
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>List View</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Detailed list layout with more information per item
                </p>
              </CardHeader>
              <CardContent>
                <BeforeAfterGallery
                  images={sampleImages.slice(0, 3)}
                  layout="list"
                  showFilters={false}
                  showSearch={false}
                  showStats={false}
                  allowFavorites={true}
                  itemsPerPage={3}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Masonry View</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Pinterest-style layout with varying aspect ratios
                </p>
              </CardHeader>
              <CardContent>
                <BeforeAfterGallery
                  images={sampleImages.slice(0, 4)}
                  layout="masonry"
                  showFilters={false}
                  showSearch={false}
                  showStats={false}
                  allowFavorites={true}
                  itemsPerPage={4}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Comprehensive set of features for professional before/after showcases
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-primary">Core Features</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Smooth drag-to-compare interaction</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Touch gesture support for mobile</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Zoom and pan functionality</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Fullscreen viewing mode</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Progress indicator</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-primary">Gallery Features</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Multiple layout options</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Advanced filtering and search</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Category and tag management</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Favorite/bookmark system</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>View statistics and analytics</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-primary">Technical Features</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Lazy loading for performance</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>WebP image format support</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Keyboard navigation</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>C2PA authenticity verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Share and download functionality</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Usage Examples</CardTitle>
          <p className="text-sm text-muted-foreground">
            Simple code examples to get you started
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Basic Slider</h4>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`<BeforeAfterSlider
  images={{
    id: '1',
    beforeImage: '/before.jpg',
    afterImage: '/after.jpg',
    title: 'Transformation',
    description: 'Amazing results'
  }}
  showControls={true}
  showLabels={true}
/>`}
              </pre>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Gallery with Multiple Images</h4>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`<BeforeAfterGallery
  images={transformations}
  layout="grid"
  showFilters={true}
  allowFavorites={true}
  onImageSelect={(image, index) => {
    console.log('Selected:', image.title)
  }}
/>`}
              </pre>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">With C2PA Verification</h4>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`<BeforeAfterSlider
  images={image}
  c2paVerified={true}
  authenticityInfo={{
    verified: true,
    manifestId: 'c2pa-123456',
    verificationDate: '2024-01-16'
  }}
/>`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}