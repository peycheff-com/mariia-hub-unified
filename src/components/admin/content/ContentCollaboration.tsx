import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users, MessageSquare, Clock, Eye, Edit3, Send, Reply, AtSign, Hash,
  Search, Filter, Bell, Settings, MoreVertical, UserPlus, UserMinus,
  Video, Phone, Monitor, Mic, MicOff, VideoOff, ScreenShare, StopCircle,
  FileText, Image as ImageIcon, Paperclip, Smile, MoreHorizontal,
  Circle, CheckCircle, AlertCircle, Lock, Unlock, Crown, Shield,
  Zap, Target, TrendingUp, Calendar, BarChart3, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'reviewer' | 'commenter' | 'viewer';
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canShare: boolean;
    canDelete: boolean;
  };
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  cursor?: {
    position: number;
    selection?: { start: number; end: number };
  };
  currentEdit?: {
    section: string;
    startedAt: Date;
  };
  activity: {
    type: 'viewing' | 'editing' | 'commenting' | 'idle';
    details: string;
    timestamp: Date;
  };
}

interface Comment {
  id: string;
  content: string;
  author: Collaborator;
  createdAt: Date;
  updatedAt?: Date;
  resolved: boolean;
  resolvedBy?: Collaborator;
  resolvedAt?: Date;
  replies: Comment[];
  mentions: Collaborator[];
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  section?: string;
  position?: {
    start: number;
    end: number;
    text: string;
  };
  reactions: {
    emoji: string;
    users: Collaborator[];
    count: number;
  }[];
}

interface Thread {
  id: string;
  title: string;
  description?: string;
  collaborators: Collaborator[];
  status: 'active' | 'resolved' | 'archived';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  createdBy: Collaborator;
  comments: Comment[];
  tags: string[];
  isPinned: boolean;
}

interface Activity {
  id: string;
  type: 'edit' | 'comment' | 'mention' | 'share' | 'join' | 'leave';
  actor: Collaborator;
  target?: string;
  details: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const ContentCollaboration: React.FC = () => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [activeTab, setActiveTab] = useState('collaborators');
  const [comments, setComments] = useState<Comment[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedCollaborators, setSelectedCollaborators] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'reviewer' | 'commenter' | 'viewer'>('editor');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const { toast } = useToast();

  // Mock data
  useEffect(() => {
    const mockCollaborators: Collaborator[] = [
      {
        id: 'user-1',
        name: 'Anna Kowalska',
        email: 'anna@example.com',
        avatar: '/avatars/anna.jpg',
        role: 'owner',
        permissions: {
          canEdit: true,
          canComment: true,
          canShare: true,
          canDelete: true
        },
        status: 'online',
        lastSeen: new Date(),
        cursor: {
          position: 1245,
          selection: { start: 1240, end: 1255 }
        },
        currentEdit: {
          section: 'Introduction',
          startedAt: new Date(Date.now() - 5 * 60 * 1000)
        },
        activity: {
          type: 'editing',
          details: 'Editing Introduction section',
          timestamp: new Date()
        }
      },
      {
        id: 'user-2',
        name: 'Maria Nowak',
        email: 'maria@example.com',
        avatar: '/avatars/maria.jpg',
        role: 'editor',
        permissions: {
          canEdit: true,
          canComment: true,
          canShare: true,
          canDelete: false
        },
        status: 'online',
        lastSeen: new Date(),
        activity: {
          type: 'viewing',
          details: 'Viewing Benefits section',
          timestamp: new Date()
        }
      },
      {
        id: 'user-3',
        name: 'Sophie Martin',
        email: 'sophie@example.com',
        avatar: '/avatars/sophie.jpg',
        role: 'reviewer',
        permissions: {
          canEdit: false,
          canComment: true,
          canShare: false,
          canDelete: false
        },
        status: 'away',
        lastSeen: new Date(Date.now() - 15 * 60 * 1000),
        activity: {
          type: 'commenting',
          details: 'Added comment to FAQ section',
          timestamp: new Date(Date.now() - 10 * 60 * 1000)
        }
      }
    ];

    const mockComments: Comment[] = [
      {
        id: 'comment-1',
        content: 'This section needs more details about the aftercare process. Could we add specific timeline information?',
        author: mockCollaborators[2],
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        resolved: false,
        replies: [
          {
            id: 'reply-1',
            content: 'Good point! I\'ll add a detailed aftercare timeline with specific day-by-day instructions.',
            author: mockCollaborators[0],
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
            resolved: false,
            replies: [],
            mentions: [mockCollaborators[2]],
            tags: [],
            priority: 'medium',
            reactions: []
          }
        ],
        mentions: [],
        tags: ['aftercare', 'improvement'],
        priority: 'medium',
        section: 'Aftercare Instructions',
        position: {
          start: 850,
          end: 920,
          text: 'After the treatment, follow these simple steps...'
        },
        reactions: [
          {
            emoji: '👍',
            users: [mockCollaborators[0], mockCollaborators[1]],
            count: 2
          }
        ]
      },
      {
        id: 'comment-2',
        content: 'The pricing section looks great! Very clear and comprehensive.',
        author: mockCollaborators[1],
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        resolved: true,
        resolvedBy: mockCollaborators[0],
        resolvedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        replies: [],
        mentions: [],
        tags: ['pricing', 'feedback'],
        priority: 'low',
        reactions: [
          {
            emoji: '❤️',
            users: [mockCollaborators[0]],
            count: 1
          }
        ]
      }
    ];

    const mockThreads: Thread[] = [
      {
        id: 'thread-1',
        title: 'Update Aftercare Section',
        description: 'Discussion about expanding the aftercare instructions with more detailed information',
        collaborators: [mockCollaborators[0], mockCollaborators[2]],
        status: 'active',
        priority: 'high',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        createdBy: mockCollaborators[2],
        comments: [mockComments[0]],
        tags: ['aftercare', 'content-update'],
        isPinned: true
      }
    ];

    const mockActivities: Activity[] = [
      {
        id: 'activity-1',
        type: 'edit',
        actor: mockCollaborators[0],
        target: 'Introduction section',
        details: 'Edited Introduction section',
        timestamp: new Date(Date.now() - 5 * 60 * 1000)
      },
      {
        id: 'activity-2',
        type: 'comment',
        actor: mockCollaborators[2],
        target: 'Aftercare section',
        details: 'Commented on aftercare instructions',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'activity-3',
        type: 'join',
        actor: mockCollaborators[1],
        details: 'Joined the document',
        timestamp: new Date(Date.now() - 30 * 60 * 1000)
      }
    ];

    setCollaborators(mockCollaborators);
    setComments(mockComments);
    setThreads(mockThreads);
    setActivities(mockActivities);
  }, []);

  const inviteCollaborator = useCallback(async () => {
    if (!inviteEmail) {
      toast({
        title: 'Email Required',
        description: 'Please enter an email address',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Simulate invitation process
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newCollaborator: Collaborator = {
        id: `user-${Date.now()}`,
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        permissions: {
          canEdit: inviteRole === 'editor' || inviteRole === 'owner',
          canComment: inviteRole !== 'viewer',
          canShare: inviteRole === 'editor' || inviteRole === 'owner',
          canDelete: inviteRole === 'owner'
        },
        status: 'offline',
        lastSeen: new Date(),
        activity: {
          type: 'idle',
          details: 'Invited to document',
          timestamp: new Date()
        }
      };

      setCollaborators(prev => [...prev, newCollaborator]);
      setInviteEmail('');
      setShowInviteDialog(false);

      toast({
        title: 'Invitation Sent',
        description: `Invitation sent to ${inviteEmail}`,
      });
    } catch (error) {
      toast({
        title: 'Invitation Failed',
        description: 'Unable to send invitation',
        variant: 'destructive'
      });
    }
  }, [inviteEmail, inviteRole, toast]);

  const addComment = useCallback(async () => {
    if (!newComment.trim()) return;

    try {
      const currentUser = collaborators[0]; // Assume first user is current user

      const comment: Comment = {
        id: `comment-${Date.now()}`,
        content: newComment,
        author: currentUser,
        createdAt: new Date(),
        resolved: false,
        replies: [],
        mentions: [],
        tags: [],
        priority: 'medium',
        reactions: []
      };

      setComments(prev => [comment, ...prev]);
      setNewComment('');

      // Add activity
      const activity: Activity = {
        id: `activity-${Date.now()}`,
        type: 'comment',
        actor: currentUser,
        details: 'Added a new comment',
        timestamp: new Date()
      };
      setActivities(prev => [activity, ...prev]);

      toast({
        title: 'Comment Added',
        description: 'Your comment has been added successfully',
      });
    } catch (error) {
      toast({
        title: 'Failed to Add Comment',
        description: 'Unable to add comment',
        variant: 'destructive'
      });
    }
  }, [newComment, collaborators, toast]);

  const addReply = useCallback(async (commentId: string) => {
    if (!replyText.trim()) return;

    try {
      const currentUser = collaborators[0];

      const reply: Comment = {
        id: `reply-${Date.now()}`,
        content: replyText,
        author: currentUser,
        createdAt: new Date(),
        resolved: false,
        replies: [],
        mentions: [],
        tags: [],
        priority: 'medium',
        reactions: []
      };

      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: [...comment.replies, reply]
          };
        }
        return comment;
      }));

      setReplyText('');
      setReplyingTo(null);

      toast({
        title: 'Reply Added',
        description: 'Your reply has been added successfully',
      });
    } catch (error) {
      toast({
        title: 'Failed to Add Reply',
        description: 'Unable to add reply',
        variant: 'destructive'
      });
    }
  }, [replyText, collaborators, toast]);

  const resolveComment = useCallback(async (commentId: string) => {
    try {
      const currentUser = collaborators[0];

      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            resolved: true,
            resolvedBy: currentUser,
            resolvedAt: new Date()
          };
        }
        return comment;
      }));

      toast({
        title: 'Comment Resolved',
        description: 'The comment has been marked as resolved',
      });
    } catch (error) {
      toast({
        title: 'Failed to Resolve',
        description: 'Unable to resolve comment',
        variant: 'destructive'
      });
    }
  }, [collaborators, toast]);

  const startVideoCall = useCallback(async () => {
    try {
      setIsVideoCallActive(true);
      toast({
        title: 'Video Call Started',
        description: 'Video call session has been initiated',
      });
    } catch (error) {
      toast({
        title: 'Failed to Start Call',
        description: 'Unable to start video call',
        variant: 'destructive'
      });
    }
  }, [toast]);

  const getStatusColor = (status: string) => {
    const colors = {
      online: 'bg-green-500',
      away: 'bg-amber-500',
      busy: 'bg-red-500',
      offline: 'bg-gray-400'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-400';
  };

  const getRoleIcon = (role: string) => {
    const icons = {
      owner: Crown,
      editor: Edit3,
      reviewer: Shield,
      commenter: MessageSquare,
      viewer: Eye
    };
    return icons[role as keyof typeof icons] || Users;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      owner: 'text-purple-600 bg-purple-100',
      editor: 'text-blue-600 bg-blue-100',
      reviewer: 'text-amber-600 bg-amber-100',
      commenter: 'text-green-600 bg-green-100',
      viewer: 'text-gray-600 bg-gray-100'
    };
    return colors[role as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const filteredCollaborators = collaborators.filter(collaborator => {
    const matchesSearch = collaborator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         collaborator.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || collaborator.role === filterRole;
    const matchesStatus = filterStatus === 'all' || collaborator.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const CollaboratorCard = ({ collaborator }: { collaborator: Collaborator }) => {
    const RoleIcon = getRoleIcon(collaborator.role);

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src={collaborator.avatar} />
                  <AvatarFallback>{collaborator.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(collaborator.status)}`}></div>
              </div>
              <div>
                <h3 className="font-medium">{collaborator.name}</h3>
                <p className="text-sm text-muted-foreground">{collaborator.email}</p>
              </div>
            </div>
            <Badge className={getRoleColor(collaborator.role)}>
              <RoleIcon className="w-3 h-3 mr-1" />
              {collaborator.role}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{collaborator.activity.details}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Last active {collaborator.lastSeen.toLocaleTimeString()}</span>
            </div>

            {collaborator.currentEdit && (
              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                <div className="flex items-center gap-2 text-sm">
                  <Edit3 className="w-3 h-3 text-blue-500" />
                  <span>Editing {collaborator.currentEdit.section}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Started {collaborator.currentEdit.startedAt.toLocaleTimeString()}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline">
                <MessageSquare className="w-3 h-3 mr-1" />
                Message
              </Button>
              <Button size="sm" variant="outline">
                <Video className="w-3 h-3 mr-1" />
                Call
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const CommentCard = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    return (
      <div className={`${isReply ? 'ml-8 border-l-2 border-muted pl-4' : ''} space-y-3`}>
        <Card className={`${comment.resolved ? 'opacity-60' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.author.avatar} />
                  <AvatarFallback>{comment.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{comment.author.name}</span>
                    <Badge variant={comment.priority === 'high' ? 'destructive' : comment.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                      {comment.priority}
                    </Badge>
                    {comment.resolved && (
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        Resolved
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{comment.createdAt.toLocaleDateString()}</span>
                    <span>{comment.createdAt.toLocaleTimeString()}</span>
                    {comment.section && (
                      <>
                        <span>•</span>
                        <span>{comment.section}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {!comment.resolved && (
                      <DropdownMenuItem onClick={() => resolveComment(comment.id)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Resolve
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Reply className="w-4 h-4 mr-2" />
                      Reply
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Users className="w-4 h-4 mr-2" />
                      Mention
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm">{comment.content}</p>

              {comment.position && (
                <div className="bg-muted/50 border rounded p-2">
                  <p className="text-xs font-mono text-muted-foreground">
                    "{comment.position.text.substring(0, 100)}..."
                  </p>
                </div>
              )}

              {comment.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {comment.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {comment.reactions.map((reaction, index) => (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <span className="text-xs">{reaction.emoji}</span>
                          <span className="text-xs ml-1">{reaction.count}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          {reaction.users.map(u => u.name).join(', ')}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>

                {!isReply && (
                  <div className="flex items-center gap-2">
                    {comment.replies.length > 0 && (
                      <Button variant="ghost" size="sm" className="text-xs">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {comment.replies.length} replies
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(comment.id)}
                    >
                      <Reply className="w-3 h-3 mr-1" />
                      Reply
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {replyingTo === comment.id && (
          <div className="ml-8 mt-2">
            <div className="flex gap-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                className="flex-1"
              />
              <div className="flex flex-col gap-2">
                <Button size="sm" onClick={() => addReply(comment.id)}>
                  <Send className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {comment.replies.map(reply => (
          <CommentCard key={reply.id} comment={reply} isReply />
        ))}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-500" />
              Content Collaboration
            </h2>
            <p className="text-muted-foreground">
              Real-time collaboration with your team
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={startVideoCall}
              disabled={isVideoCallActive}
            >
              <Video className="w-4 h-4 mr-2" />
              Start Call
            </Button>
            <Button onClick={() => setShowInviteDialog(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite
            </Button>
          </div>
        </div>

        {/* Active Call Controls */}
        {isVideoCallActive && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Video Call in Progress</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {collaborators.filter(c => c.status === 'online').length} participants
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isMuted ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant={isVideoOff ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setIsVideoOff(!isVideoOff)}
                  >
                    {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant={isScreenSharing ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setIsScreenSharing(!isScreenSharing)}
                  >
                    {isScreenSharing ? <StopCircle className="w-4 h-4" /> : <ScreenShare className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsVideoCallActive(false)}
                  >
                    <Phone className="w-4 h-4" />
                    End Call
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="threads">Threads</TabsTrigger>
          </TabsList>

          <TabsContent value="collaborators" className="space-y-6">
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search collaborators..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="reviewer">Reviewer</SelectItem>
                      <SelectItem value="commenter">Commenter</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="away">Away</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCollaborators.map(collaborator => (
                <CollaboratorCard key={collaborator.id} collaborator={collaborator} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="comments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Comment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Share your thoughts, suggestions, or feedback..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <AtSign className="w-4 h-4 mr-1" />
                      Mention
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Hash className="w-4 h-4 mr-1" />
                      Tag
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Paperclip className="w-4 h-4 mr-1" />
                      Attach
                    </Button>
                  </div>
                  <Button onClick={addComment} disabled={!newComment.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Post Comment
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {comments.map(comment => (
                <CommentCard key={comment.id} comment={comment} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={activity.actor.avatar} />
                        <AvatarFallback>{activity.actor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{activity.actor.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {activity.details}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {activity.timestamp.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="threads" className="space-y-6">
            <div className="space-y-4">
              {threads.map(thread => (
                <Card key={thread.id} className={thread.isPinned ? 'border-blue-200 bg-blue-50' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {thread.isPinned && (
                            <Target className="w-4 h-4 text-blue-500" />
                          )}
                          <h3 className="font-semibold text-lg">{thread.title}</h3>
                          <Badge variant={
                            thread.priority === 'high' ? 'destructive' :
                            thread.priority === 'medium' ? 'default' : 'secondary'
                          }>
                            {thread.priority}
                          </Badge>
                          <Badge variant="outline">{thread.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {thread.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Created by {thread.createdBy.name}</span>
                          <span>{thread.comments.length} comments</span>
                          <span>Updated {thread.updatedAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {thread.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {thread.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={thread.collaborators[0]?.avatar} />
                        <AvatarFallback>
                          {thread.collaborators[0]?.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {thread.collaborators.length > 1 && (
                        <div className="flex -space-x-2">
                          {thread.collaborators.slice(1, 3).map((collaborator, index) => (
                            <Avatar key={index} className="w-6 h-6 border-2 border-background">
                              <AvatarImage src={collaborator.avatar} />
                              <AvatarFallback className="text-xs">
                                {collaborator.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {thread.collaborators.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                              <span className="text-xs">+{thread.collaborators.length - 3}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Invite Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Collaborator</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block" htmlFor="email-address">Email Address</label>
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block" htmlFor="role">Role</label>
                <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor - Can edit and comment</SelectItem>
                    <SelectItem value="reviewer">Reviewer - Can comment only</SelectItem>
                    <SelectItem value="commenter">Commenter - Can comment only</SelectItem>
                    <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={inviteCollaborator}>
                  Send Invitation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default ContentCollaboration;