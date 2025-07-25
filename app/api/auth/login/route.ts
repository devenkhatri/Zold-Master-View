import { NextResponse } from 'next/server';
import { hashPassword, verifyPassword } from '@/lib/auth-utils';
import { fetchSheet, getEnvVariable } from '@/app/api/data/googleSheetsApi';

// Note: This API route won't work with static export (output: 'export')
// You'll need to use a serverless function or API route handler
// that's compatible with your deployment platform

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Fetch users from Google Sheets
    const masterDataRange = getEnvVariable('GOOGLE_SHEETS_MASTERDATA_RANGE', 'MasterData!A1:F100');
    const data = await fetchSheet(masterDataRange);
    
    // Skip header row and find user
    const userRow = data.slice(1).find(
      (row: any[]) => 
        row[3]?.toString().toLowerCase() === username.toLowerCase() && // Column D: Username
        row[5]?.toString().toLowerCase() === 'true' // Column F: isActive
    );

    if (!userRow) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const hashedPassword = userRow[4]; // Column E: Password
    const isPasswordValid = await verifyPassword(password, hashedPassword);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Create session
    const user = {
      username: userRow[3], // Column D: Username
      isActive: userRow[5] === 'true', // Column F: isActive
      name: userRow[1], // Column B: Name
      email: userRow[2], // Column C: Email
    };

    // Set a secure HTTP-only cookie for session management
    const response = NextResponse.json(user);
    response.cookies.set({
      name: 'auth-session',
      value: JSON.stringify(user),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      domain: process.env.NODE_ENV === 'production' ? '.zold-master-view.vercel.app' : undefined
    });
    
    // Also set a non-httpOnly cookie for client-side checks if needed
    response.cookies.set({
      name: 'is-authenticated',
      value: 'true',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      domain: process.env.NODE_ENV === 'production' ? '.zold-master-view.vercel.app' : undefined
    });
    
    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
