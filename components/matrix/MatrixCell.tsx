'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface MatrixCellData {
  blockNumber: string;
  flatNumber: string;
  value: string | number | null;
  metadata?: {
    paymentDate?: string;
    receiptNumber?: string;
    stickerCount?: number;
    [key: string]: any;
  };
}

export interface MatrixCellProps {
  data: MatrixCellData;
  type: 'amc' | 'sticker';
  isLoading?: boolean;
  hasError?: boolean;
  onClick?: (data: MatrixCellData) => void;
  onHover?: (data: MatrixCellData | null) => void;
  className?: string;
  'aria-label'?: string;
}

const MatrixCell = React.forwardRef<HTMLDivElement, MatrixCellProps>(
  ({ 
    data, 
    type, 
    isLoading = false, 
    hasError = false, 
    onClick, 
    onHover, 
    className,
    'aria-label': ariaLabel,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);

    const handleClick = React.useCallback(() => {
      if (onClick && !isLoading && !hasError) {
        onClick(data);
      }
    }, [onClick, data, isLoading, hasError]);

    const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
      if ((event.key === 'Enter' || event.key === ' ') && onClick && !isLoading && !hasError) {
        event.preventDefault();
        onClick(data);
      }
    }, [onClick, data, isLoading, hasError]);

    const handleMouseEnter = React.useCallback(() => {
      setIsHovered(true);
      if (onHover && !isLoading && !hasError) {
        onHover(data);
      }
    }, [onHover, data, isLoading, hasError]);

    const handleMouseLeave = React.useCallback(() => {
      setIsHovered(false);
      if (onHover) {
        onHover(null);
      }
    }, [onHover]);

    const handleFocus = React.useCallback(() => {
      setIsFocused(true);
    }, []);

    const handleBlur = React.useCallback(() => {
      setIsFocused(false);
    }, []);

    const formatValue = React.useCallback((value: string | number | null) => {
      if (value === null || value === undefined || value === '') {
        return type === 'amc' ? '₹0' : 'Not Assigned';
      }
      
      if (type === 'amc' && typeof value === 'number') {
        return `₹${value.toLocaleString('en-IN')}`;
      }
      
      return String(value);
    }, [type]);

    const getCellVariant = React.useCallback(() => {
      if (hasError) return 'error';
      if (isLoading) return 'loading';
      if (!data.value || data.value === 0 || data.value === '') return 'empty';
      return 'filled';
    }, [hasError, isLoading, data.value]);

    const variant = getCellVariant();
    const isInteractive = Boolean(onClick) && !isLoading && !hasError;
    const isEmpty = variant === 'empty';

    const cellClasses = cn(
      // Base styles
      'relative min-h-[48px] min-w-[80px] p-2 border border-border',
      'flex items-center justify-center text-sm font-medium',
      'transition-all duration-200 ease-in-out',
      
      // Responsive sizing
      'sm:min-h-[52px] sm:min-w-[90px] sm:p-3',
      'md:min-h-[56px] md:min-w-[100px] md:p-4',
      
      // Interactive states
      isInteractive && [
        'cursor-pointer',
        'hover:shadow-md hover:scale-105',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'active:scale-95'
      ],
      
      // Focus states
      isFocused && 'ring-2 ring-ring ring-offset-2',
      
      // Hover states
      isHovered && !isLoading && !hasError && 'shadow-lg',
      
      // Variant styles
      {
        'bg-background text-foreground': variant === 'filled',
        'bg-muted text-muted-foreground': variant === 'empty',
        'bg-destructive/10 text-destructive border-destructive/20': variant === 'error',
        'bg-muted animate-pulse': variant === 'loading',
      },
      
      // Type-specific styles
      type === 'amc' && {
        'hover:bg-green-50 hover:border-green-200': variant === 'filled' && isHovered,
        'hover:bg-red-50 hover:border-red-200': variant === 'empty' && isHovered,
      },
      
      type === 'sticker' && {
        'hover:bg-blue-50 hover:border-blue-200': variant === 'filled' && isHovered,
        'hover:bg-orange-50 hover:border-orange-200': variant === 'empty' && isHovered,
      },
      
      className
    );

    const displayValue = React.useMemo(() => {
      if (isLoading) return '...';
      if (hasError) return 'Error';
      return formatValue(data.value);
    }, [isLoading, hasError, data.value, formatValue]);

    const cellAriaLabel = React.useMemo(() => {
      if (ariaLabel) return ariaLabel;
      
      const baseLabel = `Block ${data.blockNumber}, Flat ${data.flatNumber}`;
      
      if (isLoading) return `${baseLabel}, Loading`;
      if (hasError) return `${baseLabel}, Error loading data`;
      
      if (type === 'amc') {
        const amount = data.value ? `Amount: ${formatValue(data.value)}` : 'No payment';
        const date = data.metadata?.paymentDate ? `, Payment date: ${data.metadata.paymentDate}` : '';
        return `${baseLabel}, ${amount}${date}`;
      }
      
      if (type === 'sticker') {
        const sticker = data.value ? `Sticker: ${data.value}` : 'No sticker assigned';
        const count = data.metadata?.stickerCount ? `, ${data.metadata.stickerCount} stickers` : '';
        return `${baseLabel}, ${sticker}${count}`;
      }
      
      return baseLabel;
    }, [ariaLabel, data, type, isLoading, hasError, formatValue]);

    return (
      <div
        ref={ref}
        className={cellClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        tabIndex={isInteractive ? 0 : -1}
        role={isInteractive ? 'button' : 'cell'}
        aria-label={cellAriaLabel}
        aria-disabled={isLoading || hasError}
        data-block={data.blockNumber}
        data-flat={data.flatNumber}
        data-type={type}
        data-variant={variant}
        {...props}
      >
        {/* Main content */}
        <div className="flex flex-col items-center justify-center text-center">
          <span className={cn(
            'truncate max-w-full',
            isEmpty && 'text-xs opacity-70',
            variant === 'error' && 'text-destructive'
          )}>
            {displayValue}
          </span>
          
          {/* Additional metadata for sticker type */}
          {type === 'sticker' && data.metadata?.stickerCount && data.metadata.stickerCount > 1 && (
            <span className="text-xs text-muted-foreground mt-1">
              +{data.metadata.stickerCount - 1} more
            </span>
          )}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error indicator */}
        {hasError && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        )}

        {/* Hover indicator for interactive cells */}
        {isInteractive && isHovered && !isLoading && !hasError && (
          <div className="absolute inset-0 border-2 border-primary/20 rounded pointer-events-none" />
        )}
      </div>
    );
  }
);

MatrixCell.displayName = 'MatrixCell';

export { MatrixCell };