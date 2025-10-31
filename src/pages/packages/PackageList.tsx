import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Package,
  Star,
  TrendingUp,
  Grid,
  List,
  ChevronDown,
  ArrowUpDown,
  Calendar
} from 'lucide-react';

import { useToast } from '@/components/ui/use-toast';
import { SEO } from '@/components/SEO';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import MobileFooter from '@/components/MobileFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import PackageCard from '@/components/packages/PackageCard';
import PackagePurchaseModal from '@/components/packages/PackagePurchaseModal';
import { useCurrency } from '@/contexts/CurrencyContext';
import { packageService, ServicePackage, ClientPackage } from '@/services/packageService';
import { cn } from '@/lib/utils';

const PackageList = () => {
  const { i18n } = useTranslation();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'beauty' | 'fitness' | 'lifestyle'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'savings' | 'popularity'>('popularity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Query packages from database
  const {
    data: packages = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['service-packages', selectedCategory, sortBy, sortOrder],
    queryFn: () => packageService.getServicePackages({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      sort_by: sortBy,
      sort_order: sortOrder,
      limit: 100
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter and sort packages
  const filteredAndSortedPackages = useMemo(() => {
    let filtered = packages;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(pkg =>
        pkg.name.toLowerCase().includes(searchLower) ||
        pkg.description?.toLowerCase().includes(searchLower) ||
        pkg.benefits?.some(benefit => benefit.toLowerCase().includes(searchLower))
      );
    }

    // Sorting is already handled by the API
    return filtered;
  }, [packages, searchTerm]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredAndSortedPackages.length;
    const maxSavings = Math.max(
      ...filteredAndSortedPackages.map(p => p.savings_percentage || 0),
      0
    );
    const avgPrice = total > 0
      ? filteredAndSortedPackages.reduce((sum, p) => sum + p.package_price, 0) / total
      : 0;

    return {
      total,
      maxSavings,
      avgPrice,
      featuredCount: filteredAndSortedPackages.filter(p => p.is_featured).length
    };
  }, [filteredAndSortedPackages]);

  // Handle package purchase
  const handlePurchasePackage = (pkg: ServicePackage) => {
    setSelectedPackage(pkg);
    setShowPurchaseModal(true);
  };

  const handlePurchaseSuccess = (clientPackage: ClientPackage) => {
    toast({
      title: i18n.t('package.purchaseSuccess', 'Package Purchased!'),
      description: i18n.t('package.purchaseSuccessDesc', 'Your package has been successfully purchased.'),
    });
    setShowPurchaseModal(false);
    setSelectedPackage(null);
    // Optionally refetch packages or update UI
    refetch();
  };

  const handlePackageInfo = (pkg: ServicePackage) => {
    // Could open a detail modal or navigate to detail page
    toast({
      title: pkg.name,
      description: pkg.description,
    });
  };

  const categories = [
    { value: 'all', label: i18n.t('packages.allCategories', 'All Packages'), icon: Package },
    { value: 'beauty', label: i18n.t('beauty.title', 'Beauty'), icon: Star },
    { value: 'fitness', label: i18n.t('fitness.title', 'Fitness'), icon: TrendingUp },
    { value: 'lifestyle', label: i18n.t('lifestyle.title', 'Lifestyle'), icon: Calendar }
  ];

  const sortOptions = [
    { value: 'popularity', label: i18n.t('packages.sort.popularity', 'Most Popular') },
    { value: 'price', label: i18n.t('packages.sort.price', 'Price: Low to High') },
    { value: 'savings', label: i18n.t('packages.sort.savings', 'Best Savings') },
    { value: 'name', label: i18n.t('packages.sort.name', 'Name: A to Z') }
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            {i18n.t('error.loadPackagesFailed', 'Failed to load packages')}
          </p>
          <Button onClick={() => refetch()}>
            {i18n.t('general.retry', 'Retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Service Packages — Beauty & Fitness Deals | Mariia Hub"
        description={`Save up to ${stats.maxSavings.toFixed(0)}% on beauty and fitness packages. Special offers on microblading, training programs, and more.`}
        keywords="packages Warsaw, beauty deals, fitness packages, microblading package, personal training package"
      />
      <Navigation />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-background via-background to-muted/10 pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-r from-bronze/20 via-transparent to-background/30" />

        <div className="container mx-auto px-6 md:px-8 max-w-7xl relative z-10">
          <div className="max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-accent border border-champagne/20 animate-fade-rise">
              <Package className="w-4 h-4 text-champagne-200" />
              <span className="text-xs font-body tracking-[0.3em] uppercase font-light text-champagne-200">
                {i18n.t('packages.title', 'Premium Service Packages')}
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.85] text-pearl tracking-tight font-light font-display animate-fade-rise">
              <div className="space-y-2">
                <span className="block">
                  {i18n.t('packages.hero.title', 'Save Big with')}
                </span>
                <span className="block bg-gradient-to-r from-bronze via-champagne-200 to-champagne bg-clip-text text-transparent font-normal">
                  {i18n.t('packages.hero.highlight', 'Package Deals')}
                </span>
              </div>
            </h1>

            <div className="w-24 h-[3px] bg-gradient-to-r from-bronze via-champagne to-bronze rounded-full shadow-luxury animate-fade-rise-delay" />

            <p className="text-xl sm:text-2xl text-pearl/80 leading-relaxed font-light font-body max-w-3xl animate-fade-rise-delay">
              {i18n.t('packages.hero.description', 'Choose from our curated packages and enjoy comprehensive services at exclusive prices.')}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mt-8 animate-fade-rise-delay">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-champagne-200" />
                <span className="text-pearl/80">
                  {stats.total} {i18n.t('packages.available', 'Available')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-pearl/80">
                  {stats.maxSavings.toFixed(0)}% {i18n.t('packages.maxSavings', 'Max Savings')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-champagne-200" />
                <span className="text-pearl/80">
                  {stats.featuredCount} {i18n.t('packages.featured', 'Featured')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="sticky top-20 z-40 glass-card backdrop-blur-xl border-b border-champagne/20 bg-charcoal/80 py-4">
        <div className="container mx-auto px-6 md:px-8 max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pearl/40" />
                <Input
                  placeholder={i18n.t('packages.searchPlaceholder', 'Search packages...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 glass-subtle border-champagne/20"
                />
              </div>
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
              <SelectTrigger className="w-full lg:w-48 glass-subtle border-champagne/20">
                <SelectValue placeholder={i18n.t('packages.selectCategory', 'All Categories')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center gap-2">
                      <category.icon className="w-4 h-4" />
                      {category.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [sort, order] = value.split('-') as [typeof sortBy, typeof sortOrder];
                setSortBy(sort);
                setSortOrder(order);
              }}
            >
              <SelectTrigger className="w-full lg:w-48 glass-subtle border-champagne/20">
                <SelectValue placeholder={i18n.t('packages.sortBy', 'Sort by')} />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="glass-subtle border-champagne/20"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="glass-subtle border-champagne/20"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Grid/List */}
      <section className="py-20 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background to-muted/10" />

        <div className="container mx-auto px-6 md:px-8 max-w-7xl relative z-10">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredAndSortedPackages.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-20 h-20 text-champagne-200 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-pearl mb-4">
                {i18n.t('packages.noResults', 'No packages found')}
              </h3>
              <p className="text-xl text-pearl/70 mb-8">
                {i18n.t('packages.noResultsDesc', 'Try adjusting your search or filters')}
              </p>
              <Button onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}>
                {i18n.t('packages.clearFilters', 'Clear Filters')}
              </Button>
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
                : 'space-y-6'
            )}>
              {filteredAndSortedPackages.map((pkg, index) => (
                <PackageCard
                  key={pkg.id}
                  package={pkg}
                  onPurchase={handlePurchasePackage}
                  onInfo={handlePackageInfo}
                  variant={pkg.is_featured ? 'featured' : 'default'}
                  className="animate-fade-rise"
                  style={{ animationDelay: `${index * 100}ms` }}
                />
              ))}
            </div>
          )}

          {/* Load More (if pagination is implemented) */}
          {filteredAndSortedPackages.length > 0 && (
            <div className="text-center mt-12">
              <Button variant="outline" size="lg" className="glass-subtle border-champagne/20">
                {i18n.t('packages.loadMore', 'Load More Packages')}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-muted/10 to-transparent">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-pearl leading-tight tracking-tight mb-4">
              {i18n.t('packages.benefits.title', 'Why Choose Our Packages?')}
            </h2>
            <p className="text-xl text-pearl/70 font-body max-w-2xl mx-auto">
              {i18n.t('packages.benefits.description', 'Get more value with our carefully curated service packages')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: i18n.t('packages.benefits.saveMoney', 'Save Money'),
                description: i18n.t('packages.benefits.saveMoneyDesc', 'Get exclusive discounts when you buy packages')
              },
              {
                icon: Calendar,
                title: i18n.t('packages.benefits.flexible', 'Flexible Scheduling'),
                description: i18n.t('packages.benefits.flexibleDesc', 'Use your sessions when it suits you best')
              },
              {
                icon: Star,
                title: i18n.t('packages.benefits.premium', 'Premium Service'),
                description: i18n.t('packages.benefits.premiumDesc', 'Enjoy our best services with package deals')
              }
            ].map((benefit, index) => (
              <div
                key={index}
                className="glass-card p-8 rounded-2xl border border-champagne/20 text-center animate-fade-rise"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-16 h-16 rounded-full glass-accent flex items-center justify-center mx-auto mb-6">
                  <benefit.icon className="w-8 h-8 text-champagne-200" />
                </div>
                <h3 className="text-xl font-semibold text-pearl mb-4">
                  {benefit.title}
                </h3>
                <p className="text-pearl/70 font-body leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <MobileFooter mode="beauty" />

      {/* Purchase Modal */}
      {selectedPackage && (
        <PackagePurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => {
            setShowPurchaseModal(false);
            setSelectedPackage(null);
          }}
          package={selectedPackage}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  );
};

export default PackageList;