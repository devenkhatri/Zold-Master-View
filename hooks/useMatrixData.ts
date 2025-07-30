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

// Helper function to extract available years from receipts with error handling
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
        const date = new Date(receipt.paymentDate);
        const year = date.getFullYear();
        
        if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 10) {
          errors.push(`Receipt at index ${index} has invalid year: ${year}`);
        } else {
          yearSet.add(year);
        }
      } catch (dateError) {
        errors.push(`Receipt at index ${index} has invalid date format: ${receipt.paymentDate}`);
      }
    });
    
    const years = Array.from(yearSet).sort((a, b) => b - a); // Sort descending (newest first)
    
    if (errors.length > 0) {
      console.warn('Data validation warnings in extractAvailableYears:', errors);
    }
    
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
  
    // Filter receipts for the selected year with error handling
    const yearReceipts = receipts.filter(receipt => {
      try {
        if (!receipt || !receipt.paymentDate) return false;
        const receiptYear = new Date(receipt.paymentDate).getFullYear();
        return !isNaN(receiptYear) && receiptYear === selectedYear;
      } catch (error) {
        console.warn('Error processing receipt date:', receipt, error);
        return false;
      }
    });
  
    // Group receipts by block and flat with error handling
    const receiptMap = new Map<string, Receipt[]>();
    yearReceipts.forEach((receipt, index) => {
      try {
        if (!receipt.blockNumber || !receipt.flatNumber) {
          console.warn(`Receipt at index ${index} missing block or flat number:`, receipt);
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
            
            // Get the most recent payment for metadata with error handling
            let latestReceipt: Receipt | undefined;
            try {
              latestReceipt = blockFlatReceipts
                .filter(receipt => receipt.paymentDate)
                .sort((a, b) => {
                  try {
                    return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
                  } catch (error) {
                    console.warn('Error sorting receipts by date:', a, b, error);
                    return 0;
                  }
                })[0];
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