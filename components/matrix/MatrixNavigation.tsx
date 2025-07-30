'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Building2, BarChart3, Car, Home, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export interface MatrixNavigationProps {
  className?: string;
}

const MatrixNavigation: React.FC<MatrixNavigationProps> = ({ className }) => {
  const pathname = usePathname();

  // Navigation items for matrix views
  const matrixNavItems = [
    {
      href: '/matrix/amc',
      label: 'AMC Matrix',
      description: 'View AMC payments by block and flat',
      icon: BarChart3,
      isActive: pathname === '/matrix/amc'
    },
    {
      href: '/matrix/stickers',
      label: 'Car Sticker Matrix',
      description: 'View car sticker assignments by block and flat',
      icon: Car,
      isActive: pathname === '/matrix/stickers'
    }
  ];

  // Breadcrumb items based on current path
  const getBreadcrumbItems = () => {
    const items = [
      {
        href: '/',
        label: 'Home',
        icon: Home
      }
    ];

    if (pathname.startsWith('/matrix')) {
      items.push({
        href: '/matrix',
        label: 'Matrix Views',
        icon: Building2
      });

      if (pathname === '/matrix/amc') {
        items.push({
          href: '/matrix/amc',
          label: 'AMC Matrix',
          icon: BarChart3
        });
      } else if (pathname === '/matrix/stickers') {
        items.push({
          href: '/matrix/stickers',
          label: 'Car Sticker Matrix',
          icon: Car
        });
      }
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-muted-foreground">
        {breadcrumbItems.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === breadcrumbItems.length - 1;
          
          return (
            <React.Fragment key={item.href}>
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              )}
              
              {isLast ? (
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Matrix View Navigation - Only show when on matrix pages */}
      {pathname.startsWith('/matrix') && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Matrix Views
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose a matrix view to analyze property data in a structured format
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                {matrixNavItems.map((item) => {
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200',
                        'hover:bg-accent hover:text-accent-foreground',
                        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        item.isActive
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-background border-border text-foreground hover:border-accent-foreground/20'
                      )}
                      aria-current={item.isActive ? 'page' : undefined}
                    >
                      <Icon className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className={cn(
                          'text-xs',
                          item.isActive 
                            ? 'text-primary-foreground/80' 
                            : 'text-muted-foreground'
                        )}>
                          {item.description}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Navigation for non-matrix pages */}
      {!pathname.startsWith('/matrix') && pathname !== '/' && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Matrix Views Available</h3>
                <p className="text-xs text-muted-foreground">
                  Analyze your property data in matrix format
                </p>
              </div>
              
              <div className="flex gap-2">
                {matrixNavItems.map((item) => {
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted hover:bg-accent rounded-md transition-colors"
                    >
                      <Icon className="h-3 w-3" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export { MatrixNavigation };