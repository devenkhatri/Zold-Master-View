'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Owner, Receipt } from '@/types/property';
import { useMatrixData, AmcMatrixData } from '@/hooks/useMatrixData';
import { Matrix } from './Matrix';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface AmcMatrixProps {
  owners: Owner[];
  receipts: Receipt[];
  isLoading?: boolean;
  hasError?: boolean;
  onCellClick?: (data: any) => void;
  className?: string;
}

const AmcMatrix: React.FC<AmcMatrixProps> = ({
  owners,
  receipts,
  isLoading = false,
  hasError = false,
  onCellClick,
  className
}) => {
  const { availableYears, processAmcDataForYear } = useMatrixData(owners, receipts);
  
  // Default to the most recent year
  const [selectedYear, setSelectedYear] = React.useState<number>(() => {
    return availableYears.length > 0 ? availableYears[0] : new Date().getFullYear();
  });

  // Update selected year when available years change
  React.useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Process AMC data for the selected year
  const amcData: AmcMatrixData = React.useMemo(() => {
    if (isLoading || hasError || availableYears.length === 0) {
      return {
        blocks: [],
        flats: [],
        cells: [],
        availableYears: [],
        selectedYear,
        totalByBlock: {},
        totalByFlat: {}
      };
    }
    return processAmcDataForYear(selectedYear);
  }, [processAmcDataForYear, selectedYear, isLoading, hasError, availableYears]);

  const handleYearChange = React.useCallback((year: string) => {
    setSelectedYear(parseInt(year, 10));
  }, []);

  const formatCurrency = React.useCallback((amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  }, []);

  // Calculate grand total
  const grandTotal = React.useMemo(() => {
    return Object.values(amcData.totalByBlock).reduce((sum, amount) => sum + amount, 0);
  }, [amcData.totalByBlock]);

  if (hasError) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-center">
            <div>
              <div className="text-destructive font-medium mb-2">Error Loading AMC Matrix</div>
              <div className="text-sm text-muted-foreground">
                Unable to load AMC payment data. Please try again.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Header with year selector */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-xl font-semibold">
              AMC Payment Matrix
            </CardTitle>
            
            {availableYears.length > 0 && (
              <div className="flex items-center gap-2">
                <label htmlFor="year-selector" className="text-sm font-medium text-muted-foreground">
                  Year:
                </label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={handleYearChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="year-selector" className="w-32">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {/* Summary info */}
          {!isLoading && !hasError && amcData.blocks.length > 0 && (
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2">
              <span>{amcData.blocks.length} blocks</span>
              <span>{amcData.flats.length} flats</span>
              <span className="font-medium text-foreground">
                Total: {formatCurrency(grandTotal)}
              </span>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Matrix display */}
      <Card>
        <CardContent className="p-0">
          <div className="relative">
            <Matrix
              data={{
                blocks: amcData.blocks,
                flats: amcData.flats,
                cells: amcData.cells
              }}
              type="amc"
              isLoading={isLoading}
              hasError={hasError}
              onCellClick={onCellClick}
              aria-label={`AMC Payment Matrix for ${selectedYear}`}
            />
            
            {/* Totals overlay */}
            {!isLoading && !hasError && amcData.blocks.length > 0 && (
              <div className="absolute top-0 right-0 bg-background border-l border-b border-border">
                {/* Column totals header */}
                <div className="sticky top-0 z-10 bg-muted border-b border-border p-3 font-semibold text-center min-w-[100px]">
                  Total
                </div>
                
                {/* Row totals */}
                {amcData.blocks.map((block) => (
                  <div
                    key={`total-${block}`}
                    className="border-b border-border p-3 text-center font-medium bg-muted/50 min-h-[48px] sm:min-h-[52px] md:min-h-[56px] flex items-center justify-center"
                    title={`Total for Block ${block}: ${formatCurrency(amcData.totalByBlock[block] || 0)}`}
                  >
                    {formatCurrency(amcData.totalByBlock[block] || 0)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Column totals */}
      {!isLoading && !hasError && amcData.blocks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Totals by Flat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {amcData.flats.map((flat) => (
                <div
                  key={`flat-total-${flat}`}
                  className="flex flex-col items-center p-3 bg-muted/30 rounded-lg border"
                >
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Flat {flat}
                  </div>
                  <div className="text-sm font-semibold">
                    {formatCurrency(amcData.totalByFlat[flat] || 0)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Grand total */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Grand Total:</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No data state */}
      {!isLoading && !hasError && availableYears.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center text-center">
              <div>
                <div className="text-muted-foreground font-medium mb-2">No Payment Data Available</div>
                <div className="text-sm text-muted-foreground">
                  No AMC payment records found. Please ensure receipt data is available.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export { AmcMatrix };