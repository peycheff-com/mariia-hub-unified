import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, AlertCircle, Send, Eye, MessageSquare, History, Filter, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface ContentWorkflowProps {
  contentType?: 'blog' | 'service' | 'page' | 'all';
}

interface ContentItem {
  id: string;
  title: string;
  type: 'blog' | 'service' | 'page';
  status: 'draft' | 'review' | 'approved' | 'published' | 'scheduled' | 'rejected';
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  reviewer?: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  scheduledFor?: Date;
  excerpt: string;
  tags: string[];
  workflowHistory: WorkflowStep[];
  comments: WorkflowComment[];
}

interface WorkflowStep {
  id: string;
  status: string;
  actor: {
    id: string;
    name: string;
  };
  timestamp: Date;
  comment?: string;
  duration?: number; // Time spent in this step
}

interface WorkflowComment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: Date;
  type: 'review' | 'approval' | 'rejection' | 'general';
}

const ContentWorkflow: React.FC<ContentWorkflowProps> = ({ contentType = 'all' }) => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('queue');
  const [reviewComment, setReviewComment] = useState('');
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const { toast } = useToast();

  // Mock data - replace with actual Supabase queries
  useEffect(() => {
    const mockData: ContentItem[] = [
      {
        id: '1',
        title: 'Complete Guide to Lash Extensions',
        type: 'blog',
        status: 'review',
        author: {
          id: 'author-1',
          name: 'Anna Kowalska',
          avatar: '/avatars/anna.jpg'
        },
        reviewer: {
          id: 'reviewer-1',
          name: 'Maria Nowak',
          avatar: '/avatars/maria.jpg'
        },
        createdAt: new Date('2024-01-15T10:00:00'),
        updatedAt: new Date('2024-01-15T14:30:00'),
        excerpt: 'Everything you need to know about lash extensions, from preparation to aftercare...',
        tags: ['beauty', 'lashes', 'tutorial'],
        workflowHistory: [
          {
            id: 'wh-1',
            status: 'draft',
            actor: { id: 'author-1', name: 'Anna Kowalska' },
            timestamp: new Date('2024-01-15T10:00:00'),
            duration: 4.5
          },
          {
            id: 'wh-2',
            status: 'submitted',
            actor: { id: 'author-1', name: 'Anna Kowalska' },
            timestamp: new Date('2024-01-15T14:30:00'),
            comment: 'Ready for review'
          }
        ],
        comments: []
      },
      {
        id: '2',
        title: 'Brow Lamination Service',
        type: 'service',
        status: 'approved',
        author: {
          id: 'author-2',
          name: 'Elena Wiśniewska',
          avatar: '/avatars/elena.jpg'
        },
        createdAt: new Date('2024-01-14T09:00:00'),
        updatedAt: new Date('2024-01-14T16:00:00'),
        scheduledFor: new Date('2024-01-20T09:00:00'),
        excerpt: 'Professional brow lamination service with long-lasting results...',
        tags: ['beauty', 'brows', 'service'],
        workflowHistory: [
          {
            id: 'wh-3',
            status: 'draft',
            actor: { id: 'author-2', name: 'Elena Wiśniewska' },
            timestamp: new Date('2024-01-14T09:00:00'),
            duration: 7
          },
          {
            id: 'wh-4',
            status: 'approved',
            actor: { id: 'reviewer-1', name: 'Maria Nowak' },
            timestamp: new Date('2024-01-14T16:00:00'),
            comment: 'Great content, approved for publication'
          }
        ],
        comments: []
      },
      {
        id: '3',
        title: 'Skincare Tips for Winter',
        type: 'blog',
        status: 'draft',
        author: {
          id: 'author-3',
          name: 'Sophie Martin',
          avatar: '/avatars/sophie.jpg'
        },
        createdAt: new Date('2024-01-13T11:00:00'),
        updatedAt: new Date('2024-01-13T15:00:00'),
        excerpt: 'Essential skincare tips to protect your skin during winter months...',
        tags: ['skincare', 'winter', 'tips'],
        workflowHistory: [
          {
            id: 'wh-5',
            status: 'draft',
            actor: { id: 'author-3', name: 'Sophie Martin' },
            timestamp: new Date('2024-01-13T11:00:00'),
            duration: 4
          }
        ],
        comments: []
      }
    ];

    setContentItems(mockData);
  }, []);

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      review: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      published: 'bg-blue-100 text-blue-700',
      scheduled: 'bg-purple-100 text-purple-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      draft: Clock,
      review: Eye,
      approved: CheckCircle,
      published: Send,
      scheduled: Calendar,
      rejected: AlertCircle
    };
    return icons[status as keyof typeof icons] || Clock;
  };

  const filteredItems = contentItems.filter(item => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = contentType === 'all' || item.type === contentType;

    return matchesStatus && matchesSearch && matchesType;
  });

  const getItemsByTab = (tab: string) => {
    switch (tab) {
      case 'queue':
        return filteredItems.filter(item => item.status === 'draft' || item.status === 'review');
      case 'approved':
        return filteredItems.filter(item => item.status === 'approved' || item.status === 'scheduled');
      case 'published':
        return filteredItems.filter(item => item.status === 'published');
      case 'all':
        return filteredItems;
      default:
        return filteredItems;
    }
  };

  const handleApprove = async (item: ContentItem) => {
    try {
      // Update item status in database
      setContentItems(prev =>
        prev.map(i =>
          i.id === item.id
            ? {
                ...i,
                status: 'approved' as const,
                workflowHistory: [
                  ...i.workflowHistory,
                  {
                    id: `wh-${Date.now()}`,
                    status: 'approved',
                    actor: { id: 'current-user', name: 'Current User' },
                    timestamp: new Date(),
                    comment: reviewComment
                  }
                ]
              }
            : i
        )
      );

      toast({
        title: 'Content approved',
        description: `${item.title} has been approved and is ready for publication.`,
      });

      setReviewComment('');
      setIsReviewDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve content',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (item: ContentItem) => {
    try {
      setContentItems(prev =>
        prev.map(i =>
          i.id === item.id
            ? {
                ...i,
                status: 'rejected' as const,
                workflowHistory: [
                  ...i.workflowHistory,
                  {
                    id: `wh-${Date.now()}`,
                    status: 'rejected',
                    actor: { id: 'current-user', name: 'Current User' },
                    timestamp: new Date(),
                    comment: reviewComment
                  }
                ],
                comments: [
                  ...i.comments,
                  {
                    id: `comment-${Date.now()}`,
                    author: { id: 'current-user', name: 'Current User' },
                    content: reviewComment,
                    timestamp: new Date(),
                    type: 'rejection'
                  }
                ]
              }
            : i
        )
      );

      toast({
        title: 'Content rejected',
        description: `${item.title} has been returned to the author for revisions.`,
      });

      setReviewComment('');
      setIsReviewDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject content',
        variant: 'destructive',
      });
    }
  };

  const ContentCard = ({ item }: { item: ContentItem }) => {
    const StatusIcon = getStatusIcon(item.status);
    const timeInStatus = item.workflowHistory.length > 0
      ? Math.round((Date.now() - item.updatedAt.getTime()) / (1000 * 60 * 60)) // hours
      : 0;

    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getStatusColor(item.status)}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {item.status}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {item.type}
                </Badge>
                {timeInStatus > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {timeInStatus}h
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                {item.excerpt}
              </p>
            </div>
            <div className="flex gap-2">
              {(item.status === 'review' || item.status === 'draft') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem(item);
                    setIsReviewDialogOpen(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Review
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={item.author.avatar} />
                <AvatarFallback>{item.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{item.author.name}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {item.updatedAt.toLocaleDateString()}
            </div>
          </div>

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {item.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Workflow</h2>
          <p className="text-muted-foreground">Manage content approval and publishing workflow</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="review">In Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Workflow Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Queue ({getItemsByTab('queue').length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Approved ({getItemsByTab('approved').length})
          </TabsTrigger>
          <TabsTrigger value="published" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Published ({getItemsByTab('published').length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            All ({getItemsByTab('all').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          <div className="grid gap-4">
            {getItemsByTab(selectedTab).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No content found</h3>
                  <p className="text-muted-foreground">
                    {selectedTab === 'queue' && 'No content is currently waiting for review.'}
                    {selectedTab === 'approved' && 'No content has been approved yet.'}
                    {selectedTab === 'published' && 'No content has been published yet.'}
                    {selectedTab === 'all' && 'No content matches your current filters.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              getItemsByTab(selectedTab).map(item => (
                <ContentCard key={item.id} item={item} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Content</DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              {/* Content Preview */}
              <div className="border rounded-lg p-6 bg-muted/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">{selectedItem.title}</h3>
                  <Badge className={getStatusColor(selectedItem.status)}>
                    {selectedItem.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">{selectedItem.excerpt}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Author:</span> {selectedItem.author.name}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {selectedItem.type}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {selectedItem.createdAt.toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span> {selectedItem.updatedAt.toLocaleDateString()}
                  </div>
                </div>

                {selectedItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedItem.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Review Comment */}
              <div className="space-y-3">
                <label className="text-sm font-medium" htmlFor="review-comments">Review Comments</label>
                <Textarea
                  placeholder="Add your review comments..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsReviewDialogOpen(false);
                    setSelectedItem(null);
                    setReviewComment('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedItem)}
                >
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(selectedItem)}
                >
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentWorkflow;