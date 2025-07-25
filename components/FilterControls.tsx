"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Search } from 'lucide-react';
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


  const [localSearchTerm, setLocalSearchTerm] = useState(filters.searchTerm || '');

  // Sync local state with filters prop
  useEffect(() => {
    setLocalSearchTerm(filters.searchTerm || '');
  }, [filters.searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value);
  };

  const handleSearch = () => {
    if (localSearchTerm.trim()) {
      onFiltersChange({ searchTerm: localSearchTerm.trim() });
    } else {
      onFiltersChange({ searchTerm: '' });
    }
  };

  const handleClearSearch = () => {
    setLocalSearchTerm('');
    onFiltersChange({ searchTerm: '' });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };


  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Search Records</h3>
      </div>
      
      <div className="mb-4">
        <div className="space-y-3 w-full">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search by flat, name, mobile, carno, stickerno, receiptno..."
              value={localSearchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Search className="h-4 w-4 mr-1" />
              Search
            </button>
            {filters.searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="sr-only">Clear search</span>
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">        
        {filters.searchTerm && (
          <div className="flex items-center h-10 px-3 py-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
            Search Active
          </div>
        )}
      </div>
    </div>
  );
};