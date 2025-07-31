'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin text-primary',
        sizeClasses[size],
        className
      )} 
    />
  );
}

interface LoadingStateProps {
  message?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingState({ 
  message = 'Loading...', 
  description,
  size = 'md',
  className 
}: LoadingStateProps) {
  const containerClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const spinnerSizes = {
    sm: 'md' as const,
    md: 'lg' as const,
    lg: 'xl' as const,
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      containerClasses[size],
      className
    )}>
      <LoadingSpinner size={spinnerSizes[size]} className="mb-4" />
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{message}</p>
        {description && (
          <p className="text-xs text-muted-foreground max-w-sm">{description}</p>
        )}
      </div>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className, variant = 'rectangular' }: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-muted',
        variantClasses[variant],
        className
      )}
    />
  );
}

interface PageLoadingProps {
  title?: string;
  description?: string;
}

export function PageLoading({ 
  title = 'Loading Page...', 
  description = 'Please wait while we load your content.' 
}: PageLoadingProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full mx-auto">
        <LoadingState 
          message={title}
          description={description}
          size="lg"
        />
      </div>
    </div>
  );
}

interface MatrixLoadingProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export function MatrixLoading({ rows = 5, cols = 8, className }: MatrixLoadingProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
      
      {/* Matrix skeleton */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header row */}
        <div className="flex border-b bg-muted/50">
          <Skeleton className="h-12 w-20 m-2 rounded" />
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-16 m-2 rounded" />
          ))}
        </div>
        
        {/* Data rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex border-b last:border-b-0">
            <Skeleton className="h-12 w-20 m-2 rounded" />
            {Array.from({ length: cols }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex} 
                className={cn(
                  'h-12 w-16 m-2 rounded',
                  // Random widths for more realistic skeleton
                  Math.random() > 0.3 ? 'opacity-100' : 'opacity-30'
                )} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export { LoadingSpinner as Spinner };