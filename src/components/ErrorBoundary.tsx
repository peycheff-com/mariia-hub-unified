import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log to our logger service
    logger.error('Error boundary caught error:', { error, errorInfo });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In development, also log detailed error information
    if (import.meta.env.DEV) {
      logger.error('Error boundary caught error - Development Details:', {
        error,
        errorInfo,
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));

      logger.info('Error boundary retry attempted', {
        retryCount: this.state.retryCount + 1,
        maxRetries: this.maxRetries,
      });
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });

    logger.info('Error boundary reset by user');
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-rose/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-rose" />
              </div>
              <h1 className="text-2xl font-display font-semibold text-pearl mb-2">
                {import.meta.env.DEV ? 'Development Error' : 'Something went wrong'}
              </h1>
              <p className="text-body/80">
                {import.meta.env.DEV
                  ? 'An error occurred while rendering this component.'
                  : 'We apologize for the inconvenience. An unexpected error occurred.'}
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-champagne hover:text-champagne/80 transition-colors mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="bg-charcoal-light rounded-lg p-4 mt-2 overflow-x-auto">
                  <p className="text-rose text-sm font-mono mb-2">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-body/60 overflow-x-auto whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {canRetry ? (
                <Button
                  onClick={this.handleRetry}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                </Button>
              ) : (
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </Button>
              )}

              <Button
                onClick={this.handleGoHome}
                variant="ghost"
                className="flex items-center gap-2 text-pearl/80 hover:text-pearl"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </div>

            {!import.meta.env.DEV && (
              <p className="text-xs text-body/60 mt-6">
                This error has been automatically reported to our team.
                If the problem persists, please contact support.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default ErrorBoundary;