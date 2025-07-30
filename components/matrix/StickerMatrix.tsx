'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Owner } from '@/types/property';
import { useMatrixData, StickerMatrixData } from '@/hooks/useMatrixData';
import { Matrix } from './Matrix';
import { ExportButtons } from './ExportButtons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Users } from 'lucide-react';

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
  const { stickerMatrixData } = useMatrixData(owners, []);

  // Process sticker data
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
    return stickerMatrixData;
  }, [stickerMatrixData, isLoading, hasError]);

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
    <div className={cn('w-full space-y-4', className)}>
      {/* Header with statistics */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-xl font-semibold">
              Car Sticker Assignment Matrix
            </CardTitle>
            
            <ExportButtons
              data={stickerData}
              type="sticker"
              disabled={isLoading || hasError || stickerData.blocks.length === 0}
            />
          </div>
          
          {/* Statistics */}
          {!isLoading && !hasError && stickerData.blocks.length > 0 && (
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2">
              <span>{stickerData.blocks.length} blocks</span>
              <span>{stickerData.flats.length} flats</span>
              <span className="font-medium text-foreground">
                {statistics.assignedFlats}/{statistics.totalFlats} assigned ({statistics.assignmentRate}%)
              </span>
              <span>{statistics.totalStickers} total stickers</span>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Statistics Cards */}
      {!isLoading && !hasError && stickerData.blocks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{statistics.assignedFlats}</div>
                  <div className="text-sm text-muted-foreground">Assigned Flats</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">{statistics.unassignedFlats}</div>
                  <div className="text-sm text-muted-foreground">Unassigned Flats</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{statistics.multipleStickersCount}</div>
                  <div className="text-sm text-muted-foreground">Multiple Stickers</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs text-primary-foreground font-bold">%</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{statistics.assignmentRate}%</div>
                  <div className="text-sm text-muted-foreground">Assignment Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Matrix display */}
      <Card>
        <CardContent className="p-0">
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
        </CardContent>
      </Card>

      {/* Unassigned Flats Summary */}
      {!isLoading && !hasError && stickerData.unassignedFlats.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Unassigned Flats ({stickerData.unassignedFlats.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stickerData.unassignedFlats.map((flatKey) => {
                const [block, flat] = flatKey.split('-');
                return (
                  <Badge
                    key={flatKey}
                    variant="outline"
                    className="border-orange-200 text-orange-700 bg-orange-50"
                  >
                    Block {block}, Flat {flat}
                  </Badge>
                );
              })}
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              These flats do not have any car stickers assigned. Click on individual cells for more details.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Multiple Stickers Summary */}
      {!isLoading && !hasError && stickerData.multipleStickers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Flats with Multiple Stickers ({stickerData.multipleStickers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
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
                    className="border-blue-200 text-blue-700 bg-blue-50"
                  >
                    Block {block}, Flat {flat} ({stickerCount} stickers)
                  </Badge>
                );
              })}
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              These flats have multiple car stickers assigned. Click on individual cells to view all sticker numbers.
            </div>
          </CardContent>
        </Card>
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

      {/* Legend */}
      {!isLoading && !hasError && stickerData.blocks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-background border border-border rounded"></div>
                <span>Assigned sticker</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted border border-border rounded"></div>
                <span>No sticker assigned</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                <span>Multiple stickers</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Hover over cells to see detailed sticker information. Click cells to view additional details.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export { StickerMatrix };