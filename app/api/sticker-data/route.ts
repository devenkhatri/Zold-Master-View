import { NextResponse } from 'next/server';
import { fetchOwners } from '../data/googleSheetsApi';
import { Owner } from '@/types/property';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
let cachedData: {
  owners: Owner[];
  timestamp: number;
} | null = null;

// Sticker-specific error class
class StickerApiError extends Error {
  status: number;
  code: string;
  
  constructor(message: string, status: number = 500, code: string = 'STICKER_API_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'StickerApiError';
  }
}

// Data validation functions
function validateOwner(owner: any): owner is Owner {
  return (
    owner &&
    typeof owner.id === 'string' &&
    typeof owner.blockNumber === 'string' &&
    typeof owner.flatNumber === 'string' &&
    typeof owner.memberName === 'string' &&
    typeof owner.stickerNos === 'string'
  );
}

// Transform and validate sticker data
function transformStickerData(owners: any[]) {
  const validatedOwners: Owner[] = [];
  const errors: string[] = [];

  // Validate and transform owners
  owners.forEach((owner, index) => {
    if (validateOwner(owner)) {
      // Additional sticker-specific validation
      if (!owner.blockNumber || !owner.flatNumber) {
        errors.push(`Owner ${index}: Missing block or flat number`);
        return;
      }
      
      // Validate sticker numbers format (allow empty)
      if (owner.stickerNos && typeof owner.stickerNos !== 'string') {
        errors.push(`Owner ${index}: Invalid sticker numbers format`);
        return;
      }
      
      validatedOwners.push(owner);
    } else {
      errors.push(`Owner ${index}: Invalid owner data structure`);
    }
  });

  return {
    owners: validatedOwners,
    validationErrors: errors
  };
}

// Process sticker assignments for statistics
function processStickerStatistics(owners: Owner[]) {
  const statistics = {
    totalFlats: 0,
    assignedFlats: 0,
    unassignedFlats: 0,
    multipleStickers: 0,
    totalStickers: 0,
    uniqueBlocks: 0,
    stickersByBlock: {} as Record<string, number>,
    assignmentsByBlock: {} as Record<string, { assigned: number; total: number }>
  };

  // Group owners by block-flat combination
  const flatMap = new Map<string, Owner[]>();
  const blockSet = new Set<string>();
  
  owners.forEach(owner => {
    const flatKey = `${owner.blockNumber}-${owner.flatNumber}`;
    if (!flatMap.has(flatKey)) {
      flatMap.set(flatKey, []);
    }
    flatMap.get(flatKey)!.push(owner);
    blockSet.add(owner.blockNumber);
  });

  statistics.uniqueBlocks = blockSet.size;
  statistics.totalFlats = flatMap.size;

  // Initialize block statistics
  blockSet.forEach(block => {
    statistics.stickersByBlock[block] = 0;
    statistics.assignmentsByBlock[block] = { assigned: 0, total: 0 };
  });

  // Process each flat
  flatMap.forEach((flatOwners, flatKey) => {
    const [blockNumber] = flatKey.split('-');
    statistics.assignmentsByBlock[blockNumber].total++;

    // Collect all stickers for this flat
    const allStickers: string[] = [];
    flatOwners.forEach(owner => {
      if (owner.stickerNos && owner.stickerNos.trim()) {
        const stickers = owner.stickerNos.split(/[,;|]/).map(s => s.trim()).filter(s => s);
        allStickers.push(...stickers);
      }
    });

    // Remove duplicates
    const uniqueStickers = Array.from(new Set(allStickers));

    if (uniqueStickers.length === 0) {
      statistics.unassignedFlats++;
    } else {
      statistics.assignedFlats++;
      statistics.assignmentsByBlock[blockNumber].assigned++;
      statistics.totalStickers += uniqueStickers.length;
      statistics.stickersByBlock[blockNumber] += uniqueStickers.length;
      
      if (uniqueStickers.length > 1) {
        statistics.multipleStickers++;
      }
    }
  });

  return statistics;
}

// Check if cached data is still valid
function isCacheValid(): boolean {
  if (!cachedData) return false;
  return Date.now() - cachedData.timestamp < CACHE_DURATION;
}

// Fetch fresh data from Google Sheets
async function fetchFreshStickerData() {
  try {
    console.log('Fetching fresh sticker data from Google Sheets...');
    
    const owners = await fetchOwners().catch(error => {
      console.error('Error fetching owners for stickers:', error);
      throw new StickerApiError(
        `Failed to fetch owner data: ${error.message}`,
        500,
        'OWNERS_FETCH_ERROR'
      );
    });

    // Transform and validate the data
    const { owners: validatedOwners, validationErrors } = transformStickerData(owners);

    // Log validation results
    if (validationErrors.length > 0) {
      console.warn('Sticker data validation warnings:', validationErrors);
    }

    console.log(`Successfully fetched and validated sticker data: ${validatedOwners.length} owners`);

    // Update cache
    cachedData = {
      owners: validatedOwners,
      timestamp: Date.now()
    };

    return {
      owners: validatedOwners,
      validationErrors,
      fromCache: false
    };

  } catch (error) {
    console.error('Error fetching fresh sticker data:', error);
    
    if (error instanceof StickerApiError) {
      throw error;
    }
    
    throw new StickerApiError(
      `Unexpected error fetching sticker data: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    
    console.log('Sticker API endpoint called', { forceRefresh, cacheValid: isCacheValid() });

    let stickerData;

    // Use cached data if available and valid, unless force refresh is requested
    if (!forceRefresh && isCacheValid() && cachedData) {
      console.log('Returning cached sticker data');
      stickerData = {
        owners: cachedData.owners,
        validationErrors: [],
        fromCache: true
      };
    } else {
      // Fetch fresh data
      stickerData = await fetchFreshStickerData();
    }

    // Calculate statistics
    const statistics = processStickerStatistics(stickerData.owners);

    return NextResponse.json({
      success: true,
      data: {
        owners: stickerData.owners,
        statistics,
        summary: {
          totalOwners: stickerData.owners.length,
          totalFlats: statistics.totalFlats,
          assignedFlats: statistics.assignedFlats,
          unassignedFlats: statistics.unassignedFlats,
          totalStickers: statistics.totalStickers,
          uniqueBlocks: statistics.uniqueBlocks,
          assignmentRate: statistics.totalFlats > 0 ? Math.round((statistics.assignedFlats / statistics.totalFlats) * 100) : 0
        }
      },
      _meta: {
        receivedAt: new Date().toISOString(),
        fromCache: stickerData.fromCache,
        cacheTimestamp: cachedData?.timestamp ? new Date(cachedData.timestamp).toISOString() : null,
        validationErrors: stickerData.validationErrors.length > 0 ? stickerData.validationErrors : undefined
      }
    });

  } catch (error) {
    console.error('Error in Sticker API route:', error);
    
    // Handle different types of errors
    if (error instanceof StickerApiError) {
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
      console.log('Sticker data cache cleared manually');
      
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
    console.error('Error in Sticker API POST route:', error);
    
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