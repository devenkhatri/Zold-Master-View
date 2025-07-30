'use client';

import * as React from 'react';
import { AlertTriangle, RefreshCw, Bug, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

interface MatrixErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

interface MatrixErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    errorInfo: ErrorInfo;
    retry: () => void;
    reset: () => void;
  }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number | boolean | null | undefined>;
}

class MatrixErrorBoundary extends React.Component<
  MatrixErrorBoundaryProps,
  MatrixErrorBoundaryState
> {
  private resetTimeoutId: number | null = null;

  constructor(props: MatrixErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<MatrixErrorBoundaryState> {
    // Generate a unique error ID for tracking
    const errorId = `matrix-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('Matrix Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      retryCount: this.state.retryCount,
    });

    this.setState({
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to monitoring service (if available)
    this.reportError(error, errorInfo);
  }

  componentDidUpdate(prevProps: MatrixErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error state if resetKeys have changed
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys![index]
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }

    // Reset error state if any props have changed (when resetOnPropsChange is true)
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Enhanced error reporting with Google Sheets API specific handling
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount,
      // Enhanced context for Google Sheets API errors
      isApiError: this.isGoogleSheetsApiError(error),
      errorType: this.categorizeError(error),
      retryable: this.isRetryableError(error),
    };

    // Log with appropriate level based on error type
    if (this.isGoogleSheetsApiError(error)) {
      console.warn('Matrix Google Sheets API Error:', errorReport);
    } else {
      console.error('Matrix Component Error:', errorReport);
    }

    // In a real application, you might send this to a service like Sentry
    // Example: Sentry.captureException(error, { extra: errorReport });
  };

  private isGoogleSheetsApiError = (error: Error): boolean => {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    // Check for Google Sheets API specific errors
    return message.includes('sheets') || 
           message.includes('quota') || 
           message.includes('api key') ||
           message.includes('auth') ||
           message.includes('rate limit') ||
           message.includes('googleapis') ||
           message.includes('google api') ||
           stack.includes('googleapi') ||
           // Check for specific error codes
           message.includes('quota_exceeded') ||
           message.includes('rate_limit_exceeded') ||
           message.includes('auth_error') ||
           message.includes('access_denied') ||
           message.includes('sheets_api_error') ||
           message.includes('receipts_fetch_error') ||
           message.includes('owners_fetch_error');
  };

  private categorizeError = (error: Error): string => {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    // Enhanced categorization for Google Sheets API errors
    if (message.includes('quota_exceeded') || message.includes('quota exceeded')) {
      return 'QUOTA_EXCEEDED';
    }
    if (message.includes('rate_limit_exceeded') || message.includes('rate limit')) {
      return 'RATE_LIMIT_EXCEEDED';
    }
    if (message.includes('auth_error') || message.includes('authentication') || message.includes('api key')) {
      return 'AUTHENTICATION_ERROR';
    }
    if (message.includes('access_denied') || message.includes('permission')) {
      return 'ACCESS_DENIED';
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('timeout') || message.includes('aborted')) {
      return 'TIMEOUT_ERROR';
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('malformed')) {
      return 'VALIDATION_ERROR';
    }
    if (message.includes('data_processing') || message.includes('transform') || message.includes('parse')) {
      return 'DATA_PROCESSING_ERROR';
    }
    if (message.includes('sheets') || message.includes('googleapis') || stack.includes('googleapi')) {
      return 'GOOGLE_SHEETS_API_ERROR';
    }
    if (message.includes('receipts_fetch_error')) {
      return 'RECEIPTS_FETCH_ERROR';
    }
    if (message.includes('owners_fetch_error')) {
      return 'OWNERS_FETCH_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  };

  private isRetryableError = (error: Error): boolean => {
    const errorType = this.categorizeError(error);
    
    // Define which error types are retryable
    const retryableErrors = [
      'RATE_LIMIT_EXCEEDED',
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'GOOGLE_SHEETS_API_ERROR',
      'RECEIPTS_FETCH_ERROR',
      'OWNERS_FETCH_ERROR',
      'DATA_PROCESSING_ERROR'
    ];
    
    // Quota exceeded errors are retryable but with longer delays
    if (errorType === 'QUOTA_EXCEEDED') {
      return true;
    }
    
    // Authentication and access errors are generally not retryable
    if (errorType === 'AUTHENTICATION_ERROR' || errorType === 'ACCESS_DENIED') {
      return false;
    }
    
    // Validation errors are not retryable
    if (errorType === 'VALIDATION_ERROR') {
      return false;
    }
    
    return retryableErrors.includes(errorType);
  };

  private getUserFriendlyErrorMessage = (error: Error): string => {
    const errorType = this.categorizeError(error);
    
    switch (errorType) {
      case 'QUOTA_EXCEEDED':
        return 'Google Sheets API quota has been exceeded. Please wait 1-2 minutes before trying again.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Too many requests to Google Sheets API. Please wait 30 seconds and try again.';
      case 'AUTHENTICATION_ERROR':
        return 'Authentication failed. Please check your Google Sheets access permissions or contact support.';
      case 'ACCESS_DENIED':
        return 'Access denied to Google Sheets. Please verify your permissions or contact an administrator.';
      case 'NETWORK_ERROR':
        return 'Network connection issue. Please check your internet connection and try again.';
      case 'TIMEOUT_ERROR':
        return 'Request timed out. The server may be busy. Please try again in a moment.';
      case 'VALIDATION_ERROR':
        return 'Data validation error. Some data may be in an unexpected format. Please contact support if this persists.';
      case 'DATA_PROCESSING_ERROR':
        return 'Error processing matrix data. This may be due to unexpected data format. Please try refreshing.';
      case 'RECEIPTS_FETCH_ERROR':
        return 'Failed to fetch receipt data from Google Sheets. Please check your connection and try again.';
      case 'OWNERS_FETCH_ERROR':
        return 'Failed to fetch owner data from Google Sheets. Please check your connection and try again.';
      case 'GOOGLE_SHEETS_API_ERROR':
        return 'Google Sheets API error occurred. Please try refreshing the data or contact support.';
      case 'UNKNOWN_ERROR':
      default:
        // Provide more context for unknown errors
        const message = error.message || 'An unexpected error occurred in the matrix component';
        if (message.length > 100) {
          return 'An unexpected error occurred. Please try refreshing or contact support if the issue persists.';
        }
        return message;
    }
  };

  private resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    });
  };

  private getRetryDelay = (retryCount: number, errorType: string): number => {
    // Base delay in milliseconds
    let baseDelay = 1000;
    
    // Adjust base delay based on error type
    switch (errorType) {
      case 'QUOTA_EXCEEDED':
        baseDelay = 60000; // 1 minute for quota errors
        break;
      case 'RATE_LIMIT_EXCEEDED':
        baseDelay = 30000; // 30 seconds for rate limit errors
        break;
      case 'NETWORK_ERROR':
      case 'TIMEOUT_ERROR':
        baseDelay = 2000; // 2 seconds for network errors
        break;
      case 'GOOGLE_SHEETS_API_ERROR':
      case 'RECEIPTS_FETCH_ERROR':
      case 'OWNERS_FETCH_ERROR':
        baseDelay = 5000; // 5 seconds for API errors
        break;
      default:
        baseDelay = 1000; // 1 second for other errors
    }
    
    // Apply exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    const maxDelay = 300000; // Cap at 5 minutes
    
    return Math.min(exponentialDelay + jitter, maxDelay);
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount, error } = this.state;

    if (retryCount >= maxRetries) {
      console.warn('Maximum retry attempts reached for matrix error boundary');
      return;
    }

    if (!error) {
      console.warn('Cannot retry: no error information available');
      return;
    }

    const errorType = this.categorizeError(error);
    const delay = this.getRetryDelay(retryCount, errorType);

    console.log(`Retrying matrix component (attempt ${retryCount + 1}/${maxRetries}) after ${delay}ms delay for error type: ${errorType}`);

    // Show loading state during retry delay for longer delays
    if (delay > 5000) {
      this.setState({ hasError: false }); // Temporarily hide error to show loading
      
      setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: retryCount + 1,
        }, () => {
          // Set a timeout to reset retry count after successful render
          this.resetTimeoutId = window.setTimeout(() => {
            this.setState({ retryCount: 0 });
          }, 30000); // Reset retry count after 30 seconds of successful operation
        });
      }, delay);
    } else {
      // For shorter delays, retry immediately
      setTimeout(() => {
        this.setState(
          {
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: retryCount + 1,
          },
          () => {
            // Set a timeout to reset retry count after successful render
            this.resetTimeoutId = window.setTimeout(() => {
              this.setState({ retryCount: 0 });
            }, 30000); // Reset retry count after 30 seconds of successful operation
          }
        );
      }, delay);
    }
  };

  private handleReset = () => {
    this.resetErrorBoundary();
  };

  render() {
    const { hasError, error, errorInfo, errorId, retryCount } = this.state;
    const { children, fallback: Fallback, maxRetries = 3 } = this.props;

    if (hasError && error && errorInfo) {
      // Use custom fallback component if provided
      if (Fallback) {
        return (
          <Fallback
            error={error}
            errorInfo={errorInfo}
            retry={this.handleRetry}
            reset={this.handleReset}
          />
        );
      }

      // Default error UI
      return (
        <Card className="w-full border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Matrix Component Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <Bug className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">
                    {this.getUserFriendlyErrorMessage(error)}
                  </div>
                  {errorId && (
                    <div className="text-xs text-muted-foreground">
                      Error ID: {errorId}
                    </div>
                  )}
                  {this.isGoogleSheetsApiError(error) && (
                    <div className="text-xs bg-amber-50 border border-amber-200 p-3 rounded mt-2">
                      <div className="flex items-start gap-2">
                        <div className="text-amber-600 font-medium">💡 Google Sheets API Issue</div>
                      </div>
                      <div className="mt-1 text-amber-700">
                        {this.categorizeError(error) === 'QUOTA_EXCEEDED' && (
                          <div>
                            <div className="font-medium">Quota Exceeded</div>
                            <div>The Google Sheets API quota has been exceeded. Please wait 1-2 minutes before trying again.</div>
                          </div>
                        )}
                        {this.categorizeError(error) === 'RATE_LIMIT_EXCEEDED' && (
                          <div>
                            <div className="font-medium">Rate Limit Exceeded</div>
                            <div>Too many requests have been made. Please wait 30 seconds before trying again.</div>
                          </div>
                        )}
                        {this.categorizeError(error) === 'AUTHENTICATION_ERROR' && (
                          <div>
                            <div className="font-medium">Authentication Error</div>
                            <div>Please check your Google Sheets access permissions or contact support.</div>
                          </div>
                        )}
                        {this.categorizeError(error) === 'ACCESS_DENIED' && (
                          <div>
                            <div className="font-medium">Access Denied</div>
                            <div>You don't have permission to access the Google Sheet. Contact an administrator.</div>
                          </div>
                        )}
                        {!['QUOTA_EXCEEDED', 'RATE_LIMIT_EXCEEDED', 'AUTHENTICATION_ERROR', 'ACCESS_DENIED'].includes(this.categorizeError(error)) && (
                          <div>Try refreshing the page or check your internet connection. If the issue persists, contact support.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                This error has been logged for investigation. You can try the following actions:
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleRetry}
                  disabled={retryCount >= maxRetries}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {retryCount >= maxRetries
                    ? 'Max retries reached'
                    : (() => {
                        const errorType = error ? this.categorizeError(error) : 'UNKNOWN_ERROR';
                        const delay = this.getRetryDelay(retryCount, errorType);
                        const delayText = delay >= 60000 
                          ? `${Math.round(delay / 60000)}m` 
                          : delay >= 1000 
                            ? `${Math.round(delay / 1000)}s` 
                            : `${delay}ms`;
                        return `Retry (${retryCount}/${maxRetries}) - ${delayText} delay`;
                      })()}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleReset}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Reset Component
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
              </div>
            </div>

            {/* Development-only error details */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                  Technical Details (Development Only)
                </summary>
                <div className="mt-2 space-y-2 text-xs">
                  <div>
                    <div className="font-medium">Error Stack:</div>
                    <pre className="mt-1 overflow-auto bg-muted p-2 rounded text-xs">
                      {error.stack}
                    </pre>
                  </div>
                  <div>
                    <div className="font-medium">Component Stack:</div>
                    <pre className="mt-1 overflow-auto bg-muted p-2 rounded text-xs">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return children;
  }
}

export { MatrixErrorBoundary };
export type { MatrixErrorBoundaryProps, ErrorInfo };