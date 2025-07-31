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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
        {/* Enhanced Loading Header */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-700 text-white shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Car className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Car Sticker Assignment Matrix</h1>
                  <p className="text-purple-100 text-sm sm:text-base mt-1 hidden sm:block">
                    Manage and track vehicle sticker assignments by block and flat
                  </p>
                </div>
              </div>
              <Navigation variant="auto" />
            </div>
          </div>
        </div>
        
        {/* Loading Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-6"></div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Sticker Matrix</h2>
              <p className="text-gray-600">Please wait while we fetch your sticker data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      {/* Enhanced Professional Header */}
      <header className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-700 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg">
                <Car className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Car Sticker Assignment Matrix</h1>
                <p className="text-purple-100 text-sm sm:text-base mt-1 hidden sm:block">
                  Manage and track vehicle sticker assignments by block and flat
                </p>
              </div>
            </div>
            <Navigation variant="auto" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <ClientOnly
          fallback={
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-6"></div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Sticker Matrix</h2>
                  <p className="text-gray-600">Preparing your sticker data...</p>
                </div>
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
      </main>
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
