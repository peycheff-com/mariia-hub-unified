
# Image Optimization Guidelines

## Usage in React Components

Use the optimized WebP versions with fallbacks:

```tsx
<img
  src="${imagePath}"
  alt="Description"
  loading="lazy"
  decoding="async"
  onLoad={(e) => {
    // Fade in effect
    e.currentTarget.classList.add('loaded');
  }}
  onError={(e) => {
    // Fallback to original image
    const target = e.target as HTMLImageElement;
    target.src = target.src.replace('.webp', ext);
  }}
/>
```

## CSS for lazy loading

```css
img {
  opacity: 0;
  transition: opacity 0.3s ease;
}

img.loaded {
  opacity: 1;
}
```

## Recommended Practices

1. Always include `loading="lazy"` for below-the-fold images
2. Use WebP format with fallbacks to JPEG/PNG
3. Include proper alt text for accessibility
4. Add width and height to prevent layout shift
5. Use responsive images with srcset for different screen sizes
6. Consider implementing intersection observer for advanced lazy loading
