import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { pl, enUS, ru, uk } from 'date-fns/locale';
import {
  MoreVertical,
  Edit3,
  BarChart3,
  FileText,
  Sparkles,
  Send,
  Share2,
  Globe,
  Eye,
  Heart,
  Share as ShareIcon,
  Zap,
} from 'lucide-react';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Badge,
} from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Button,
} from '@/components/ui/button';

import { ContentItem } from './types';

interface ContentTableProps {
  contentList: ContentItem[];
  onContentSelect: (content: ContentItem) => void;
  onGenerateImage: (content: ContentItem) => void;
  onTranslateContent: (content: ContentItem, lang: string) => void;
  selectedLanguage: string;
}

const dateLocales = {
  en: enUS,
  pl: pl,
  ru: ru,
  uk: uk,
};

export const ContentTable = React.memo<ContentTableProps>(({
  contentList,
  onContentSelect,
  onGenerateImage,
  onTranslateContent,
  selectedLanguage,
}) => {
  const { t, i18n } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blog-post': return <FileText className="w-4 h-4" />;
      case 'service-description': return <Sparkles className="w-4 h-4" />;
      case 'email': return <Send className="w-4 h-4" />;
      case 'social-media': return <Share2 className="w-4 h-4" />;
      case 'translation': return <Globe className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('admin.ai.contentManager.title')}</TableHead>
            <TableHead>{t('admin.ai.contentManager.type')}</TableHead>
            <TableHead>{t('admin.ai.contentManager.status')}</TableHead>
            <TableHead>{t('admin.ai.contentManager.author')}</TableHead>
            <TableHead>{t('admin.ai.contentManager.updated')}</TableHead>
            <TableHead>{t('admin.ai.contentManager.performance')}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {contentList.map((content) => (
            <TableRow
              key={content.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onContentSelect(content)}
            >
              <TableCell>
                <div>
                  <p className="font-medium">{content.title[content.language] || content.title.en}</p>
                  <p className="text-sm text-muted-foreground truncate max-w-xs">
                    {content.content[content.language] || content.content.en}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getTypeIcon(content.type)}
                  <span className="capitalize">{content.type.replace('-', ' ')}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusColor(content.status)}>
                  {content.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={content.authorAvatar} />
                    <AvatarFallback>{content.author[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{content.author}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(content.updatedAt), 'dd MMM yyyy')}
                </span>
              </TableCell>
              <TableCell>
                {content.analytics ? (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {content.analytics.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {content.analytics.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShareIcon className="w-3 h-3" />
                      {content.analytics.shares}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {content.aiGenerated && (
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      AI
                    </Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onContentSelect(content); }}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        {t('admin.ai.contentManager.viewAnalytics')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onGenerateImage(content); }}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {t('admin.ai.contentManager.generateImage')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
});

ContentTable.displayName = 'ContentTable';