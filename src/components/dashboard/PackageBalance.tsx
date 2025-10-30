import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Package,
  Calendar,
  Clock,
  Star,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  Gift
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/components/ui/use-toast aria-live="polite" aria-atomic="true"';
import { packageService, ClientPackage } from '@/services/packageService';
import { cn } from '@/lib/utils';

interface PackageBalanceProps {
  className?: string;
}

const PackageBalance: React.FC<PackageBalanceProps> = ({ className }) => {
  const { t, i18n } = useTranslation();
  const { formatPrice } = useCurrency();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  // Fetch active packages
  const {
    data: packages = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['client-packages', 'active'],
    queryFn: () => packageService.getClientPackages('current-user-id', { status: 'active', include_sessions: true }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Calculate totals
  const totalSessions = packages.reduce((sum, pkg) => sum + pkg.total_sessions, 0);
  const usedSessions = packages.reduce((sum, pkg) => sum + pkg.sessions_used, 0);
  const remainingSessions = totalSessions - usedSessions;
  const totalValue = packages.reduce((sum, pkg) => sum + pkg.amount_paid, 0);
  const expiringSoon = packages.filter(pkg => {
    if (!pkg.expiry_date) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(pkg.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {t('dashboard.packageBalance.title', 'Your Packages')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || packages.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {t('dashboard.packageBalance.title', 'Your Packages')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('dashboard.packageBalance.noPackages', 'No Active Packages')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t('dashboard.packageBalance.noPackagesDesc', 'Browse our packages to get great deals on multiple sessions')}
            </p>
            <Button asChild className="w-full">
              <Link to="/packages">
                {t('dashboard.packageBalance.browsePackages', 'Browse Packages')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil(
      (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days <= 0) return t('dashboard.packageBalance.expired', 'Expired');
    if (days === 1) return t('dashboard.packageBalance.expiresTomorrow', 'Expires tomorrow');
    if (days <= 7) return t('dashboard.packageBalance.expiresInDays', '{{days}} days', { days });
    if (days <= 30) return t('dashboard.packageBalance.expiresInDays', '{{days}} days', { days });
    return t('dashboard.packageBalance.expiresInDays', '{{days}} days', { days });
  };

  const getUsagePercentage = (pkg: ClientPackage) => {
    return Math.round((pkg.sessions_used / pkg.total_sessions) * 100);
  };

  const handleQuickBook = (pkg: ClientPackage) => {
    // Find next available session and navigate to booking
    toast aria-live="polite" aria-atomic="true"({
      title: t('dashboard.packageBalance.booking', 'Booking Session'),
      description: t('dashboard.packageBalance.bookingDesc', 'Redirecting to booking...'),
    });
    // Navigate to booking with pre-selected service
    window.location.href = `/book?service=${pkg.service?.id}&use_package=${pkg.id}`;
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {t('dashboard.packageBalance.title', 'Your Packages')}
          </div>
          <Badge variant="secondary" className="text-xs">
            {packages.length} {t('dashboard.packageBalance.active', 'Active')}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-secondary">
            <div className="text-2xl font-bold">{packages.length}</div>
            <div className="text-xs text-muted-foreground">
              {t('dashboard.packageBalance.totalPackages', 'Total')}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary">
            <div className="text-2xl font-bold">{remainingSessions}</div>
            <div className="text-xs text-muted-foreground">
              {t('dashboard.packageBalance.remaining', 'Remaining')}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary">
            <div className="text-2xl font-bold">{usedSessions}</div>
            <div className="text-xs text-muted-foreground">
              {t('dashboard.packageBalance.used', 'Used')}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary">
            <div className="text-lg font-bold">{formatPrice(totalValue)}</div>
            <div className="text-xs text-muted-foreground">
              {t('dashboard.packageBalance.totalValue', 'Total Value')}
            </div>
          </div>
        </div>

        {/* Expiring Soon Warning */}
        {expiringSoon.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                  {t('dashboard.packageBalance.expiringSoon', 'Packages Expiring Soon')}
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                  {t('dashboard.packageBalance.expiringSoonDesc', '{{count}} package(s) will expire in the next 30 days', { count: expiringSoon.length })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Package List */}
        <div className="space-y-4">
          {packages.map((pkg, index) => (
            <div
              key={pkg.id}
              className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              {/* Package Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{pkg.package?.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {pkg.service?.service_type}
                    </Badge>
                    <span>•</span>
                    <span>{pkg.total_sessions} {t('dashboard.packageBalance.sessions', 'sessions')}</span>
                    <span>•</span>
                    <span className={cn(
                      "font-medium",
                      pkg.expiry_date && new Date(pkg.expiry_date) < new Date() && "text-destructive"
                    )}>
                      {getDaysUntilExpiry(pkg.expiry_date)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {t('dashboard.packageBalance.paid', 'Paid')}
                  </div>
                  <div className="font-semibold">
                    {formatPrice(pkg.amount_paid)}
                  </div>
                </div>
              </div>

              {/* Usage Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-2">
                  <span>{t('dashboard.packageBalance.usage', 'Usage')}</span>
                  <span>{getUsagePercentage(pkg)}%</span>
                </div>
                <Progress
                  value={getUsagePercentage(pkg)}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{pkg.sessions_used} {t('dashboard.packageBalance.used', 'used')}</span>
                  <span>{pkg.sessions_remaining} {t('dashboard.packageBalance.remaining', 'remaining')}</span>
                </div>
              </div>

              {/* Sessions Breakdown */}
              {pkg.package?.package_sessions && pkg.package_sessions.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer text-sm text-primary hover:text-primary/80 flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    {t('dashboard.packageBalance.viewSessions', 'View Session Details')}
                  </summary>
                  <div className="mt-3 pl-4 space-y-2 text-sm">
                    {pkg.package_sessions.map((session, idx) => (
                      <div
                        key={session.id}
                        className={cn(
                          "flex items-center justify-between p-2 rounded border",
                          session.status === 'completed' && "bg-success/10 border-success/20",
                          session.status === 'scheduled' && "bg-primary/10 border-primary/20",
                          session.status === 'available' && "bg-secondary/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-medium">Session {idx + 1}</div>
                            {session.scheduled_for && (
                              <div className="text-xs text-muted-foreground">
                                {new Date(session.scheduled_for).toLocaleDateString(i18n.language)}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={session.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {t(`packageSession.status.${session.status}`, session.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                {pkg.sessions_remaining > 0 && (
                  <Button
                    size="sm"
                    onClick={() => handleQuickBook(pkg)}
                    className="flex-1"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {t('dashboard.packageBalance.bookSession', 'Book Session')}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                >
                  <Link to={`/packages/${pkg.package_id}`}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {t('dashboard.packageBalance.viewDetails', 'View Details')}
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        {packages.length > 0 && (
          <div className="text-center mt-6 pt-4 border-t">
            <Button variant="outline" asChild>
              <Link to="/user/packages">
                <Package className="w-4 h-4 mr-2" />
                {t('dashboard.packageBalance.viewAllPackages', 'View All Packages')}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PackageBalance;