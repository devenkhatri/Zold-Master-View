import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ message: 'Logged out successfully' });
    
    // Clear the auth cookie
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
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to log out' },
      { status: 500 }
    );
  }
}
