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
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className={`block w-full pl-10 pr-12 py-3 border ${
                filters.searchTerm ? 'border-blue-300' : 'border-gray-300'
              } rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200`}
              placeholder="Search by flat, name, mobile, carno, stickerno, receiptno..."
              value={localSearchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              aria-label="Search for property records"
            />
            {localSearchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Clear search"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleSearch}
              disabled={isLoading || !localSearchTerm.trim()}
              className={`inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white ${
                isLoading || !localSearchTerm.trim()
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-1.5" />
                  Search
                </>
              )}
            </button>
            {filters.searchTerm && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Reset All
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