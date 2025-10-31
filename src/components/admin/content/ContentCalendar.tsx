import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { contentStrategyService } from '@/services/content-strategy.service';
import { ContentStrategyItem, ContentSeasonality, ContentPillar, TargetAudienceSegment } from '@/types/content-strategy';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Clock,
  MapPin,
  Users,
  Target,
  Sparkles,
  TrendingUp,
  CalendarDays,
  BarChart3,
  Settings,
  Eye,
  Edit,
  Trash2,
  Copy,
  Share2
} from 'lucide-react';

interface ContentCalendarProps {
  className?: string;
  language?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  content: ContentStrategyItem[];
  holidays?: string[];
  localEvents?: string[];
}

interface CalendarFilters {
  strategyType?: string[];
  contentPillar?: ContentPillar[];
  targetAudience?: TargetAudienceSegment[];
  seasonality?: ContentSeasonality[];
  status?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

const WARSAW_SEASAL_EVENTS = [
  { month: 1, events: ['New Year Beauty Resolutions', 'Winter Skin Care Workshops'] },
  { month: 2, events: ['Valentine\'s Beauty Prep', 'Warsaw Fashion Week'] },
  { month: 3, events: ['Spring Beauty Awakening', 'Easter Preparation'] },
  { month: 4, events: ['Spring Beauty Week', 'Outdoor Fitness Preparation'] },
  { month: 5, events: ['Summer Body Prep', 'Vistula Outdoor Activities'] },
  { month: 6, events: ['Summer Beauty Launch', 'Wedding Season Prep'] },
  { month: 7, events: ['Summer Care Tips', 'Holiday Beauty Planning'] },
  { month: 8, events: ['Late Summer Maintenance', 'Back to School Beauty'] },
  { month: 9, events: ['Autumn Wellness Start', 'Back to Fitness'] },
  { month: 10, events: ['Autumn Beauty Trends', 'Indoor Fitness Transition'] },
  { month: 11, events: ['Winter Preparation', 'Holiday Beauty Events'] },
  { month: 12, events: ['Holiday Glamour', 'New Year Planning'] }
];

const SEASONAL_COLORS = {
  spring_prep: 'bg-green-100 text-green-800 border-green-200',
  summer_ready: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  autumn_wellness: 'bg-orange-100 text-orange-800 border-orange-200',
  winter_recovery: 'bg-blue-100 text-blue-800 border-blue-200',
  holiday_season: 'bg-red-100 text-red-800 border-red-200',
  new_year: 'bg-purple-100 text-purple-800 border-purple-200',
  valentines_special: 'bg-pink-100 text-pink-800 border-pink-200',
  summer_body: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  winter_skin: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  year_round: 'bg-gray-100 text-gray-800 border-gray-200'
} as const;

export const ContentCalendar = ({ className, language = 'en' }: ContentCalendarProps) => {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [contentItems, setContentItems] = useState<ContentStrategyItem[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentStrategyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CalendarFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');

  // Load content data
  useEffect(() => {
    loadContentData();
  }, [currentMonth, filters]);

  const loadContentData = async () => {
    try {
      setLoading(true);

      // Calculate date range for the month
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      // Load content items for the current month view
      const searchResults = await contentStrategyService.searchContent({
        filters: {
          ...filters,
          date_range: {
            start: monthStart.toISOString(),
            end: monthEnd.toISOString()
          }
        },
        sort_by: 'publish_date',
        sort_order: 'asc',
        limit: 100,
        offset: 0
      });

      setContentItems(searchResults.results.map(r => r as any));
      setFilteredContent(searchResults.results.map(r => r as any));

      generateCalendarDays(monthStart, monthEnd, searchResults.results.map(r => r as any));
    } catch (error) {
      console.error('Failed to load content data:', error);
      toast.error(t('admin.content.calendar.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = (monthStart: Date, monthEnd: Date, content: ContentStrategyItem[]) => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const calendarDays: CalendarDay[] = days.map(date => {
      const dayContent = content.filter(item => {
        if (item.publish_date) {
          const publishDate = new Date(item.publish_date);
          return isSameDay(publishDate, date);
        }
        return false;
      });

      const monthEvents = WARSAW_SEASAL_EVENTS.find(e => e.month === date.getMonth());
      const holidays = getPolishHolidays(date);

      return {
        date,
        isCurrentMonth: isSameMonth(date, currentMonth),
        content: dayContent,
        localEvents: monthEvents?.events || [],
        holidays
      };
    });

    setCalendarDays(calendarDays);
  };

  const getPolishHolidays = (date: Date): string[] => {
    const holidays: string[] = [];
    const month = date.getMonth();
    const day = date.getDate();

    // Major Polish holidays
    if (month === 0 && day === 1) holidays.push('New Year\'s Day');
    if (month === 0 && day === 6) holidays.push('Epiphany');
    if (month === 4 && day === 1) holidays.push('Labor Day');
    if (month === 4 && day === 3) holidays.push('Constitution Day');
    if (month === 7 && day === 15) holidays.push('Armed Forces Day');
    if (month === 10 && day === 1) holidays.push('All Saints\' Day');
    if (month === 10 && day === 11) holidays.push('Independence Day');
    if (month === 11 && day === 25) holidays.push('Christmas Day');
    if (month === 11 && day === 26) holidays.push('St. Stephen\'s Day');

    return holidays;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev =>
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const handleFilterChange = (filterType: keyof CalendarFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
    toast.success(t('admin.content.calendar.filtersCleared'));
  };

  const exportCalendar = () => {
    // Export calendar data as CSV or iCal
    const csvContent = generateCSVExport();
    downloadFile(csvContent, 'content-calendar.csv', 'text/csv');
    toast.success(t('admin.content.calendar.exported'));
  };

  const generateCSVExport = (): string => {
    const headers = ['Date', 'Title', 'Type', 'Status', 'Pillar', 'Audience', 'Seasonality'];
    const rows = filteredContent.map(item => [
      item.publish_date || '',
      item.title,
      item.content_type,
      item.status,
      '', // pillar - would need to join with strategy
      '', // audience - would need to join with strategy
      '' // seasonality - would need to join with strategy
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getContentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planned: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      draft: 'bg-yellow-100 text-yellow-800',
      review: 'bg-orange-100 text-orange-800',
      approved: 'bg-green-100 text-green-800',
      scheduled: 'bg-purple-100 text-purple-800',
      published: 'bg-emerald-100 text-emerald-800',
      promoted: 'bg-indigo-100 text-indigo-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const renderCalendarView = () => (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {format(currentMonth, 'MMMM yyyy', { locale: language === 'pl' ? pl : undefined })}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            {t('admin.content.calendar.monthView')}
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {t('admin.content.calendar.weekView')}
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('admin.content.calendar.listView')}
          </Button>
        </div>
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Weekday headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
              {t(`admin.content.calendar.days.${day.toLowerCase()}`)}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={cn(
                'bg-white p-2 min-h-[120px] cursor-pointer hover:bg-gray-50 transition-colors',
                !day.isCurrentMonth && 'bg-gray-50 text-gray-400',
                selectedDate && isSameDay(day.date, selectedDate) && 'ring-2 ring-blue-500'
              )}
              onClick={() => setSelectedDate(day.date)}
            >
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <span className={cn(
                    'text-sm font-medium',
                    !day.isCurrentMonth && 'text-gray-400'
                  )}>
                    {format(day.date, 'd')}
                  </span>
                  {day.holidays?.length > 0 && (
                    <div className="w-2 h-2 bg-red-500 rounded-full" title={day.holidays.join(', ')} />
                  )}
                </div>

                {/* Content items */}
                <div className="space-y-1">
                  {day.content.slice(0, 3).map((content, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'text-xs p-1 rounded truncate cursor-pointer hover:opacity-80',
                        getContentStatusColor(content.status)
                      )}
                      title={content.title}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Open content details
                      }}
                    >
                      {content.title}
                    </div>
                  ))}
                  {day.content.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{day.content.length - 3} more
                    </div>
                  )}
                </div>

                {/* Local events */}
                {day.localEvents?.slice(0, 1).map((event, idx) => (
                  <div
                    key={idx}
                    className="text-xs bg-purple-100 text-purple-800 p-1 rounded truncate"
                    title={event}
                  >
                    🎉 {event}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredContent.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('admin.content.calendar.noContent')}
            </div>
          ) : (
            filteredContent.map((content) => (
              <Card key={content.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{content.title}</h3>
                        <Badge className={getContentStatusColor(content.status)}>
                          {content.status}
                        </Badge>
                        <Badge variant="outline">
                          {content.content_type}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        {content.publish_date && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {format(new Date(content.publish_date), 'MMM d, yyyy')}
                          </div>
                        )}
                        {content.word_count_target && (
                          <div className="flex items-center gap-1">
                            <Edit className="h-4 w-4" />
                            {content.word_count_target} words
                          </div>
                        )}
                        {content.assigned_to && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Assigned
                          </div>
                        )}
                      </div>

                      {content.key_messages && (
                        <div className="flex flex-wrap gap-1">
                          {content.key_messages.slice(0, 3).map((message, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {message}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );

  const renderFilters = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          {t('admin.content.calendar.filters')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block" htmlFor="t-admin-content-calendar-status">
            {t('admin.content.calendar.status')}
          </label>
          <Select
            value={filters.status?.[0] || ''}
            onValueChange={(value) => handleFilterChange('status', value ? [value] : [])}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('admin.content.calendar.selectStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="promoted">Promoted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content Type Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block" htmlFor="t-admin-content-calendar-contenttype">
            {t('admin.content.calendar.contentType')}
          </label>
          <Select
            value={filters.strategyType?.[0] || ''}
            onValueChange={(value) => handleFilterChange('strategyType', value ? [value] : [])}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('admin.content.calendar.selectType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thought_leadership">Thought Leadership</SelectItem>
              <SelectItem value="educational">Educational</SelectItem>
              <SelectItem value="seasonal_campaign">Seasonal Campaign</SelectItem>
              <SelectItem value="local_warsaw_focus">Local Warsaw Focus</SelectItem>
              <SelectItem value="trend_forecasting">Trend Forecasting</SelectItem>
              <SelectItem value="expert_interviews">Expert Interviews</SelectItem>
              <SelectItem value="case_studies">Case Studies</SelectItem>
              <SelectItem value="research_analysis">Research Analysis</SelectItem>
              <SelectItem value="industry_insights">Industry Insights</SelectItem>
              <SelectItem value="community_spotlight">Community Spotlight</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Seasonality Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block" htmlFor="t-admin-content-calendar-seasonality">
            {t('admin.content.calendar.seasonality')}
          </label>
          <Select
            value={filters.seasonality?.[0] || ''}
            onValueChange={(value) => handleFilterChange('seasonality', value ? [value] : [])}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('admin.content.calendar.selectSeasonality')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spring_prep">Spring Preparation</SelectItem>
              <SelectItem value="summer_ready">Summer Ready</SelectItem>
              <SelectItem value="autumn_wellness">Autumn Wellness</SelectItem>
              <SelectItem value="winter_recovery">Winter Recovery</SelectItem>
              <SelectItem value="holiday_season">Holiday Season</SelectItem>
              <SelectItem value="new_year">New Year</SelectItem>
              <SelectItem value="valentines_special">Valentine's Special</SelectItem>
              <SelectItem value="summer_body">Summer Body</SelectItem>
              <SelectItem value="winter_skin">Winter Skin</SelectItem>
              <SelectItem value="year_round">Year Round</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={clearFilters} className="flex-1">
            {t('common.clear')}
          </Button>
          <Button onClick={exportCalendar} className="flex-1">
            <Share2 className="h-4 w-4 mr-2" />
            {t('admin.content.calendar.export')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderAnalytics = () => {
    const totalContent = filteredContent.length;
    const publishedContent = filteredContent.filter(c => c.status === 'published').length;
    const scheduledContent = filteredContent.filter(c => c.status === 'scheduled').length;
    const inProgressContent = filteredContent.filter(c => c.status === 'in_progress').length;

    const contentTypeDistribution = filteredContent.reduce((acc, content) => {
      const type = content.content_type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{totalContent}</p>
                  <p className="text-sm text-gray-600">Total Content</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{publishedContent}</p>
                  <p className="text-sm text-gray-600">Published</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{scheduledContent}</p>
                  <p className="text-sm text-gray-600">Scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Edit className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{inProgressContent}</p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Content Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(contentTypeDistribution).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{type.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(count / totalContent) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading content calendar...</div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-primary" />
            {t('admin.content.calendar.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('admin.content.calendar.description')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {t('admin.content.calendar.filters')}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.content.calendar.addContent')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('admin.content.calendar.addNewContent')}</DialogTitle>
                <DialogDescription>
                  {t('admin.content.calendar.addContentDescription')}
                </DialogDescription>
              </DialogHeader>
              {/* Content creation form would go here */}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Local Events Banner */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-purple-600" />
            <span className="font-medium text-purple-900">
              Warsaw Events this month:
            </span>
            <div className="flex flex-wrap gap-2">
              {WARSAW_SEASAL_EVENTS.find(e => e.month === currentMonth.getMonth())?.events.map((event, idx) => (
                <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-800">
                  🎉 {event}
                </Badge>
              )) || (
                <span className="text-sm text-purple-700">No special events this month</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:col-span-1">
            {renderFilters()}
          </div>
        )}

        {/* Calendar/Analytics */}
        <div className={cn(showFilters ? "lg:col-span-3" : "lg:col-span-4")}>
          <Tabs defaultValue="calendar" className="space-y-4">
            <TabsList>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {t('admin.content.calendar.calendar')}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                {t('admin.content.calendar.analytics')}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t('admin.content.calendar.settings')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar">
              {renderCalendarView()}
            </TabsContent>

            <TabsContent value="analytics">
              {renderAnalytics()}
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.content.calendar.settings')}</CardTitle>
                  <CardDescription>
                    {t('admin.content.calendar.settingsDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block" htmlFor="default-view">
                        Default View
                      </label>
                      <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="month">Month View</SelectItem>
                          <SelectItem value="week">Week View</SelectItem>
                          <SelectItem value="list">List View</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block" htmlFor="language">
                        Language
                      </label>
                      <Select value={language} disabled>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="pl">Polski</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4">
                      <Button onClick={exportCalendar} className="w-full">
                        <Share2 className="h-4 w-4 mr-2" />
                        Export Calendar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ContentCalendar;