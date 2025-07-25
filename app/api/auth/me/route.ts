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
    
    // Verify the user exists in the sheet and is active
    const data = await fetchSheet(process.env.GOOGLE_SHEETS_MASTERDATA_RANGE || 'MasterData!A1:F100');
    const userRow = data.find(
      (row: any[]) => 
        row[3]?.toString().toLowerCase() === user.username?.toLowerCase() // Column D: Username
    );
    
    if (!userRow || userRow[5]?.toString().toLowerCase() !== 'true') { // Column F: isActive
      // Clear the invalid session
      const response = NextResponse.json(
        { error: 'Session expired or user not found' },
        { status: 401 }
      );
      
      response.cookies.set({
        name: 'auth-session',
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: new Date(0),
        domain: process.env.NODE_ENV === 'production' ? '.zold-master-view.vercel.app' : undefined
      });
      
      // Also clear the client-side auth cookie
      response.cookies.set({
        name: 'is-authenticated',
        value: '',
        path: '/',
        expires: new Date(0),
        domain: process.env.NODE_ENV === 'production' ? '.zold-master-view.vercel.app' : undefined
      });
      
      return response;
    }
    
    // Return the full user data including name and email
    const userData = {
      username: userRow[3],
      name: userRow[1],
      email: userRow[2],
      isActive: userRow[5] === 'true'
    };
    
    return NextResponse.json(userData);
    
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'An error occurred while checking session' },
      { status: 500 }
    );
  }
}
