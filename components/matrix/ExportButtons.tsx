'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
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
          await exportAmcToCsv(amcData, options);
        } else {
          exportAmcToExcel(amcData, options);
        }
      } else {
        const stickerData = data as StickerMatrixData;
        if (format === 'csv') {
          await exportStickerToCsv(stickerData, options);
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
          className={cn(
            // Enhanced responsive sizing
            "min-w-[100px] sm:min-w-[120px]",
            // Better touch targets on mobile
            "h-9 sm:h-8",
            // Responsive text sizing
            "text-xs sm:text-sm",
            className
          )}
        >
          <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">
            {isExporting ? 'Exporting...' : 'Export'}
          </span>
          <span className="xs:hidden">
            {isExporting ? '...' : 'Export'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          className="text-sm"
        >
          <FileText className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          disabled={isExporting}
          className="text-sm"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { ExportButtons };