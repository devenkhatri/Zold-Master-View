"use client";

import { useState, useEffect, useMemo } from 'react';
import { Owner, Receipt, FilterOptions } from '@/types/property';

export const usePropertyData = () => {
  const [filters, setFilters] = useState<FilterOptions>({
    blockNumber: '',
    flatNumber: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [owners, setOwners] = useState<Owner[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    fetch('/api/sheets')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(({ data }) => {
        if (isMounted && data) {
          setOwners(data.owners || []);
          setReceipts(data.receipts || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError('Failed to load data');
          setIsLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, []);

  const filteredData = useMemo(() => {
    const filteredOwners = owners.filter(owner => {
      const blockMatch = !filters.blockNumber || owner.blockNumber === filters.blockNumber;
      const flatMatch = !filters.flatNumber || owner.flatNumber === filters.flatNumber;
      return blockMatch && flatMatch;
    });

    const filteredReceipts = receipts.filter(receipt => {
      const blockMatch = !filters.blockNumber || receipt.blockNumber === filters.blockNumber;
      const flatMatch = !filters.flatNumber || receipt.flatNumber === filters.flatNumber;
      return blockMatch && flatMatch;
    });

    return { owners: filteredOwners, receipts: filteredReceipts };
  }, [filters, owners, receipts]);

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