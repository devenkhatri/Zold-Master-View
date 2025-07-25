"use client";

import { useState, useEffect, useMemo } from 'react';
import { Owner, Receipt, FilterOptions } from '@/types/property';
import { mockOwners, mockReceipts } from '@/data/mockData';

export const usePropertyData = () => {
  const [filters, setFilters] = useState<FilterOptions>({
    blockNumber: '',
    flatNumber: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    const filteredOwners = mockOwners.filter(owner => {
      const blockMatch = !filters.blockNumber || owner.blockNumber === filters.blockNumber;
      const flatMatch = !filters.flatNumber || owner.flatNumber === filters.flatNumber;
      return blockMatch && flatMatch;
    });

    const filteredReceipts = mockReceipts.filter(receipt => {
      const blockMatch = !filters.blockNumber || receipt.blockNumber === filters.blockNumber;
      const flatMatch = !filters.flatNumber || receipt.flatNumber === filters.flatNumber;
      return blockMatch && flatMatch;
    });

    return { owners: filteredOwners, receipts: filteredReceipts };
  }, [filters]);

  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    setIsLoading(true);
    setError(null);
    
    // Simulate API delay
    setTimeout(() => {
      setFilters(prev => ({ ...prev, ...newFilters }));
      setIsLoading(false);
    }, 300);
  };

  const resetFilters = () => {
    setFilters({ blockNumber: '', flatNumber: '' });
  };

  return {
    filters,
    filteredData,
    isLoading,
    error,
    updateFilters,
    resetFilters,
  };
};