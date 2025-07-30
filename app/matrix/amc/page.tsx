'use client';

import { useState, useEffect } from 'react';
import { MatrixNavigation } from '@/components/matrix/MatrixNavigation';
import { AmcMatrix } from '@/components/matrix/AmcMatrix';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Owner, Receipt } from '@/types/property';
import { Building2, BarChart3 } from 'lucide-react';

function AmcMatrixPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Set page title and meta description
    document.title = 'AMC Payment Matrix - Property Management';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'View AMC payments organized by block and flat for each year. Analyze payment patterns and identify gaps in collections.');
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
        setReceipts(data.receipts || []);
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
    // Handle cell click - could show detailed payment information
    console.log('AMC cell clicked:', cellData);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold">AMC Payment Matrix</h1>
              <p className="text-blue-100 text-sm">View AMC payments organized by block and flat for each year</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Component */}
        <MatrixNavigation className="mb-6" />

        {/* AMC Matrix Component */}
        <AmcMatrix
          owners={owners}
          receipts={receipts}
          isLoading={isLoading}
          hasError={hasError}
          onCellClick={handleCellClick}
        />
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

