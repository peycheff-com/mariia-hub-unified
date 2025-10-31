import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Loader2,
  Save,
  Calendar as CalendarIcon2,
  Eye,
  Globe,
  Zap,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Button,
} from '@/components/ui/button';
import {
  Input,
} from '@/components/ui/input';
import {
  Label,
} from '@/components/ui/label';
import {
  Textarea,
} from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Calendar,
  Calendar as CalendarIcon,
} from '@/components/ui/calendar';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Separator,
} from '@/components/ui/separator';

import { ContentItem } from './types';
import { useContentTranslation } from './hooks/useContentTranslation';
import { useContentScheduler } from './hooks/useContentScheduler';

interface AIContentEditorProps {
  content: ContentItem | null;
  onClose: () => void;
  selectedLanguage: string;
  onContentUpdate: (content: ContentItem) => void;
}

export const AIContentEditor = React.memo<AIContentEditorProps>(({
  content,
  onClose,
  selectedLanguage,
  onContentUpdate,
}) => {
  const { t } = useTranslation();
  const { translateContent, isTranslating } = useContentTranslation();
  const { scheduleContent, isScheduling } = useContentScheduler();
  const [isSaving, setIsSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  if (!content) return null;

  const handleSaveContent = async (status: ContentItem['status']) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/content/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...content,
          status,
          updatedAt: new Date().toISOString(),
          version: content.version + 1,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success(t('admin.ai.content.savedSuccessfully'));
      onContentUpdate({ ...content, status, version: content.version + 1 });
    } catch (error) {
      console.error('Save failed:', error);
      toast.error(t('admin.ai.content.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSchedule = (date: Date) => {
    scheduleContent({
      content,
      publishDate: date,
      channels: ['website', 'email'],
    });
    setShowCalendar(false);
    onClose();
  };

  const handleTranslate = (targetLang: string) => {
    translateContent({
      content,
      targetLang,
      sourceLang: selectedLanguage,
    });
  };

  const updateContentField = (field: string, value: any) => {
    onContentUpdate({
      ...content,
      [field]: value,
    });
  };

  const updateContentLanguage = (field: 'title' | 'content', value: string) => {
    onContentUpdate({
      ...content,
      [field]: {
        ...content[field],
        [selectedLanguage]: value,
      },
    });
  };

  return (
    <Dialog open={!!content} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('admin.ai.contentManager.editContent')}</DialogTitle>
          <DialogDescription>
            {t('admin.ai.contentManager.editContentDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('admin.ai.contentManager.title')}</Label>
              <Input
                value={content.title[selectedLanguage] || ''}
                onChange={(e) => updateContentLanguage('title', e.target.value)}
              />
            </div>
            <div>
              <Label>{t('admin.ai.contentManager.slug')}</Label>
              <Input value={content.slug} disabled />
            </div>
          </div>

          <div>
            <Label>{t('admin.ai.contentManager.content')}</Label>
            <Textarea
              value={content.content[selectedLanguage] || ''}
              onChange={(e) => updateContentLanguage('content', e.target.value)}
              rows={15}
            />
          </div>

          <div className="flex items-center gap-2">
            <Label>Language</Label>
            <Select value={selectedLanguage}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="pl">Polski</SelectItem>
                <SelectItem value="ru">Русский</SelectItem>
                <SelectItem value="uk">Українська</SelectItem>
              </SelectContent>
            </Select>
            {content.aiGenerated && (
              <Badge variant="secondary" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                AI
              </Badge>
            )}
          </div>

          <Separator />

          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleSaveContent('draft')}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {t('admin.ai.contentManager.saveDraft')}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSaveContent('review')}
                disabled={isSaving}
              >
                {t('admin.ai.contentManager.submitForReview')}
              </Button>
            </div>
            <div className="flex gap-2">
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon2 className="w-4 h-4 mr-2" />
                    {t('admin.ai.contentManager.schedule')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={content.scheduledAt ? new Date(content.scheduledAt) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleSchedule(date);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={() => handleSaveContent('published')} disabled={isSaving}>
                {t('admin.ai.contentManager.publish')}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTranslate('pl')}
                disabled={isTranslating}
              >
                <Globe className="w-4 h-4 mr-2" />
                Translate to Polish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTranslate('ru')}
                disabled={isTranslating}
              >
                <Globe className="w-4 h-4 mr-2" />
                Translate to Russian
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTranslate('uk')}
                disabled={isTranslating}
              >
                <Globe className="w-4 h-4 mr-2" />
                Translate to Ukrainian
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

AIContentEditor.displayName = 'AIContentEditor';