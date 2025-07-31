'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { MatrixNavigation } from '@/components/matrix/MatrixNavigation';
import { Navigation } from '@/components/Navigation';
// Dynamic import to prevent SSR issues
const AmcMatrix = dynamic(() => import('@/components/matrix/AmcMatrix').then(mod => ({ default: mod.AmcMatrix })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8">Loading...</div>
});
import { MatrixErrorBoundary } from '@/components/matrix/MatrixErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BarChart3 } from 'lucide-react';

function AmcMatrixPage() {
  useEffect(() => {
    // Set page title and meta description
    document.title = 'AMC Payment Matrix - Property Management';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'View AMC payments organized by block and flat for each year. Analyze payment patterns and identify gaps in collections.');
    }
  }, []);

  const handleCellClick = (cellData: any) => {
    // Handle cell click - could show detailed payment information
    console.log('AMC cell clicked:', cellData);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Enhanced responsive design */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-white shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold truncate">AMC Payment Matrix</h1>
                <p className="text-blue-100 text-xs sm:text-sm hidden xs:block">
                  View AMC payments organized by block and flat for each year
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

        {/* AMC Matrix Component - Using enhanced API with error boundary */}
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
      </div>
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

