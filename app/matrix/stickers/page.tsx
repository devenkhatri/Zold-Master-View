'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { StickerMatrix } from '@/components/matrix/StickerMatrix';
import { MatrixErrorBoundary } from '@/components/matrix/MatrixErrorBoundary';
import { ClientOnly } from '@/components/ClientOnly';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useStickerData } from '@/hooks/useStickerData';
import { Car } from 'lucide-react';

function StickerMatrixPage() {
  const [isMounted, setIsMounted] = useState(false);
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
    setIsMounted(true);
    document.title = 'Car Sticker Matrix - Property Management';
  }, []);

  const handleCellClick = (cellData: any) => {
    console.log('Sticker cell clicked:', cellData);
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <Car className="h-6 w-6 sm:h-8 sm:w-8 text-white shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold truncate">Car Sticker Assignment Matrix</h1>
                </div>
              </div>
              <Navigation />
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading Sticker Matrix...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Car className="h-6 w-6 sm:h-8 sm:w-8 text-white shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold truncate">Car Sticker Assignment Matrix</h1>
              </div>
            </div>
            <Navigation />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        <ClientOnly
          fallback={
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading Sticker Matrix...</p>
              </div>
            </div>
          }
        >
          <MatrixErrorBoundary
            onError={(error, errorInfo) => {
              console.error('Sticker Matrix Page Error:', error, errorInfo);
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
        </ClientOnly>
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
