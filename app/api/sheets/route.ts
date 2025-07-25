import { NextResponse } from 'next/server';
import { fetchOwners, fetchReceipts, fetchMasterData } from '../data/googleSheetsApi';

// Helper to handle errors consistently
class SheetsApiError extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
    this.name = 'SheetsApiError';
  }
}

export async function GET() {
  try {
    // Log environment variable status (without exposing sensitive data)
    console.log('Sheets API endpoint called');
    
    // These will now run on the server where env vars are available
    const [owners, receipts, masterData] = await Promise.all([
      fetchOwners().catch(error => {
        console.error('Error fetching owners:', error);
        throw new SheetsApiError(`Failed to fetch owners: ${error.message}`, 500);
      }),
      fetchReceipts().catch(error => {
        console.error('Error fetching receipts:', error);
        // Don't fail the entire request if receipts fail
        console.warn('Continuing without receipts due to error');
        return [];
      }),
      fetchMasterData().catch(error => {
        console.error('Error fetching master data:', error);
        throw new SheetsApiError(`Failed to fetch master data: ${error.message}`, 500);
      })
    ]);

    // Log success (without sensitive data)
    console.log('Successfully fetched data from Google Sheets');
    
    return NextResponse.json({
      success: true,
      data: {
        owners,
        receipts,
        ...masterData
      },
      _meta: {
        receivedAt: new Date().toISOString(),
        counts: {
          owners: owners?.length || 0,
          receipts: receipts?.length || 0,
          blockOptions: masterData?.blockOptions?.length || 0
        }
      }
    });
  } catch (error) {
    console.error('Error in sheets API route:', error);
    
    // Handle different types of errors
    if (error instanceof SheetsApiError) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          code: error.name
        },
        { status: error.status }
      );
    }
    
    // Default error response
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}
