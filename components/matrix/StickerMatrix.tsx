'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Owner } from '@/types/property';
import { useMatrixData, StickerMatrixData } from '@/hooks/useMatrixData';
import { Matrix } from './Matrix';
import { ExportButtons } from './ExportButtons';
import { CollapsibleSection } from './CollapsibleSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Users, Car, Grid3X3, BarChart3, Info, RefreshCw } from 'lucide-react';
import { MatrixErrorBoundary } from './MatrixErrorBoundary';
import { MatrixLoadingState } from './MatrixLoadingState';
import { useMatrixErrorHandling } from '@/hooks/useMatrixErrorHandling';

export interface StickerMatrixProps {
  owners: Owner[];
  isLoading?: boolean;
  hasError?: boolean;
  onCellClick?: (data: any) => void;
  className?: string;
}

const StickerMatrix: React.FC<StickerMatrixProps> = ({
  owners,
  isLoading = false,
  hasError = false,
  onCellClick,
  className
}) => {
  // Use error handling hook
  const errorHandler = useMatrixErrorHandling();
  const { stickerMatrixData } = useMatrixData(owners, []);

  // Process sticker data with error handling
  const stickerData: StickerMatrixData = React.useMemo(() => {
    if (isLoading || hasError) {
      return {
        blocks: [],
        flats: [],
        cells: [],
        unassignedFlats: [],
        multipleStickers: []
      };
    }
    
    try {
      return stickerMatrixData;
    } catch (error) {
      console.error('Error processing sticker data:', error);
      errorHandler.addError({
        type: 'data_processing',
        message: 'Failed to process sticker data',
        details: { error, owners: owners.length },
      });
      
      // Return empty data as fallback
      return {
        blocks: [],
        flats: [],
        cells: [],
        unassignedFlats: [],
        multipleStickers: []
      };
    }
  }, [stickerMatrixData, isLoading, hasError, owners.length, errorHandler]);

  // Calculate statistics
  const statistics = React.useMemo(() => {
    const totalFlats = stickerData.blocks.length * stickerData.flats.length;
    const assignedFlats = totalFlats - stickerData.unassignedFlats.length;
    const multipleStickersCount = stickerData.multipleStickers.length;
    
    // Count total stickers
    let totalStickers = 0;
    stickerData.cells.forEach(row => {
      row.forEach(cell => {
        if (cell.metadata?.stickerCount) {
          totalStickers += cell.metadata.stickerCount;
        }
      });
    });

    return {
      totalFlats,
      assignedFlats,
      unassignedFlats: stickerData.unassignedFlats.length,
      multipleStickersCount,
      totalStickers,
      assignmentRate: totalFlats > 0 ? Math.round((assignedFlats / totalFlats) * 100) : 0
    };
  }, [stickerData]);

  const handleCellClick = React.useCallback((cellData: any) => {
    if (onCellClick) {
      // Enhance cell data with additional sticker information
      const enhancedData = {
        ...cellData,
        isUnassigned: !cellData.value,
        hasMultipleStickers: cellData.metadata?.stickerCount > 1,
        stickerList: cellData.value ? cellData.value.split(',').map((s: string) => s.trim()) : []
      };
      onCellClick(enhancedData);
    }
  }, [onCellClick]);

  if (isLoading) {
    return (
      <MatrixLoadingState
        type="sticker"
        stage="processing"
        className={className}
      />
    );
  }

  if (hasError) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-center">
            <div>
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <div className="text-destructive font-medium mb-2">Error Loading Car Sticker Matrix</div>
              <div className="text-sm text-muted-foreground">
                Unable to load car sticker data. Please try again.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <MatrixErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Sticker Matrix Error:', error, errorInfo);
        errorHandler.addError({
          type: 'unknown',
          message: error.message,
          details: { error, errorInfo },
        });
      }}
      resetKeys={[owners.length]}
    >
      <div className={cn('w-full space-y-4', className)}>
        {/* Header with statistics - Enhanced for mobile */}
        <CollapsibleSection
        title="Car Sticker Assignment Matrix"
        icon={<Car className="h-5 w-5" />}
        defaultExpanded={true}
        collapsibleOnMobile={false}
        alwaysExpanded={true}
      >
        <div className="flex flex-col space-y-4">
          {/* Controls and summary row - responsive layout */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Statistics - responsive layout */}
            {!isLoading && !hasError && stickerData.blocks.length > 0 && (
              <div className="flex flex-wrap gap-2 sm:gap-4 text-sm text-muted-foreground">
                <span className="bg-muted/50 px-2 py-1 rounded text-xs sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm">
                  {stickerData.blocks.length} blocks
                </span>
                <span className="bg-muted/50 px-2 py-1 rounded text-xs sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm">
                  {stickerData.flats.length} flats
                </span>
                <span className="bg-primary/10 px-2 py-1 rounded text-xs font-medium text-primary sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm sm:text-foreground">
                  {statistics.assignedFlats}/{statistics.totalFlats} assigned ({statistics.assignmentRate}%)
                </span>
                <span className="bg-muted/50 px-2 py-1 rounded text-xs sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm">
                  {statistics.totalStickers} total stickers
                </span>
              </div>
            )}
            
            {/* Export buttons - full width on mobile */}
            <div className="w-full sm:w-auto">
              <ExportButtons
                data={stickerData}
                type="sticker"
                disabled={isLoading || hasError || stickerData.blocks.length === 0}
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Statistics Cards - Collapsible on mobile */}
      {!isLoading && !hasError && stickerData.blocks.length > 0 && (
        <CollapsibleSection
          title="Assignment Statistics"
          icon={<BarChart3 className="h-5 w-5" />}
          defaultExpanded={false}
          collapsibleOnMobile={true}
        >
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">{statistics.assignedFlats}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Assigned Flats</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-orange-600">{statistics.unassignedFlats}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Unassigned Flats</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">{statistics.multipleStickersCount}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Multiple Stickers</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-primary rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs text-primary-foreground font-bold">%</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-primary">{statistics.assignmentRate}%</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Assignment Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CollapsibleSection>
      )}

      {/* Matrix display - Enhanced responsive container */}
      <CollapsibleSection
        title="Sticker Assignment Matrix"
        icon={<Grid3X3 className="h-5 w-5" />}
        defaultExpanded={true}
        collapsibleOnMobile={true}
        contentClassName="p-0"
      >
        {/* Mobile scroll hint */}
        <div className="block sm:hidden bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border">
          💡 Scroll horizontally to view all flats
        </div>
        
        <Matrix
          data={{
            blocks: stickerData.blocks,
            flats: stickerData.flats,
            cells: stickerData.cells
          }}
          type="sticker"
          isLoading={isLoading}
          hasError={hasError}
          onCellClick={handleCellClick}
          aria-label="Car Sticker Assignment Matrix"
        />
      </CollapsibleSection>

      {/* Unassigned Flats Summary - Collapsible on mobile */}
      {!isLoading && !hasError && stickerData.unassignedFlats.length > 0 && (
        <CollapsibleSection
          title={`Unassigned Flats (${stickerData.unassignedFlats.length})`}
          icon={<AlertCircle className="w-5 h-5 text-orange-600" />}
          defaultExpanded={false}
          collapsibleOnMobile={true}
        >
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {stickerData.unassignedFlats.map((flatKey) => {
              const [block, flat] = flatKey.split('-');
              return (
                <Badge
                  key={flatKey}
                  variant="outline"
                  className="border-orange-200 text-orange-700 bg-orange-50 text-xs sm:text-sm hover:bg-orange-100 transition-colors"
                >
                  Block {block}, Flat {flat}
                </Badge>
              );
            })}
          </div>
          <div className="mt-3 text-xs sm:text-sm text-muted-foreground">
            These flats do not have any car stickers assigned. Click on individual cells for more details.
          </div>
        </CollapsibleSection>
      )}

      {/* Multiple Stickers Summary - Collapsible on mobile */}
      {!isLoading && !hasError && stickerData.multipleStickers.length > 0 && (
        <CollapsibleSection
          title={`Flats with Multiple Stickers (${stickerData.multipleStickers.length})`}
          icon={<Users className="w-5 h-5 text-blue-600" />}
          defaultExpanded={false}
          collapsibleOnMobile={true}
        >
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {stickerData.multipleStickers.map((flatKey) => {
              const [block, flat] = flatKey.split('-');
              // Find the cell data to get sticker count
              const blockIndex = stickerData.blocks.indexOf(block);
              const flatIndex = stickerData.flats.indexOf(flat);
              const cellData = stickerData.cells[blockIndex]?.[flatIndex];
              const stickerCount = cellData?.metadata?.stickerCount || 0;
              
              return (
                <Badge
                  key={flatKey}
                  variant="outline"
                  className="border-blue-200 text-blue-700 bg-blue-50 text-xs sm:text-sm hover:bg-blue-100 transition-colors"
                >
                  Block {block}, Flat {flat} ({stickerCount} stickers)
                </Badge>
              );
            })}
          </div>
          <div className="mt-3 text-xs sm:text-sm text-muted-foreground">
            These flats have multiple car stickers assigned. Click on individual cells to view all sticker numbers.
          </div>
        </CollapsibleSection>
      )}

      {/* No data state */}
      {!isLoading && !hasError && stickerData.blocks.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center text-center">
              <div>
                <div className="text-muted-foreground font-medium mb-2">No Sticker Data Available</div>
                <div className="text-sm text-muted-foreground">
                  No car sticker assignments found. Please ensure owner data is available.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend - Collapsible on mobile */}
      {!isLoading && !hasError && stickerData.blocks.length > 0 && (
        <CollapsibleSection
          title="Legend"
          icon={<Info className="w-5 h-5" />}
          defaultExpanded={false}
          collapsibleOnMobile={true}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-background border border-border rounded shrink-0"></div>
              <span>Assigned sticker</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-muted border border-border rounded shrink-0"></div>
              <span>No sticker assigned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded shrink-0"></div>
              <span>Multiple stickers</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Hover over cells to see detailed sticker information. </span>
            <span className="sm:hidden">Tap cells to view detailed sticker information. </span>
            Click cells to view additional details.
          </div>
        </CollapsibleSection>
      )}
      </div>
    </MatrixErrorBoundary>
  );
};

export { StickerMatrix };
export default StickerMatrix;