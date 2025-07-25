import { NextResponse } from 'next/server';
import { fetchOwners, fetchReceipts, fetchMasterData } from '../data/googleSheetsApi';

export async function GET() {
  const results: Record<string, any> = {
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasApiKey: !!process.env.GOOGLE_SHEETS_API_KEY,
      hasSheetId: !!process.env.GOOGLE_SHEETS_ID,
    },
    tests: {}
  };

  try {
    // Test fetchOwners
    try {
      const owners = await fetchOwners();
      results.tests.fetchOwners = {
        success: true,
        count: owners.length,
        firstItem: owners[0] || null
      };
    } catch (error) {
      results.tests.fetchOwners = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      };
    }

    // Test fetchMasterData
    try {
      const masterData = await fetchMasterData();
      results.tests.fetchMasterData = {
        success: true,
        blockOptionsCount: masterData.blockOptions?.length || 0,
        hasGetFlatOptions: typeof masterData.getFlatOptions === 'function'
      };
    } catch (error) {
      results.tests.fetchMasterData = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      };
    }

    // Test fetchReceipts
    try {
      const receipts = await fetchReceipts();
      results.tests.fetchReceipts = {
        success: true,
        count: receipts.length,
        firstItem: receipts[0] || null
      };
    } catch (error) {
      results.tests.fetchReceipts = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      };
    }

    return NextResponse.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Debug endpoint failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
