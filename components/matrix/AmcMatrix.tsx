'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Owner, Receipt } from '@/types/property';
import { useMatrixData, AmcMatrixData } from '@/hooks/useMatrixData';
import { useAmcData } from '@/hooks/useAmcData';
import { Matrix } from './Matrix';
import { ExportButtons } from './ExportButtons';
import { CollapsibleSection } from './CollapsibleSection';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Calculator, Grid3X3, RefreshCw, AlertTriangle } from 'lucide-react';
import { MatrixErrorBoundary } from './MatrixErrorBoundary';
import { MatrixLoadingState } from './MatrixLoadingState';
import { useMatrixErrorHandling } from '@/hooks/useMatrixErrorHandling';

export interface AmcMatrixProps {
  owners?: Owner[];
  receipts?: Receipt[];
  isLoading?: boolean;
  hasError?: boolean;
  onCellClick?: (data: any) => void;
  className?: string;
  useEnhancedApi?: boolean; // Flag to use the new AMC API
}

const AmcMatrix: React.FC<AmcMatrixProps> = ({
  owners: propOwners,
  receipts: propReceipts,
  isLoading: propIsLoading = false,
  hasError: propHasError = false,
  onCellClick,
  className,
  useEnhancedApi = true // Default to using the enhanced API
}) => {
  // Use error handling hook
  const errorHandler = useMatrixErrorHandling();

  // Use the enhanced AMC API if enabled, otherwise fall back to props
  const amcApiData = useAmcData();

  const owners = useEnhancedApi ? amcApiData.owners : (propOwners || []);
  const receipts = useEnhancedApi ? amcApiData.receipts : (propReceipts || []);
  const isLoading = useEnhancedApi ? amcApiData.isLoading : propIsLoading;
  const hasError = useEnhancedApi ? amcApiData.hasError : propHasError;
  const apiError = useEnhancedApi ? amcApiData.error : null;
  const fromCache = useEnhancedApi ? amcApiData.fromCache : false;
  const validationErrors = useEnhancedApi ? amcApiData.validationErrors : [];
  const summary = useEnhancedApi ? amcApiData.summary : null;
  const loadingStage = useEnhancedApi ? amcApiData.loadingStage : 'complete';
  const canRetry = useEnhancedApi ? amcApiData.canRetry : false;
  const retryCount = useEnhancedApi ? amcApiData.retryCount : 0;

  // Handle API errors
  React.useEffect(() => {
    if (apiError && useEnhancedApi) {
      errorHandler.handleApiError(apiError, 'AMC Data Loading');
    }
  }, [apiError, useEnhancedApi, errorHandler]);

  const { availableYears, processAmcDataForYear } = useMatrixData(owners, receipts);

  // Default to the most recent year
  const [selectedYear, setSelectedYear] = React.useState<number>(() => {
    return availableYears.length > 0 ? availableYears[0] : new Date().getFullYear();
  });

  // Debug: Track data changes (optimized to prevent loops)
  React.useEffect(() => {
    console.log(`AMC Matrix: Data changed - Owners: ${owners.length}, Receipts: ${receipts.length}, Available Years: [${availableYears.join(', ')}], Selected Year: ${selectedYear}`);

    if (receipts.length > 0) {
      // Log year distribution in current receipt data
      const yearDistribution = receipts.reduce((acc, receipt) => {
        try {
          if (receipt.paymentDate) {
            let receiptDate: Date;
            if (typeof receipt.paymentDate === 'string') {
              if (receipt.paymentDate.includes('T') || receipt.paymentDate.includes('Z')) {
                receiptDate = new Date(receipt.paymentDate);
              } else {
                receiptDate = new Date(receipt.paymentDate + 'T00:00:00.000Z');
              }
            } else {
              receiptDate = new Date(receipt.paymentDate);
            }

            const year = receiptDate.getFullYear();
            if (!isNaN(year)) {
              acc[year] = (acc[year] || 0) + 1;
            }
          }
        } catch (error) {
          // Ignore parsing errors for this debug log
        }
        return acc;
      }, {} as Record<number, number>);

      console.log(`AMC Matrix: Receipt year distribution:`, yearDistribution);
    }
  }, [owners.length, receipts.length, availableYears.length, selectedYear]); // Fixed: use availableYears.length instead of the array

  // Update selected year when available years change (optimized to prevent loops)
  React.useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      console.log(`AMC Matrix: Updating selected year from ${selectedYear} to ${availableYears[0]}`);
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears.join(','), selectedYear]); // Fixed: use string join to prevent array reference changes

  // Process AMC data for the selected year with error handling (optimized to prevent loops)
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

    try {
      console.log(`AMC Matrix: Processing data for year ${selectedYear}`);
      const result = processAmcDataForYear(selectedYear);
      console.log(`AMC Matrix: Processed ${result.cells.flat().filter(cell => cell.value).length} cells with data for year ${selectedYear}`);
      return result;
    } catch (error) {
      console.error('Error processing AMC data for year:', selectedYear, error);
      errorHandler.addError({
        type: 'data_processing',
        message: `Failed to process AMC data for year ${selectedYear}`,
        details: { error, selectedYear },
      });

      // Return empty data as fallback
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
  }, [processAmcDataForYear, selectedYear, isLoading, hasError, availableYears.length, owners.length, receipts.length]); // Fixed: removed errorHandler and use availableYears.length

  // Data integrity check - ensure matrix only shows data for selected year (optimized to prevent loops)
  React.useEffect(() => {
    if (!isLoading && !hasError && amcData.cells.length > 0) {
      let crossYearDataFound = false;
      let crossYearExamples: string[] = [];

      amcData.cells.forEach((blockRow, blockIndex) => {
        blockRow.forEach((cell, flatIndex) => {
          if (cell.metadata?.paymentDate) {
            try {
              let cellDate: Date;
              if (typeof cell.metadata.paymentDate === 'string') {
                if (cell.metadata.paymentDate.includes('T') || cell.metadata.paymentDate.includes('Z')) {
                  cellDate = new Date(cell.metadata.paymentDate);
                } else {
                  cellDate = new Date(cell.metadata.paymentDate + 'T00:00:00.000Z');
                }
              } else {
                cellDate = new Date(cell.metadata.paymentDate);
              }

              const cellYear = cellDate.getFullYear();
              if (cellYear !== selectedYear) {
                crossYearDataFound = true;
                crossYearExamples.push(`${cell.blockNumber}-${cell.flatNumber}: ${cellYear} (should be ${selectedYear})`);
                console.error(`❌ CROSS-YEAR DATA DETECTED: Cell ${cell.blockNumber}-${cell.flatNumber} shows data from year ${cellYear} but selected year is ${selectedYear}`, cell);
              }
            } catch (error) {
              console.warn('Error validating cell date:', cell, error);
            }
          }
        });
      });

      if (crossYearDataFound) {
        console.error(`🚨 CRITICAL: Found cross-year data contamination! Examples:`, crossYearExamples.slice(0, 5));
        errorHandler.addError({
          type: 'validation',
          message: `Matrix contains data from wrong years. Found ${crossYearExamples.length} cells with incorrect year data.`,
          details: { selectedYear, examples: crossYearExamples.slice(0, 10) },
        });
      } else {
        console.log(`✅ Data integrity check passed: All matrix data is from year ${selectedYear}`);
      }
    }
  }, [amcData.cells.length, selectedYear, isLoading, hasError]); // Fixed: removed errorHandler and use cells.length instead of full amcData

  const handleYearChange = React.useCallback((year: string) => {
    try {
      const yearNum = parseInt(year, 10);
      if (isNaN(yearNum)) {
        throw new Error(`Invalid year: ${year}`);
      }
      console.log(`AMC Matrix: Changing year from ${selectedYear} to ${yearNum}`);
      setSelectedYear(yearNum);
      // Clear any previous data processing errors when changing year
      errorHandler.clearErrors();
    } catch (error) {
      console.error('Error changing year:', error);
      errorHandler.addError({
        type: 'validation',
        message: `Invalid year selected: ${year}`,
        details: { year, error },
      });
    }
  }, [errorHandler, selectedYear]);

  const formatCurrency = React.useCallback((amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  }, []);

  // Calculate grand total
  const grandTotal = React.useMemo(() => {
    return Object.values(amcData.totalByBlock).reduce((sum, amount) => sum + amount, 0);
  }, [amcData.totalByBlock]);

  if (isLoading) {
    return (
      <MatrixLoadingState
        type="amc"
        stage={loadingStage}
        className={className}
      />
    );
  }

  if (hasError) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <div>
              <div className="text-destructive font-medium mb-2">Error Loading AMC Matrix</div>
              <div className="text-sm text-muted-foreground mb-4">
                {apiError || 'Unable to load AMC payment data. Please try again.'}
              </div>
              {retryCount > 0 && (
                <div className="text-xs text-amber-600 mb-2">
                  Retry attempt {retryCount}/3
                </div>
              )}
              {useEnhancedApi && (
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  {canRetry && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => amcApiData.retry()}
                      disabled={isLoading}
                    >
                      <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                      Retry ({3 - retryCount} left)
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => amcApiData.refetch(true)}
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                    Force Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => amcApiData.clearCache()}
                    disabled={isLoading}
                  >
                    Clear Cache
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <MatrixErrorBoundary
      onError={(error, errorInfo) => {
        console.error('AMC Matrix Error:', error, errorInfo);
        errorHandler.addError({
          type: 'unknown',
          message: error.message,
          details: { error, errorInfo },
        });
      }}
      resetKeys={[selectedYear, owners.length, receipts.length]}
    >
      <div className={cn('w-full space-y-4', className)}>
        {/* Header with year selector - Enhanced for mobile */}
        <CollapsibleSection
          title="AMC Payment Matrix"
          icon={<BarChart3 className="h-5 w-5" />}
          defaultExpanded={true}
          collapsibleOnMobile={false}
          alwaysExpanded={true}
        >
          <div className="flex flex-col space-y-4">
            {/* Controls row - responsive layout */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {availableYears.length > 0 && (
                  <div className="flex items-center gap-2">
                    <label htmlFor="year-selector" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                      Year:
                    </label>
                    <Select
                      value={selectedYear.toString()}
                      onValueChange={handleYearChange}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="year-selector" className="w-full sm:w-32">
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

                {/* Enhanced API controls */}
                {useEnhancedApi && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => amcApiData.refetch(true)}
                      disabled={isLoading}
                      className="text-xs"
                    >
                      <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} />
                      Refresh
                    </Button>
                    {fromCache && (
                      <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                        Cached
                      </span>
                    )}
                  </div>
                )}

                {/* Summary info - responsive layout */}
                {!isLoading && !hasError && amcData.blocks.length > 0 && (
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-sm text-muted-foreground">
                    <span className="bg-muted/50 px-2 py-1 rounded text-xs sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm">
                      {amcData.blocks.length} blocks
                    </span>
                    <span className="bg-muted/50 px-2 py-1 rounded text-xs sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm">
                      {amcData.flats.length} flats
                    </span>
                    <span className="bg-primary/10 px-2 py-1 rounded text-xs font-medium text-primary sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm sm:text-foreground">
                      Total: {formatCurrency(grandTotal)}
                    </span>
                  </div>
                )}

                {/* Validation warnings */}
                {validationErrors.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{validationErrors.length} validation warnings</span>
                  </div>
                )}
              </div>

              {/* Export buttons - full width on mobile */}
              <div className="w-full sm:w-auto">
                <ExportButtons
                  data={amcData}
                  type="amc"
                  disabled={isLoading || hasError || amcData.blocks.length === 0}
                  className="w-full sm:w-auto"
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Matrix display - Enhanced responsive container */}
        <CollapsibleSection
          title="Payment Matrix"
          icon={<Grid3X3 className="h-5 w-5" />}
          defaultExpanded={true}
          collapsibleOnMobile={true}
          contentClassName="p-0"
        >
          <div className="relative">
            {/* Mobile scroll hint */}
            <div className="block sm:hidden bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border">
              💡 Scroll horizontally to view all flats
            </div>

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


          </div>
        </CollapsibleSection>

        {/* Block totals - Collapsible on mobile */}
        {!isLoading && !hasError && amcData.blocks.length > 0 && (
          <CollapsibleSection
            title="Totals by Block"
            icon={<Calculator className="h-5 w-5" />}
            defaultExpanded={false}
            collapsibleOnMobile={true}
          >
            {/* Responsive grid with better mobile layout */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
              {amcData.blocks.map((block) => (
                <div
                  key={`block-total-${block}`}
                  className="flex flex-col items-center p-2 sm:p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                    Block {block}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-center">
                    {formatCurrency(amcData.totalByBlock[block] || 0)}
                  </div>
                </div>
              ))}
            </div>

            {/* Grand total - Enhanced mobile layout */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="text-base sm:text-lg font-semibold">Grand Total:</span>
                <span className="text-lg sm:text-xl font-bold text-primary">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>
          </CollapsibleSection>
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
    </MatrixErrorBoundary>
  );
};

export { AmcMatrix };
export default AmcMatrix;