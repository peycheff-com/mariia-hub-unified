import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Heart,
  Clock,
  User,
  Package,
  Gift,
  Star,
  TrendingUp,
  CreditCard,
  MessageSquare,
  Settings,
  Phone,
  MapPin,
  Plus
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  color: string;
  badge?: string;
  isPro?: boolean;
}

interface QuickActionsProps {
  className?: string;
  onActionClick?: (action: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ className, onActionClick }) => {
  const { t } = useTranslation();

  const quickActions: QuickAction[] = [
    {
      id: 'book',
      label: t('dashboard.quickActions.bookNew', 'Book Appointment'),
      description: t('dashboard.quickActions.bookNewDesc', 'Schedule your next service'),
      icon: Calendar,
      href: '/book',
      color: 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
    },
    {
      id: 'packages',
      label: t('dashboard.quickActions.browsePackages', 'Browse Packages'),
      description: t('dashboard.quickActions.browsePackagesDesc', 'Get deals on multi-session packages'),
      icon: Package,
      href: '/packages',
      color: 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
    },
    {
      id: 'rebook',
      label: t('dashboard.quickActions.rebook', 'Quick Rebook'),
      description: t('dashboard.quickActions.rebookDesc', 'Book your favorite service again'),
      icon: Plus,
      href: '/user/favorites',
      color: 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
    },
    {
      id: 'history',
      label: t('dashboard.quickActions.viewHistory', 'Booking History'),
      description: t('dashboard.quickActions.viewHistoryDesc', 'View all past and upcoming appointments'),
      icon: Clock,
      href: '/user/bookings',
      color: 'from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600',
    },
    {
      id: 'favorites',
      label: t('dashboard.quickActions.manageFavorites', 'Manage Favorites'),
      description: t('dashboard.quickActions.manageFavoritesDesc', 'View and manage your favorite services'),
      icon: Heart,
      href: '/user/favorites',
      color: 'from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600',
    },
    {
      id: 'profile',
      label: t('dashboard.quickActions.editProfile', 'Edit Profile'),
      description: t('dashboard.quickActions.editProfileDesc', 'Update your personal information and preferences'),
      icon: User,
      href: '/user/profile',
      color: 'from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600',
    },
    {
      id: 'gift',
      label: t('dashboard.quickActions.buyGift', 'Buy Gift Card'),
      description: t('dashboard.quickActions.buyGiftDesc', 'Purchase a gift for someone special'),
      icon: Gift,
      href: '/gift-cards',
      color: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
    },
    {
      id: 'payment',
      label: t('dashboard.quickActions.managePayment', 'Payment Methods'),
      description: t('dashboard.quickActions.managePaymentDesc', 'Manage your saved payment methods'),
      icon: CreditCard,
      href: '/user/payment-methods',
      color: 'from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600',
      isPro: true,
    },
    {
      id: 'contact',
      label: t('dashboard.quickActions.contactSupport', 'Contact Support'),
      description: t('dashboard.quickActions.contactSupportDesc', 'Get help from our support team'),
      icon: MessageSquare,
      href: '/contact',
      color: 'from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600',
    },
  ];

  const handleActionClick = (actionId: string) => {
    if (onActionClick) {
      onActionClick(actionId);
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          {t('dashboard.quickActions.title', 'Quick Actions')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Button
              key={action.id}
              variant="ghost"
              asChild
              onClick={() => handleActionClick(action.id)}
              className={cn(
                "h-auto p-6 flex flex-col items-center justify-center text-white shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-white/20 relative group",
                `bg-gradient-to-br ${action.color}`
              )}
            >
              <Link to={action.href} className="flex flex-col items-center">
                <div className="relative">
                  <action.icon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                  {action.badge && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-2 py-1 animate-pulse">
                      {action.badge}
                    </div>
                  )}
                  {action.isPro && (
                    <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs rounded-full px-2 py-1">
                      PRO
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium mb-1 text-center">
                  {action.label}
                </span>
              </Link>
            </Button>
          ))}
        </div>

        {/* Additional Quick Access */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            {t('dashboard.quickActions.quickAccess', 'Quick Access')}
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link to="/book?emergency=true" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {t('dashboard.quickActions.emergencyBooking', 'Emergency Booking')}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link to="/locations" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t('dashboard.quickActions.findLocation', 'Find Location')}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link to="/consultation" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {t('dashboard.quickActions.freeConsultation', 'Free Consultation')}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link to="/refer" className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                {t('dashboard.quickActions.referFriend', 'Refer a Friend')}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;