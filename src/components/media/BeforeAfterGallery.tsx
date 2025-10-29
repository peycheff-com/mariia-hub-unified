import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Grid,
  List,
  Search,
  Filter,
  Calendar,
  Tag,
  Eye,
  Heart,
  Share2,
  Download,
  Maximize2,
  X
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { BeforeAfterSlider, BeforeAfterImages } from './BeforeAfterSlider'

interface BeforeAfterGalleryProps {
  images: BeforeAfterImages[]
  categories?: string[]
  tags?: string[]
  layout?: 'grid' | 'list' | 'masonry'
  showFilters?: boolean
  showSearch?: boolean
  showStats?: boolean
  allowFavorites?: boolean
  defaultView?: 'grid' | 'list' | 'masonry'
  itemsPerPage?: number
  className?: string
  onImageSelect?: (image: BeforeAfterImages, index: number) => void
  onFavorite?: (imageId: string, isFavorite: boolean) => void
}

interface FilterState {
  search: string
  category: string
  tags: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  sortBy: 'date' | 'title' | 'popularity' | 'category'
  sortOrder: 'asc' | 'desc'
}

interface GalleryStats {
  totalImages: number
  categories: number
  tags: number
  favorites: number
  views: number
}

export const BeforeAfterGallery: React.FC<BeforeAfterGalleryProps> = ({
  images,
  categories = [],
  tags = [],
  layout = 'grid',
  showFilters = true,
  showSearch = true,
  showStats = true,
  allowFavorites = true,
  defaultView = 'grid',
  itemsPerPage = 12,
  className,
  onImageSelect,
  onFavorite
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'masonry'>(defaultView)
  const [selectedImage, setSelectedImage] = useState<BeforeAfterImages | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [filteredImages, setFilteredImages] = useState<BeforeAfterImages[]>(images)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    tags: [],
    sortBy: 'date',
    sortOrder: 'desc'
  })

  const galleryRef = useRef<HTMLDivElement>(null)

  // Extract unique categories and tags from images
  const imageCategories = Array.from(new Set(images.flatMap(img => img.tags || [])))
  const imageTags = Array.from(new Set(images.flatMap(img => img.tags || [])))

  // Apply filters and search
  useEffect(() => {
    let filtered = [...images]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(img =>
        img.title?.toLowerCase().includes(searchLower) ||
        img.description?.toLowerCase().includes(searchLower) ||
        img.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(img =>
        img.tags?.includes(filters.category)
      )
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(img =>
        filters.tags.every(tag => img.tags?.includes(tag))
      )
    }

    // Date range filter
    if (filters.dateRange) {
      const { start, end } = filters.dateRange
      filtered = filtered.filter(img => {
        if (!img.date) return false
        const imgDate = new Date(img.date)
        return imgDate >= start && imgDate <= end
      })
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (filters.sortBy) {
        case 'date':
          comparison = (new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
          break
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '')
          break
        case 'popularity':
          // This would need a popularity field in the data
          comparison = 0
          break
        case 'category':
          comparison = (a.tags?.[0] || '').localeCompare(b.tags?.[0] || '')
          break
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredImages(filtered)
    setCurrentPage(1)
  }, [images, filters])

  // Pagination
  const totalPages = Math.ceil(filteredImages.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedImages = filteredImages.slice(startIndex, startIndex + itemsPerPage)

  // Calculate stats
  const stats: GalleryStats = {
    totalImages: images.length,
    categories: imageCategories.length,
    tags: imageTags.length,
    favorites: favorites.size,
    views: images.reduce((sum, img) => sum + (img as any).views || 0, 0)
  }

  const handleImageClick = (image: BeforeAfterImages, index: number) => {
    const globalIndex = filteredImages.indexOf(image)
    setSelectedImage(image)
    setSelectedIndex(globalIndex)
    onImageSelect?.(image, globalIndex)
  }

  const handleFavorite = (imageId: string, isFavorite: boolean) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (isFavorite) {
        newFavorites.add(imageId)
      } else {
        newFavorites.delete(imageId)
      }
      return newFavorites
    })
    onFavorite?.(imageId, isFavorite)
  }

  const handleSliderNavigation = (direction: number) => {
    const newIndex = selectedIndex + direction
    if (newIndex >= 0 && newIndex < filteredImages.length) {
      setSelectedImage(filteredImages[newIndex])
      setSelectedIndex(newIndex)
    }
  }

  const renderImageCard = (image: BeforeAfterImages, index: number) => {
    const isFavorite = favorites.has(image.id)
    const globalIndex = startIndex + index

    return (
      <motion.div
        key={image.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className={cn(
          'group relative overflow-hidden rounded-lg border bg-card shadow-sm hover:shadow-md transition-all duration-200',
          viewMode === 'list' && 'flex',
          viewMode === 'masonry' && 'break-inside-avoid'
        )}
      >
        {/* Thumbnail */}
        <div
          className={cn(
            'relative cursor-pointer overflow-hidden bg-muted',
            viewMode === 'grid' && 'aspect-[4/3]',
            viewMode === 'list' && 'w-48 h-36 flex-shrink-0',
            viewMode === 'masonry' && 'aspect-[4/3] sm:aspect-[3/4]'
          )}
          onClick={() => handleImageClick(image, globalIndex)}
        >
          <div className="relative w-full h-full">
            {/* Before thumbnail */}
            <img
              src={image.beforeImage}
              alt="Before"
              className="absolute inset-0 w-1/2 h-full object-cover"
            />
            {/* After thumbnail */}
            <img
              src={image.afterImage}
              alt="After"
              className="absolute inset-0 left-1/2 w-1/2 h-full object-cover"
            />
            {/* Divider line */}
            <div className="absolute top-0 left-1/2 h-full w-px bg-white" />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={cn(
          'p-4',
          viewMode === 'list' && 'flex-1'
        )}>
          {/* Title and actions */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg line-clamp-2 flex-1">
              {image.title || `Transformation ${globalIndex + 1}`}
            </h3>
            <div className="flex items-center gap-1 ml-2">
              {allowFavorites && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFavorite(image.id, !isFavorite)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Heart
                    className={cn(
                      'h-4 w-4',
                      isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                    )}
                  />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleImageClick(image, globalIndex)
                }}
                className="h-8 w-8 p-0"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Description */}
          {image.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {image.description}
            </p>
          )}

          {/* Tags */}
          {image.tags && image.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {image.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {image.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{image.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Date and stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {image.date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(image.date).toLocaleDateString()}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {(image as any).views || 0}
            </span>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div ref={galleryRef} className={cn('w-full space-y-6', className)}>
      {/* Header with stats */}
      {showStats && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-2xl font-bold mb-2">Before & After Gallery</h2>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>{stats.totalImages} transformations</span>
              <span>{stats.categories} categories</span>
              <span>{stats.favorites} favorites</span>
              <span>{stats.views} total views</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Controls */}
      {(showFilters || showSearch) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Search */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transformations..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
          )}

          {/* Filters and view mode */}
          {showFilters && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* Category filter */}
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">All Categories</option>
                  {imageCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                {/* Sort options */}
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-')
                    setFilters(prev => ({
                      ...prev,
                      sortBy: sortBy as FilterState['sortBy'],
                      sortOrder: sortOrder as FilterState['sortOrder']
                    }))
                  }}
                  className="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                </select>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {paginatedImages.length} of {filteredImages.length} transformations
      </div>

      {/* Gallery grid */}
      <div
        className={cn(
          'grid gap-4',
          viewMode === 'grid' && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          viewMode === 'list' && 'grid-cols-1',
          viewMode === 'masonry' && 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 space-y-4'
        )}
      >
        {paginatedImages.map((image, index) => renderImageCard(image, index))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1
              const isActive = page === currentPage
              return (
                <Button
                  key={page}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              )
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </motion.div>
      )}

      {/* Empty state */}
      {filteredImages.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-muted-foreground mb-4">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No transformations found</h3>
            <p>Try adjusting your search or filters to find what you're looking for.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setFilters({
              search: '',
              category: '',
              tags: [],
              sortBy: 'date',
              sortOrder: 'desc'
            })}
          >
            Clear Filters
          </Button>
        </motion.div>
      )}

      {/* Fullscreen slider modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative w-full h-full flex items-center justify-center p-4">
              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Navigation */}
              {filteredImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSliderNavigation(-1)
                    }}
                    disabled={selectedIndex === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 disabled:opacity-30"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSliderNavigation(1)
                    }}
                    disabled={selectedIndex === filteredImages.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 disabled:opacity-30"
                  >
                    Next
                  </Button>
                </>
              )}

              {/* Slider */}
              <div className="w-full max-w-6xl max-h-[90vh]">
                <BeforeAfterSlider
                  images={selectedImage}
                  showThumbnails={filteredImages.length > 1}
                  showControls={true}
                  allowDownload={true}
                  allowShare={true}
                  className="w-full"
                  onImageChange={(index) => {
                    setSelectedIndex(index)
                    setSelectedImage(filteredImages[index])
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}