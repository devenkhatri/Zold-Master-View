'use client';

import * as React from 'react';
import { StickerMatrix } from './StickerMatrix';
import { Owner } from '@/types/property';

// Mock data for testing
const mockOwners: Owner[] = [
  {
    id: '1',
    isOwner: 'Yes',
    mobile1: '9876543210',
    memberName: 'John Doe',
    mobile2: '',
    cars: '1',
    bikes: '1',
    stickerNos: 'S001',
    blockNumber: '1',
    flatNumber: '101',
    blockFlatNumber: '1-101'
  },
  {
    id: '2',
    isOwner: 'Yes',
    mobile1: '9876543211',
    memberName: 'Jane Smith',
    mobile2: '',
    cars: '2',
    bikes: '0',
    stickerNos: 'S002, S003',
    blockNumber: '1',
    flatNumber: '102',
    blockFlatNumber: '1-102'
  },
  {
    id: '3',
    isOwner: 'Yes',
    mobile1: '9876543212',
    memberName: 'Bob Johnson',
    mobile2: '',
    cars: '0',
    bikes: '1',
    stickerNos: '',
    blockNumber: '1',
    flatNumber: '103',
    blockFlatNumber: '1-103'
  },
  {
    id: '4',
    isOwner: 'Yes',
    mobile1: '9876543213',
    memberName: 'Alice Brown',
    mobile2: '',
    cars: '1',
    bikes: '2',
    stickerNos: 'S004',
    blockNumber: '2',
    flatNumber: '201',
    blockFlatNumber: '2-201'
  },
  {
    id: '5',
    isOwner: 'Yes',
    mobile1: '9876543214',
    memberName: 'Charlie Wilson',
    mobile2: '',
    cars: '3',
    bikes: '1',
    stickerNos: 'S005, S006, S007',
    blockNumber: '2',
    flatNumber: '202',
    blockFlatNumber: '2-202'
  },
  {
    id: '6',
    isOwner: 'Yes',
    mobile1: '9876543215',
    memberName: 'Diana Davis',
    mobile2: '',
    cars: '0',
    bikes: '0',
    stickerNos: '',
    blockNumber: '2',
    flatNumber: '203',
    blockFlatNumber: '2-203'
  }
];

const StickerMatrixTest: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const handleCellClick = React.useCallback((data: any) => {
    console.log('Cell clicked:', data);
    alert(`Clicked on Block ${data.blockNumber}, Flat ${data.flatNumber}\n` +
          `Sticker: ${data.value || 'Not Assigned'}\n` +
          `Has Multiple: ${data.hasMultipleStickers ? 'Yes' : 'No'}\n` +
          `Is Unassigned: ${data.isUnassigned ? 'Yes' : 'No'}`);
  }, []);

  const toggleLoading = () => setIsLoading(!isLoading);
  const toggleError = () => setHasError(!hasError);

  return (
    <div className="p-6 space-y-6">
      <div className="flex gap-4 mb-6">
        <button
          onClick={toggleLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Toggle Loading ({isLoading ? 'ON' : 'OFF'})
        </button>
        <button
          onClick={toggleError}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Toggle Error ({hasError ? 'ON' : 'OFF'})
        </button>
      </div>

      <StickerMatrix
        owners={mockOwners}
        isLoading={isLoading}
        hasError={hasError}
        onCellClick={handleCellClick}
      />
    </div>
  );
};

export { StickerMatrixTest };