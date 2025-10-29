import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type ErrorType = '404' | '500' | '403' | 'offline' | 'timeout' | 'network';

interface ErrorPageProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  customActions?: React.ReactNode;
  showRefresh?: boolean;
  errorDetails?: {
    error?: Error;
    info?: any;
  };
}

const errorConfig = {
  '404': {
    icon: AlertTriangle,
    title: 'Page Not Found',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    showRefresh: false,
  },
  '500': {
    icon: AlertTriangle,
    title: 'Server Error',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    showRefresh: true,
  },
  '403': {
    icon: AlertTriangle,
    title: 'Access Denied',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    showRefresh: false,
  },
  'offline': {
    icon: AlertTriangle,
    title: 'Offline',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    showRefresh: true,
  },
  'timeout': {
    icon: AlertTriangle,
    title: 'Request Timeout',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    showRefresh: true,
  },
  'network': {
    icon: AlertTriangle,
    title: 'Network Error',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    showRefresh: true,
  },
};

export function ErrorPage({
  type,
  title,
  message,
  customActions,
  showRefresh,
  errorDetails,
}: ErrorPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const config = type ? errorConfig[type] : null;
  const Icon = config?.icon || AlertTriangle;

  // Log error for analytics
  useEffect(() => {
    const errorData = {
      type: type || 'unknown',
      title: title || config?.title,
      message,
      url: window.location.href,
      path: location.pathname,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    // Send to analytics
    if (window.gtag) {
      window.gtag('event', 'error_page_view', {
        error_type: errorData.type,
        error_title: errorData.title,
        page_path: location.pathname,
      });
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error Page:', errorData);
    }

    // Store error for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('error-logs') || '[]');
      errors.push(errorData);

      // Keep only last 10 errors
      if (errors.length > 10) {
        errors.shift();
      }

      localStorage.setItem('error-logs', JSON.stringify(errors));
    } catch (e) {
      console.warn('Could not save error log:', e);
    }
  }, [type, title, message, location]);

  const handleRefresh = () => {
    // Clear caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }

    // Reload page
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleReport = () => {
    const subject = encodeURIComponent('Error Report');
    const body = encodeURIComponent(
      `Error Details:\n\nType: ${type || 'unknown'}\nTitle: ${title || config?.title}\nMessage: ${message}\nURL: ${window.location.href}\nTimestamp: ${new Date().toISOString()}\n\nAdditional Details:\n${errorDetails?.error?.stack || 'No stack trace available'}`
    );
    window.location.href = `mailto:support@mariiahub.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center ${config?.bgColor || 'bg-gray-100'}`}>
            <Icon className={`h-8 w-8 ${config?.color || 'text-gray-600'}`} />
          </div>
          <CardTitle className="text-2xl">
            {title || config?.title || t('error.defaultTitle', 'Error')}
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            {message || t(`error.${type}.message`, 'An error occurred while processing your request.')}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(showRefresh ?? config?.showRefresh) && (
              <Button onClick={handleRefresh} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('error.refresh', 'Refresh Page')}
              </Button>
            )}

            <Button onClick={handleGoHome} variant="outline" className="w-full">
              <Home className="mr-2 h-4 w-4" />
              {t('error.goHome', 'Go Home')}
            </Button>
          </div>

          {/* Additional Actions */}
          <div className="flex gap-3">
            <Button onClick={handleGoBack} variant="outline" className="flex-1">
              {t('error.goBack', 'Go Back')}
            </Button>

            <Button
              onClick={handleReport}
              variant="ghost"
              className="flex-1"
            >
              <Mail className="mr-2 h-4 w-4" />
              {t('error.report', 'Report Issue')}
            </Button>
          </div>

          {/* Custom Actions */}
          {customActions}

          {/* Error Details in Development */}
          {import.meta.env.DEV && errorDetails && (
            <details className="mt-6 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <summary className="cursor-pointer text-sm font-medium mb-2">
                {t('error.details', 'Error Details (Development Only)')}
              </summary>
              <div className="space-y-3 text-xs">
                {errorDetails.error && (
                  <div>
                    <strong>Error:</strong> {errorDetails.error.toString()}
                  </div>
                )}

                {errorDetails.error?.stack && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="mt-1 overflow-auto bg-gray-50 dark:bg-gray-950 p-2 rounded">
                      {errorDetails.error.stack}
                    </pre>
                  </div>
                )}

                {errorDetails.info && (
                  <div>
                    <strong>Info:</strong>
                    <pre className="mt-1 overflow-auto bg-gray-50 dark:bg-gray-950 p-2 rounded">
                      {JSON.stringify(errorDetails.info, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Pre-configured error pages
export const Error404 = () => (
  <ErrorPage
    type="404"
    message={t('error.404.message', "The page you're looking for doesn't exist or has been moved.")}
  />
);

export const Error500 = () => (
  <ErrorPage
    type="500"
    message={t('error.500.message', "We're experiencing technical difficulties. Please try again later.")}
  />
);

export const Error403 = () => (
  <ErrorPage
    type="403"
    message={t('error.403.message', "You don't have permission to access this page.")}
  />
);

export const ErrorOffline = () => (
  <ErrorPage
    type="offline"
    message={t('error.offline.message', "You appear to be offline. Please check your internet connection.")}
  />
);

// HOC for wrapping components with error page
export function withErrorPage<P extends object>(
  Component: React.ComponentType<P>,
  errorPageProps?: Omit<ErrorPageProps, 'errorDetails'>
) {
  return (props: P) => {
    return (
      <ErrorBoundary
        fallback={<ErrorPage {...errorPageProps} />}
        onError={(error, info) => {
          // Log error and show error page
          console.error('Component error:', error, info);
          // Could navigate to error page here
          // navigate('/error', { state: { error, info } });
        }}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Import ErrorBoundary from existing component
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default ErrorPage;