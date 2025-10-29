import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { pl, enUS, ru, uk } from 'date-fns/locale';
import { Eye, Edit, Trash2, Calendar, Share2, TrendingUp, Search, Filter, Grid, List } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { ContentItem } from './types';

interface ContentListProps {
  contents: ContentItem[];
  viewMode: 'grid' | 'list';
  filterStatus: string;
  filterType: string;
  searchTerm: string;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onFilterStatusChange: (status: string) => void;
  onFilterTypeChange: (type: string) => void;
  onSearchChange: (term: string) => void;
  onEditContent: (content: ContentItem) => void;
  onDeleteContent: (contentId: string) => void;
  onScheduleContent: (content: ContentItem) => void;
  onPublishContent: (content: ContentItem) => void;
  onPreviewContent: (content: ContentItem) => void;
  onShareContent: (content: ContentItem) => void;
}

const dateLocales = {
  pl,
  en: enUS,
  ru,
  uk,
};

export function ContentList({
  contents,
  viewMode,
  filterStatus,
  filterType,
  searchTerm,
  onViewModeChange,
  onFilterStatusChange,
  onFilterTypeChange,
  onSearchChange,
  onEditContent,
  onDeleteContent,
  onScheduleContent,
  onPublishContent,
  onPreviewContent,
  onShareContent,
}: ContentListProps) {
  const { t, i18n } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'archived':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blog':
        return '📝';
      case 'service':
        return '💅';
      case 'social':
        return '📱';
      case 'newsletter':
        return '📧';
      default:
        return '📄';
    }
  };

  const filteredContents = contents.filter((content) => {
    const matchesStatus = filterStatus === 'all' || content.status === filterStatus;
    const matchesType = filterType === 'all' || content.type === filterType;
    const matchesSearch = searchTerm === '' ||
      content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesType && matchesSearch;
  });

  const ContentCard = ({ content }: { content: ContentItem }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getTypeIcon(content.type)}</span>
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2">{content.title}</CardTitle>
              <CardDescription className="line-clamp-2 mt-1">
                {content.excerpt}
              </CardDescription>
            </div>
          </div>
          <Badge className={getStatusColor(content.status)}>
            {t(`admin.ai.contentManager.status.${content.status}`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <span>{t('admin.ai.contentManager.by', { author: content.author })}</span>
          <span>
            {format(new Date(content.updatedAt), 'PPP', {
              locale: dateLocales[i18n.language as keyof typeof dateLocales],
            })}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {content.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {content.tags?.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{content.tags.length - 3}
            </Badge>
          )}
        </div>

        {content.analytics && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {content.analytics.views}
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {content.analytics.engagementRate}%
            </div>
            <div className="flex items-center gap-1">
              <Share2 className="h-3 w-3" />
              {content.analytics.shares}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPreviewContent(content)}
            className="h-8 px-2"
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditContent(content)}
            className="h-8 px-2"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onShareContent(content)}
            className="h-8 px-2"
          >
            <Share2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onScheduleContent(content)}
            className="h-8 px-2"
          >
            <Calendar className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteContent(content.id)}
            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('admin.ai.contentManager.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={onFilterStatusChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.ai.contentManager.allStatuses')}</SelectItem>
                  <SelectItem value="draft">{t('admin.ai.contentManager.status.draft')}</SelectItem>
                  <SelectItem value="published">{t('admin.ai.contentManager.status.published')}</SelectItem>
                  <SelectItem value="scheduled">{t('admin.ai.contentManager.status.scheduled')}</SelectItem>
                  <SelectItem value="archived">{t('admin.ai.contentManager.status.archived')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={onFilterTypeChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.ai.contentManager.allTypes')}</SelectItem>
                  <SelectItem value="blog">{t('admin.ai.contentManager.blogPost')}</SelectItem>
                  <SelectItem value="service">{t('admin.ai.contentManager.serviceDescription')}</SelectItem>
                  <SelectItem value="social">{t('admin.ai.contentManager.socialMedia')}</SelectItem>
                  <SelectItem value="newsletter">{t('admin.ai.contentManager.newsletter')}</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('grid')}
                  className="h-9 w-9 p-0"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('list')}
                  className="h-9 w-9 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
        {filteredContents.map((content) => (
          <ContentCard key={content.id} content={content} />
        ))}
      </div>

      {filteredContents.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-muted-foreground text-sm">
                {t('admin.ai.contentManager.noContentFound')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}