'use client';

import * as React from 'react';
import { Matrix, MatrixData } from './Matrix';
import { MatrixCellData } from './MatrixCell';

// Sample data for demonstration
const sampleAmcData: MatrixData = {
  blocks: ['A', 'B', 'C'],
  flats: ['101', '102', '103', '201', '202'],
  cells: [
    [
      { blockNumber: 'A', flatNumber: '101', value: 5000, metadata: { paymentDate: '2024-01-15', receiptNumber: 'RCP001' } },
      { blockNumber: 'A', flatNumber: '102', value: 7500, metadata: { paymentDate: '2024-01-20', receiptNumber: 'RCP002' } },
      { blockNumber: 'A', flatNumber: '103', value: null },
      { blockNumber: 'A', flatNumber: '201', value: 6000, metadata: { paymentDate: '2024-01-25', receiptNumber: 'RCP003' } },
      { blockNumber: 'A', flatNumber: '202', value: null },
    ],
    [
      { blockNumber: 'B', flatNumber: '101', value: 4500, metadata: { paymentDate: '2024-02-01', receiptNumber: 'RCP004' } },
      { blockNumber: 'B', flatNumber: '102', value: null },
      { blockNumber: 'B', flatNumber: '103', value: 8000, metadata: { paymentDate: '2024-02-10', receiptNumber: 'RCP005' } },
      { blockNumber: 'B', flatNumber: '201', value: null },
      { blockNumber: 'B', flatNumber: '202', value: 5500, metadata: { paymentDate: '2024-02-15', receiptNumber: 'RCP006' } },
    ],
    [
      { blockNumber: 'C', flatNumber: '101', value: null },
      { blockNumber: 'C', flatNumber: '102', value: 6500, metadata: { paymentDate: '2024-03-01', receiptNumber: 'RCP007' } },
      { blockNumber: 'C', flatNumber: '103', value: null },
      { blockNumber: 'C', flatNumber: '201', value: 7000, metadata: { paymentDate: '2024-03-05', receiptNumber: 'RCP008' } },
      { blockNumber: 'C', flatNumber: '202', value: null },
    ],
  ]
};

const sampleStickerData: MatrixData = {
  blocks: ['A', 'B', 'C'],
  flats: ['101', '102', '103', '201', '202'],
  cells: [
    [
      { blockNumber: 'A', flatNumber: '101', value: 'ST001', metadata: { stickerCount: 1 } },
      { blockNumber: 'A', flatNumber: '102', value: 'ST002,ST003', metadata: { stickerCount: 2 } },
      { blockNumber: 'A', flatNumber: '103', value: null },
      { blockNumber: 'A', flatNumber: '201', value: 'ST004', metadata: { stickerCount: 1 } },
      { blockNumber: 'A', flatNumber: '202', value: null },
    ],
    [
      { blockNumber: 'B', flatNumber: '101', value: 'ST005', metadata: { stickerCount: 1 } },
      { blockNumber: 'B', flatNumber: '102', value: null },
      { blockNumber: 'B', flatNumber: '103', value: 'ST006,ST007,ST008', metadata: { stickerCount: 3 } },
      { blockNumber: 'B', flatNumber: '201', value: null },
      { blockNumber: 'B', flatNumber: '202', value: 'ST009', metadata: { stickerCount: 1 } },
    ],
    [
      { blockNumber: 'C', flatNumber: '101', value: null },
      { blockNumber: 'C', flatNumber: '102', value: 'ST010', metadata: { stickerCount: 1 } },
      { blockNumber: 'C', flatNumber: '103', value: null },
      { blockNumber: 'C', flatNumber: '201', value: 'ST011,ST012', metadata: { stickerCount: 2 } },
      { blockNumber: 'C', flatNumber: '202', value: null },
    ],
  ]
};

export const MatrixDemo: React.FC = () => {
  const [currentView, setCurrentView] = React.useState<'amc' | 'sticker'>('amc');
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const handleCellClick = React.useCallback((data: MatrixCellData) => {
    console.log('Cell clicked:', data);
    alert(`Clicked: Block ${data.blockNumber}, Flat ${data.flatNumber}\nValue: ${data.value || 'None'}`);
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
        <h2 className="text-2xl font-bold">Matrix Components Demo</h2>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCurrentView('amc')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'amc'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            AMC Matrix
          </button>
          <button
            onClick={() => setCurrentView('sticker')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'sticker'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Sticker Matrix
          </button>
          <button
            onClick={simulateLoading}
            className="px-4 py-2 rounded-md text-sm font-medium bg-blue-500 text-white hover:bg-blue-600"
          >
            Test Loading
          </button>
          <button
            onClick={simulateError}
            className="px-4 py-2 rounded-md text-sm font-medium bg-red-500 text-white hover:bg-red-600"
          >
            Test Error
          </button>
        </div>
      </div>

      <div className="border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">
          {currentView === 'amc' ? 'AMC Payment Matrix' : 'Car Sticker Matrix'}
        </h3>
        
        <Matrix
          data={currentView === 'amc' ? sampleAmcData : sampleStickerData}
          type={currentView}
          isLoading={isLoading}
          hasError={hasError}
          onCellClick={handleCellClick}
          className="max-w-full"
        />
      </div>

      <div className="text-sm text-muted-foreground space-y-2">
        <p><strong>Instructions:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Hover over cells to see detailed tooltips</li>
          <li>Click on cells to trigger click handlers</li>
          <li>Use keyboard navigation (Tab, Enter, Space) for accessibility</li>
          <li>Switch between AMC and Sticker views using the buttons above</li>
          <li>Test loading and error states with the respective buttons</li>
          <li>Resize the window to test responsive behavior</li>
        </ul>
      </div>
    </div>
  );
};