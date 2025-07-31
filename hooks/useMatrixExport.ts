"use client";

import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { AmcMatrixData, StickerMatrixData } from './useMatrixData';

export interface ExportOptions {
  filename?: string;
  includeMetadata?: boolean;
  includeTimestamp?: boolean;
}

export const useMatrixExport = () => {
  // Generate filename with timestamp
  const generateFilename = useCallback((baseName: string, extension: string, includeTimestamp: boolean = true) => {
    const timestamp = includeTimestamp ? new Date().toISOString().slice(0, 19).replace(/:/g, '-') : '';
    return `${baseName}${timestamp ? `_${timestamp}` : ''}.${extension}`;
  }, []);

  // Export AMC matrix to CSV
  const exportAmcToCsv = useCallback(async (data: AmcMatrixData, options: ExportOptions = {}) => {
    const { filename, includeMetadata = true, includeTimestamp = true } = options;
    
    // Prepare CSV data
    const csvData: any[] = [];
    
    // Add metadata header if requested
    if (includeMetadata) {
      csvData.push(['AMC Payment Matrix Export']);
      csvData.push(['Generated:', new Date().toLocaleString()]);
      csvData.push(['Year:', data.selectedYear]);
      csvData.push(['Total Blocks:', data.blocks.length]);
      csvData.push(['Total Flats:', data.flats.length]);
      csvData.push(['Grand Total:', `₹${Object.values(data.totalByBlock).reduce((sum, amount) => sum + amount, 0).toLocaleString('en-IN')}`]);
      csvData.push([]); // Empty row
    }
    
    // Create header row
    const headerRow = ['Block/Flat', ...data.flats.map(flat => `Flat ${flat}`), 'Block Total'];
    csvData.push(headerRow);
    
    // Add data rows
    data.blocks.forEach((block, blockIndex) => {
      const row = [`Block ${block}`];
      
      // Add cell values
      data.flats.forEach((flat, flatIndex) => {
        const cell = data.cells[blockIndex][flatIndex];
        const value = cell.value ? `₹${cell.value.toLocaleString('en-IN')}` : '';
        row.push(value);
      });
      
      // Add block total
      const blockTotal = data.totalByBlock[block] || 0;
      row.push(`₹${blockTotal.toLocaleString('en-IN')}`);
      
      csvData.push(row);
    });
    
    // Add flat totals row
    const totalsRow = ['Flat Total'];
    data.flats.forEach(flat => {
      const flatTotal = data.totalByFlat[flat] || 0;
      totalsRow.push(`₹${flatTotal.toLocaleString('en-IN')}`);
    });
    // Add grand total
    const grandTotal = Object.values(data.totalByBlock).reduce((sum, amount) => sum + amount, 0);
    totalsRow.push(`₹${grandTotal.toLocaleString('en-IN')}`);
    csvData.push(totalsRow);
    
    // Convert to CSV and download
    const Papa = await import('papaparse');
    const csv = Papa.default.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename || generateFilename('amc_matrix', 'csv', includeTimestamp));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [generateFilename]);

  // Export AMC matrix to Excel
  const exportAmcToExcel = useCallback((data: AmcMatrixData, options: ExportOptions = {}) => {
    const { filename, includeMetadata = true, includeTimestamp = true } = options;
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Prepare data for worksheet
    const wsData: any[][] = [];
    
    // Add metadata if requested
    if (includeMetadata) {
      wsData.push(['AMC Payment Matrix Export']);
      wsData.push(['Generated:', new Date().toLocaleString()]);
      wsData.push(['Year:', data.selectedYear]);
      wsData.push(['Total Blocks:', data.blocks.length]);
      wsData.push(['Total Flats:', data.flats.length]);
      wsData.push(['Grand Total:', Object.values(data.totalByBlock).reduce((sum, amount) => sum + amount, 0)]);
      wsData.push([]); // Empty row
    }
    
    // Create header row
    const headerRow = ['Block/Flat', ...data.flats.map(flat => `Flat ${flat}`), 'Block Total'];
    wsData.push(headerRow);
    
    // Add data rows
    data.blocks.forEach((block, blockIndex) => {
      const row: (string | number)[] = [`Block ${block}`];
      
      // Add cell values
      data.flats.forEach((flat, flatIndex) => {
        const cell = data.cells[blockIndex][flatIndex];
        const value = typeof cell.value === 'number' ? cell.value : 0;
        row.push(value);
      });
      
      // Add block total
      const blockTotal = data.totalByBlock[block] || 0;
      row.push(blockTotal);
      
      wsData.push(row);
    });
    
    // Add flat totals row
    const totalsRow: (string | number)[] = ['Flat Total'];
    data.flats.forEach(flat => {
      const flatTotal = data.totalByFlat[flat] || 0;
      totalsRow.push(flatTotal);
    });
    // Add grand total
    const grandTotal = Object.values(data.totalByBlock).reduce((sum, amount) => sum + amount, 0);
    totalsRow.push(grandTotal);
    wsData.push(totalsRow);
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Apply formatting
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    // Format currency columns (skip first column and last column for totals)
    for (let row = (includeMetadata ? 8 : 1); row <= range.e.r; row++) {
      for (let col = 1; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws[cellAddress] && typeof ws[cellAddress].v === 'number') {
          ws[cellAddress].z = '"₹"#,##0';
        }
      }
    }
    
    // Set column widths
    const colWidths = [{ wch: 15 }]; // Block/Flat column
    data.flats.forEach(() => colWidths.push({ wch: 12 })); // Flat columns
    colWidths.push({ wch: 15 }); // Total column
    ws['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, `AMC Matrix ${data.selectedYear}`);
    
    // Save file
    XLSX.writeFile(wb, filename || generateFilename('amc_matrix', 'xlsx', includeTimestamp));
  }, [generateFilename]);

  // Export Sticker matrix to CSV
  const exportStickerToCsv = useCallback(async (data: StickerMatrixData, options: ExportOptions = {}) => {
    const { filename, includeMetadata = true, includeTimestamp = true } = options;
    
    // Prepare CSV data
    const csvData: any[] = [];
    
    // Add metadata header if requested
    if (includeMetadata) {
      const totalFlats = data.blocks.length * data.flats.length;
      const assignedFlats = totalFlats - data.unassignedFlats.length;
      const assignmentRate = totalFlats > 0 ? Math.round((assignedFlats / totalFlats) * 100) : 0;
      
      csvData.push(['Car Sticker Assignment Matrix Export']);
      csvData.push(['Generated:', new Date().toLocaleString()]);
      csvData.push(['Total Blocks:', data.blocks.length]);
      csvData.push(['Total Flats:', data.flats.length]);
      csvData.push(['Assigned Flats:', assignedFlats]);
      csvData.push(['Unassigned Flats:', data.unassignedFlats.length]);
      csvData.push(['Assignment Rate:', `${assignmentRate}%`]);
      csvData.push([]); // Empty row
    }
    
    // Create header row
    const headerRow = ['Block/Flat', ...data.flats.map(flat => `Flat ${flat}`)];
    csvData.push(headerRow);
    
    // Add data rows
    data.blocks.forEach((block, blockIndex) => {
      const row: string[] = [`Block ${block}`];
      
      // Add cell values
      data.flats.forEach((flat, flatIndex) => {
        const cell = data.cells[blockIndex][flatIndex];
        const value = cell.value ? String(cell.value) : 'Not Assigned';
        row.push(value);
      });
      
      csvData.push(row);
    });
    
    // Add summary sections
    if (data.unassignedFlats.length > 0) {
      csvData.push([]);
      csvData.push(['Unassigned Flats:']);
      data.unassignedFlats.forEach(flatKey => {
        const [block, flat] = flatKey.split('-');
        csvData.push([`Block ${block}, Flat ${flat}`]);
      });
    }
    
    if (data.multipleStickers.length > 0) {
      csvData.push([]);
      csvData.push(['Flats with Multiple Stickers:']);
      data.multipleStickers.forEach(flatKey => {
        const [block, flat] = flatKey.split('-');
        const blockIndex = data.blocks.indexOf(block);
        const flatIndex = data.flats.indexOf(flat);
        const cellData = data.cells[blockIndex]?.[flatIndex];
        const stickerCount = cellData?.metadata?.stickerCount || 0;
        csvData.push([`Block ${block}, Flat ${flat}`, `${stickerCount} stickers`, cellData?.value || '']);
      });
    }
    
    // Convert to CSV and download
    const Papa = await import('papaparse');
    const csv = Papa.default.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename || generateFilename('sticker_matrix', 'csv', includeTimestamp));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [generateFilename]);

  // Export Sticker matrix to Excel
  const exportStickerToExcel = useCallback((data: StickerMatrixData, options: ExportOptions = {}) => {
    const { filename, includeMetadata = true, includeTimestamp = true } = options;
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Main matrix sheet
    const wsData: any[][] = [];
    
    // Add metadata if requested
    if (includeMetadata) {
      const totalFlats = data.blocks.length * data.flats.length;
      const assignedFlats = totalFlats - data.unassignedFlats.length;
      const assignmentRate = totalFlats > 0 ? Math.round((assignedFlats / totalFlats) * 100) : 0;
      
      wsData.push(['Car Sticker Assignment Matrix Export']);
      wsData.push(['Generated:', new Date().toLocaleString()]);
      wsData.push(['Total Blocks:', data.blocks.length]);
      wsData.push(['Total Flats:', data.flats.length]);
      wsData.push(['Assigned Flats:', assignedFlats]);
      wsData.push(['Unassigned Flats:', data.unassignedFlats.length]);
      wsData.push(['Assignment Rate:', `${assignmentRate}%`]);
      wsData.push([]); // Empty row
    }
    
    // Create header row
    const headerRow = ['Block/Flat', ...data.flats.map(flat => `Flat ${flat}`)];
    wsData.push(headerRow);
    
    // Add data rows
    data.blocks.forEach((block, blockIndex) => {
      const row: (string | number)[] = [`Block ${block}`];
      
      // Add cell values
      data.flats.forEach((flat, flatIndex) => {
        const cell = data.cells[blockIndex][flatIndex];
        const value = cell.value ? String(cell.value) : 'Not Assigned';
        row.push(value);
      });
      
      wsData.push(row);
    });
    
    // Create main worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    const colWidths = [{ wch: 15 }]; // Block/Flat column
    data.flats.forEach(() => colWidths.push({ wch: 15 })); // Flat columns
    ws['!cols'] = colWidths;
    
    // Add main worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Sticker Matrix');
    
    // Create summary sheet if there are unassigned or multiple stickers
    if (data.unassignedFlats.length > 0 || data.multipleStickers.length > 0) {
      const summaryData: any[][] = [];
      
      summaryData.push(['Sticker Assignment Summary']);
      summaryData.push(['Generated:', new Date().toLocaleString()]);
      summaryData.push([]);
      
      if (data.unassignedFlats.length > 0) {
        summaryData.push(['Unassigned Flats:']);
        summaryData.push(['Block', 'Flat']);
        data.unassignedFlats.forEach(flatKey => {
          const [block, flat] = flatKey.split('-');
          summaryData.push([block, flat]);
        });
        summaryData.push([]);
      }
      
      if (data.multipleStickers.length > 0) {
        summaryData.push(['Flats with Multiple Stickers:']);
        summaryData.push(['Block', 'Flat', 'Sticker Count', 'Sticker Numbers']);
        data.multipleStickers.forEach(flatKey => {
          const [block, flat] = flatKey.split('-');
          const blockIndex = data.blocks.indexOf(block);
          const flatIndex = data.flats.indexOf(flat);
          const cellData = data.cells[blockIndex]?.[flatIndex];
          const stickerCount = cellData?.metadata?.stickerCount || 0;
          summaryData.push([block, flat, stickerCount, cellData?.value || '']);
        });
      }
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWs['!cols'] = [{ wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    }
    
    // Save file
    XLSX.writeFile(wb, filename || generateFilename('sticker_matrix', 'xlsx', includeTimestamp));
  }, [generateFilename]);

  return {
    exportAmcToCsv,
    exportAmcToExcel,
    exportStickerToCsv,
    exportStickerToExcel,
    generateFilename
  };
};