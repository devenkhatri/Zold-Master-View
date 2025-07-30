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

// Helper function to extract unique blocks and flats
const extractBlocksAndFlats = (owners: Owner[]) => {
  const blockSet = new Set<string>();
  const flatSet = new Set<string>();
  
  owners.forEach(owner => {
    if (owner.blockNumber) blockSet.add(owner.blockNumber);
    if (owner.flatNumber) flatSet.add(owner.flatNumber);
  });
  
  // Sort blocks and flats numerically
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
  
  return { blocks, flats };
};

// Helper function to extract available years from receipts
const extractAvailableYears = (receipts: Receipt[]): number[] => {
  const yearSet = new Set<number>();
  
  receipts.forEach(receipt => {
    if (receipt.paymentDate) {
      const year = new Date(receipt.paymentDate).getFullYear();
      if (!isNaN(year)) {
        yearSet.add(year);
      }
    }
  });
  
  return Array.from(yearSet).sort((a, b) => b - a); // Sort descending (newest first)
};

// Process AMC data by year and block/flat combinations
const processAmcData = (owners: Owner[], receipts: Receipt[], selectedYear: number): AmcMatrixData => {
  const { blocks, flats } = extractBlocksAndFlats(owners);
  const availableYears = extractAvailableYears(receipts);
  
  // Filter receipts for the selected year
  const yearReceipts = receipts.filter(receipt => {
    if (!receipt.paymentDate) return false;
    const receiptYear = new Date(receipt.paymentDate).getFullYear();
    return receiptYear === selectedYear;
  });
  
  // Group receipts by block and flat
  const receiptMap = new Map<string, Receipt[]>();
  yearReceipts.forEach(receipt => {
    const key = `${receipt.blockNumber}-${receipt.flatNumber}`;
    if (!receiptMap.has(key)) {
      receiptMap.set(key, []);
    }
    receiptMap.get(key)!.push(receipt);
  });
  
  // Create matrix cells
  const cells: MatrixCellData[][] = [];
  const totalByBlock: Record<string, number> = {};
  const totalByFlat: Record<string, number> = {};
  
  // Initialize totals
  blocks.forEach(block => totalByBlock[block] = 0);
  flats.forEach(flat => totalByFlat[flat] = 0);
  
  blocks.forEach((block, blockIndex) => {
    cells[blockIndex] = [];
    
    flats.forEach((flat, flatIndex) => {
      const key = `${block}-${flat}`;
      const blockFlatReceipts = receiptMap.get(key) || [];
      
      // Calculate total payment amount for this block/flat combination
      const totalAmount = blockFlatReceipts.reduce((sum, receipt) => sum + (receipt.paymentAmount || 0), 0);
      
      // Get the most recent payment for metadata
      const latestReceipt = blockFlatReceipts.sort((a, b) => 
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
      )[0];
      
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
    });
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
};

// Process sticker data by block/flat combinations
const processStickerData = (owners: Owner[]): StickerMatrixData => {
  const { blocks, flats } = extractBlocksAndFlats(owners);
  
  // Group owners by block and flat
  const ownerMap = new Map<string, Owner[]>();
  owners.forEach(owner => {
    const key = `${owner.blockNumber}-${owner.flatNumber}`;
    if (!ownerMap.has(key)) {
      ownerMap.set(key, []);
    }
    ownerMap.get(key)!.push(owner);
  });
  
  // Create matrix cells
  const cells: MatrixCellData[][] = [];
  const unassignedFlats: string[] = [];
  const multipleStickers: string[] = [];
  
  blocks.forEach((block, blockIndex) => {
    cells[blockIndex] = [];
    
    flats.forEach((flat, flatIndex) => {
      const key = `${block}-${flat}`;
      const blockFlatOwners = ownerMap.get(key) || [];
      
      // Collect all sticker numbers for this block/flat
      const allStickers: string[] = [];
      blockFlatOwners.forEach(owner => {
        if (owner.stickerNos && owner.stickerNos.trim()) {
          // Handle multiple stickers separated by commas or other delimiters
          const stickers = owner.stickerNos.split(/[,;|]/).map(s => s.trim()).filter(s => s);
          allStickers.push(...stickers);
        }
      });
      
      // Remove duplicates and sort
      const uniqueStickers = Array.from(new Set(allStickers)).sort();
      
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
    });
  });
  
  return {
    blocks,
    flats,
    cells,
    unassignedFlats,
    multipleStickers
  };
};

// Main hook for matrix data processing
export const useMatrixData = (owners: Owner[], receipts: Receipt[]) => {
  // Get available years from receipts
  const availableYears = useMemo(() => extractAvailableYears(receipts), [receipts]);
  
  // Process AMC data for a specific year
  const processAmcDataForYear = useMemo(() => {
    return (year: number): AmcMatrixData => {
      return processAmcData(owners, receipts, year);
    };
  }, [owners, receipts]);
  
  // Process sticker data
  const stickerMatrixData = useMemo((): StickerMatrixData => {
    return processStickerData(owners);
  }, [owners]);
  
  return {
    availableYears,
    processAmcDataForYear,
    stickerMatrixData
  };
};