import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Video,
  Download,
  Trash2,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  Edit3,
  Copy,
  Move,
  Tag,
  Palette,
  Settings,
  FolderPlus,
  FolderOpen,
  Star,
  Clock,
  FileImage,
  Film,
  Music,
  File,
  Zap,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  thumbnailUrl?: string;
  size: number;
  dimensions?: { width: number; height: number };
  duration?: number; // for video/audio
  format: string;
  uploadedAt: Date;
  uploadedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  tags: string[];
  folder: string;
  alt: string;
  caption: string;
  metadata: {
    colorProfile?: string;
    hasTransparency?: boolean;
    compression?: string;
    quality?: number;
    fps?: number; // for video
    bitrate?: number; // for video/audio
  };
  usage: {
    count: number;
    lastUsed: Date;
    locations: string[]; // where this media is used
  };
  cdnUrl?: string;
  optimizedVersions: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    original?: string;
  };
  accessibility: {
    altText: string;
    longDescription?: string;
    isDecorative: boolean;
    language?: string;
  };
}

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  fileCount: number;
  size: number;
  createdAt: Date;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canUpload: boolean;
  };
}

const AdvancedMediaManager: React.FC = () => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('root');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('uploadedAt');
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [editFile, setEditFile] = useState<MediaFile | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data - replace with actual Supabase queries
  useEffect(() => {
    const mockFiles: MediaFile[] = [
      {
        id: '1',
        name: 'hero-lash-extension.jpg',
        type: 'image',
        url: '/media/hero-lash-extension.jpg',
        thumbnailUrl: '/media/thumbnails/hero-lash-extension.jpg',
        size: 2048576, // 2MB
        dimensions: { width: 1920, height: 1080 },
        format: 'JPEG',
        uploadedAt: new Date('2024-01-15T10:00:00'),
        uploadedBy: {
          id: 'user-1',
          name: 'Anna Kowalska',
          avatar: '/avatars/anna.jpg'
        },
        tags: ['hero', 'lashes', 'beauty', 'featured'],
        folder: 'images/hero',
        alt: 'Woman with beautiful lash extensions looking at camera',
        caption: 'Professional lash extension service results',
        metadata: {
          colorProfile: 'sRGB',
          hasTransparency: false,
          compression: 'JPEG',
          quality: 92
        },
        usage: {
          count: 5,
          lastUsed: new Date('2024-01-20T14:30:00'),
          locations: ['/beauty/lashes', '/home', '/blog/lash-guide']
        },
        optimizedVersions: {
          thumbnail: '/media/thumbnails/hero-lash-extension-sm.jpg',
          small: '/media/small/hero-lash-extension.jpg',
          medium: '/media/medium/hero-lash-extension.jpg',
          large: '/media/large/hero-lash-extension.jpg',
          original: '/media/original/hero-lash-extension.jpg'
        },
        accessibility: {
          altText: 'Close-up of professionally applied lash extensions',
          longDescription: 'A client showing off their new lash extensions, featuring natural-looking, longer lashes with proper application technique.',
          isDecorative: false,
          language: 'en'
        }
      },
      {
        id: '2',
        name: 'brow-lamination-process.mp4',
        type: 'video',
        url: '/media/brow-lamination-process.mp4',
        thumbnailUrl: '/media/thumbnails/brow-lamination-process.jpg',
        size: 15728640, // 15MB
        dimensions: { width: 1920, height: 1080 },
        duration: 120, // 2 minutes
        format: 'MP4',
        uploadedAt: new Date('2024-01-14T15:30:00'),
        uploadedBy: {
          id: 'user-2',
          name: 'Maria Nowak',
          avatar: '/avatars/maria.jpg'
        },
        tags: ['tutorial', 'brows', 'process', 'video'],
        folder: 'videos/tutorials',
        alt: 'Brow lamination procedure demonstration',
        caption: 'Step-by-step brow lamination process',
        metadata: {
          fps: 30,
          bitrate: 5000,
          quality: 1080
        },
        usage: {
          count: 3,
          lastUsed: new Date('2024-01-18T10:15:00'),
          locations: ['/services/brows', '/tutorials/brow-lamination']
        },
        accessibility: {
          altText: 'Video showing brow lamination process',
          isDecorative: false,
          language: 'en'
        }
      }
    ];

    const mockFolders: Folder[] = [
      {
        id: 'folder-1',
        name: 'Images',
        parentId: null,
        path: '/images',
        fileCount: 150,
        size: 524288000, // 500MB
        createdAt: new Date('2024-01-01T00:00:00'),
        permissions: {
          canEdit: true,
          canDelete: false,
          canUpload: true
        }
      },
      {
        id: 'folder-2',
        name: 'Hero Images',
        parentId: 'folder-1',
        path: '/images/hero',
        fileCount: 25,
        size: 104857600, // 100MB
        createdAt: new Date('2024-01-01T00:00:00'),
        permissions: {
          canEdit: true,
          canDelete: true,
          canUpload: true
        }
      },
      {
        id: 'folder-3',
        name: 'Videos',
        parentId: null,
        path: '/videos',
        fileCount: 45,
        size: 2147483648, // 2GB
        createdAt: new Date('2024-01-01T00:00:00'),
        permissions: {
          canEdit: true,
          canDelete: false,
          canUpload: true
        }
      }
    ];

    setMediaFiles(mockFiles);
    setFolders(mockFolders);
  }, []);

  const handleFileUpload = useCallback(async (files: FileList) => {
    setIsUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Add to processing queue
      setIsProcessing(prev => new Set(prev).add(fileId));

      // Simulate processing (optimization, thumbnail generation, etc.)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create media file object
      const newMediaFile: MediaFile = {
        id: fileId,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' :
              file.type.startsWith('video/') ? 'video' :
              file.type.startsWith('audio/') ? 'audio' : 'document',
        url: `/media/${file.name}`,
        size: file.size,
        format: file.type.split('/')[1].toUpperCase(),
        uploadedAt: new Date(),
        uploadedBy: {
          id: 'current-user',
          name: 'Current User'
        },
        tags: [],
        folder: selectedFolder === 'root' ? 'uploads' : selectedFolder,
        alt: '',
        caption: '',
        metadata: {},
        usage: {
          count: 0,
          lastUsed: new Date(),
          locations: []
        },
        accessibility: {
          altText: '',
          isDecorative: false
        }
      };

      // Add image dimensions if it's an image
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          newMediaFile.dimensions = { width: img.width, height: img.height };
          setMediaFiles(prev => [...prev, newMediaFile]);
        };
        img.src = URL.createObjectURL(file);
      } else {
        setMediaFiles(prev => [...prev, newMediaFile]);
      }

      setIsProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });

      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
    });

    try {
      await Promise.all(uploadPromises);
      toast({
        title: 'Upload successful',
        description: `${files.length} file(s) uploaded successfully`,
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Some files failed to upload',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFolder, toast]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return FileImage;
      case 'video': return Film;
      case 'audio': return Music;
      default: return File;
    }
  };

  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || file.type === filterType;
    const matchesFolder = selectedFolder === 'root' || file.folder.startsWith(selectedFolder);
    return matchesSearch && matchesType && matchesFolder;
  });

  const MediaCard = ({ file }: { file: MediaFile }) => {
    const FileIcon = getFileIcon(file.type);
    const isSelected = selectedFiles.has(file.id);

    return (
      <Card
        className={`group cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => {
          setSelectedFiles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(file.id)) {
              newSet.delete(file.id);
            } else {
              newSet.add(file.id);
            }
            return newSet;
          });
        }}
      >
        <CardHeader className="p-3">
          <div className="aspect-video bg-muted rounded-md overflow-hidden relative">
            {file.type === 'image' ? (
              <img
                src={file.thumbnailUrl || file.url}
                alt={file.alt}
                className="w-full h-full object-cover"
              />
            ) : file.type === 'video' ? (
              <div className="relative w-full h-full">
                <img
                  src={file.thumbnailUrl}
                  alt={file.alt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Film className="w-8 h-8 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileIcon className="w-12 h-12 text-muted-foreground" />
              </div>
            )}

            {isSelected && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                <div className="w-4 h-4 bg-white rounded-sm" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-2">
            <h3 className="font-medium text-sm truncate" title={file.name}>
              {file.name}
            </h3>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatFileSize(file.size)}</span>
              {file.dimensions && (
                <span>{file.dimensions.width}×{file.dimensions.height}</span>
              )}
              {file.duration && (
                <span>{formatDuration(file.duration)}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {file.type}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {file.uploadedAt.toLocaleDateString()}
              </span>
            </div>
            {file.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {file.tags.slice(0, 2).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {file.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{file.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Media Manager</h2>
          <p className="text-muted-foreground">Advanced media management with optimization and CDN support</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          />
          <Button>
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardContent className="py-4">
            <div className="space-y-3">
              {Object.entries(uploadProgress).map(([fileId, progress]) => (
                <div key={fileId} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading file...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              ))}
              {isProcessing.size > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="w-4 h-4 animate-pulse" />
                  Processing {isProcessing.size} file(s)...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search media files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uploadedAt">Upload Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="usage">Usage</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Folder Navigation */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            <div className="flex items-center gap-2 text-sm">
              <Button variant="ghost" size="sm">Root</Button>
              <span>/</span>
              <Button variant="ghost" size="sm">{selectedFolder}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid */}
      <div className="grid gap-4">
        {filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" alt="Image" />
              <h3 className="text-lg font-medium mb-2">No media files found</h3>
              <p className="text-muted-foreground mb-4">
                Upload your first media file to get started
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid'
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            : "space-y-2"
          }>
            {filteredFiles.map(file => (
              <MediaCard key={file.id} file={file} />
            ))}
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedFiles.size > 0 && (
        <Card className="sticky bottom-4">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedFiles.size} file(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Tag className="w-4 h-4 mr-2" />
                  Add Tags
                </Button>
                <Button variant="outline" size="sm">
                  <Move className="w-4 h-4 mr-2" />
                  Move
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {previewFile && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>{previewFile.name}</DialogTitle>
              </DialogHeader>

              {previewFile.type === 'image' && (
                <div className="flex justify-center">
                  <img
                    src={previewFile.url}
                    alt={previewFile.alt}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg"
                  />
                </div>
              )}

              {previewFile.type === 'video' && (
                <div className="flex justify-center">
                  <video
                    src={previewFile.url}
                    controls
                    className="max-w-full max-h-[60vh] rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Size:</span> {formatFileSize(previewFile.size)}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {previewFile.type}
                </div>
                <div>
                  <span className="font-medium">Format:</span> {previewFile.format}
                </div>
                <div>
                  <span className="font-medium">Uploaded:</span> {previewFile.uploadedAt.toLocaleDateString()}
                </div>
                {previewFile.dimensions && (
                  <div>
                    <span className="font-medium">Dimensions:</span> {previewFile.dimensions.width}×{previewFile.dimensions.height}
                  </div>
                )}
                {previewFile.duration && (
                  <div>
                    <span className="font-medium">Duration:</span> {formatDuration(previewFile.duration)}
                  </div>
                )}
              </div>

              {previewFile.tags.length > 0 && (
                <div className="space-y-2">
                  <span className="font-medium text-sm">Tags:</span>
                  <div className="flex flex-wrap gap-2">
                    {previewFile.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <span className="font-medium text-sm">Alt Text:</span>
                <p className="text-sm text-muted-foreground">{previewFile.alt || 'No alt text provided'}</p>
              </div>

              {previewFile.caption && (
                <div className="space-y-2">
                  <span className="font-medium text-sm">Caption:</span>
                  <p className="text-sm text-muted-foreground">{previewFile.caption}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancedMediaManager;