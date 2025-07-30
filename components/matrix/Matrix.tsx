'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { MatrixCell, MatrixCellData } from './MatrixCell';
import { MatrixTooltip } from './MatrixTooltip';
import { AlertTriangle } from 'lucide-react';

export interface MatrixData {
  blocks: string[];
  flats: string[];
  cells: MatrixCellData[][];
}

export interface MatrixProps {
  data: MatrixData;
  type: 'amc' | 'sticker';
  isLoading?: boolean;
  hasError?: boolean;
  onCellClick?: (data: MatrixCellData) => void;
  className?: string;
  'aria-label'?: string;
}

const Matrix: React.FC<MatrixProps> = ({
  data,
  type,
  isLoading = false,
  hasError = false,
  onCellClick,
  className,
  'aria-label': ariaLabel,
}) => {
  const [hoveredCell, setHoveredCell] = React.useState<MatrixCellData | null>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState<{ x: number; y: number } | null>(null);
  const matrixRef = React.useRef<HTMLDivElement>(null);

  const handleCellHover = React.useCallback((cellData: MatrixCellData | null, event?: React.MouseEvent) => {
    setHoveredCell(cellData);
    
    if (cellData && event) {
      setTooltipPosition({
        x: event.clientX + 10,
        y: event.clientY - 10
      });
    } else {
      setTooltipPosition(null);
    }
  }, []);

  const handleMouseMove = React.useCallback((event: React.MouseEvent) => {
    if (hoveredCell) {
      setTooltipPosition({
        x: event.clientX + 10,
        y: event.clientY - 10
      });
    }
  }, [hoveredCell]);

  const handleMouseLeave = React.useCallback(() => {
    setHoveredCell(null);
    setTooltipPosition(null);
  }, []);

  // Generate grid template columns based on number of flats with better overflow handling
  const gridTemplateColumns = React.useMemo(() => {
    const headerWidth = '80px'; // Width for block headers
    // Use fixed max width to prevent overflow while maintaining minimum usability
    const cellWidth = 'minmax(80px, 120px)';
    return `${headerWidth} repeat(${data.flats.length}, ${cellWidth})`;
  }, [data.flats.length]);

  if (hasError) {
    return (
      <div className={cn(
        'flex items-center justify-center p-8 border border-destructive/20 rounded-lg bg-destructive/5',
        className
      )}>
        <div className="text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <div>
            <div className="text-destructive font-medium mb-2">Error Loading Matrix</div>
            <div className="text-sm text-muted-foreground">
              Unable to load matrix data. This could be due to:
            </div>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1">
              <li>• Google Sheets API connectivity issues</li>
              <li>• Data processing or validation errors</li>
              <li>• Rate limiting or quota exceeded</li>
              <li>• Network connectivity problems</li>
            </ul>
          </div>
          <div className="text-xs text-muted-foreground">
            Try refreshing the page, checking your internet connection, or waiting a few minutes if you've hit API limits.
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn(
        'flex items-center justify-center p-8 border border-border rounded-lg bg-muted/20',
        className
      )}>
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="absolute inset-0 w-8 h-8 border-2 border-primary/20 rounded-full mx-auto" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground mb-1">Loading matrix data...</div>
            <div className="text-xs text-muted-foreground">
              Processing {type === 'amc' ? 'payment' : 'sticker'} information
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data.blocks.length || !data.flats.length) {
    return (
      <div className={cn(
        'flex items-center justify-center p-8 border border-border rounded-lg bg-muted/10',
        className
      )}>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
            <div className="text-2xl text-muted-foreground">📊</div>
          </div>
          <div>
            <div className="text-muted-foreground font-medium mb-2">No Data Available</div>
            <div className="text-sm text-muted-foreground mb-3">
              No {type === 'amc' ? 'payment' : 'sticker'} data found to display.
            </div>
            <div className="text-xs text-muted-foreground">
              This could mean:
            </div>
            <ul className="text-xs text-muted-foreground mt-1 space-y-1">
              <li>• No data has been uploaded yet</li>
              <li>• Data is still being processed</li>
              <li>• Filters are too restrictive</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Matrix container with enhanced responsive scrolling */}
      <div 
        ref={matrixRef}
        className={cn(
          // Base scrolling styles with enhanced mobile support
          "overflow-auto border border-border rounded-lg bg-background",
          // Enhanced scrollbar styling for better UX
          "scrollbar-thin scrollbar-track-muted/50 scrollbar-thumb-muted-foreground/30",
          "hover:scrollbar-thumb-muted-foreground/50",
          // Touch-friendly scrolling optimizations
          "overscroll-contain scroll-smooth",
          // Mobile-specific enhancements
          "max-h-[70vh] sm:max-h-[80vh] lg:max-h-none",
          // Improved touch scrolling momentum
          "[-webkit-overflow-scrolling:touch]"
        )}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        role="grid"
        aria-label={ariaLabel || `${type === 'amc' ? 'AMC Payment' : 'Car Sticker'} Matrix`}
        // Enhanced touch-friendly attributes
        style={{ 
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x pan-y',
          // Prevent zoom on double tap for better UX
          WebkitTouchCallout: 'none',
          userSelect: 'none'
        } as React.CSSProperties}
      >
        <div 
          className={cn(
            "grid gap-0",
            // Enhanced responsive minimum width with better mobile support
            "min-w-fit",
            // Responsive width handling
            "w-full sm:w-auto",
            // Ensure matrix doesn't break on very small screens
            "min-w-[320px]"
          )}
          style={{ gridTemplateColumns }}
        >
          {/* Header row */}
          <div className="sticky top-0 left-0 z-20 bg-muted border-b border-r border-border p-3 font-semibold text-center overflow-hidden">
            <span className="truncate block text-xs sm:text-sm">Block / Flat</span>
          </div>
          
          {data.flats.map((flat) => (
            <div
              key={flat}
              className="sticky top-0 z-10 bg-muted border-b border-border p-3 font-semibold text-center min-w-[80px] max-w-[120px] overflow-hidden"
              role="columnheader"
              aria-label={`Flat ${flat}`}
              title={flat}
            >
              <span className="truncate block">{flat}</span>
            </div>
          ))}

          {/* Data rows */}
          {data.blocks.map((block, blockIndex) => (
            <React.Fragment key={block}>
              {/* Block header */}
              <div
                className="sticky left-0 z-10 bg-muted border-r border-border p-3 font-semibold text-center overflow-hidden"
                role="rowheader"
                aria-label={`Block ${block}`}
                title={block}
              >
                <span className="truncate block">{block}</span>
              </div>

              {/* Cells for this block */}
              {data.flats.map((flat, flatIndex) => {
                const cellData = data.cells[blockIndex]?.[flatIndex] || {
                  blockNumber: block,
                  flatNumber: flat,
                  value: null
                };

                return (
                  <MatrixCell
                    key={`${block}-${flat}`}
                    data={cellData}
                    type={type}
                    onClick={onCellClick}
                    onHover={(data) => handleCellHover(data, event as any)}
                    className="border-r border-b border-border last:border-r-0"
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      <MatrixTooltip
        data={hoveredCell}
        type={type}
        position={tooltipPosition}
      />

      {/* Screen reader summary */}
      <div className="sr-only" aria-live="polite">
        Matrix showing {data.blocks.length} blocks and {data.flats.length} flats.
        {hoveredCell && (
          <>
            {' '}Currently focused on Block {hoveredCell.blockNumber}, Flat {hoveredCell.flatNumber}.
            {type === 'amc' && hoveredCell.value && ` Amount: ₹${hoveredCell.value}`}
            {type === 'sticker' && hoveredCell.value && ` Sticker: ${hoveredCell.value}`}
          </>
        )}
      </div>
    </div>
  );
};

export { Matrix };