import React, { useState, useEffect } from 'react';
import {
  History,
  Clock,
  User,
  FileText,
  GitCompare,
  Eye,
  Download,
  RotateCcw,
  Copy,
  MessageSquare,
  Tag,
  Calendar,
  Search,
  Filter,
  BarChart3,
  ChevronDown,
  ChevronRight,
  GitBranch,
  GitCommit,
  GitMerge,
  AlertCircle,
  CheckCircle,
  Info,
  Settings,
  Star,
  Trash2,
  Archive,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface ContentVersion {
  id: string;
  version: string;
  title: string;
  description?: string;
  content: string;
  contentType: 'blog' | 'service' | 'page' | 'product';
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  collaborators: {
    id: string;
    name: string;
    role: 'editor' | 'reviewer' | 'commenter';
  }[];
  metadata: {
    wordCount: number;
    characterCount: number;
    readingTime: number;
    seoScore?: number;
    readabilityScore?: number;
    lastModified: Date;
  };
  changes: {
    type: 'create' | 'update' | 'delete' | 'merge';
    sections: string[];
    summary: string;
    additions: number;
    deletions: number;
    modifications: number;
  };
  tags: string[];
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  isCurrent: boolean;
  isMajor: boolean;
  parentVersion?: string;
  childVersions: string[];
  branchName?: string;
  commitMessage?: string;
  reviewedBy?: {
    id: string;
    name: string;
    reviewedAt: Date;
    comments: string[];
  }[];
  analytics?: {
    views?: number;
    engagement?: number;
    conversions?: number;
  };
}

interface VersionComparison {
  version1: ContentVersion;
  version2: ContentVersion;
  differences: {
    added: string[];
    removed: string[];
    modified: { original: string; updated: string }[];
    statistics: {
      totalChanges: number;
      percentageChange: number;
    };
  };
}

const ContentVersionHistory: React.FC = () => {
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ContentVersion | null>(null);
  const [compareVersions, setCompareVersions] = useState<[ContentVersion?, ContentVersion?]>([undefined, undefined]);
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'branches'>('timeline');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAuthor, setFilterAuthor] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'version' | 'author' | 'changes'>('date');
  const [showComparison, setShowComparison] = useState(false);
  const [showVersionDetails, setShowVersionDetails] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [comparison, setComparison] = useState<VersionComparison | null>(null);
  const { toast } = useToast();

  // Mock data
  useEffect(() => {
    const mockVersions: ContentVersion[] = [
      {
        id: 'v1.0.0',
        version: '1.0.0',
        title: 'Complete Guide to Lash Extensions',
        description: 'Initial comprehensive guide for lash extension services',
        content: 'Initial content...',
        contentType: 'blog',
        createdAt: new Date('2024-01-15T10:00:00'),
        updatedAt: new Date('2024-01-15T10:00:00'),
        author: {
          id: 'user-1',
          name: 'Anna Kowalska',
          email: 'anna@example.com',
          avatar: '/avatars/anna.jpg'
        },
        collaborators: [
          { id: 'user-2', name: 'Maria Nowak', role: 'editor' }
        ],
        metadata: {
          wordCount: 1500,
          characterCount: 8000,
          readingTime: 8,
          seoScore: 85,
          readabilityScore: 92,
          lastModified: new Date('2024-01-15T10:00:00')
        },
        changes: {
          type: 'create',
          sections: ['Introduction', 'What to Expect', 'Benefits', 'FAQ'],
          summary: 'Initial version created with comprehensive lash extension guide',
          additions: 1500,
          deletions: 0,
          modifications: 0
        },
        tags: ['lashes', 'guide', 'initial'],
        status: 'published',
        isCurrent: false,
        isMajor: true,
        childVersions: ['v1.1.0', 'v1.2.0'],
        commitMessage: 'feat: Add comprehensive lash extension guide',
        analytics: {
          views: 2500,
          engagement: 78,
          conversions: 45
        }
      },
      {
        id: 'v1.1.0',
        version: '1.1.0',
        title: 'Complete Guide to Lash Extensions',
        description: 'Updated with aftercare section and pricing information',
        content: 'Updated content...',
        contentType: 'blog',
        createdAt: new Date('2024-01-18T14:30:00'),
        updatedAt: new Date('2024-01-18T14:30:00'),
        author: {
          id: 'user-2',
          name: 'Maria Nowak',
          email: 'maria@example.com',
          avatar: '/avatars/maria.jpg'
        },
        collaborators: [
          { id: 'user-1', name: 'Anna Kowalska', role: 'reviewer' }
        ],
        metadata: {
          wordCount: 1800,
          characterCount: 9500,
          readingTime: 9,
          seoScore: 88,
          readabilityScore: 90,
          lastModified: new Date('2024-01-18T14:30:00')
        },
        changes: {
          type: 'update',
          sections: ['Aftercare', 'Pricing', 'FAQ'],
          summary: 'Added comprehensive aftercare instructions and updated pricing',
          additions: 300,
          deletions: 50,
          modifications: 100
        },
        tags: ['lashes', 'guide', 'aftercare', 'pricing'],
        status: 'published',
        isCurrent: false,
        isMajor: false,
        parentVersion: 'v1.0.0',
        childVersions: ['v1.1.1'],
        commitMessage: 'feat: Add aftercare section and update pricing',
        reviewedBy: [
          {
            id: 'user-1',
            name: 'Anna Kowalska',
            reviewedAt: new Date('2024-01-19T09:00:00'),
            comments: ['Great addition of aftercare section', 'Pricing updates look good']
          }
        ],
        analytics: {
          views: 1800,
          engagement: 82,
          conversions: 38
        }
      },
      {
        id: 'v1.1.1',
        version: '1.1.1',
        title: 'Complete Guide to Lash Extensions',
        description: 'Minor updates and SEO improvements',
        content: 'Minor updated content...',
        contentType: 'blog',
        createdAt: new Date('2024-01-22T11:15:00'),
        updatedAt: new Date('2024-01-22T11:15:00'),
        author: {
          id: 'user-3',
          name: 'Sophie Martin',
          email: 'sophie@example.com',
          avatar: '/avatars/sophie.jpg'
        },
        collaborators: [],
        metadata: {
          wordCount: 1850,
          characterCount: 9700,
          readingTime: 9,
          seoScore: 92,
          readabilityScore: 91,
          lastModified: new Date('2024-01-22T11:15:00')
        },
        changes: {
          type: 'update',
          sections: ['SEO Meta', 'Introduction'],
          summary: 'SEO optimization and minor content improvements',
          additions: 50,
          deletions: 10,
          modifications: 80
        },
        tags: ['lashes', 'guide', 'seo', 'optimization'],
        status: 'published',
        isCurrent: true,
        isMajor: false,
        parentVersion: 'v1.1.0',
        childVersions: [],
        commitMessage: 'chore: SEO optimization and minor improvements',
        reviewedBy: [],
        analytics: {
          views: 1200,
          engagement: 85,
          conversions: 28
        }
      }
    ];

    setVersions(mockVersions);
  }, []);

  const filteredVersions = versions.filter(version => {
    const matchesStatus = filterStatus === 'all' || version.status === filterStatus;
    const matchesAuthor = filterAuthor === 'all' || version.author.id === filterAuthor;
    const matchesType = filterType === 'all' || version.contentType === filterType;
    const matchesSearch = version.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         version.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         version.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesAuthor && matchesType && matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'version':
        return b.version.localeCompare(a.version);
      case 'author':
        return a.author.name.localeCompare(b.author.name);
      case 'changes':
        return (b.changes.additions + b.changes.modifications + b.changes.deletions) -
               (a.changes.additions + a.changes.modifications + a.changes.deletions);
      default:
        return 0;
    }
  });

  const revertToVersion = useCallback(async (version: ContentVersion) => {
    setIsReverting(true);
    try {
      // Simulate revert process
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: 'Version Reverted',
        description: `Successfully reverted to version ${version.version}`,
      });

      // Update current version
      setVersions(prev => prev.map(v => ({
        ...v,
        isCurrent: v.id === version.id
      })));
    } catch (error) {
      toast({
        title: 'Revert Failed',
        description: 'Unable to revert to this version',
        variant: 'destructive'
      });
    } finally {
      setIsReverting(false);
    }
  }, [toast]);

  const compareVersions = useCallback(async (v1: ContentVersion, v2: ContentVersion) => {
    try {
      // Simulate comparison process
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockComparison: VersionComparison = {
        version1: v1,
        version2: v2,
        differences: {
          added: ['New aftercare section added', 'Updated pricing information', 'Additional FAQ items'],
          removed: ['Outdated contact information', 'Deprecated service descriptions'],
          modified: [
            { original: 'Basic lash extensions', updated: 'Premium lash extensions with customized options' },
            { original: '2-3 weeks duration', updated: '3-4 weeks with proper aftercare' }
          ],
          statistics: {
            totalChanges: 5,
            percentageChange: 12.5
          }
        }
      };

      setComparison(mockComparison);
      setShowComparison(true);
    } catch (error) {
      toast({
        title: 'Comparison Failed',
        description: 'Unable to compare versions',
        variant: 'destructive'
      });
    }
  }, [toast]);

  const exportVersion = useCallback((version: ContentVersion, format: 'json' | 'html' | 'markdown') => {
    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(version, null, 2);
        filename = `version-${version.version}.json`;
        mimeType = 'application/json';
        break;
      case 'markdown':
        content = `# ${version.title} - Version ${version.version}\n\n${version.description || ''}\n\n${version.content}`;
        filename = `version-${version.version}.md`;
        mimeType = 'text/markdown';
        break;
      default:
        content = version.content;
        filename = `version-${version.version}.html`;
        mimeType = 'text/html';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Version Exported',
      description: `Version ${version.version} exported as ${format.toUpperCase()}`,
    });
  }, [toast]);

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      review: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      published: 'bg-blue-100 text-blue-700',
      archived: 'bg-purple-100 text-purple-700'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getChangeTypeIcon = (type: string) => {
    const icons = {
      create: GitCommit,
      update: RefreshCw,
      delete: Trash2,
      merge: GitMerge
    };
    return icons[type as keyof typeof icons] || GitCommit;
  };

  const VersionCard = ({ version }: { version: ContentVersion }) => {
    const ChangeIcon = getChangeTypeIcon(version.changes.type);
    const totalChanges = version.changes.additions + version.changes.modifications + version.changes.deletions;

    return (
      <Card className={`hover:shadow-md transition-shadow cursor-pointer ${
        version.isCurrent ? 'ring-2 ring-blue-500' : ''
      }`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{version.title}</h3>
                {version.isCurrent && (
                  <Badge className="bg-blue-100 text-blue-700">Current</Badge>
                )}
                <Badge variant="outline">{version.version}</Badge>
                {version.isMajor && (
                  <Badge variant="secondary">Major</Badge>
                )}
                <Badge className={getStatusColor(version.status)}>
                  {version.status}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                {version.description}
              </p>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{version.author.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{version.createdAt.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span>{version.metadata.wordCount} words</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <ChangeIcon className="w-4 h-4 text-blue-500" />
                <span className="text-sm">{version.changes.summary}</span>
                <Badge variant="outline" className="text-xs">
                  +{version.changes.additions} -{version.changes.deletions} ~{version.changes.modifications}
                </Badge>
              </div>

              {version.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {version.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {version.analytics && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{version.analytics.views} views</span>
                  <span>{version.analytics.engagement}% engagement</span>
                  <span>{version.analytics.conversions} conversions</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 ml-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVersion(version);
                      setShowVersionDetails(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Details</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCompareVersions([compareVersions[0], version]);
                      if (compareVersions[0] && compareVersions[0].id !== version.id) {
                        compareVersions(compareVersions[0]!, version);
                      }
                    }}
                  >
                    <GitCompare className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Compare with {compareVersions[0]?.version || 'another version'}</p>
                </TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => revertToVersion(version)}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Revert to this version
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => exportVersion(version, 'html')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export as HTML
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportVersion(version, 'markdown')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportVersion(version, 'json')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {version.reviewedBy && version.reviewedBy.length > 0 && (
            <div className="flex items-center gap-2 pt-3 border-t">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                Reviewed by {version.reviewedBy[0].name}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const TimelineView = () => (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
      <div className="space-y-6">
        {filteredVersions.map((version, index) => (
          <div key={version.id} className="relative flex items-start gap-4">
            <div className={`w-8 h-8 rounded-full border-2 border-background flex items-center justify-center z-10 ${
              version.isCurrent ? 'bg-blue-500 border-blue-500' : 'bg-muted border-muted-foreground'
            }`}>
              {version.isMajor ? (
                <Star className="w-4 h-4 text-white" />
              ) : (
                <GitCommit className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <VersionCard version={version} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const BranchView = () => (
    <div className="space-y-6">
      {versions.filter(v => !v.parentVersion).map(mainVersion => (
        <Card key={mainVersion.id}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-lg">Main Branch: {mainVersion.version}</CardTitle>
              {mainVersion.isCurrent && (
                <Badge className="bg-blue-100 text-blue-700">Current</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <VersionCard version={mainVersion} />
              {versions.filter(v => v.parentVersion === mainVersion.id).map(childVersion => (
                <div key={childVersion.id} className="ml-8 border-l-2 border-muted pl-4">
                  <VersionCard version={childVersion} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <History className="w-6 h-6 text-blue-500" />
              Content Version History
            </h2>
            <p className="text-muted-foreground">
              Track and manage all versions of your content
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                // Refresh versions
                toast({
                  title: 'Versions Refreshed',
                  description: 'Version history has been updated',
                });
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters and Controls */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search versions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timeline">Timeline</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                  <SelectItem value="branches">Branches</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="blog">Blog</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="page">Page</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="version">Sort by Version</SelectItem>
                  <SelectItem value="author">Sort by Author</SelectItem>
                  <SelectItem value="changes">Sort by Changes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Version Display */}
        <div className="space-y-4">
          {filteredVersions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Versions Found</h3>
                <p className="text-muted-foreground">
                  No content versions match your current filters
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {viewMode === 'timeline' && <TimelineView />}
              {viewMode === 'list' && (
                <div className="space-y-4">
                  {filteredVersions.map(version => (
                    <VersionCard key={version.id} version={version} />
                  ))}
                </div>
              )}
              {viewMode === 'branches' && <BranchView />}
            </>
          )}
        </div>

        {/* Version Details Dialog */}
        <Dialog open={showVersionDetails} onOpenChange={setShowVersionDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Version Details - {selectedVersion?.version}</DialogTitle>
            </DialogHeader>
            {selectedVersion && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Version Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-sm font-medium">Version:</span>
                        <p className="text-sm">{selectedVersion.version}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Title:</span>
                        <p className="text-sm">{selectedVersion.title}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Status:</span>
                        <Badge className={getStatusColor(selectedVersion.status)}>
                          {selectedVersion.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Created:</span>
                        <p className="text-sm">{selectedVersion.createdAt.toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Content Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Word Count:</span>
                        <span className="text-sm font-medium">{selectedVersion.metadata.wordCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Character Count:</span>
                        <span className="text-sm font-medium">{selectedVersion.metadata.characterCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Reading Time:</span>
                        <span className="text-sm font-medium">{selectedVersion.metadata.readingTime} min</span>
                      </div>
                      {selectedVersion.metadata.seoScore && (
                        <div className="flex justify-between">
                          <span className="text-sm">SEO Score:</span>
                          <span className="text-sm font-medium">{selectedVersion.metadata.seoScore}%</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Changes Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{selectedVersion.changes.summary}</p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          +{selectedVersion.changes.additions}
                        </div>
                        <div className="text-xs text-muted-foreground">Additions</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-600">
                          -{selectedVersion.changes.deletions}
                        </div>
                        <div className="text-xs text-muted-foreground">Deletions</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-amber-600">
                          ~{selectedVersion.changes.modifications}
                        </div>
                        <div className="text-xs text-muted-foreground">Modifications</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {selectedVersion.reviewedBy && selectedVersion.reviewedBy.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reviews</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedVersion.reviewedBy.map((review, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{review.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {review.reviewedAt.toLocaleDateString()}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {review.comments.map((comment, idx) => (
                              <p key={idx} className="text-sm text-muted-foreground">
                                • {comment}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Version Comparison Dialog */}
        <Dialog open={showComparison} onOpenChange={setShowComparison}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Version Comparison</DialogTitle>
            </DialogHeader>
            {comparison && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{comparison.version1.version}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {comparison.version1.author.name} • {comparison.version1.createdAt.toLocaleDateString()}
                      </p>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{comparison.version2.version}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {comparison.version2.author.name} • {comparison.version2.createdAt.toLocaleDateString()}
                      </p>
                    </CardHeader>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Comparison Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{comparison.differences.statistics.totalChanges}</div>
                        <div className="text-sm text-muted-foreground">Total Changes</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          +{comparison.differences.added.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Additions</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          -{comparison.differences.removed.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Removals</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {comparison.differences.added.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-green-600">Added Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {comparison.differences.added.map((item, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {comparison.differences.removed.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-red-600">Removed Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {comparison.differences.removed.map((item, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {comparison.differences.modified.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-amber-600">Modified Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {comparison.differences.modified.map((item, index) => (
                          <div key={index} className="space-y-2">
                            <div className="bg-red-50 border border-red-200 rounded p-2">
                              <p className="text-sm font-mono">{item.original}</p>
                            </div>
                            <div className="text-center text-xs text-muted-foreground">↓</div>
                            <div className="bg-green-50 border border-green-200 rounded p-2">
                              <p className="text-sm font-mono">{item.updated}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default ContentVersionHistory;