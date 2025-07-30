'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useMatrixExport, ExportOptions } from '@/hooks/useMatrixExport';
import { AmcMatrixData, StickerMatrixData } from '@/hooks/useMatrixData';

export interface ExportButtonsProps {
  data: AmcMatrixData | StickerMatrixData;
  type: 'amc' | 'sticker';
  disabled?: boolean;
  className?: string;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({
  data,
  type,
  disabled = false,
  className
}) => {
  const {
    exportAmcToCsv,
    exportAmcToExcel,
    exportStickerToCsv,
    exportStickerToExcel
  } = useMatrixExport();

  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = React.useCallback(async (format: 'csv' | 'excel') => {
    if (disabled || isExporting) return;

    setIsExporting(true);
    
    try {
      const options: ExportOptions = {
        includeMetadata: true,
        includeTimestamp: true
      };

      if (type === 'amc') {
        const amcData = data as AmcMatrixData;
        if (format === 'csv') {
          exportAmcToCsv(amcData, options);
        } else {
          exportAmcToExcel(amcData, options);
        }
      } else {
        const stickerData = data as StickerMatrixData;
        if (format === 'csv') {
          exportStickerToCsv(stickerData, options);
        } else {
          exportStickerToExcel(stickerData, options);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      // You could add toast notification here
    } finally {
      setIsExporting(false);
    }
  }, [data, type, disabled, isExporting, exportAmcToCsv, exportAmcToExcel, exportStickerToCsv, exportStickerToExcel]);

  // Don't render if no data
  if (!data || (data.blocks.length === 0 && data.flats.length === 0)) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting}
          className={className}
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isExporting}
        >
          <FileText className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          disabled={isExporting}
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { ExportButtons };