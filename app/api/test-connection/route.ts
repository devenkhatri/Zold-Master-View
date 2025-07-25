import { NextResponse } from 'next/server';

// This is a test endpoint to verify Google Sheets API connection
export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    const sheetId = process.env.GOOGLE_SHEETS_ID;
    const testRange = process.env.GOOGLE_SHEETS_OWNERS_RANGE || 'Sheet1!A1:B2';
    
    if (!apiKey || !sheetId) {
      throw new Error('Missing required environment variables');
    }
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(testRange)}?key=${apiKey}`;
    
    // console.log('Testing connection to:', url.replace(apiKey, '***'));
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Google Sheets API Error:', data);
      throw new Error(`API Error (${response.status}): ${data.error?.message || 'Unknown error'}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully connected to Google Sheets API',
      data: {
        sheetId: sheetId ? '***' + sheetId.slice(-4) : 'MISSING',
        range: testRange,
        rowCount: data.values?.length || 0,
        firstFewRows: data.values?.slice(0, 3) || []
      }
    });
    
  } catch (error) {
    console.error('Test connection failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' 
          ? (error as any)?.response?.data || error 
          : undefined
      },
      { status: 500 }
    );
  }
}
