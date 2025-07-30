'use client';

import { useState, useEffect } from 'react';
import { MatrixNavigation } from '@/components/matrix/MatrixNavigation';
import { StickerMatrix } from '@/components/matrix/StickerMatrix';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Owner } from '@/types/property';
import { Car } from 'lucide-react';

function StickerMatrixPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Set page title and meta description
    document.title = 'Car Sticker Matrix - Property Management';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'View car sticker assignments organized by block and flat. Identify unassigned units and multiple sticker assignments.');
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        const response = await fetch('/api/sheets');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const data = await response.json();
        setOwners(data.owners || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCellClick = (cellData: any) => {
    // Handle cell click - could show detailed sticker information
    console.log('Sticker cell clicked:', cellData);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Enhanced responsive design */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Car className="h-6 w-6 sm:h-8 sm:w-8 text-white shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold truncate">Car Sticker Assignment Matrix</h1>
              <p className="text-purple-100 text-xs sm:text-sm hidden xs:block">
                View car sticker assignments organized by block and flat
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Enhanced responsive container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Navigation Component */}
        <MatrixNavigation className="mb-4 sm:mb-6" />

        {/* Sticker Matrix Component */}
        <StickerMatrix
          owners={owners}
          isLoading={isLoading}
          hasError={hasError}
          onCellClick={handleCellClick}
        />
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

