"use client";

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw, Filter } from 'lucide-react';
import { FilterOptions } from '@/types/property';

interface FilterControlsProps {
  filters: FilterOptions;
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
  onReset: () => void;
  isLoading: boolean;
}

export const FilterControls = ({ 
  filters, 
  onFiltersChange, 
  onReset, 
  isLoading 
}: FilterControlsProps) => {
  const [flatOptions, setFlatOptions] = useState<string[]>([]);
  const [blockOptions, setBlockOptions] = useState<string[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Load block options on component mount
  useEffect(() => {
    let isMounted = true;
    const loadBlockOptions = async () => {
      try {
        setIsLoadingOptions(true);
        const response = await fetch('/api/sheets');
        if (!response.ok) throw new Error('Failed to load options');
        const { data } = await response.json();
        if (isMounted && data?.blockOptions) {
          setBlockOptions(data.blockOptions);
        }
      } catch (error) {
        console.error('Error loading block options:', error);
      } finally {
        if (isMounted) setIsLoadingOptions(false);
      }
    };
    
    loadBlockOptions();
    return () => { isMounted = false; };
  }, []);

  // Load flat options when block number changes
  useEffect(() => {
    let isMounted = true;
    const loadFlatOptions = async () => {
      if (!filters.blockNumber) {
        setFlatOptions([]);
        return;
      }
      
      try {
        setIsLoadingOptions(true);
        const response = await fetch('/api/sheets');
        if (!response.ok) throw new Error('Failed to load options');
        const { data } = await response.json();
        
        if (isMounted && data?.getFlatOptions) {
          const options = await data.getFlatOptions(filters.blockNumber);
          setFlatOptions(options || []);
        }
      } catch (error) {
        console.error('Error loading flat options:', error);
      } finally {
        if (isMounted) setIsLoadingOptions(false);
      }
    };
    
    loadFlatOptions();
    return () => { isMounted = false; };
  }, [filters.blockNumber]);

  const handleBlockChange = (value: string) => {
    onFiltersChange({ 
      blockNumber: value,
      flatNumber: '' // Reset flat number when block changes
    });
  };

  const handleFlatChange = (value: string) => {
    onFiltersChange({ flatNumber: value });
  };



  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-800">Filter Controls</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Enter Block Number:
          </label>
          <Select 
            value={filters.blockNumber} 
            onValueChange={handleBlockChange}
            disabled={isLoading || isLoadingOptions}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Block" />
            </SelectTrigger>
            <SelectContent>
              {blockOptions.map((block) => (
                <SelectItem key={block} value={block}>
                  Block {block}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Enter Flat Number:
          </label>
          <Select 
            value={filters.flatNumber} 
            onValueChange={handleFlatChange}
            disabled={!filters.blockNumber || isLoading || isLoadingOptions}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Flat" />
            </SelectTrigger>
            <SelectContent>
              {flatOptions.map((flat) => (
                <SelectItem key={flat} value={flat}>
                  Flat {flat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
          <label className="text-sm font-medium text-slate-700 opacity-0">
            Actions
          </label>
          <Button 
            variant="outline" 
            onClick={onReset}
            disabled={isLoading}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Reset Filters
          </Button>
        </div>

        {(filters.blockNumber || filters.flatNumber) && (
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <label className="text-sm font-medium text-slate-700 opacity-0">
              Status
            </label>
            <div className="flex items-center h-10 px-3 py-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
              Filters Active
            </div>
          </div>
        )}
      </div>
    </div>
  );
};