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
        return { main: type === 'amc' ? '—' : '—', secondary: type === 'amc' ? 'No Payment' : 'Unassigned' };
      }
      
      if (type === 'amc' && typeof value === 'number') {
        // Format currency with better readability
        if (value >= 100000) {
          return { main: `₹${(value / 100000).toFixed(1)}L`, secondary: `₹${value.toLocaleString('en-IN')}` };
        } else if (value >= 1000) {
          return { main: `₹${(value / 1000).toFixed(0)}K`, secondary: `₹${value.toLocaleString('en-IN')}` };
        } else {
          return { main: `₹${value}`, secondary: null };
        }
      }
      
      const stringValue = String(value);
      
      // For sticker type, handle long values better
      if (type === 'sticker') {
        if (stringValue.length > 10) {
          return { main: stringValue.substring(0, 8) + '...', secondary: stringValue };
        }
        return { main: stringValue, secondary: null };
      }
      
      return { main: stringValue, secondary: null };
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
      // Enhanced base styles for better desktop visibility
      'relative min-h-[50px] min-w-[90px] max-w-[140px] p-3 border border-border/60',
      'flex items-center justify-center text-sm font-medium',
      'transition-all duration-200 ease-in-out overflow-hidden',
      'rounded-sm', // Subtle rounding for modern look
      
      // Progressive enhancement for larger screens with better spacing
      'sm:min-h-[55px] sm:min-w-[100px] sm:max-w-[150px] sm:p-3.5 sm:text-sm',
      'md:min-h-[60px] md:min-w-[110px] md:max-w-[160px] md:p-4 md:text-base',
      'lg:min-h-[65px] lg:min-w-[120px] lg:max-w-[170px] lg:p-4',
      'xl:min-h-[70px] xl:min-w-[130px] xl:max-w-[180px] xl:p-5',
      
      // Interactive states with enhanced visual feedback
      isInteractive && [
        'cursor-pointer',
        // Enhanced hover effects for desktop
        'hover:shadow-lg hover:scale-[1.03] hover:border-primary/30',
        // Better focus states
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
        // Touch-optimized active states
        'active:scale-[0.98] active:shadow-inner',
        // Ensure minimum touch target size
        'min-h-[44px] min-w-[44px]',
        // Prevent text selection
        'select-none touch-manipulation',
        '[-webkit-tap-highlight-color:transparent]'
      ],
      
      // Enhanced focus states
      isFocused && 'ring-2 ring-primary/50 ring-offset-2',
      
      // Enhanced hover states with better visual feedback
      isHovered && !isLoading && !hasError && 'shadow-xl border-primary/40',
      
      // Improved variant styles with better contrast
      {
        // Filled cells - enhanced visibility
        'bg-white text-gray-900 border-gray-200 shadow-sm': variant === 'filled',
        // Empty cells - subtle but visible
        'bg-gray-50 text-gray-500 border-gray-200': variant === 'empty',
        // Error cells - clear error indication
        'bg-red-50 text-red-700 border-red-200': variant === 'error',
        // Loading cells
        'bg-gray-100 animate-pulse border-gray-200': variant === 'loading',
      },
      
      // Enhanced type-specific styles with better color schemes
      type === 'amc' && {
        // Filled AMC cells - green theme for payments
        'bg-emerald-50 text-emerald-900 border-emerald-200': variant === 'filled',
        'hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-emerald-200/50': variant === 'filled' && isHovered,
        // Empty AMC cells - red theme for missing payments
        'bg-red-50 text-red-600 border-red-200': variant === 'empty',
        'hover:bg-red-100 hover:border-red-300': variant === 'empty' && isHovered,
      },
      
      type === 'sticker' && {
        // Filled sticker cells - blue theme
        'bg-blue-50 text-blue-900 border-blue-200': variant === 'filled',
        'hover:bg-blue-100 hover:border-blue-300 hover:shadow-blue-200/50': variant === 'filled' && isHovered,
        // Empty sticker cells - orange theme
        'bg-orange-50 text-orange-600 border-orange-200': variant === 'empty',
        'hover:bg-orange-100 hover:border-orange-300': variant === 'empty' && isHovered,
      },
      
      className
    );

    const displayValue = React.useMemo(() => {
      if (isLoading) return { main: '...', secondary: null };
      if (hasError) return { main: 'Error', secondary: null };
      return formatValue(data.value);
    }, [isLoading, hasError, data.value, formatValue]);

    const cellAriaLabel = React.useMemo(() => {
      if (ariaLabel) return ariaLabel;
      
      const baseLabel = `Block ${data.blockNumber}, Flat ${data.flatNumber}`;
      
      if (isLoading) return `${baseLabel}, Loading`;
      if (hasError) return `${baseLabel}, Error loading data`;
      
      if (type === 'amc') {
        const formattedValue = formatValue(data.value);
        const amount = data.value ? `Amount: ${formattedValue.secondary || formattedValue.main}` : 'No payment';
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
        {/* Enhanced main content with better typography */}
        <div className="flex flex-col items-center justify-center text-center w-full h-full overflow-hidden gap-1">
          {/* Primary value - larger and more prominent */}
          <div className={cn(
            'font-semibold leading-tight',
            // Responsive font sizing for better desktop visibility
            'text-sm sm:text-base md:text-lg lg:text-xl',
            // Enhanced contrast and visibility
            isEmpty && 'text-gray-400 font-normal text-xs sm:text-sm',
            variant === 'error' && 'text-red-600',
            variant === 'filled' && type === 'amc' && 'text-emerald-800',
            variant === 'filled' && type === 'sticker' && 'text-blue-800',
            // Ensure text fits within cell bounds
            'max-w-full overflow-hidden text-ellipsis whitespace-nowrap'
          )} title={displayValue.secondary || displayValue.main}>
            {displayValue.main}
          </div>
          
          {/* Secondary value - smaller, detailed info on hover/large screens */}
          {displayValue.secondary && !isEmpty && (
            <div className={cn(
              'text-xs font-normal opacity-75 leading-tight',
              'hidden lg:block', // Only show on large screens
              'max-w-full overflow-hidden text-ellipsis whitespace-nowrap',
              type === 'amc' && 'text-emerald-600',
              type === 'sticker' && 'text-blue-600'
            )} title={displayValue.secondary}>
              {displayValue.secondary}
            </div>
          )}
          
          {/* Payment date indicator for AMC */}
          {type === 'amc' && data.metadata?.paymentDate && !isEmpty && (
            <div className="text-xs opacity-60 font-normal hidden xl:block">
              {new Date(data.metadata.paymentDate).toLocaleDateString('en-IN', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          )}
          
          {/* Multiple stickers indicator */}
          {type === 'sticker' && data.metadata?.stickerCount && data.metadata.stickerCount > 1 && (
            <div className="text-xs opacity-75 font-medium bg-blue-100 px-1.5 py-0.5 rounded-full">
              +{data.metadata.stickerCount - 1}
            </div>
          )}
        </div>

        {/* Enhanced loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Enhanced error indicator */}
        {hasError && (
          <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm" />
        )}

        {/* Enhanced hover indicator with subtle glow */}
        {isInteractive && isHovered && !isLoading && !hasError && (
          <div className={cn(
            "absolute inset-0 rounded-sm pointer-events-none",
            "border-2 border-primary/30",
            type === 'amc' && "border-emerald-400/50 bg-emerald-50/20",
            type === 'sticker' && "border-blue-400/50 bg-blue-50/20"
          )} />
        )}

        {/* Value indicator for filled cells */}
        {variant === 'filled' && !isLoading && !hasError && (
          <div className={cn(
            "absolute top-1 left-1 w-2 h-2 rounded-full",
            type === 'amc' && "bg-emerald-400",
            type === 'sticker' && "bg-blue-400"
          )} />
        )}
      </div>
    );
  }
);

MatrixCell.displayName = 'MatrixCell';

export { MatrixCell };