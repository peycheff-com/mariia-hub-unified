import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { pl, enUS, ru, uk } from 'date-fns/locale';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Badge,
} from '@/components/ui/badge';
import {
  ScrollArea,
} from '@/components/ui/scroll-area';
import {
  Calendar,
} from '@/components/ui/calendar';
import {
  cn,
} from '@/lib/utils';

import { ContentCalendar as ContentCalendarType } from './types';

interface ContentCalendarProps {
  calendarItems: ContentCalendarType[];
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  selectedLanguage: string;
}

const dateLocales = {
  en: enUS,
  pl: pl,
  ru: ru,
  uk: uk,
};

export const ContentCalendar = React.memo<ContentCalendarProps>(({
  calendarItems,
  selectedDate,
  onDateSelect,
  selectedLanguage,
}) => {
  const { t, i18n } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'missed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getContentForDate = (date: Date) => {
    return calendarItems.filter(item => {
      const itemDate = new Date(item.publishDate);
      return itemDate.toDateString() === date.toDateString();
    });
  };

  const hasContentOnDate = (date: Date) => {
    return getContentForDate(date).length > 0;
  };

  const getUpcomingContent = () => {
    const now = new Date();
    return calendarItems
      .filter(item => new Date(item.publishDate) > now)
      .sort((a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime())
      .slice(0, 10);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.ai.contentManager.contentCalendar')}</CardTitle>
        <CardDescription>{t('admin.ai.contentManager.contentCalendarDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateSelect}
              className="rounded-md border"
              modifiers={{
                hasContent: hasContentOnDate,
              }}
              modifiersStyles={{
                hasContent: {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  borderRadius: '6px',
                },
              }}
            />
          </div>
          <div>
            <h3 className="font-semibold mb-4">{t('admin.ai.contentManager.scheduledContent')}</h3>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {getUpcomingContent().map((item) => (
                  <div key={item.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm line-clamp-2">
                          {item.content?.title?.[selectedLanguage] || 'Untitled Content'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(item.publishDate), 'dd MMM yyyy HH:mm', {
                            locale: dateLocales[i18n.language as keyof typeof dateLocales],
                          })}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.channels.map((channel) => (
                            <Badge key={channel} variant="outline" className="text-xs">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("ml-2", getStatusColor(item.status))}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {getUpcomingContent().length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No upcoming content scheduled</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ContentCalendar.displayName = 'ContentCalendar';