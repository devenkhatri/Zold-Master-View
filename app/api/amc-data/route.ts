import { NextResponse } from 'next/server';
import { fetchAmcReceipts, fetchOwners } from '../data/googleSheetsApi';
import { Receipt, Owner } from '@/types/property';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
let cachedData: {
  receipts: Receipt[];
  owners: Owner[];
  timestamp: number;
} | null = null;

// AMC-specific error class
class AmcApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number = 500, code: string = 'AMC_API_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'AmcApiError';
  }
}

// Data validation functions
function validateReceipt(receipt: any): receipt is Receipt {
  return (
    receipt &&
    typeof receipt.id === 'string' &&
    typeof receipt.receiptNo === 'string' &&
    typeof receipt.receiptDate === 'string' &&
    typeof receipt.blockNumber === 'string' &&
    typeof receipt.flatNumber === 'string' &&
    typeof receipt.paymentAmount === 'number' &&
    typeof receipt.paymentDate === 'string'
  );
}

function validateOwner(owner: any): owner is Owner {
  return (
    owner &&
    typeof owner.id === 'string' &&
    typeof owner.blockNumber === 'string' &&
    typeof owner.flatNumber === 'string' &&
    typeof owner.memberName === 'string'
  );
}

// Transform and validate AMC data
function transformAmcData(receipts: any[], owners: any[]) {
  const validatedReceipts: Receipt[] = [];
  const validatedOwners: Owner[] = [];
  const errors: string[] = [];

  // Validate and transform receipts
  receipts.forEach((receipt, index) => {
    if (validateReceipt(receipt)) {
      // Additional AMC-specific validation
      if (receipt.paymentAmount <= 0) {
        errors.push(`Receipt ${index}: Invalid payment amount`);
        return;
      }

      // Validate date format
      const paymentDate = new Date(receipt.paymentDate);
      if (isNaN(paymentDate.getTime())) {
        errors.push(`Receipt ${index}: Invalid payment date format`);
        return;
      }

      validatedReceipts.push(receipt);
    } else {
      errors.push(`Receipt ${index}: Invalid receipt data structure`);
    }
  });

  // Validate and transform owners
  owners.forEach((owner, index) => {
    if (validateOwner(owner)) {
      validatedOwners.push(owner);
    } else {
      errors.push(`Owner ${index}: Invalid owner data structure`);
    }
  });

  return {
    receipts: validatedReceipts,
    owners: validatedOwners,
    validationErrors: errors
  };
}

// Check if cached data is still valid
function isCacheValid(): boolean {
  if (!cachedData) return false;
  return Date.now() - cachedData.timestamp < CACHE_DURATION;
}

// Fetch fresh data from Google Sheets
async function fetchFreshAmcData() {
  try {
    console.log('Fetching fresh AMC data from Google Sheets...');

    const [receipts, owners] = await Promise.all([
      fetchAmcReceipts().catch(error => {
        console.error('Error fetching AMC receipts:', error);
        throw new AmcApiError(
          `Failed to fetch AMC receipt data: ${error.message}`,
          500,
          'AMC_RECEIPTS_FETCH_ERROR'
        );
      }),
      fetchOwners().catch(error => {
        console.error('Error fetching owners for AMC:', error);
        throw new AmcApiError(
          `Failed to fetch owner data: ${error.message}`,
          500,
          'OWNERS_FETCH_ERROR'
        );
      })
    ]);

    // Transform and validate the data
    const { receipts: validatedReceipts, owners: validatedOwners, validationErrors } =
      transformAmcData(receipts, owners);

    // Log validation results
    if (validationErrors.length > 0) {
      console.warn('AMC data validation warnings:', validationErrors);
    }

    console.log(`Successfully fetched and validated AMC data: ${validatedReceipts.length} receipts, ${validatedOwners.length} owners`);

    // Update cache
    cachedData = {
      receipts: validatedReceipts,
      owners: validatedOwners,
      timestamp: Date.now()
    };

    return {
      receipts: validatedReceipts,
      owners: validatedOwners,
      validationErrors,
      fromCache: false
    };

  } catch (error) {
    console.error('Error fetching fresh AMC data:', error);

    if (error instanceof AmcApiError) {
      throw error;
    }

    throw new AmcApiError(
      `Unexpected error fetching AMC data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      'UNEXPECTED_ERROR'
    );
  }
}

// Main GET handler
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    console.log('AMC API endpoint called', { forceRefresh, cacheValid: isCacheValid() });

    let amcData;

    // Use cached data if available and valid, unless force refresh is requested
    if (!forceRefresh && isCacheValid() && cachedData) {
      console.log('Returning cached AMC data');
      amcData = {
        receipts: cachedData.receipts,
        owners: cachedData.owners,
        validationErrors: [],
        fromCache: true
      };
    } else {
      // Fetch fresh data
      amcData = await fetchFreshAmcData();
    }

    // Calculate available years for AMC data
    const availableYears = Array.from(
      new Set(
        amcData.receipts
          .map(receipt => new Date(receipt.paymentDate).getFullYear())
          .filter(year => !isNaN(year))
      )
    ).sort((a, b) => b - a);

    // Calculate summary statistics
    const totalPayments = amcData.receipts.reduce((sum, receipt) => sum + receipt.paymentAmount, 0);
    const uniqueBlocks = new Set(amcData.owners.map(owner => owner.blockNumber)).size;
    const uniqueFlats = new Set(amcData.owners.map(owner => `${owner.blockNumber}-${owner.flatNumber}`)).size;

    return NextResponse.json({
      success: true,
      data: {
        receipts: amcData.receipts,
        owners: amcData.owners,
        availableYears,
        summary: {
          totalReceipts: amcData.receipts.length,
          totalOwners: amcData.owners.length,
          totalPayments,
          uniqueBlocks,
          uniqueFlats,
          availableYears: availableYears.length
        }
      },
      _meta: {
        receivedAt: new Date().toISOString(),
        fromCache: amcData.fromCache,
        cacheTimestamp: cachedData?.timestamp ? new Date(cachedData.timestamp).toISOString() : null,
        validationErrors: amcData.validationErrors.length > 0 ? amcData.validationErrors : undefined
      }
    });

  } catch (error) {
    console.error('Error in AMC API route:', error);

    // Handle different types of errors
    if (error instanceof AmcApiError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          timestamp: new Date().toISOString()
        },
        { status: error.status }
      );
    }

    // Handle authentication/authorization errors
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google Sheets API authentication failed',
          code: 'AUTH_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    // Handle rate limiting errors
    if (error instanceof Error && error.message.includes('quota')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google Sheets API quota exceeded. Please try again later.',
          code: 'QUOTA_EXCEEDED',
          timestamp: new Date().toISOString()
        },
        { status: 429 }
      );
    }

    // Default error response
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Optional: Add a POST endpoint to manually clear cache
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === 'clearCache') {
      cachedData = null;
      console.log('AMC data cache cleared manually');

      return NextResponse.json({
        success: true,
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action',
        code: 'INVALID_ACTION'
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in AMC API POST route:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
        code: 'REQUEST_ERROR'
      },
      { status: 500 }
    );
  }
}