import React from 'react';
import { useTranslation } from 'react-i18next';
import { format, addDays, startOfWeek, addWeeks, isSameDay, isToday, isPast, isFuture } from 'date-fns';
import { pl, enUS, ru, uk } from 'date-fns/locale';
import { Calendar, Clock, ChevronLeft, ChevronRight, Plus, Edit, Trash2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { ContentCalendar as ContentCalendarType } from './types';

interface ContentCalendarProps {
  calendarEvents: ContentCalendarType[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onAddEvent: (date: Date) => void;
  onEditEvent: (event: ContentCalendarType) => void;
  onDeleteEvent: (eventId: string) => void;
}

const dateLocales = {
  pl,
  en: enUS,
  ru,
  uk,
};

export function ContentCalendar({
  calendarEvents,
  currentDate,
  onDateChange,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
}: ContentCalendarProps) {
  const { t, i18n } = useTranslation();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return '📧';
      case 'social':
        return '📱';
      case 'sms':
        return '💬';
      case 'push':
        return '🔔';
      default:
        return '📢';
    }
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayEvents = calendarEvents.filter((event) =>
            isSameDay(new Date(event.scheduledDate), day)
          );

          return (
            <div
              key={day.toISOString()}
              className={`
                border rounded-lg p-2 min-h-[100px] cursor-pointer transition-colors
                ${isToday(day) ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'border-gray-200'}
                ${isPast(day) && !isToday(day) ? 'bg-gray-50 dark:bg-gray-900/20' : ''}
                hover:bg-gray-100 dark:hover:bg-gray-800/50
              `}
              onClick={() => onAddEvent(day)}
            >
              <div className="text-sm font-medium mb-1">
                {format(day, 'EEE', { locale: dateLocales[i18n.language as keyof typeof dateLocales] })}
              </div>
              <div className={`text-lg mb-2 ${isToday(day) ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs p-1 rounded bg-white dark:bg-gray-800 border cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEvent(event);
                    }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <span>{getChannelIcon(event.channels[0])}</span>
                      <Badge className={`text-xs ${getPriorityColor(event.priority)}`}>
                        {t(`admin.ai.contentManager.priority.${event.priority}`)}
                      </Badge>
                    </div>
                    <div className="truncate text-gray-600 dark:text-gray-400">
                      {format(new Date(event.scheduledDate), 'HH:mm')}
                    </div>
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayEvents.length - 2} {t('admin.ai.contentManager.more')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = startOfWeek(firstDay, { weekStartsOn: 1 });
    const endDate = addWeeks(startDate, 5);

    const days = [];
    for (let d = startDate; d <= endDate; d = addDays(d, 1)) {
      days.push(d);
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center text-sm font-medium p-2 text-gray-600 dark:text-gray-400">
            {t(`admin.ai.contentManager.days.${day.toLowerCase()}`)}
          </div>
        ))}
        {days.map((day) => {
          const dayEvents = calendarEvents.filter((event) =>
            isSameDay(new Date(event.scheduledDate), day)
          );

          return (
            <div
              key={day.toISOString()}
              className={`
                border rounded p-2 min-h-[80px] cursor-pointer transition-colors
                ${day.getMonth() !== month ? 'bg-gray-50 text-gray-400 dark:bg-gray-900/20 dark:text-gray-600' : ''}
                ${isToday(day) ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'border-gray-200'}
                ${isPast(day) && !isToday(day) ? 'bg-gray-50 dark:bg-gray-900/20' : ''}
                hover:bg-gray-100 dark:hover:bg-gray-800/50
              `}
              onClick={() => onAddEvent(day)}
            >
              <div className={`text-sm mb-1 ${isToday(day) ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs p-1 rounded bg-white dark:bg-gray-800 border cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEvent(event);
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>{getChannelIcon(event.channels[0])}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        event.priority === 'urgent' ? 'bg-red-500' :
                        event.priority === 'high' ? 'bg-orange-500' :
                        event.priority === 'medium' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`} />
                    </div>
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayEvents.length - 2}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const upcomingEvents = calendarEvents
    .filter(event => isFuture(new Date(event.scheduledDate)))
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('admin.ai.contentManager.contentCalendar')}</h3>
          <p className="text-sm text-muted-foreground">
            {format(currentDate, 'MMMM yyyy', { locale: dateLocales[i18n.language as keyof typeof dateLocales] })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(addDays(currentDate, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(new Date())}
          >
            {t('admin.ai.contentManager.today')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(addDays(currentDate, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={() => onAddEvent(currentDate)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.ai.contentManager.addEvent')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('admin.ai.contentManager.weekView')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderWeekView()}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>{t('admin.ai.contentManager.monthView')}</CardTitle>
            </CardHeader>
            <CardContent>
              {renderMonthView()}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('admin.ai.contentManager.upcomingEvents')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('admin.ai.contentManager.noUpcomingEvents')}
                </p>
              ) : (
                upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => onEditEvent(event)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{getChannelIcon(event.channels[0])}</span>
                        <Badge className={`text-xs ${getPriorityColor(event.priority)}`}>
                          {t(`admin.ai.contentManager.priority.${event.priority}`)}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditEvent(event);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteEvent(event.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm font-medium mb-1">
                      {format(new Date(event.scheduledDate), 'PPP', {
                        locale: dateLocales[i18n.language as keyof typeof dateLocales],
                      })}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {format(new Date(event.scheduledDate), 'HH:mm')}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge className={`text-xs ${getStatusColor(event.status)}`}>
                        {t(`admin.ai.contentManager.status.${event.status}`)}
                      </Badge>
                      {event.channels.map((channel) => (
                        <Badge key={channel} variant="outline" className="text-xs">
                          {t(`admin.ai.contentManager.channels.${channel}`)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('admin.ai.contentManager.legend')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>{t('admin.ai.contentManager.priority.urgent')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span>{t('admin.ai.contentManager.priority.high')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>{t('admin.ai.contentManager.priority.medium')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span>{t('admin.ai.contentManager.priority.low')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}