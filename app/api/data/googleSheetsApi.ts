import { Owner, Receipt } from '@/types/property';

// Debug: Check if running on server
const isServer = typeof window === 'undefined';
// console.log('[googleSheetsApi] Running in environment:', isServer ? 'Server' : 'Client');

// This file should only be used on the server side
if (!isServer) {
  throw new Error('googleSheetsApi should only be used on the server side');
}

// Helper function to get environment variables (server-side only)
export function getEnvVariable(key: string, fallback: string = ''): string {
  // This will only run on the server where env vars are available
  const value = process.env[key] || process.env[`NEXT_PUBLIC_${key}`];
  
  if (!value && !fallback) {
    console.warn(`Environment variable ${key} is not set`);
  }
  
  return value || fallback;
}

// Log environment variable status (without sensitive data)
// console.log('[googleSheetsApi] Environment variables status:', {
//   hasApiKey: !!process.env.GOOGLE_SHEETS_API_KEY,
//   hasSheetId: !!process.env.GOOGLE_SHEETS_ID,
//   ownersRange: process.env.GOOGLE_SHEETS_OWNERS_RANGE || 'Using default',
//   masterDataRange: process.env.GOOGLE_SHEETS_MASTERDATA_RANGE || 'Using default',
//   hasReceiptsSheets: !!process.env.GOOGLE_SHEETS_RECEIPTS_SHEETS
// });

// Get environment variables with fallbacks
const API_KEY = getEnvVariable('GOOGLE_SHEETS_API_KEY');
const SHEET_ID = getEnvVariable('GOOGLE_SHEETS_ID');
const OWNERS_RANGE = getEnvVariable('GOOGLE_SHEETS_OWNERS_RANGE', 'MemberData!A1:L300');
const MASTERDATA_RANGE = getEnvVariable('GOOGLE_SHEETS_MASTERDATA_RANGE', 'MasterData!A1:F100');

// Handle RECEIPTS_SHEETS which is an array
const receiptsSheetsStr = getEnvVariable('GOOGLE_SHEETS_RECEIPTS_SHEETS', '');
const RECEIPTS_SHEETS = receiptsSheetsStr ? receiptsSheetsStr.split(',').map(s => s.trim()) : [];

// console.log('[googleSheetsApi] Configured with:', {
//   ownersRange: OWNERS_RANGE,
//   masterDataRange: MASTERDATA_RANGE,
//   receiptsSheets: RECEIPTS_SHEETS
// });

// Export all necessary functions and variables
export async function fetchSheet(range: string): Promise<any[][]> {
  try {
    // console.log("Fetching sheet with range:", range);
    // console.log("Using Sheet ID:", SHEET_ID ? '***' + SHEET_ID.slice(-4) : 'MISSING');
    
    if (!API_KEY) throw new Error('Google Sheets API key not set');
    if (!SHEET_ID) throw new Error('Google Sheet ID not set');
    if (!range) throw new Error('Sheet range not specified');
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
    // console.log("Request URL:", url.replace(API_KEY, '***'));
    
    const res = await fetch(url);
    const responseText = await res.text();
    
    if (!res.ok) {
      console.error('Google Sheets API Error:', {
        status: res.status,
        statusText: res.statusText,
        response: responseText,
        url: url.replace(API_KEY, '***')
      });
      throw new Error(`Failed to fetch sheet (${res.status}): ${res.statusText}`);
    }
    
    const data = JSON.parse(responseText);
    return data.values || [];
  } catch (error) {
    console.error('Error in fetchSheet:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      range,
      sheetId: SHEET_ID ? '***' + SHEET_ID.slice(-4) : 'MISSING',
      hasApiKey: !!API_KEY
    });
    throw error;
  }
}

export async function fetchOwners(): Promise<Owner[]> {
  const rows = await fetchSheet(OWNERS_RANGE);
  const [header, ...dataRows] = rows;
  return dataRows.map(row => ({
    id: row[0]+row[1]+row[2],
    isOwner: row[2],    
    memberName: row[3],
    mobile1: row[4],
    mobile2: row[5],
    cars: row[7],
    bikes: row[8],
    stickerNos: row[11],
    blockNumber: row[0],
    flatNumber: row[1],
    blockFlatNumber: row[12],
  })) as Owner[];
}

// Fetch unique block options and flat options for a given block from MasterData
export async function fetchMasterData() {
  const rows = await fetchSheet(MASTERDATA_RANGE);
  const [header, ...dataRows] = rows;
  const blockSet = new Set<string>();
  const blockToFlats: Record<string, Set<string>> = {};
  for (const row of dataRows) {
    const block = row[0];
    const flat = row[1];
    if (block) {
      blockSet.add(block);
      if (!blockToFlats[block]) blockToFlats[block] = new Set();
      if (flat) blockToFlats[block].add(flat);
    }
  }
  const blockOptions = Array.from(blockSet).sort();
  const getFlatOptions = (blockNumber: string): string[] => {
    return blockToFlats[blockNumber] ? Array.from(blockToFlats[blockNumber]).sort() : [];
  };
  return { blockOptions, getFlatOptions };
}

export async function fetchReceipts(): Promise<Receipt[]> {
  if (!RECEIPTS_SHEETS.length) return [];
  let allRows: any[][] = [];
  for (const sheetName of RECEIPTS_SHEETS) {
    const rows = await fetchSheet(`${sheetName}!A1:N1000`); // N = 14 columns
    if (rows.length > 1) {
      allRows = allRows.concat(rows.slice(1)); // skip header
    }
  }
  // Columns: Receipt No, Receipt Date, Block No, Flat No, Name, Mode, Payment Amount, Payment No, Payment Date, Payment Bank, Remarks, PDF Status, PDF URL, PDF Name
  return allRows.map((row, idx) => ({
    id: `${row[0]}_${row[2]}_${row[3]}_${idx}`,
    receiptNo: row[0],
    receiptDate: row[1],
    blockNumber: row[2],
    flatNumber: row[3],
    name: row[4],
    mode: row[5],
    paymentAmount: Number(row[6]),
    paymentNo: row[7],
    paymentDate: row[8],
    paymentBank: row[9],
    remarks: row[10],
    pdfStatus: row[11],
    pdfUrl: row[12],
    pdfName: row[13],
  }));
}

// Export config object with all necessary variables
export const config = {
  API_KEY,
  SHEET_ID,
  OWNERS_RANGE,
  MASTERDATA_RANGE,
  RECEIPTS_SHEETS
};
