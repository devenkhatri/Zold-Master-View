"use client";

import { useMemo } from 'react';
import { Owner, Receipt } from '@/types/property';
import { MatrixCellData } from '@/components/matrix/MatrixCell';

// Re-export for convenience
export type MatrixCell = MatrixCellData;

export interface MatrixData {
  blocks: string[];
  flats: string[];
  cells: MatrixCellData[][];
  availableYears?: number[];
}

export interface AmcMatrixData extends MatrixData {
  selectedYear: number;
  totalByBlock: Record<string, number>;
  totalByFlat: Record<string, number>;
}

export interface StickerMatrixData extends MatrixData {
  unassignedFlats: string[];
  multipleStickers: string[];
}

// Helper function to parse dates in multiple formats
const parseReceiptDate = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  // Try different date formats
  let date: Date;

  // Format 1: ISO date strings (with timezone) - e.g., "2024-04-14T00:00:00.000Z"
  if (dateString.includes('T') || dateString.includes('Z')) {
    date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Format 2: YYYY-MM-DD format - e.g., "2024-04-14"
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    date = new Date(dateString + 'T00:00:00.000Z');
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Format 3: MM/DD/YYYY format - e.g., "5/5/2025", "12/31/2024"
  if (dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const [month, day, year] = dateString.split('/').map(Number);
    date = new Date(year, month - 1, day); // month is 0-based in Date constructor
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Format 4: DD/MM/YYYY format - e.g., "14/04/2024"
  if (dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const parts = dateString.split('/').map(Number);
    // Try DD/MM/YYYY if MM/DD/YYYY didn't work or seems invalid
    if (parts[1] > 12) { // Day > 12, so it must be DD/MM/YYYY
      const [day, month, year] = parts;
      date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // Format 5: Try native Date parsing as fallback
  date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
};

// Helper function to get Indian financial year from a date
// Indian financial year runs from April 1st to March 31st
// For example: April 2024 to March 2025 = FY 2024-25 (displayed as 2024)
const getIndianFinancialYear = (date: Date): number => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based (0 = January, 3 = April)
  
  // If month is April (3) or later, it belongs to the current year's financial year
  // If month is January (0) to March (2), it belongs to the previous year's financial year
  if (month >= 3) { // April to December
    return year;
  } else { // January to March
    return year - 1;
  }
};

// Helper function to extract unique blocks and flats with error handling
const extractBlocksAndFlats = (owners: Owner[]) => {
  try {
    if (!Array.isArray(owners)) {
      throw new Error('Owners data must be an array');
    }
    
    const blockSet = new Set<string>();
    const flatSet = new Set<string>();
    const errors: string[] = [];
    
    owners.forEach((owner, index) => {
      if (!owner) {
        errors.push(`Owner at index ${index} is null or undefined`);
        return;
      }
      
      if (!owner.blockNumber || typeof owner.blockNumber !== 'string') {
        errors.push(`Owner at index ${index} has invalid block number: ${owner.blockNumber}`);
      } else {
        blockSet.add(owner.blockNumber);
      }
      
      if (!owner.flatNumber || typeof owner.flatNumber !== 'string') {
        errors.push(`Owner at index ${index} has invalid flat number: ${owner.flatNumber}`);
      } else {
        flatSet.add(owner.flatNumber);
      }
    });
    
    // Sort blocks and flats numerically with error handling
    const blocks = Array.from(blockSet).sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA - numB;
    });
    
    const flats = Array.from(flatSet).sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA - numB;
    });
    
    if (errors.length > 0) {
      console.warn('Data validation warnings in extractBlocksAndFlats:', errors);
    }
    
    return { blocks, flats, errors };
  } catch (error) {
    console.error('Error in extractBlocksAndFlats:', error);
    throw new Error(`Failed to extract blocks and flats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to extract available Indian financial years from receipts
const extractAvailableYears = (receipts: Receipt[]): { years: number[]; errors: string[] } => {
  try {
    if (!Array.isArray(receipts)) {
      throw new Error('Receipts data must be an array');
    }
    
    const yearSet = new Set<number>();
    const errors: string[] = [];
    
    receipts.forEach((receipt, index) => {
      if (!receipt) {
        errors.push(`Receipt at index ${index} is null or undefined`);
        return;
      }
      
      if (!receipt.paymentDate) {
        errors.push(`Receipt at index ${index} has no payment date`);
        return;
      }
      
      try {
        const date = parseReceiptDate(receipt.paymentDate);
        if (!date) {
          errors.push(`Receipt at index ${index} has invalid date format: ${receipt.paymentDate}`);
          return;
        }
        
        // Get Indian financial year instead of calendar year
        const financialYear = getIndianFinancialYear(date);
        
        if (isNaN(financialYear) || financialYear < 1900 || financialYear > new Date().getFullYear() + 10) {
          errors.push(`Receipt at index ${index} has invalid financial year: ${financialYear}`);
        } else {
          yearSet.add(financialYear);
        }
        
        // Debug logging for financial year calculation
        if (receipt.blockNumber === 'G' && receipt.flatNumber === '104') {
          console.log(`📅 FY DEBUG: Receipt ${receipt.id} - Date: ${receipt.paymentDate}, Parsed Date: ${date.toISOString()}, Calendar Year: ${date.getFullYear()}, Month: ${date.getMonth() + 1}, Financial Year: ${financialYear}`);
        }
      } catch (dateError) {
        errors.push(`Receipt at index ${index} has invalid date format: ${receipt.paymentDate} - Error: ${dateError}`);
      }
    });
    
    const years = Array.from(yearSet).sort((a, b) => b - a); // Sort descending (newest first)
    
    if (errors.length > 0) {
      console.warn('Data validation warnings in extractAvailableYears:', errors);
    }
    
    console.log(`📅 Available Indian Financial Years:`, years);
    
    return { years, errors };
  } catch (error) {
    console.error('Error in extractAvailableYears:', error);
    throw new Error(`Failed to extract available years: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Process AMC data by year and block/flat combinations with error handling
const processAmcData = (owners: Owner[], receipts: Receipt[], selectedYear: number): AmcMatrixData => {
  try {
    if (!Array.isArray(owners) || !Array.isArray(receipts)) {
      throw new Error('Invalid data: owners and receipts must be arrays');
    }
    
    if (typeof selectedYear !== 'number' || isNaN(selectedYear)) {
      throw new Error(`Invalid selected year: ${selectedYear}`);
    }
    
    const { blocks, flats, errors: extractionErrors } = extractBlocksAndFlats(owners);
    const { years: availableYears, errors: yearErrors } = extractAvailableYears(receipts);
    
    // Log any data validation warnings
    const allErrors = [...(extractionErrors || []), ...(yearErrors || [])];
    if (allErrors.length > 0) {
      console.warn('Data validation warnings in processAmcData:', allErrors);
    }
  
    // CRITICAL FIX: Filter receipts by Indian Financial Year (April to March)
    console.log(`🔧 STARTING INDIAN FY FILTER: Processing ${receipts.length} receipts for Financial Year ${selectedYear}-${(selectedYear + 1).toString().slice(-2)}`);
    
    const yearReceipts = receipts.filter(receipt => {
      try {
        if (!receipt || !receipt.paymentDate) {
          console.warn('Receipt missing or has no payment date:', receipt);
          return false;
        }
        
        // Parse the date using robust date parsing function
        const receiptDate = parseReceiptDate(receipt.paymentDate);
        
        // Validate the parsed date
        if (!receiptDate) {
          console.warn(`❌ Invalid date format: ${receipt.paymentDate}`, receipt);
          return false;
        }
        
        // CRITICAL: Get Indian Financial Year instead of calendar year
        const receiptFinancialYear = getIndianFinancialYear(receiptDate);
        
        // Validate the financial year
        if (isNaN(receiptFinancialYear) || receiptFinancialYear < 1900 || receiptFinancialYear > new Date().getFullYear() + 10) {
          console.warn(`Invalid financial year calculated: ${receiptFinancialYear} from date ${receipt.paymentDate}`, receipt);
          return false;
        }
        
        // CRITICAL: Compare financial years
        const isValidYear = receiptFinancialYear === selectedYear;
        
        // Enhanced debug logging for critical blocks
        if (receipt.blockNumber === 'G' && receipt.flatNumber === '104') {
          const calendarYear = receiptDate.getFullYear();
          const month = receiptDate.getMonth() + 1;
          console.log(`🔍 G-104 FY FILTER: Date=${receipt.paymentDate}, Calendar Year=${calendarYear}, Month=${month}, Financial Year=${receiptFinancialYear}, Selected FY=${selectedYear}, Include=${isValidYear}, Amount=${receipt.paymentAmount}`);
        }
        
        // Log filtered receipts for debugging
        if (!isValidYear && (receipt.blockNumber === 'G' || receipt.blockNumber === 'B')) {
          const calendarYear = receiptDate.getFullYear();
          console.log(`❌ FILTERED OUT: ${receipt.blockNumber}-${receipt.flatNumber} FY ${receiptFinancialYear} (Calendar ${calendarYear}) != Selected FY ${selectedYear}`);
        }
        
        return isValidYear;
      } catch (error) {
        console.error('CRITICAL ERROR in financial year filtering:', error, receipt);
        return false;
      }
    });
    
    console.log(`🔍 YEAR FILTER DEBUG: Filtered ${yearReceipts.length} receipts for year ${selectedYear} from ${receipts.length} total receipts`);
    
    // Critical debugging: Log all receipts for G-104 to understand the issue
    const g104Receipts = receipts.filter(r => r.blockNumber === 'G' && r.flatNumber === '104');
    if (g104Receipts.length > 0) {
      console.log(`🏠 ALL G-104 RECEIPTS IN DATA:`, g104Receipts.map(r => ({
        id: r.id,
        paymentDate: r.paymentDate,
        year: new Date(r.paymentDate).getFullYear(),
        amount: r.paymentAmount,
        receiptNo: r.receiptNo
      })));
    }
    
    const g104FilteredReceipts = yearReceipts.filter(r => r.blockNumber === 'G' && r.flatNumber === '104');
    console.log(`🏠 FILTERED G-104 RECEIPTS FOR YEAR ${selectedYear}:`, g104FilteredReceipts.map(r => ({
      id: r.id,
      paymentDate: r.paymentDate,
      year: new Date(r.paymentDate).getFullYear(),
      amount: r.paymentAmount,
      receiptNo: r.receiptNo
    })));
    
    // Enhanced debugging for year filtering
    if (receipts.length > 0) {
      // Analyze both calendar and financial years in the data
      const calendarYearAnalysis = receipts.reduce((acc, receipt) => {
        try {
          if (receipt.paymentDate) {
            const receiptDate = parseReceiptDate(receipt.paymentDate);
            if (receiptDate) {
              const calendarYear = receiptDate.getFullYear();
              if (!isNaN(calendarYear)) {
                acc[calendarYear] = (acc[calendarYear] || 0) + 1;
              }
            }
          }
        } catch (error) {
          console.warn('Error analyzing calendar year:', receipt, error);
        }
        return acc;
      }, {} as Record<number, number>);
      
      const financialYearAnalysis = receipts.reduce((acc, receipt) => {
        try {
          if (receipt.paymentDate) {
            const receiptDate = parseReceiptDate(receipt.paymentDate);
            if (receiptDate) {
              const financialYear = getIndianFinancialYear(receiptDate);
              if (!isNaN(financialYear)) {
                acc[financialYear] = (acc[financialYear] || 0) + 1;
              }
            }
          }
        } catch (error) {
          console.warn('Error analyzing financial year:', receipt, error);
        }
        return acc;
      }, {} as Record<number, number>);
      
      console.log(`📅 Calendar Year distribution:`, calendarYearAnalysis);
      console.log(`📅 Financial Year distribution:`, financialYearAnalysis);
      console.log(`📅 Available Financial Years:`, Object.keys(financialYearAnalysis).map(Number).sort());
      
      if (yearReceipts.length === 0) {
        console.warn(`No receipts found for year ${selectedYear}. Year distribution:`, yearAnalysis);
      }
      
      // Log specific examples for debugging with both calendar and financial years
      const exampleReceipts = receipts.slice(0, 5).map(r => ({
        id: r.id,
        paymentDate: r.paymentDate,
        calendarYear: r.paymentDate ? (() => {
          try {
            const date = parseReceiptDate(r.paymentDate);
            return date ? date.getFullYear() : 'Parse Error';
          } catch (e) {
            return 'Error';
          }
        })() : 'No date',
        financialYear: r.paymentDate ? (() => {
          try {
            const date = parseReceiptDate(r.paymentDate);
            return date ? getIndianFinancialYear(date) : 'Parse Error';
          } catch (e) {
            return 'Error';
          }
        })() : 'No date',
        month: r.paymentDate ? (() => {
          try {
            const date = parseReceiptDate(r.paymentDate);
            return date ? date.getMonth() + 1 : 'Parse Error';
          } catch (e) {
            return 'Error';
          }
        })() : 'No date',
        blockFlat: `${r.blockNumber}-${r.flatNumber}`,
        amount: r.paymentAmount
      }));
      console.log(`📊 Example receipts (Calendar vs Financial Year):`, exampleReceipts);
    }
  
    // CRITICAL VALIDATION: Double-check all filtered receipts are from correct financial year
    console.log(`🔍 FY VALIDATION: Checking ${yearReceipts.length} filtered receipts for Financial Year ${selectedYear}-${(selectedYear + 1).toString().slice(-2)}`);
    const invalidYearReceipts = yearReceipts.filter(receipt => {
      const receiptDate = parseReceiptDate(receipt.paymentDate);
      if (!receiptDate) return true; // Invalid date should be filtered out
      const receiptFinancialYear = getIndianFinancialYear(receiptDate);
      return receiptFinancialYear !== selectedYear;
    });
    
    if (invalidYearReceipts.length > 0) {
      console.error(`🚨 CRITICAL BUG DETECTED: ${invalidYearReceipts.length} receipts with wrong financial year passed through filter!`);
      invalidYearReceipts.forEach(receipt => {
        const receiptDate = parseReceiptDate(receipt.paymentDate);
        if (receiptDate) {
          const receiptFinancialYear = getIndianFinancialYear(receiptDate);
          const calendarYear = receiptDate.getFullYear();
          console.error(`❌ Wrong FY receipt: ${receipt.blockNumber}-${receipt.flatNumber} FY=${receiptFinancialYear} (Calendar=${calendarYear}) Selected FY=${selectedYear}`, receipt);
        } else {
          console.error(`❌ Invalid date receipt: ${receipt.blockNumber}-${receipt.flatNumber} Date=${receipt.paymentDate}`, receipt);
        }
      });
      // Remove invalid receipts as a safety measure
      const validReceipts = yearReceipts.filter(receipt => {
        const receiptDate = parseReceiptDate(receipt.paymentDate);
        if (!receiptDate) return false;
        const receiptFinancialYear = getIndianFinancialYear(receiptDate);
        return receiptFinancialYear === selectedYear;
      });
      console.log(`🔧 SAFETY FIX: Removed ${yearReceipts.length - validReceipts.length} invalid receipts`);
      yearReceipts.length = 0;
      yearReceipts.push(...validReceipts);
    }

    // Group receipts by block and flat with error handling
    const receiptMap = new Map<string, Receipt[]>();
    yearReceipts.forEach((receipt, index) => {
      try {
        if (!receipt.blockNumber || !receipt.flatNumber) {
          console.warn(`Receipt at index ${index} missing block or flat number:`, receipt);
          return;
        }
        
        // CRITICAL: Final financial year validation before adding to map
        const receiptDate = parseReceiptDate(receipt.paymentDate);
        if (!receiptDate) {
          console.error(`🚨 FINAL DATE VALIDATION FAILED: Receipt ${receipt.blockNumber}-${receipt.flatNumber} has invalid date ${receipt.paymentDate}`);
          return;
        }
        const receiptFinancialYear = getIndianFinancialYear(receiptDate);
        if (receiptFinancialYear !== selectedYear) {
          console.error(`🚨 FINAL FY VALIDATION FAILED: Receipt ${receipt.blockNumber}-${receipt.flatNumber} has FY ${receiptFinancialYear} but selected FY is ${selectedYear}`);
          return;
        }
        
        const key = `${receipt.blockNumber}-${receipt.flatNumber}`;
        if (!receiptMap.has(key)) {
          receiptMap.set(key, []);
        }
        receiptMap.get(key)!.push(receipt);
      } catch (error) {
        console.warn(`Error processing receipt at index ${index}:`, receipt, error);
      }
    });
  
    // Create matrix cells with error handling
    const cells: MatrixCellData[][] = [];
    const totalByBlock: Record<string, number> = {};
    const totalByFlat: Record<string, number> = {};
    
    // Initialize totals
    blocks.forEach(block => totalByBlock[block] = 0);
    flats.forEach(flat => totalByFlat[flat] = 0);
    
    blocks.forEach((block, blockIndex) => {
      try {
        cells[blockIndex] = [];
        
        flats.forEach((flat, flatIndex) => {
          try {
            const key = `${block}-${flat}`;
            const blockFlatReceipts = receiptMap.get(key) || [];
            
            // Debug logging for specific block/flat combination
            if (block === 'G' && flat === '104') {
              console.log(`DEBUG: Processing Block G, Flat 104 - Found ${blockFlatReceipts.length} receipts for year ${selectedYear}:`, blockFlatReceipts);
              blockFlatReceipts.forEach((receipt, idx) => {
                const receiptYear = new Date(receipt.paymentDate).getFullYear();
                console.log(`  Receipt ${idx}: ID=${receipt.id}, Year=${receiptYear}, Amount=${receipt.paymentAmount}, Date=${receipt.paymentDate}`);
              });
            }
            
            // Calculate total payment amount for this block/flat combination with error handling
            const totalAmount = blockFlatReceipts.reduce((sum, receipt) => {
              try {
                const amount = receipt.paymentAmount || 0;
                if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
                  console.warn(`Invalid payment amount for receipt:`, receipt);
                  return sum;
                }
                return sum + amount;
              } catch (error) {
                console.warn('Error processing payment amount:', receipt, error);
                return sum;
              }
            }, 0);
            
            // CRITICAL: Get the most recent payment for metadata with strict year validation
            let latestReceipt: Receipt | undefined;
            try {
              // First, validate all receipts are from the correct financial year
              const validYearReceipts = blockFlatReceipts.filter(receipt => {
                if (!receipt.paymentDate) return false;
                const receiptDate = parseReceiptDate(receipt.paymentDate);
                if (!receiptDate) {
                  console.error(`🚨 METADATA DATE PARSE ERROR: Receipt ${receipt.blockNumber}-${receipt.flatNumber} has invalid date ${receipt.paymentDate}`);
                  return false;
                }
                const receiptFinancialYear = getIndianFinancialYear(receiptDate);
                const isValid = receiptFinancialYear === selectedYear;
                if (!isValid) {
                  const calendarYear = receiptDate.getFullYear();
                  console.error(`🚨 METADATA BUG: Receipt ${receipt.blockNumber}-${receipt.flatNumber} has FY ${receiptFinancialYear} (Calendar ${calendarYear}) but selected FY is ${selectedYear}`);
                }
                return isValid;
              });
              
              if (validYearReceipts.length !== blockFlatReceipts.length) {
                console.error(`🚨 CRITICAL: Found ${blockFlatReceipts.length - validYearReceipts.length} receipts with wrong year for ${block}-${flat}`);
              }
              
              latestReceipt = validYearReceipts
                .filter(receipt => receipt.paymentDate)
                .sort((a, b) => {
                  try {
                    return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
                  } catch (error) {
                    console.warn('Error sorting receipts by date:', a, b, error);
                    return 0;
                  }
                })[0];
                
              // Final validation of latest receipt using financial year
              if (latestReceipt) {
                const latestDate = parseReceiptDate(latestReceipt.paymentDate);
                if (!latestDate) {
                  console.error(`🚨 LATEST RECEIPT DATE PARSE ERROR: ${block}-${flat} latest receipt has invalid date ${latestReceipt.paymentDate}`);
                  latestReceipt = undefined; // Clear invalid metadata
                } else {
                  const latestFinancialYear = getIndianFinancialYear(latestDate);
                  if (latestFinancialYear !== selectedYear) {
                    const calendarYear = latestDate.getFullYear();
                    console.error(`🚨 LATEST RECEIPT FY VALIDATION FAILED: ${block}-${flat} latest receipt is from FY ${latestFinancialYear} (Calendar ${calendarYear}) but selected FY is ${selectedYear}`);
                    latestReceipt = undefined; // Clear invalid metadata
                  }
                }
              }
            } catch (error) {
              console.warn('Error finding latest receipt:', blockFlatReceipts, error);
            }
            
            const cell: MatrixCellData = {
              blockNumber: block,
              flatNumber: flat,
              value: totalAmount > 0 ? totalAmount : null,
              metadata: latestReceipt ? {
                paymentDate: latestReceipt.paymentDate,
                receiptNumber: latestReceipt.receiptNo,
              } : undefined
            };
            
            // Debug logging for specific block/flat combination
            if (block === 'G' && flat === '104') {
              console.log(`🎯 CELL CREATION DEBUG: Created cell for Block G, Flat 104:`, cell);
              console.log(`🎯 Latest receipt used for G-104:`, latestReceipt);
              console.log(`🎯 Total amount calculated: ${totalAmount} from ${blockFlatReceipts.length} receipts`);
              if (latestReceipt) {
                const receiptYear = new Date(latestReceipt.paymentDate).getFullYear();
                console.log(`🎯 Latest receipt year: ${receiptYear}, Selected year: ${selectedYear}`);
                if (receiptYear !== selectedYear) {
                  console.error(`❌ CRITICAL BUG: Latest receipt is from year ${receiptYear} but selected year is ${selectedYear}!`);
                }
              }
            }
            
            cells[blockIndex][flatIndex] = cell;
            
            // Update totals
            if (totalAmount > 0) {
              totalByBlock[block] += totalAmount;
              totalByFlat[flat] += totalAmount;
            }
          } catch (error) {
            console.error(`Error processing cell for block ${block}, flat ${flat}:`, error);
            // Create empty cell as fallback
            cells[blockIndex][flatIndex] = {
              blockNumber: block,
              flatNumber: flat,
              value: null,
            };
          }
        });
      } catch (error) {
        console.error(`Error processing block ${block}:`, error);
        // Initialize empty row as fallback
        cells[blockIndex] = flats.map(flat => ({
          blockNumber: block,
          flatNumber: flat,
          value: null,
        }));
      }
    });
    
    // Final validation: Ensure all cell data is from the selected year
    let validationErrors = 0;
    cells.forEach((blockRow, blockIndex) => {
      blockRow.forEach((cell, flatIndex) => {
        if (cell.metadata?.paymentDate) {
          try {
            const cellDate = parseReceiptDate(cell.metadata.paymentDate);
            if (!cellDate) {
              console.error(`VALIDATION ERROR: Cell ${cell.blockNumber}-${cell.flatNumber} has invalid date format ${cell.metadata.paymentDate}`, cell);
              validationErrors++;
            } else {
              const cellFinancialYear = getIndianFinancialYear(cellDate);
              if (cellFinancialYear !== selectedYear) {
                const calendarYear = cellDate.getFullYear();
                console.error(`VALIDATION ERROR: Cell ${cell.blockNumber}-${cell.flatNumber} contains data from FY ${cellFinancialYear} (Calendar ${calendarYear}) but selected FY is ${selectedYear}`, cell);
                validationErrors++;
              }
            }
          } catch (error) {
            console.warn('Error validating cell date:', cell, error);
            validationErrors++;
          }
        }
      });
    });
    
    if (validationErrors > 0) {
      console.error(`Found ${validationErrors} validation errors in matrix data for Financial Year ${selectedYear}-${(selectedYear + 1).toString().slice(-2)}`);
    } else {
      console.log(`✅ Matrix data validation passed: All data is from Financial Year ${selectedYear}-${(selectedYear + 1).toString().slice(-2)}`);
    }

    return {
      blocks,
      flats,
      cells,
      availableYears,
      selectedYear,
      totalByBlock,
      totalByFlat
    };
  } catch (error) {
    console.error('Error in processAmcData:', error);
    throw new Error(`Failed to process AMC data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Process sticker data by block/flat combinations with error handling
const processStickerData = (owners: Owner[]): StickerMatrixData => {
  try {
    if (!Array.isArray(owners)) {
      throw new Error('Invalid data: owners must be an array');
    }
    
    const { blocks, flats, errors: extractionErrors } = extractBlocksAndFlats(owners);
    
    // Log any data validation warnings
    if (extractionErrors && extractionErrors.length > 0) {
      console.warn('Data validation warnings in processStickerData:', extractionErrors);
    }
  
    // Group owners by block and flat with error handling
    const ownerMap = new Map<string, Owner[]>();
    owners.forEach((owner, index) => {
      try {
        if (!owner || !owner.blockNumber || !owner.flatNumber) {
          console.warn(`Owner at index ${index} missing block or flat number:`, owner);
          return;
        }
        
        const key = `${owner.blockNumber}-${owner.flatNumber}`;
        if (!ownerMap.has(key)) {
          ownerMap.set(key, []);
        }
        ownerMap.get(key)!.push(owner);
      } catch (error) {
        console.warn(`Error processing owner at index ${index}:`, owner, error);
      }
    });
  
    // Create matrix cells with error handling
    const cells: MatrixCellData[][] = [];
    const unassignedFlats: string[] = [];
    const multipleStickers: string[] = [];
    
    blocks.forEach((block, blockIndex) => {
      try {
        cells[blockIndex] = [];
        
        flats.forEach((flat, flatIndex) => {
          try {
            const key = `${block}-${flat}`;
            const blockFlatOwners = ownerMap.get(key) || [];
            
            // Collect all sticker numbers for this block/flat with error handling
            const allStickers: string[] = [];
            blockFlatOwners.forEach((owner, ownerIndex) => {
              try {
                if (owner.stickerNos && typeof owner.stickerNos === 'string' && owner.stickerNos.trim()) {
                  // Handle multiple stickers separated by commas or other delimiters
                  const stickers = owner.stickerNos
                    .split(/[,;|]/)
                    .map(s => s.trim())
                    .filter(s => s && s.length > 0);
                  allStickers.push(...stickers);
                }
              } catch (error) {
                console.warn(`Error processing sticker numbers for owner ${ownerIndex} in ${key}:`, owner, error);
              }
            });
            
            // Remove duplicates and sort with error handling
            let uniqueStickers: string[] = [];
            try {
              uniqueStickers = Array.from(new Set(allStickers)).sort();
            } catch (error) {
              console.warn(`Error processing unique stickers for ${key}:`, allStickers, error);
              uniqueStickers = allStickers; // Fallback to unsorted list
            }
            
            const flatKey = `${block}-${flat}`;
            
            let cellValue: string | null = null;
            let stickerCount = 0;
            
            if (uniqueStickers.length === 0) {
              unassignedFlats.push(flatKey);
              cellValue = null;
            } else if (uniqueStickers.length === 1) {
              cellValue = uniqueStickers[0];
              stickerCount = 1;
            } else {
              multipleStickers.push(flatKey);
              cellValue = uniqueStickers.join(', ');
              stickerCount = uniqueStickers.length;
            }
            
            const cell: MatrixCellData = {
              blockNumber: block,
              flatNumber: flat,
              value: cellValue,
              metadata: {
                stickerCount
              }
            };
            
            cells[blockIndex][flatIndex] = cell;
          } catch (error) {
            console.error(`Error processing cell for block ${block}, flat ${flat}:`, error);
            // Create empty cell as fallback
            cells[blockIndex][flatIndex] = {
              blockNumber: block,
              flatNumber: flat,
              value: null,
              metadata: { stickerCount: 0 }
            };
          }
        });
      } catch (error) {
        console.error(`Error processing block ${block}:`, error);
        // Initialize empty row as fallback
        cells[blockIndex] = flats.map(flat => ({
          blockNumber: block,
          flatNumber: flat,
          value: null,
          metadata: { stickerCount: 0 }
        }));
      }
    });
    
    return {
      blocks,
      flats,
      cells,
      unassignedFlats,
      multipleStickers
    };
  } catch (error) {
    console.error('Error in processStickerData:', error);
    throw new Error(`Failed to process sticker data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Main hook for matrix data processing with error handling
export const useMatrixData = (owners: Owner[], receipts: Receipt[]) => {
  // Get available years from receipts with error handling
  const availableYears = useMemo(() => {
    try {
      const { years } = extractAvailableYears(receipts);
      return years;
    } catch (error) {
      console.error('Error extracting available years:', error);
      return [];
    }
  }, [receipts]);
  
  // Process AMC data for a specific year with error handling
  const processAmcDataForYear = useMemo(() => {
    return (year: number): AmcMatrixData => {
      try {
        return processAmcData(owners, receipts, year);
      } catch (error) {
        console.error('Error processing AMC data for year:', year, error);
        // Return empty matrix data as fallback
        return {
          blocks: [],
          flats: [],
          cells: [],
          availableYears: [],
          selectedYear: year,
          totalByBlock: {},
          totalByFlat: {}
        };
      }
    };
  }, [owners, receipts]);
  
  // Process sticker data with error handling
  const stickerMatrixData = useMemo((): StickerMatrixData => {
    try {
      return processStickerData(owners);
    } catch (error) {
      console.error('Error processing sticker data:', error);
      // Return empty matrix data as fallback
      return {
        blocks: [],
        flats: [],
        cells: [],
        unassignedFlats: [],
        multipleStickers: []
      };
    }
  }, [owners]);
  
  return {
    availableYears,
    processAmcDataForYear,
    stickerMatrixData
  };
};