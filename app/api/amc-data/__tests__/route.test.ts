/**
 * @jest-environment node
 */

import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

// Mock the Google Sheets API functions
jest.mock('../../data/googleSheetsApi', () => ({
  fetchReceipts: jest.fn(),
  fetchOwners: jest.fn(),
}));

import { fetchReceipts, fetchOwners } from '../../data/googleSheetsApi';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

const mockFetchReceipts = fetchReceipts as jest.MockedFunction<typeof fetchReceipts>;
const mockFetchOwners = fetchOwners as jest.MockedFunction<typeof fetchOwners>;

// Mock data
const mockReceipts = [
  {
    id: 'R001_B1_F1_0',
    receiptNo: 'R001',
    receiptDate: '2024-01-15',
    blockNumber: 'B1',
    flatNumber: 'F1',
    name: 'John Doe',
    mode: 'Online',
    paymentAmount: 5000,
    paymentNo: 'P001',
    paymentDate: '2024-01-15',
    paymentBank: 'HDFC',
    remarks: 'AMC Payment',
    pdfStatus: 'Generated',
    pdfUrl: 'https://example.com/receipt.pdf',
    pdfName: 'receipt_R001.pdf',
  },
  {
    id: 'R002_B1_F2_1',
    receiptNo: 'R002',
    receiptDate: '2024-01-16',
    blockNumber: 'B1',
    flatNumber: 'F2',
    name: 'Jane Smith',
    mode: 'Cash',
    paymentAmount: 4500,
    paymentNo: 'P002',
    paymentDate: '2024-01-16',
    paymentBank: '',
    remarks: 'AMC Payment',
    pdfStatus: 'Pending',
    pdfUrl: '',
    pdfName: '',
  },
];

const mockOwners = [
  {
    id: 'B1F1owner',
    isOwner: 'Yes',
    memberName: 'John Doe',
    mobile1: '9876543210',
    mobile2: '',
    cars: '1',
    bikes: '2',
    stickerNos: 'S001',
    blockNumber: 'B1',
    flatNumber: 'F1',
    blockFlatNumber: 'B1-F1',
  },
  {
    id: 'B1F2owner',
    isOwner: 'Yes',
    memberName: 'Jane Smith',
    mobile1: '9876543211',
    mobile2: '',
    cars: '0',
    bikes: '1',
    stickerNos: 'S002',
    blockNumber: 'B1',
    flatNumber: 'F2',
    blockFlatNumber: 'B1-F2',
  },
];

describe('/api/amc-data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any cached data
    jest.resetModules();
  });

  describe('GET', () => {
    it('should return AMC data successfully', async () => {
      mockFetchReceipts.mockResolvedValue(mockReceipts);
      mockFetchOwners.mockResolvedValue(mockOwners);

      const request = new NextRequest('http://localhost:3000/api/amc-data');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.receipts).toHaveLength(2);
      expect(data.data.owners).toHaveLength(2);
      expect(data.data.availableYears).toContain(2024);
      expect(data.data.summary.totalReceipts).toBe(2);
      expect(data.data.summary.totalOwners).toBe(2);
      expect(data.data.summary.totalPayments).toBe(9500);
    });

    it('should handle validation errors gracefully', async () => {
      const invalidReceipts = [
        {
          id: 'invalid',
          receiptNo: 'R001',
          receiptDate: '2024-01-15',
          blockNumber: 'B1',
          flatNumber: 'F1',
          name: 'John Doe',
          mode: 'Online',
          paymentAmount: -100, // Invalid negative amount
          paymentNo: 'P001',
          paymentDate: '2024-01-15',
          paymentBank: 'HDFC',
          remarks: 'AMC Payment',
          pdfStatus: 'Generated',
          pdfUrl: 'https://example.com/receipt.pdf',
          pdfName: 'receipt_R001.pdf',
        },
        {
          id: 'valid',
          receiptNo: 'R002',
          receiptDate: '2024-01-16',
          blockNumber: 'B1',
          flatNumber: 'F2',
          name: 'Jane Smith',
          mode: 'Cash',
          paymentAmount: 4500, // Valid amount
          paymentNo: 'P002',
          paymentDate: '2024-01-16',
          paymentBank: '',
          remarks: 'AMC Payment',
          pdfStatus: 'Pending',
          pdfUrl: '',
          pdfName: '',
        },
      ];

      mockFetchReceipts.mockResolvedValue(invalidReceipts as any);
      mockFetchOwners.mockResolvedValue(mockOwners);

      const request = new NextRequest('http://localhost:3000/api/amc-data');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.receipts).toHaveLength(1); // Only valid receipt included
      expect(data._meta.validationErrors).toBeDefined();
      expect(data._meta.validationErrors.length).toBeGreaterThan(0);
    });

    it('should handle Google Sheets API errors', async () => {
      // Clear any cached data first
      jest.resetModules();
      
      mockFetchReceipts.mockRejectedValue(new Error('Google Sheets API error'));
      mockFetchOwners.mockResolvedValue(mockOwners);

      const request = new NextRequest('http://localhost:3000/api/amc-data?refresh=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to fetch receipt data');
      expect(data.code).toBe('RECEIPTS_FETCH_ERROR');
    });

    it('should support force refresh parameter', async () => {
      mockFetchReceipts.mockResolvedValue(mockReceipts);
      mockFetchOwners.mockResolvedValue(mockOwners);

      const request = new NextRequest('http://localhost:3000/api/amc-data?refresh=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data._meta.fromCache).toBe(false);
    });

    it('should handle authentication errors', async () => {
      // Clear any cached data first
      jest.resetModules();
      
      const authError = new Error('API key not configured');
      authError.message = 'Google Sheets API key not configured';
      
      mockFetchReceipts.mockRejectedValue(authError);
      mockFetchOwners.mockResolvedValue(mockOwners);

      const request = new NextRequest('http://localhost:3000/api/amc-data?refresh=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.code).toBe('AUTH_ERROR');
    });

    it('should handle quota exceeded errors', async () => {
      // Clear any cached data first
      jest.resetModules();
      
      const quotaError = new Error('Quota exceeded');
      quotaError.message = 'Google Sheets API quota exceeded';
      
      mockFetchReceipts.mockRejectedValue(quotaError);
      mockFetchOwners.mockResolvedValue(mockOwners);

      const request = new NextRequest('http://localhost:3000/api/amc-data?refresh=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.code).toBe('QUOTA_EXCEEDED');
    });
  });

  describe('POST', () => {
    it('should clear cache successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/amc-data', {
        method: 'POST',
        body: JSON.stringify({ action: 'clearCache' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Cache cleared successfully');
    });

    it('should handle invalid action', async () => {
      const request = new NextRequest('http://localhost:3000/api/amc-data', {
        method: 'POST',
        body: JSON.stringify({ action: 'invalidAction' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('INVALID_ACTION');
    });

    it('should handle malformed request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/amc-data', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.code).toBe('REQUEST_ERROR');
    });
  });
});