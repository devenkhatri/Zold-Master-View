'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { MatrixCell, MatrixCellData } from './MatrixCell';
import { MatrixTooltip } from './MatrixTooltip';

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

  // Generate grid template columns based on number of flats
  const gridTemplateColumns = React.useMemo(() => {
    const headerWidth = '80px'; // Width for block headers
    const cellWidth = 'minmax(80px, 1fr)';
    return `${headerWidth} repeat(${data.flats.length}, ${cellWidth})`;
  }, [data.flats.length]);

  if (hasError) {
    return (
      <div className={cn(
        'flex items-center justify-center p-8 border border-destructive/20 rounded-lg bg-destructive/5',
        className
      )}>
        <div className="text-center">
          <div className="text-destructive font-medium mb-2">Error Loading Matrix</div>
          <div className="text-sm text-muted-foreground">
            Unable to load matrix data. Please try again.
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
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-sm text-muted-foreground">Loading matrix data...</div>
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
        <div className="text-center">
          <div className="text-muted-foreground font-medium mb-2">No Data Available</div>
          <div className="text-sm text-muted-foreground">
            No {type === 'amc' ? 'payment' : 'sticker'} data found to display.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Matrix container with horizontal scroll */}
      <div 
        ref={matrixRef}
        className="overflow-auto border border-border rounded-lg bg-background"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        role="grid"
        aria-label={ariaLabel || `${type === 'amc' ? 'AMC Payment' : 'Car Sticker'} Matrix`}
      >
        <div 
          className="grid gap-0 min-w-fit"
          style={{ gridTemplateColumns }}
        >
          {/* Header row */}
          <div className="sticky top-0 left-0 z-20 bg-muted border-b border-r border-border p-3 font-semibold text-center">
            Block / Flat
          </div>
          
          {data.flats.map((flat) => (
            <div
              key={flat}
              className="sticky top-0 z-10 bg-muted border-b border-border p-3 font-semibold text-center min-w-[80px]"
              role="columnheader"
              aria-label={`Flat ${flat}`}
            >
              {flat}
            </div>
          ))}

          {/* Data rows */}
          {data.blocks.map((block, blockIndex) => (
            <React.Fragment key={block}>
              {/* Block header */}
              <div
                className="sticky left-0 z-10 bg-muted border-r border-border p-3 font-semibold text-center"
                role="rowheader"
                aria-label={`Block ${block}`}
              >
                {block}
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