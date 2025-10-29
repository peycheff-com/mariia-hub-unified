# Before & After Media Components

A comprehensive suite of React components for showcasing before/after transformations with advanced interaction features, mobile optimization, and gallery functionality.

## Features

### Core Components

- **BeforeAfterSlider** - Interactive before/after comparison slider
- **BeforeAfterGallery** - Complete gallery with filtering and search
- **BeforeAfterDemo** - Comprehensive demo showcasing all features

### Key Features

- ✅ **Touch Optimized** - Full mobile gesture support
- ✅ **Zoom & Pan** - Click to zoom, pinch to zoom, pan when zoomed
- ✅ **Keyboard Navigation** - Full keyboard accessibility
- ✅ **Lazy Loading** - Optimized image loading with WebP support
- ✅ **Gallery View** - Multiple images with thumbnails and navigation
- ✅ **Filtering & Search** - Advanced filtering capabilities
- ✅ **C2PA Verification** - Authenticity verification support
- ✅ **Responsive Design** - Works perfectly on all devices
- ✅ **Accessibility** - WCAG AA compliant
- ✅ **Performance** - 60fps animations and smooth interactions

## Installation

The components use these dependencies:

```bash
npm install framer-motion lucide-react
```

## Quick Start

### Basic Slider

```tsx
import { BeforeAfterSlider } from '@/components/media'

<BeforeAfterSlider
  images={{
    id: '1',
    beforeImage: '/before.jpg',
    afterImage: '/after.jpg',
    title: 'Amazing Transformation',
    description: 'Professional beauty treatment results'
  }}
  showControls={true}
  showLabels={true}
  allowDownload={true}
  allowShare={true}
/>
```

### Gallery with Multiple Images

```tsx
import { BeforeAfterGallery } from '@/components/media'

const transformations = [
  {
    id: '1',
    beforeImage: '/before1.jpg',
    afterImage: '/after1.jpg',
    title: 'Lip Enhancement',
    description: 'Natural-looking results',
    date: '2024-01-15',
    tags: ['lips', 'enhancement']
  },
  // ... more images
]

<BeforeAfterGallery
  images={transformations}
  layout="grid"
  showFilters={true}
  allowFavorites={true}
  onImageSelect={(image, index) => {
    console.log('Selected:', image.title)
  }}
/>
```

## API Reference

### BeforeAfterSlider

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `images` | `BeforeAfterImages \| BeforeAfterImages[]` | - | Single image or array of images |
| `beforeLabel` | `string` | `'Before'` | Label for before image |
| `afterLabel` | `string` | `'After'` | Label for after image |
| `initialPosition` | `number` | `50` | Initial slider position (0-100) |
| `showLabels` | `boolean` | `true` | Show before/after labels |
| `showControls` | `boolean` | `true` | Show control buttons |
| `showThumbnails` | `boolean` | `true` | Show thumbnails for multiple images |
| `showProgress` | `boolean` | `true` | Show percentage indicator |
| `allowDownload` | `boolean` | `true` | Show download button |
| `allowShare` | `boolean` | `true` | Show share button |
| `className` | `string` | - | Additional CSS classes |
| `onSliderChange` | `(position: number) => void` | - | Callback on slider move |
| `onImageChange` | `(index: number) => void` | - | Callback on image change |
| `c2paVerified` | `boolean` | `false` | Show authenticity badge |
| `authenticityInfo` | `AuthenticityInfo` | - | C2PA verification details |

#### Interfaces

```tsx
interface BeforeAfterImages {
  id: string
  beforeImage: string
  afterImage: string
  beforeLabel?: string
  afterLabel?: string
  title?: string
  description?: string
  date?: string
  tags?: string[]
}

interface AuthenticityInfo {
  verified: boolean
  manifestId?: string
  verificationDate?: string
}
```

### BeforeAfterGallery

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `images` | `BeforeAfterImages[]` | - | Array of before/after images |
| `categories` | `string[]` | `[]` | Available categories |
| `tags` | `string[]` | `[]` | Available tags |
| `layout` | `'grid' \| 'list' \| 'masonry'` | `'grid'` | Gallery layout |
| `showFilters` | `boolean` | `true` | Show filter controls |
| `showSearch` | `boolean` | `true` | Show search bar |
| `showStats` | `boolean` | `true` | Show statistics |
| `allowFavorites` | `boolean` | `true` | Enable favorite system |
| `defaultView` | `'grid' \| 'list' \| 'masonry'` | `'grid'` | Default view mode |
| `itemsPerPage` | `number` | `12` | Items per page |
| `className` | `string` | - | Additional CSS classes |
| `onImageSelect` | `(image: BeforeAfterImages, index: number) => void` | - | Image selection callback |
| `onFavorite` | `(imageId: string, isFavorite: boolean) => void` | - | Favorite callback |

## Interactions

### Touch Gestures

- **Single finger drag**: Move slider position
- **Single finger pan**: Pan image when zoomed
- **Double tap**: Reset zoom to 100%
- **Pinch**: Zoom in/out (1x - 3x)
- **Tap**: Jump slider to tapped position

### Keyboard Controls

- **Arrow Keys**: Navigate between images
- **+/-**: Zoom in/out
- **Escape**: Exit fullscreen or reset zoom
- **Tab**: Navigate through controls
- **Enter/Space**: Activate buttons

### Mouse Interactions

- **Drag slider handle**: Smooth position adjustment
- **Click on image**: Jump slider to clicked position
- **Scroll wheel**: Zoom in/out (when focused)
- **Hover**: Show additional controls and info

## Mobile Optimization

- **Touch Events**: Native touch event handling for smooth performance
- **Responsive Design**: Adapts to all screen sizes
- **Performance**: 60fps animations with CSS transforms
- **Battery Efficient**: Optimized rendering and event handling
- **Accessibility**: Screen reader support and high contrast mode

## Performance Features

### Image Optimization

- **Lazy Loading**: Images load only when needed
- **WebP Support**: Automatic WebP format detection and usage
- **Progressive Loading**: Smooth fade-in transitions
- **Error Handling**: Graceful fallbacks for failed loads
- **Memory Management**: Efficient cleanup on unmount

### Rendering Performance

- **CSS Transforms**: Hardware-accelerated animations
- **Event Throttling**: Optimized touch and mouse events
- **Virtualization**: Efficient rendering for large galleries
- **Memoization**: Prevents unnecessary re-renders
- **Bundle Optimization**: Tree-shaking and code splitting

## Accessibility

### WCAG AA Compliance

- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader**: ARIA labels and semantic HTML
- **High Contrast**: Supports high contrast mode
- **Focus Management**: Clear focus indicators
- **Text Alternatives**: Alt text for all images
- **Touch Targets**: Minimum 44x44px touch targets

### ARIA Labels

- Slider position announcements
- Image descriptions and titles
- Control button functions
- Gallery navigation states
- Filter and search results

## C2PA Integration

The components support C2PA (Coalition for Content Provenance and Authenticity) verification:

```tsx
<BeforeAfterSlider
  images={image}
  c2paVerified={true}
  authenticityInfo={{
    verified: true,
    manifestId: 'c2pa-manifest-12345678',
    verificationDate: '2024-01-16T10:30:00Z'
  }}
/>
```

This displays a verification badge and detailed authenticity information.

## Styling

### CSS Variables

The components use CSS variables for theming:

```css
:root {
  --before-after-handle-size: 3rem;
  --before-after-handle-bg: white;
  --before-after-handle-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --before-after-line-color: white;
  --before-after-line-width: 2px;
  --before-after-transition: all 0.3s ease-out;
}
```

### Custom Classes

You can customize appearance with additional CSS classes:

```tsx
<BeforeAfterSlider
  className="custom-slider"
  images={image}
/>
```

```css
.custom-slider {
  --before-after-handle-bg: #your-color;
  --before-after-line-color: #your-color;
  border-radius: 1rem;
  overflow: hidden;
}
```

## Examples

### Beauty Clinic Website

```tsx
function BeforeAfterSection() {
  const treatments = [
    {
      id: 'lips-1',
      beforeImage: '/lips-before.jpg',
      afterImage: '/lips-after.jpg',
      title: 'Lip Enhancement',
      description: 'Natural-looking lip augmentation',
      tags: ['lips', 'enhancement', 'cosmetic'],
      date: '2024-01-15'
    }
  ]

  return (
    <section>
      <h2>Client Transformations</h2>
      <BeforeAfterGallery
        images={treatments}
        layout="grid"
        showFilters={true}
        allowFavorites={true}
      />
    </section>
  )
}
```

### Fitness Studio

```tsx
function SuccessStories() {
  return (
    <div>
      <BeforeAfterSlider
        images={{
          id: 'transformation-1',
          beforeImage: '/fitness-before.jpg',
          afterImage: '/fitness-after.jpg',
          title: '12-Week Transformation',
          description: 'Incredible weight loss journey',
          date: '2024-01-01'
        }}
        showLabels={true}
        showProgress={true}
        allowShare={true}
      />
    </div>
  )
}
```

## Troubleshooting

### Common Issues

**Images not loading:**
- Check image URLs are accessible
- Ensure proper CORS headers
- Verify image formats (JPG, PNG, WebP)

**Touch not working on mobile:**
- Ensure `touch-action: none` CSS on slider container
- Check for conflicting touch event handlers
- Test on actual mobile devices

**Performance issues:**
- Use WebP images when possible
- Implement proper image dimensions
- Enable lazy loading for galleries
- Monitor bundle size

**Zoom not working:**
- Check container has proper dimensions
- Ensure CSS transforms are supported
- Verify no conflicting transform styles

## Browser Support

- **Chrome/Chromium**: 88+
- **Firefox**: 85+
- **Safari**: 14+
- **Edge**: 88+
- **Mobile Safari**: 14+
- **Chrome Mobile**: 88+

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new props
3. Include accessibility considerations
4. Test on mobile devices
5. Update documentation

## License

These components are part of the Mariia Hub project and follow the project's licensing terms.