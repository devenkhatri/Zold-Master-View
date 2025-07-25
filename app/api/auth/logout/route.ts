import { NextResponse } from 'next/server';

export async function POST() {
  // Create a response with success status
  const response = NextResponse.json({ success: true });
  
  // Clear the auth session cookie
  response.cookies.set('auth-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0), // Set to past date to expire the cookie
  });
  
  return response;
}
