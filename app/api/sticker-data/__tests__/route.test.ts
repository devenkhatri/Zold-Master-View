/**
 * @jest-environment node
 */

import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

// Mock the Google Sheets API
jest.mock('../../data/googleSheetsApi', () => ({
  fetchOwners: jest.fn(),
}));

import { fetchOwners } from '../../data/googleSheetsApi';

const mockFetchOwners = fetchOwners as jest.MockedFunction<typeof fetchOwners>;

// Mock data
const mockOwners = [
  {
    id: '1',
    isOwner: 'Yes',
    memberName: 'John Doe',
    mobile1: '1234567890',
    mobile2: '',
    cars: '1',
    bikes: '0',
    stickerNos: 'ST001',
    blockNumber: 'A',
    flatNumber: '101',
    blockFlatNumber: 'A-101',
  },
  {
    id: '2',
    isOwner: 'Yes',
    memberName: 'Jane Smith',
    mobile1: '0987654321',
    mobile2: '',
    cars: '2',
    bikes: '1',
    stickerNos: 'ST002,ST003',
    blockNumber: 'A',
    flatNumber: '102',
    blockFlatNumber: 'A-102',
  },
  {
    id: '3',
    isOwner: 'Yes',
    memberName: 'Bob Johnson',
    mobile1: '5555555555',
    mobile2: '',
    cars: '0',
    bikes: '0',
    stickerNos: '',
    blockNumber: 'B',
    flatNumber: '201',
    blockFlatNumber: 'B-201',
  },
];

// Clear module cache to reset the cached data between tests
let cachedDataBackup: any = null;

describe('Sticker Data API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Clear the module cache to reset cached data
    const routeModule = require('../route');
    if (routeModule.cachedData) {
      cachedDataBackup = routeModule.cachedData;
      routeModule.cachedData = null;
    }
  });

  afterEach(() => {
    // Restore cached data if needed
    if (cachedDataBackup) {
      const routeModule = require('../route');
      routeModule.cachedData = cachedDataBackup;
      cachedDataBackup = null;
    }
  });

  describe('GET /api/sticker-data', () => {
    it('should return sticker data successfully', async () => {
      mockFetchOwners.mockResolvedValue(mockOwners);

      const request = new NextRequest('http://localhost:3000/api/sticker-data');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.owners).toHaveLength(3);
      expect(data.data.summary.totalOwners).toBe(3);
      expect(data.data.summary.totalFlats).toBe(3);
      expect(data.data.summary.assignedFlats).toBe(2);
      expect(data.data.summary.unassignedFlats).toBe(1);
      expect(data.data.summary.totalStickers).toBe(3);
      expect(data.data.statistics.multipleStickers).toBe(1);
    });

    it('should handle validation errors gracefully', async () => {
      const invalidOwners = [
        ...mockOwners,
        {
          id: '4',
          isOwner: 'Yes',
          memberName: '', // Invalid: empty name
          mobile1: '1111111111',
          mobile2: '',
          cars: '1',
          bikes: '0',
          stickerNos: 'ST004',
          blockNumber: '', // Invalid: empty block
          flatNumber: '301',
          blockFlatNumber: '-301',
        },
      ];

      mockFetchOwners.mockResolvedValue(invalidOwners);

      const request = new NextRequest('http://localhost:3000/api/sticker-data');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.owners).toHaveLength(3); // Only valid owners included
      expect(data._meta.validationErrors).toBeDefined();
      expect(data._meta.validationErrors.length).toBeGreaterThan(0);
    });

    it('should handle Google Sheets API errors', async () => {
      mockFetchOwners.mockRejectedValue(new Error('Google Sheets API error'));

      jest.resetModules();

      const request = new NextRequest('http://localhost:3000/api/sticker-data');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to fetch owner data');
      expect(data.code).toBe('OWNERS_FETCH_ERROR');
    });

    it('should support force refresh parameter', async () => {
      mockFetchOwners.mockResolvedValue(mockOwners);

      const request = new NextRequest('http://localhost:3000/api/sticker-data?refresh=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data._meta.fromCache).toBe(false);
    });

    it('should handle authentication errors', async () => {
      mockFetchOwners.mockRejectedValue(new Error('API key not configured'));

      jest.resetModules();

      const request = new NextRequest('http://localhost:3000/api/sticker-data');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.code).toBe('AUTH_ERROR');
    });

    it('should handle quota exceeded errors', async () => {
      mockFetchOwners.mockRejectedValue(new Error('quota exceeded'));

      jest.resetModules();

      const request = new NextRequest('http://localhost:3000/api/sticker-data');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.code).toBe('QUOTA_EXCEEDED');
    });
  });

  describe('POST /api/sticker-data', () => {
    it('should clear cache successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/sticker-data', {
        method: 'POST',
        body: JSON.stringify({ action: 'clearCache' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Cache cleared successfully');
    });

    it('should handle invalid action', async () => {
      const request = new NextRequest('http://localhost:3000/api/sticker-data', {
        method: 'POST',
        body: JSON.stringify({ action: 'invalidAction' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('INVALID_ACTION');
    });

    it('should handle malformed request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/sticker-data', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.code).toBe('REQUEST_ERROR');
    });
  });
});