'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { MatrixCellData } from './MatrixCell';

export interface MatrixTooltipProps {
  data: MatrixCellData | null;
  type: 'amc' | 'sticker';
  position: { x: number; y: number } | null;
  className?: string;
}

const MatrixTooltip: React.FC<MatrixTooltipProps> = ({
  data,
  type,
  position,
  className
}) => {
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = React.useState(position);

  React.useEffect(() => {
    if (!position || !tooltipRef.current) {
      setAdjustedPosition(position);
      return;
    }

    const tooltip = tooltipRef.current;
    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { x, y } = position;

    // Adjust horizontal position if tooltip would overflow
    if (x + rect.width > viewportWidth - 10) {
      x = viewportWidth - rect.width - 10;
    }
    if (x < 10) {
      x = 10;
    }

    // Adjust vertical position if tooltip would overflow
    if (y + rect.height > viewportHeight - 10) {
      y = position.y - rect.height - 10;
    }
    if (y < 10) {
      y = 10;
    }

    setAdjustedPosition({ x, y });
  }, [position]);

  if (!data || !adjustedPosition) {
    return null;
  }

  const formatValue = (value: string | number | null) => {
    if (value === null || value === undefined || value === '') {
      return type === 'amc' ? '₹0' : 'Not Assigned';
    }
    
    if (type === 'amc' && typeof value === 'number') {
      return `₹${value.toLocaleString('en-IN')}`;
    }
    
    return String(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      ref={tooltipRef}
      className={cn(
        'fixed z-50 max-w-xs p-3 bg-popover text-popover-foreground',
        'border border-border rounded-md shadow-lg',
        'text-sm leading-relaxed',
        'pointer-events-none',
        'animate-in fade-in-0 zoom-in-95',
        className
      )}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
      role="tooltip"
      aria-live="polite"
    >
      <div className="space-y-2">
        {/* Location info */}
        <div className="font-semibold text-foreground">
          Block {data.blockNumber}, Flat {data.flatNumber}
        </div>

        {/* Value info */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            {type === 'amc' ? 'Amount:' : 'Sticker:'}
          </span>
          <span className={cn(
            'font-medium',
            (!data.value || data.value === 0) && 'text-muted-foreground'
          )}>
            {formatValue(data.value)}
          </span>
        </div>

        {/* Type-specific metadata */}
        {type === 'amc' && data.metadata && (
          <>
            {data.metadata.paymentDate && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment Date:</span>
                <span>{formatDate(data.metadata.paymentDate)}</span>
              </div>
            )}
            {data.metadata.receiptNumber && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Receipt:</span>
                <span className="font-mono text-xs">{data.metadata.receiptNumber}</span>
              </div>
            )}
          </>
        )}

        {type === 'sticker' && data.metadata && (
          <>
            {data.metadata.stickerCount && data.metadata.stickerCount > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Stickers:</span>
                <span>{data.metadata.stickerCount}</span>
              </div>
            )}
            {data.value && typeof data.value === 'string' && data.value.includes(',') && (
              <div className="mt-2">
                <div className="text-muted-foreground text-xs mb-1">All Stickers:</div>
                <div className="flex flex-wrap gap-1">
                  {data.value.split(',').map((sticker, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs font-mono"
                    >
                      {sticker.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty state message */}
        {(!data.value || data.value === 0 || data.value === '') && (
          <div className="text-xs text-muted-foreground italic">
            {type === 'amc' ? 'No payment recorded' : 'No sticker assigned'}
          </div>
        )}
      </div>
    </div>
  );
};

export { MatrixTooltip };