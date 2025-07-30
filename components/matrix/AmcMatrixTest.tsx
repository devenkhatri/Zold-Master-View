'use client';

import * as React from 'react';
import { AmcMatrix } from './AmcMatrix';
import { mockOwners, mockReceipts } from '@/app/api/data/mockData';

export const AmcMatrixTest: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const handleCellClick = React.useCallback((data: any) => {
    console.log('AMC Matrix cell clicked:', data);
    alert(`Clicked: Block ${data.blockNumber}, Flat ${data.flatNumber}\nAmount: ${data.value ? `₹${data.value}` : 'No payment'}`);
  }, []);

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const simulateError = () => {
    setHasError(true);
    setTimeout(() => setHasError(false), 3000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold">AMC Matrix Component Test</h2>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={simulateLoading}
            className="px-4 py-2 rounded-md text-sm font-medium bg-blue-500 text-white hover:bg-blue-600"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Test Loading'}
          </button>
          <button
            onClick={simulateError}
            className="px-4 py-2 rounded-md text-sm font-medium bg-red-500 text-white hover:bg-red-600"
            disabled={hasError}
          >
            {hasError ? 'Error Active' : 'Test Error'}
          </button>
        </div>
      </div>

      <div className="border border-border rounded-lg p-4">
        <AmcMatrix
          owners={mockOwners}
          receipts={mockReceipts}
          isLoading={isLoading}
          hasError={hasError}
          onCellClick={handleCellClick}
          className="max-w-full"
        />
      </div>

      <div className="text-sm text-muted-foreground space-y-2">
        <p><strong>Test Instructions:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>The matrix should display AMC payments by block and flat</li>
          <li>Year selector should show available years from receipt data (2022, 2023, 2024, 2025)</li>
          <li>Hover over cells to see payment details and dates in tooltips</li>
          <li>Click on cells to trigger click handlers</li>
          <li>Row and column totals should be displayed</li>
          <li>Test loading and error states with the buttons above</li>
          <li>Verify responsive behavior by resizing the window</li>
        </ul>
        
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p><strong>Expected Data:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Block B, Flat 404: Multiple payments across years (2022: ₹18,500, 2023: ₹22,000, 2024: ₹24,000, 2025: ₹25,070)</li>
            <li>Block A, Flat 201: One payment in 2024 (₹20,000)</li>
            <li>Block C, Flat 105: No payments (should show empty)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};