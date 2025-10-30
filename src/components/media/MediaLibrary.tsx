import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  Grid,
  List,
  Upload,
  Download,
  Trash2,
  Eye,
  Edit,
  Tag,
  Calendar,
  Image as ImageIcon,
  Video,
  FileText,
  Check,
  X,
  Plus,
  FolderOpen,
  Lock,
  Unlock,
  Shield,
  ZoomIn,
  MoreHorizontal
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface MediaAsset {
  id: string
  original_filename: string
  file_path: string
  file_size: number
  mime_type: string
  width?: number
  height?: number
  cdn_url?: string
  thumbnail_url?: string
  alt_text?: string
  description?: string
  tags: string[]
  metadata: Record<string, any>
  uploaded_by: string
  created_at: string
  updated_at: string
  collections?: string[]
  c2pa_verified?: boolean
  consent_status?: 'verified' | 'pending' | 'missing'
  moderation_status?: 'approved' | 'pending' | 'rejected'
}

interface MediaLibraryProps {
  selectable?: boolean
  onSelect?: (assets: MediaAsset[]) => void
  initialSelection?: string[]
  maxSelection?: number
  filterType?: 'all' | 'image' | 'video'
  className?: string
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  selectable = false,
  onSelect,
  initialSelection = [],
  maxSelection,
  filterType = 'all',
  className
}) => {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [filteredAssets, setFilteredAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set(initialSelection))
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [sortBy, setSortBy] = useState<'created_at' | 'filename' | 'size'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [filterCollections, setFilterCollections] = useState<string[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mock data for demonstration
  useEffect(() => {
    const mockAssets: MediaAsset[] = [
      {
        id: '1',
        original_filename: 'lips_before_001.jpg',
        file_path: '/assets/lips_before_001.jpg',
        file_size: 2457600,
        mime_type: 'image/jpeg',
        width: 1920,
        height: 1080,
        cdn_url: 'https://cdn.example.com/lips_before_001.jpg',
        thumbnail_url: 'https://cdn.example.com/thumbs/lips_before_001.jpg',
        alt_text: 'Lip enhancement before treatment',
        description: 'Client before lip filler treatment',
        tags: ['before', 'lips', 'portrait'],
        metadata: { camera: 'Canon EOS R5', iso: 400 },
        uploaded_by: 'admin',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        c2pa_verified: true,
        consent_status: 'verified',
        moderation_status: 'approved'
      },
      {
        id: '2',
        original_filename: 'lips_after_001.jpg',
        file_path: '/assets/lips_after_001.jpg',
        file_size: 2654208,
        mime_type: 'image/jpeg',
        width: 1920,
        height: 1080,
        cdn_url: 'https://cdn.example.com/lips_after_001.jpg',
        thumbnail_url: 'https://cdn.example.com/thumbs/lips_after_001.jpg',
        alt_text: 'Lip enhancement after treatment',
        description: 'Client after lip filler treatment - 2 weeks post treatment',
        tags: ['after', 'lips', 'portrait', 'healed'],
        metadata: { camera: 'Canon EOS R5', iso: 400 },
        uploaded_by: 'admin',
        created_at: '2024-01-29T10:30:00Z',
        updated_at: '2024-01-29T10:30:00Z',
        c2pa_verified: true,
        consent_status: 'verified',
        moderation_status: 'approved'
      },
      {
        id: '3',
        original_filename: 'glutes_workout_demo.mp4',
        file_path: '/assets/glutes_workout_demo.mp4',
        file_size: 52428800,
        mime_type: 'video/mp4',
        width: 1920,
        height: 1080,
        cdn_url: 'https://cdn.example.com/glutes_workout_demo.mp4',
        thumbnail_url: 'https://cdn.example.com/thumbs/glutes_workout_demo.jpg',
        alt_text: 'Glutes workout demonstration',
        description: 'Advanced glutes workout routine demonstration',
        tags: ['fitness', 'glutes', 'workout', 'demo'],
        metadata: { duration: 120, fps: 30 },
        uploaded_by: 'trainer',
        created_at: '2024-01-20T14:15:00Z',
        updated_at: '2024-01-20T14:15:00Z',
        c2pa_verified: false,
        consent_status: 'verified',
        moderation_status: 'approved'
      }
    ]
    setAssets(mockAssets)
    setLoading(false)
  }, [])

  // Filter and sort assets
  useEffect(() => {
    const filtered = assets.filter(asset => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          asset.original_filename.toLowerCase().includes(query) ||
          asset.alt_text?.toLowerCase().includes(query) ||
          asset.description?.toLowerCase().includes(query) ||
          asset.tags.some(tag => tag.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }

      // Type filter
      if (filterType !== 'all') {
        const isImage = asset.mime_type.startsWith('image/')
        const isVideo = asset.mime_type.startsWith('video/')
        if (filterType === 'image' && !isImage) return false
        if (filterType === 'video' && !isVideo) return false
      }

      // Tag filter
      if (filterTags.length > 0) {
        const hasAllTags = filterTags.every(tag => asset.tags.includes(tag))
        if (!hasAllTags) return false
      }

      // Collection filter
      if (selectedCollection !== 'all') {
        if (!asset.collections?.includes(selectedCollection)) return false
      }

      return true
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy]
      let bValue: any = b[sortBy]

      if (sortBy === 'filename') {
        aValue = a.original_filename.toLowerCase()
        bValue = b.original_filename.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredAssets(filtered)
  }, [assets, searchQuery, filterType, filterTags, selectedCollection, sortBy, sortOrder])

  const handleAssetSelect = (assetId: string) => {
    if (!selectable) return

    const newSelection = new Set(selectedAssets)

    if (newSelection.has(assetId)) {
      newSelection.delete(assetId)
    } else {
      if (maxSelection && newSelection.size >= maxSelection) {
        return // Max selection reached
      }
      newSelection.add(assetId)
    }

    setSelectedAssets(newSelection)
    onSelect?.(assets.filter(a => newSelection.has(a.id)))
  }

  const handleBulkDelete = async () => {
    if (selectedAssets.size === 0) return

    // NOTE: Bulk delete functionality pending - requires API integration
    // TODO: Implement bulk delete with proper error handling and confirmation
    console.log('Deleting assets:', Array.from(selectedAssets))
  }

  const handleFileUpload = (files: FileList) => {
    // NOTE: File upload functionality pending - requires API integration
    // TODO: Implement file upload with progress tracking and validation
    console.log('Uploading files:', files)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getAssetIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4" alt="" />
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getStatusBadge = (asset: MediaAsset) => {
    if (asset.c2pa_verified) {
      return <Badge variant="secondary" className="text-green-600"><Shield className="h-3 w-3 mr-1" />C2PA</Badge>
    }
    if (asset.consent_status === 'pending') {
      return <Badge variant="outline" className="text-yellow-600"><AlertCircle className="h-3 w-3 mr-1" />Consent</Badge>
    }
    if (asset.moderation_status === 'pending') {
      return <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />Review</Badge>
    }
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Media Library</h2>
          {selectable && (
            <Badge variant="outline">
              {selectedAssets.size} selected
              {maxSelection && ` / ${maxSelection}`}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedAssets.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedAssets.size})
            </Button>
          )}
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          />
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date</SelectItem>
              <SelectItem value="filename">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>

          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Filters:</span>
        {['before', 'after', 'portrait', 'fitness', 'verified'].map(tag => (
          <Badge
            key={tag}
            variant={filterTags.includes(tag) ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => {
              setFilterTags(prev =>
                prev.includes(tag)
                  ? prev.filter(t => t !== tag)
                  : [...prev, tag]
              )
            }}
          >
            {tag}
          </Badge>
        ))}
      </div>

      {/* Media Grid/List */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="aspect-square animate-pulse bg-muted" />
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" alt="Image" />
          <p className="text-muted-foreground">No media found</p>
        </div>
      ) : viewMode === 'grid' ? (
        <motion.div
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          <AnimatePresence>
            {filteredAssets.map((asset) => (
              <motion.div
                key={asset.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={cn(
                    'group relative overflow-hidden cursor-pointer transition-all hover:shadow-lg',
                    selectedAssets.has(asset.id) && 'ring-2 ring-primary'
                  )}
                  onClick={() => handleAssetSelect(asset.id)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-square relative">
                      {asset.thumbnail_url ? (
                        <img
                          src={asset.thumbnail_url}
                          alt={asset.alt_text}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-muted">
                          {getAssetIcon(asset.mime_type)}
                        </div>
                      )}

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedAsset(asset)
                            setShowDetailsDialog(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            // NOTE: Download functionality pending - requires API integration
                            // TODO: Implement asset download with proper error handling
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Selection Checkbox */}
                      {selectable && (
                        <div className="absolute top-2 left-2">
                          <div
                            className={cn(
                              'w-5 h-5 rounded border-2 bg-white flex items-center justify-center',
                              selectedAssets.has(asset.id)
                                ? 'border-primary bg-primary'
                                : 'border-gray-300'
                            )}
                          >
                            {selectedAssets.has(asset.id) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Status Badges */}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {getStatusBadge(asset)}
                      </div>

                      {/* File Info */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs text-white truncate">{asset.original_filename}</p>
                        <p className="text-xs text-gray-300">{formatFileSize(asset.file_size)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filteredAssets.map((asset) => (
            <Card
              key={asset.id}
              className={cn(
                'p-4 cursor-pointer transition-all hover:shadow-md',
                selectedAssets.has(asset.id) && 'ring-2 ring-primary'
              )}
              onClick={() => handleAssetSelect(asset.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  {asset.thumbnail_url ? (
                    <img
                      src={asset.thumbnail_url}
                      alt={asset.alt_text}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      {getAssetIcon(asset.mime_type)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-medium truncate">{asset.original_filename}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(asset.file_size)} • {new Date(asset.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {asset.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {asset.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{asset.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(asset)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            setSelectedAsset(asset)
                            setShowDetailsDialog(true)
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            // NOTE: Download functionality pending - requires API integration
                            // TODO: Implement asset download with proper error handling
                          }}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={(e) => {
                            e.stopPropagation()
                            // NOTE: Delete functionality pending - requires API integration
                            // TODO: Implement asset deletion with confirmation dialog
                          }}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Asset Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <Tabs defaultValue="preview" className="w-full">
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="space-y-4">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  {selectedAsset.cdn_url ? (
                    <img
                      src={selectedAsset.cdn_url}
                      alt={selectedAsset.alt_text}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      {getAssetIcon(selectedAsset.mime_type)}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Filename</Label>
                    <p className="text-sm text-muted-foreground">{selectedAsset.original_filename}</p>
                  </div>
                  <div>
                    <Label>File Size</Label>
                    <p className="text-sm text-muted-foreground">{formatFileSize(selectedAsset.file_size)}</p>
                  </div>
                  <div>
                    <Label>Type</Label>
                    <p className="text-sm text-muted-foreground">{selectedAsset.mime_type}</p>
                  </div>
                  <div>
                    <Label>Dimensions</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedAsset.width && selectedAsset.height
                        ? `${selectedAsset.width} × ${selectedAsset.height}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label>Uploaded</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedAsset.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label>Uploaded By</Label>
                    <p className="text-sm text-muted-foreground">{selectedAsset.uploaded_by}</p>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground">{selectedAsset.description || 'No description'}</p>
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedAsset.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="metadata" className="space-y-4">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                  {JSON.stringify(selectedAsset.metadata, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}