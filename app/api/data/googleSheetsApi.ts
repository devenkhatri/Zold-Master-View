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

// AMC-specific receipt sheets (filter for AMC receipts only)
const AMC_RECEIPTS_SHEETS = RECEIPTS_SHEETS.filter(sheet =>
  sheet.toLowerCase().includes('amc') ||
  sheet.toLowerCase().includes('maintenance')
);

// console.log('[googleSheetsApi] Configured with:', {
//   ownersRange: OWNERS_RANGE,
//   masterDataRange: MASTERDATA_RANGE,
//   allReceiptsSheets: RECEIPTS_SHEETS,
//   amcReceiptsSheets: AMC_RECEIPTS_SHEETS
// });

// Enhanced error handling for Google Sheets API
class GoogleSheetsApiError extends Error {
  status: number;
  code: string;
  retryable: boolean;

  constructor(message: string, status: number = 500, code: string = 'SHEETS_API_ERROR', retryable: boolean = false) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryable = retryable;
    this.name = 'GoogleSheetsApiError';
  }
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

// Sleep utility for retries
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced fetch with retry logic
async function fetchWithRetry(url: string, options: RequestInit = {}, retryCount = 0): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': 'PropertyManagementApp/1.0',
        ...options.headers
      }
    });

    // Handle rate limiting with exponential backoff
    if (response.status === 429) {
      if (retryCount < RETRY_CONFIG.maxRetries) {
        const delay = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount),
          RETRY_CONFIG.maxDelay
        );

        console.warn(`Rate limited, retrying in ${delay}ms (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);
        await sleep(delay);
        return fetchWithRetry(url, options, retryCount + 1);
      }

      throw new GoogleSheetsApiError(
        'Google Sheets API rate limit exceeded',
        429,
        'RATE_LIMIT_EXCEEDED',
        false
      );
    }

    // Handle temporary server errors with retry
    if (response.status >= 500 && response.status < 600) {
      if (retryCount < RETRY_CONFIG.maxRetries) {
        const delay = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount),
          RETRY_CONFIG.maxDelay
        );

        console.warn(`Server error ${response.status}, retrying in ${delay}ms (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);
        await sleep(delay);
        return fetchWithRetry(url, options, retryCount + 1);
      }

      throw new GoogleSheetsApiError(
        `Google Sheets API server error: ${response.status}`,
        response.status,
        'SERVER_ERROR',
        false
      );
    }

    return response;

  } catch (error) {
    // Handle network errors with retry
    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (retryCount < RETRY_CONFIG.maxRetries) {
        const delay = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount),
          RETRY_CONFIG.maxDelay
        );

        console.warn(`Network error, retrying in ${delay}ms (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);
        await sleep(delay);
        return fetchWithRetry(url, options, retryCount + 1);
      }

      throw new GoogleSheetsApiError(
        'Network error connecting to Google Sheets API',
        0,
        'NETWORK_ERROR',
        true
      );
    }

    throw error;
  }
}

// Export all necessary functions and variables
export async function fetchSheet(range: string): Promise<any[][]> {
  try {
    // console.log("Fetching sheet with range:", range);
    // console.log("Using Sheet ID:", SHEET_ID ? '***' + SHEET_ID.slice(-4) : 'MISSING');

    if (!API_KEY) {
      throw new GoogleSheetsApiError(
        'Google Sheets API key not configured',
        401,
        'MISSING_API_KEY',
        false
      );
    }

    if (!SHEET_ID) {
      throw new GoogleSheetsApiError(
        'Google Sheet ID not configured',
        400,
        'MISSING_SHEET_ID',
        false
      );
    }

    if (!range) {
      throw new GoogleSheetsApiError(
        'Sheet range not specified',
        400,
        'MISSING_RANGE',
        false
      );
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
    // console.log("Request URL:", url.replace(API_KEY, '***'));

    const res = await fetchWithRetry(url);
    const responseText = await res.text();

    if (!res.ok) {
      console.error('Google Sheets API Error:', {
        status: res.status,
        statusText: res.statusText,
        response: responseText.substring(0, 500), // Limit response text for logging
        url: url.replace(API_KEY, '***')
      });

      // Handle specific error cases
      if (res.status === 400) {
        throw new GoogleSheetsApiError(
          `Invalid request to Google Sheets API: ${res.statusText}`,
          400,
          'INVALID_REQUEST',
          false
        );
      }

      if (res.status === 403) {
        throw new GoogleSheetsApiError(
          'Access denied to Google Sheets. Check API key permissions.',
          403,
          'ACCESS_DENIED',
          false
        );
      }

      if (res.status === 404) {
        throw new GoogleSheetsApiError(
          'Google Sheet not found. Check Sheet ID and range.',
          404,
          'SHEET_NOT_FOUND',
          false
        );
      }

      throw new GoogleSheetsApiError(
        `Failed to fetch sheet (${res.status}): ${res.statusText}`,
        res.status,
        'API_ERROR',
        res.status >= 500
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new GoogleSheetsApiError(
        'Invalid JSON response from Google Sheets API',
        500,
        'INVALID_RESPONSE',
        true
      );
    }

    return data.values || [];

  } catch (error) {
    console.error('Error in fetchSheet:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      range,
      sheetId: SHEET_ID ? '***' + SHEET_ID.slice(-4) : 'MISSING',
      hasApiKey: !!API_KEY,
      errorType: error instanceof GoogleSheetsApiError ? error.code : 'UNKNOWN'
    });

    // Re-throw GoogleSheetsApiError as-is
    if (error instanceof GoogleSheetsApiError) {
      throw error;
    }

    // Wrap other errors
    throw new GoogleSheetsApiError(
      `Unexpected error fetching sheet: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      'UNEXPECTED_ERROR',
      true
    );
  }
}

export async function fetchOwners(): Promise<Owner[]> {
  const rows = await fetchSheet(OWNERS_RANGE);
  const [header, ...dataRows] = rows;
  return dataRows.map(row => ({
    id: row[0] + row[1] + row[2],
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
  let lastUpdated = '';

  // Find the last row with a date in column C (index 2)
  for (let i = dataRows.length - 1; i >= 0; i--) {
    const row = dataRows[i];
    if (row && row[2]) {
      lastUpdated = row[2];
      break;
    }
  }

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

  return {
    blockOptions,
    getFlatOptions,
    lastUpdated: lastUpdated || null
  };
}

// Fetch receipts from specific sheets
async function fetchReceiptsFromSheets(sheetsToFetch: string[], sheetType: string = 'receipt'): Promise<Receipt[]> {
  if (!sheetsToFetch.length) {
    console.warn(`No ${sheetType} sheets configured`);
    return [];
  }

  let allRows: any[][] = [];
  const sheetErrors: string[] = [];

  for (const sheetName of sheetsToFetch) {
    try {
      console.log(`Fetching ${sheetType}s from sheet: ${sheetName}`);
      const rows = await fetchSheet(`${sheetName}!A1:N1000`); // N = 14 columns

      if (rows.length > 1) {
        allRows = allRows.concat(rows.slice(1)); // skip header
        console.log(`Fetched ${rows.length - 1} rows from ${sheetName}`);
      } else {
        console.warn(`No data found in sheet: ${sheetName}`);
      }
    } catch (error) {
      const errorMsg = `Failed to fetch from sheet ${sheetName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      sheetErrors.push(errorMsg);

      // Continue with other sheets instead of failing completely
      continue;
    }
  }

  // If all sheets failed, throw an error
  if (sheetErrors.length === sheetsToFetch.length) {
    throw new GoogleSheetsApiError(
      `Failed to fetch from all ${sheetType} sheets: ${sheetErrors.join('; ')}`,
      500,
      'ALL_SHEETS_FAILED',
      true
    );
  }

  // Log partial failures
  if (sheetErrors.length > 0) {
    console.warn(`Partial failure fetching ${sheetType}s: ${sheetErrors.length}/${sheetsToFetch.length} sheets failed`);
  }

  // Columns: Receipt No, Receipt Date, Block No, Flat No, Name, Mode, Payment Amount, Payment No, Payment Date, Payment Bank, Remarks, PDF Status, PDF URL, PDF Name
  const receipts = allRows.map((row, idx) => {
    // Enhanced data validation and transformation
    const receiptNo = row[0] ? String(row[0]).trim() : '';
    const receiptDate = row[1] ? String(row[1]).trim() : '';
    const blockNumber = row[2] ? String(row[2]).trim() : '';
    const flatNumber = row[3] ? String(row[3]).trim() : '';
    const name = row[4] ? String(row[4]).trim() : '';
    const mode = row[5] ? String(row[5]).trim() : '';
    const paymentAmount = parseFloat(row[6]) || 0;
    const paymentNo = row[7] ? String(row[7]).trim() : '';
    const paymentDate = row[8] ? String(row[8]).trim() : '';
    const paymentBank = row[9] ? String(row[9]).trim() : '';
    const remarks = row[10] ? String(row[10]).trim() : '';
    const pdfStatus = row[11] ? String(row[11]).trim() : '';
    const pdfUrl = row[12] ? String(row[12]).trim() : '';
    const pdfName = row[13] ? String(row[13]).trim() : '';

    return {
      id: `${receiptNo}_${blockNumber}_${flatNumber}_${idx}`,
      receiptNo,
      receiptDate,
      blockNumber,
      flatNumber,
      name,
      mode,
      paymentAmount,
      paymentNo,
      paymentDate,
      paymentBank,
      remarks,
      pdfStatus,
      pdfUrl,
      pdfName,
    };
  }).filter(receipt => {
    // Filter out invalid receipts
    return receipt.receiptNo &&
      receipt.blockNumber &&
      receipt.flatNumber &&
      receipt.paymentAmount > 0 &&
      receipt.paymentDate;
  });

  console.log(`Successfully processed ${receipts.length} valid ${sheetType}s from ${allRows.length} total rows`);
  return receipts;
}

// Fetch all receipts (for backward compatibility)
export async function fetchReceipts(): Promise<Receipt[]> {
  return fetchReceiptsFromSheets(RECEIPTS_SHEETS, 'receipt');
}

// Fetch only AMC receipts
export async function fetchAmcReceipts(): Promise<Receipt[]> {
  console.log('Fetching AMC receipts only from sheets:', AMC_RECEIPTS_SHEETS);

  if (AMC_RECEIPTS_SHEETS.length === 0) {
    console.warn('No AMC receipt sheets found. Falling back to filtering all receipts by receipt number pattern.');

    // Fallback: fetch all receipts and filter by AMC pattern
    const allReceipts = await fetchReceiptsFromSheets(RECEIPTS_SHEETS, 'receipt');

    // Filter receipts that look like AMC receipts (you may need to adjust this pattern)
    const amcReceipts = allReceipts.filter(receipt => {
      const receiptNo = receipt.receiptNo.toLowerCase();
      const remarks = receipt.remarks.toLowerCase();

      // Filter for AMC-related receipts based on receipt number or remarks
      return receiptNo.includes('amc') ||
        receiptNo.includes('maintenance') ||
        remarks.includes('amc') ||
        remarks.includes('maintenance') ||
        remarks.includes('annual maintenance');
    });

    console.log(`Filtered ${amcReceipts.length} AMC receipts from ${allReceipts.length} total receipts`);
    return amcReceipts;
  }

  return fetchReceiptsFromSheets(AMC_RECEIPTS_SHEETS, 'AMC receipt');
}

// Export config object with all necessary variables
export const config = {
  API_KEY,
  SHEET_ID,
  OWNERS_RANGE,
  MASTERDATA_RANGE,
  RECEIPTS_SHEETS,
  AMC_RECEIPTS_SHEETS
};
