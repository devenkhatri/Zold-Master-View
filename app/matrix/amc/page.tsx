'use client';

import { useEffect, useState } from 'react';
// import { MatrixNavigation } from '@/components/matrix/MatrixNavigation';
import { Navigation } from '@/components/Navigation';
import { AmcMatrix } from '@/components/matrix/AmcMatrix';
import { MatrixErrorBoundary } from '@/components/matrix/MatrixErrorBoundary';
import { ClientOnly } from '@/components/ClientOnly';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BarChart3 } from 'lucide-react';

function AmcMatrixPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Set page title and meta description only once
    if (document.title !== 'AMC Payment Matrix - Property Management') {
      document.title = 'AMC Payment Matrix - Property Management';
    }
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && metaDescription.getAttribute('content') !== 'View AMC payments organized by block and flat for each year. Analyze payment patterns and identify gaps in collections.') {
      metaDescription.setAttribute('content', 'View AMC payments organized by block and flat for each year. Analyze payment patterns and identify gaps in collections.');
    }
  }, []); // Empty dependency array to run only once

  const handleCellClick = (cellData: any) => {
    // Handle cell click - could show detailed payment information
    console.log('AMC cell clicked:', cellData);
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Enhanced Loading Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-3xl font-bold tracking-tight">AMC Payment Matrix</h1>
                  <p className="text-blue-100 text-sm sm:text-base mt-1 hidden sm:block">
                    View AMC payments organized by block and flat for each year
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
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading AMC Matrix</h2>
              <p className="text-gray-600">Please wait while we fetch your payment data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Enhanced Professional Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg">
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight">AMC Payment Matrix</h1>
                <p className="text-blue-100 text-sm sm:text-base mt-1 hidden sm:block">
                  View AMC payments organized by block and flat for each year
                </p>
              </div>
            </div>
            <Navigation variant="auto" />
          </div>
        </div>
      </header>

      {/* Main Content - Enhanced responsive container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Navigation Component */}
        {/* <MatrixNavigation className="mb-4 sm:mb-6" /> */}

        {/* AMC Matrix Component - Using enhanced API with error boundary */}
        <ClientOnly
          fallback={
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading AMC Matrix</h2>
                  <p className="text-gray-600">Preparing your payment data...</p>
                </div>
              </div>
            </div>
          }
        >
          <MatrixErrorBoundary
            onError={(error, errorInfo) => {
              console.error('AMC Matrix Page Error:', error, errorInfo);
              // Could send to monitoring service here
            }}
            maxRetries={2}
          >
            <AmcMatrix
              useEnhancedApi={true}
              onCellClick={handleCellClick}
            />
          </MatrixErrorBoundary>
        </ClientOnly>
      </main>
    </div>
  );
}

export default function AmcMatrixPageWithAuth() {
  return (
    <ProtectedRoute>
      <AmcMatrixPage />
    </ProtectedRoute>
  );
}