import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Star,
  Tag,
  User,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Heart
} from 'lucide-react';
import { debounce } from 'lodash';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Service, ServiceType, ServiceCategory } from '@/types/booking';
import { searchService } from '@/services/search.service';

const searchSchema = z.object({
  query: z.string().optional(),
  type: z.enum(['beauty', 'fitness', 'lifestyle']).optional(),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minDuration: z.number().optional(),
  maxDuration: z.number().optional(),
  minRating: z.number().min(0).max(5).optional(),
  location: z.string().optional(),
  features: z.array(z.string()).optional(),
  availability: z.enum(['today', 'tomorrow', 'this_week', 'next_week', 'any']).optional(),
  sortBy: z.enum(['relevance', 'price_low', 'price_high', 'rating', 'popularity', 'newest']).default('relevance'),
});

type SearchFormData = z.infer<typeof searchSchema>;

interface AdvancedSearchProps {
  onSearch: (results: Service[]) => void;
  loading?: boolean;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ onSearch, loading = false }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: '',
      sortBy: 'relevance',
      minPrice: 0,
      maxPrice: 1000,
      minDuration: 15,
      maxDuration: 300,
      minRating: 0,
    },
  });

  // Fetch search suggestions
  const { data: suggestions } = useQuery({
    queryKey: ['search-suggestions', form.watch('query')],
    queryFn: () => searchService.getSuggestions(form.watch('query') || ''),
    enabled: !!form.watch('query') && form.watch('query')!.length > 2,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch popular searches
  const { data: popularSearches } = useQuery({
    queryKey: ['popular-searches'],
    queryFn: () => searchService.getPopularSearches(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['service-categories'],
    queryFn: () => searchService.getCategories(),
    staleTime: 30 * 60 * 1000,
  });

  // Fetch features
  const { data: features } = useQuery({
    queryKey: ['service-features'],
    queryFn: () => searchService.getFeatures(),
    staleTime: 30 * 60 * 1000,
  });

  // Debounced search
  const debouncedSearch = debounce((searchData: SearchFormData) => {
    performSearch(searchData);
  }, 500);

  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.query || value.type || value.category) {
        debouncedSearch(value as SearchFormData);
        updateActiveFilters(value as SearchFormData);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const performSearch = async (searchData: SearchFormData) => {
    try {
      const results = await searchService.advancedSearch(searchData);
      onSearch(results);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const updateActiveFilters = (data: SearchFormData) => {
    const filters: string[] = [];
    if (data.type) filters.push(t(`search.types.${data.type}`));
    if (data.category) filters.push(data.category);
    if (data.minPrice || data.maxPrice) {
      filters.push(`${data.minPrice} - ${data.maxPrice} PLN`);
    }
    if (data.minRating) filters.push(`${data.minRating}+ ${t('search.stars')}`);
    if (data.location) filters.push(data.location);
    setActiveFilters(filters);
  };

  const handleQuickSearch = (query: string) => {
    form.setValue('query', query);
    performSearch({ ...form.getValues(), query });
  };

  const clearFilters = () => {
    form.reset();
    setActiveFilters([]);
    performSearch({
      query: '',
      sortBy: 'relevance',
    });
  };

  const serviceTypes = [
    { value: 'beauty', label: t('search.types.beauty'), icon: '💄' },
    { value: 'fitness', label: t('search.types.fitness'), icon: '💪' },
    { value: 'lifestyle', label: t('search.types.lifestyle'), icon: '✨' },
  ];

  const sortOptions = [
    { value: 'relevance', label: t('search.sort.relevance') },
    { value: 'price_low', label: t('search.sort.priceLow') },
    { value: 'price_high', label: t('search.sort.priceHigh') },
    { value: 'rating', label: t('search.sort.rating') },
    { value: 'popularity', label: t('search.sort.popularity') },
    { value: 'newest', label: t('search.sort.newest') },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Main Search Bar */}
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(performSearch)} className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <FormField
                    control={form.control}
                    name="query"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder={t('search.placeholder')}
                            className="pl-10 text-lg h-12"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Search Suggestions */}
                  {suggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10">
                      {suggestions.slice(0, 5).map((suggestion: string, index: number) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleQuickSearch(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Search className="h-4 w-4 text-gray-400" />
                          <span>{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button type="submit" size="lg" disabled={loading} className="lg:px-8">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('search.searching')}
                    </div>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      {t('search.search')}
                    </>
                  )}
                </Button>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2">
                {serviceTypes.map((type) => (
                  <Button
                    key={type.value}
                    type="button"
                    variant={form.watch('type') === type.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const currentType = form.watch('type');
                      form.setValue('type', currentType === type.value ? undefined : type.value as ServiceType);
                    }}
                    className="flex items-center gap-2"
                  >
                    <span>{type.icon}</span>
                    {type.label}
                  </Button>
                ))}
                <Separator orientation="vertical" className="mx-2" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {t('search.advancedFilters')}
                  <ChevronDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
                </Button>
              </div>

              {/* Active Filters */}
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600">{t('search.activeFilters')}:</span>
                  {activeFilters.map((filter, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {filter}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          // Remove specific filter logic here
                          clearFilters();
                        }}
                      />
                    </Badge>
                  ))}
                  <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                    {t('search.clearAll')}
                  </Button>
                </div>
              )}

              {/* Advanced Filters */}
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleContent className="space-y-6 pt-6 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Service Type */}
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('search.filters.serviceType')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('search.selectType')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {serviceTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <span>{type.icon}</span>
                                    {type.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Category */}
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('search.filters.category')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('search.selectCategory')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map((category: string) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Location */}
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('search.filters.location')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('search.enterLocation')}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Price Range */}
                    <div className="space-y-2">
                      <FormLabel>{t('search.filters.priceRange')}</FormLabel>
                      <div className="px-2">
                        <Slider
                          value={[form.watch('minPrice') || 0, form.watch('maxPrice') || 1000]}
                          onValueChange={([min, max]) => {
                            form.setValue('minPrice', min);
                            form.setValue('maxPrice', max);
                          }}
                          max={1000}
                          step={10}
                          className="w-full"
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{form.watch('minPrice')} PLN</span>
                        <span>{form.watch('maxPrice')} PLN</span>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="space-y-2">
                      <FormLabel>{t('search.filters.duration')}</FormLabel>
                      <div className="px-2">
                        <Slider
                          value={[form.watch('minDuration') || 15, form.watch('maxDuration') || 300]}
                          onValueChange={([min, max]) => {
                            form.setValue('minDuration', min);
                            form.setValue('maxDuration', max);
                          }}
                          min={15}
                          max={300}
                          step={15}
                          className="w-full"
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{form.watch('minDuration')} min</span>
                        <span>{form.watch('maxDuration')} min</span>
                      </div>
                    </div>

                    {/* Rating */}
                    <FormField
                      control={form.control}
                      name="minRating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('search.filters.minRating')}</FormLabel>
                          <div className="flex items-center gap-2">
                            <Slider
                              value={[field.value || 0]}
                              onValueChange={([value]) => field.onChange(value)}
                              max={5}
                              step={0.5}
                              className="flex-1"
                            />
                            <span className="text-sm text-gray-600 w-12">
                              {field.value || 0}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  'h-4 w-4',
                                  star <= (field.value || 0)
                                    ? 'text-amber-400 fill-current'
                                    : 'text-gray-300'
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Availability */}
                    <FormField
                      control={form.control}
                      name="availability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('search.filters.availability')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('search.anyTime')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="today">{t('search.availability.today')}</SelectItem>
                              <SelectItem value="tomorrow">{t('search.availability.tomorrow')}</SelectItem>
                              <SelectItem value="this_week">{t('search.availability.thisWeek')}</SelectItem>
                              <SelectItem value="next_week">{t('search.availability.nextWeek')}</SelectItem>
                              <SelectItem value="any">{t('search.availability.any')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Sort By */}
                    <FormField
                      control={form.control}
                      name="sortBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('search.filters.sortBy')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {sortOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Features */}
                  {features && features.length > 0 && (
                    <div>
                      <Label className="text-base font-medium">{t('search.filters.features')}</Label>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                        {features.map((feature: string) => (
                          <FormField
                            key={feature}
                            control={form.control}
                            name="features"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(feature)}
                                    onCheckedChange={(checked) => {
                                      const currentFeatures = field.value || [];
                                      if (checked) {
                                        field.onChange([...currentFeatures, feature]);
                                      } else {
                                        field.onChange(currentFeatures.filter((f) => f !== feature));
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {feature}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Popular Searches */}
      {popularSearches && popularSearches.length > 0 && !form.watch('query') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              {t('search.popular.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((search: string, index: number) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickSearch(search)}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  {search}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedSearch;