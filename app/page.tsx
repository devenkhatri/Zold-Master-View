"use client";

import { FilterControls } from '@/components/FilterControls';
import { OwnerTable } from '@/components/OwnerTable';
import { ReceiptTable } from '@/components/ReceiptTable';
import { usePropertyData } from '@/hooks/usePropertyData';
import { Building2, Database, Search } from 'lucide-react';

export default function Home() {
  const { 
    filters, 
    filteredData, 
    isLoading, 
    error, 
    updateFilters, 
    resetFilters 
  } = usePropertyData();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Zold Master View For Flats</h1>
              <p className="text-green-100 text-sm">Property Management & Payment Tracking System</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Filter Controls */}
        <FilterControls
          filters={filters}
          onFiltersChange={updateFilters}
          onReset={resetFilters}
          isLoading={isLoading}
        />

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Results Summary */}
        {filters.searchTerm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              <div className="text-sm text-blue-800">
                <span className="font-medium">Search Results:</span> {filteredData.owners.length} owner record(s), {filteredData.receipts.length} payment record(s)
              </div>
            </div>
          </div>
        )}

        {/* Data Tables */}
        <div className="space-y-6 sm:space-y-8">
          {!filters.searchTerm ? (
            <div className="text-center py-12 text-slate-500">
              <p>Enter a search term to see results</p>
            </div>
          ) : (
            <>
              <OwnerTable owners={filteredData.owners} isLoading={isLoading} />
              <ReceiptTable receipts={filteredData.receipts} isLoading={isLoading} />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 sm:mt-12 text-center text-sm text-slate-500">
          <p>Property Management System • Built with Next.js & Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
}