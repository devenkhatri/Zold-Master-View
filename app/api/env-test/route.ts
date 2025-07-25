import { NextResponse } from 'next/server';

export async function GET() {
  // Log all environment variables (without sensitive values)
  const envVars = {
    'NODE_ENV': process.env.NODE_ENV,
    'GOOGLE_SHEETS_API_KEY': process.env.GOOGLE_SHEETS_API_KEY ? '***' + process.env.GOOGLE_SHEETS_API_KEY.slice(-4) : 'Not set',
    'NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY': process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY ? '***' + process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY.slice(-4) : 'Not set',
    'GOOGLE_SHEETS_ID': process.env.GOOGLE_SHEETS_ID ? '***' + process.env.GOOGLE_SHEETS_ID.slice(-4) : 'Not set',
    'NEXT_PUBLIC_GOOGLE_SHEETS_ID': process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID ? '***' + process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID.slice(-4) : 'Not set',
  };

  console.log('Environment variables on server:', JSON.stringify(envVars, null, 2));

  return NextResponse.json({
    message: 'Environment variables check',
    environment: process.env.NODE_ENV,
    envVars,
  });
}
