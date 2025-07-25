import { NextRequest, NextResponse } from 'next/server';
import { fetchSheet } from '@/app/api/data/googleSheetsApi';

// This endpoint checks if the user has a valid session
export async function GET(request: NextRequest) {
  try {
    // Get the auth session cookie
    const cookie = request.cookies.get('auth-session');
    
    if (!cookie?.value) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Parse the user data from the cookie
    const user = JSON.parse(cookie.value);
    
    // In a production app, you would:
    // 1. Validate the session token
    // 2. Verify the user still exists and is active
    
    // For this demo, we'll just verify the user exists in the sheet
    const data = await fetchSheet(process.env.GOOGLE_SHEETS_MASTERDATA_RANGE || 'MasterData!A1:F100');
    const userExists = data.some(
      (row: any[]) => 
        row[3]?.toString().toLowerCase() === user.username.toLowerCase() && // Column D: Username
        row[5]?.toString().toLowerCase() === 'true' // Column F: isActive
    );
    
    if (!userExists) {
      // Clear the invalid session
      const response = NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
      
      response.cookies.set('auth-session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: new Date(0),
      });
      
      return response;
    }
    
    return NextResponse.json(user);
    
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'An error occurred while checking session' },
      { status: 500 }
    );
  }
}
