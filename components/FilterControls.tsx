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


  const [localSearchTerm, setLocalSearchTerm] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value);
  };

  const handleSearch = () => {
    onFiltersChange({ searchTerm: localSearchTerm });
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
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Search</h2>
      </div>
      
      <div className="mb-4">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex">
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-l-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search owners and payments..."
              value={localSearchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Search className="h-4 w-4 mr-1" />
              Search
            </button>
            {filters.searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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