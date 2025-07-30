'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  collapsibleOnMobile?: boolean;
  alwaysExpanded?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  icon?: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = true,
  collapsibleOnMobile = true,
  alwaysExpanded = false,
  className,
  headerClassName,
  contentClassName,
  icon
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const [isMobile, setIsMobile] = React.useState(false);

  // Detect mobile screen size
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const shouldShowCollapsible = collapsibleOnMobile && isMobile && !alwaysExpanded;
  const isContentVisible = alwaysExpanded || !shouldShowCollapsible || isExpanded;

  const toggleExpanded = React.useCallback(() => {
    if (!shouldShowCollapsible) return;
    setIsExpanded(prev => !prev);
  }, [shouldShowCollapsible]);

  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleExpanded();
    }
  }, [toggleExpanded]);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader 
        className={cn(
          'pb-3',
          shouldShowCollapsible && 'cursor-pointer select-none',
          headerClassName
        )}
        onClick={shouldShowCollapsible ? toggleExpanded : undefined}
        onKeyDown={shouldShowCollapsible ? handleKeyDown : undefined}
        tabIndex={shouldShowCollapsible ? 0 : -1}
        role={shouldShowCollapsible ? 'button' : undefined}
        aria-expanded={shouldShowCollapsible ? isExpanded : undefined}
        aria-controls={shouldShowCollapsible ? `collapsible-content-${title}` : undefined}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          
          {shouldShowCollapsible && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              aria-label={isExpanded ? `Collapse ${title}` : `Expand ${title}`}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        
        {/* Mobile indicator */}
        {shouldShowCollapsible && (
          <div className="text-xs text-muted-foreground mt-1">
            Tap to {isExpanded ? 'collapse' : 'expand'}
          </div>
        )}
      </CardHeader>
      
      {isContentVisible && (
        <CardContent 
          id={shouldShowCollapsible ? `collapsible-content-${title}` : undefined}
          className={cn(
            'transition-all duration-300 ease-in-out',
            shouldShowCollapsible && !isExpanded && 'hidden',
            contentClassName
          )}
        >
          {children}
        </CardContent>
      )}
    </Card>
  );
};

export { CollapsibleSection };