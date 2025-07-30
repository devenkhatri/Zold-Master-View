'use client';

import { useEffect } from 'react';
import { MatrixNavigation } from '@/components/matrix/MatrixNavigation';
import { Navigation } from '@/components/Navigation';
import { StickerMatrix } from '@/components/matrix/StickerMatrix';
import { MatrixErrorBoundary } from '@/components/matrix/MatrixErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useStickerData } from '@/hooks/useStickerData';
import { Car } from 'lucide-react';

function StickerMatrixPage() {
  const { 
    owners, 
    isLoading, 
    hasError, 
    error,
    summary,
    validationErrors,
    loadingStage,
    canRetry,
    retryCount,
    refetch,
    retry
  } = useStickerData();

  useEffect(() => {
    // Set page title and meta description
    document.title = 'Car Sticker Matrix - Property Management';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'View car sticker assignments organized by block and flat. Identify unassigned units and multiple sticker assignments.');
    }
  }, []);

  // Log validation errors if any
  useEffect(() => {
    if (validationErrors.length > 0) {
      console.warn('Sticker data validation warnings:', validationErrors);
    }
  }, [validationErrors]);

  const handleCellClick = (cellData: any) => {
    // Handle cell click - could show detailed sticker information
    console.log('Sticker cell clicked:', cellData);
    
    // Log additional context for debugging
    if (error) {
      console.error('Current sticker data error:', error);
    }
    if (summary) {
      console.log('Current sticker summary:', summary);
    }
  };

  const handleRefresh = async () => {
    try {
      await refetch(true); // Force refresh
    } catch (err) {
      console.error('Error refreshing sticker data:', err);
    }
  };

  const handleRetry = async () => {
    try {
      await retry();
    } catch (err) {
      console.error('Error retrying sticker data:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Enhanced responsive design */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Car className="h-6 w-6 sm:h-8 sm:w-8 text-white shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold truncate">Car Sticker Assignment Matrix</h1>
                <p className="text-purple-100 text-xs sm:text-sm hidden xs:block">
                  View car sticker assignments organized by block and flat
                </p>
              </div>
            </div>
            <Navigation />
          </div>
        </div>
      </div>

      {/* Main Content - Enhanced responsive container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Navigation Component */}
        <MatrixNavigation className="mb-4 sm:mb-6" />

        {/* Sticker Matrix Component with error boundary */}
        <MatrixErrorBoundary
          onError={(error, errorInfo) => {
            console.error('Sticker Matrix Page Error:', error, errorInfo);
            // Could send to monitoring service here
          }}
          maxRetries={2}
        >
          <StickerMatrix
            owners={owners}
            isLoading={isLoading}
            hasError={hasError}
            onCellClick={handleCellClick}
          />
        </MatrixErrorBoundary>

        {/* Debug information in development */}
        {process.env.NODE_ENV === 'development' && summary && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <p>Total Owners: {summary.totalOwners}</p>
            <p>Total Flats: {summary.totalFlats}</p>
            <p>Assignment Rate: {summary.assignmentRate}%</p>
            <p>Validation Errors: {validationErrors.length}</p>
            <p>Loading Stage: {loadingStage}</p>
            <p>Retry Count: {retryCount}/3</p>
            <div className="mt-2 space-x-2">
              <button 
                onClick={handleRefresh}
                className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
                disabled={isLoading}
              >
                Force Refresh
              </button>
              {canRetry && (
                <button 
                  onClick={handleRetry}
                  className="px-3 py-1 bg-orange-500 text-white rounded text-xs"
                  disabled={isLoading}
                >
                  Retry ({3 - retryCount} left)
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StickerMatrixPageWithAuth() {
  return (
    <ProtectedRoute>
      <StickerMatrixPage />
    </ProtectedRoute>
  );
}

