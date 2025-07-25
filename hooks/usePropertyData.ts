"use client";

import { useState, useEffect, useMemo } from 'react';
import { Owner, Receipt, FilterOptions } from '@/types/property';

export const usePropertyData = () => {
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
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
    const searchTerm = (filters.searchTerm || '').toLowerCase().trim();
    
    // Return empty arrays if no search term is provided
    if (!searchTerm) {
      return { owners: [], receipts: [] };
    }
    
    const filteredOwners = owners.filter(owner => 
      Object.values(owner).some(value => 
        String(value).toLowerCase().includes(searchTerm)
      )
    );

    const filteredReceipts = receipts.filter(receipt => 
      Object.values(receipt).some(value => 
        String(value).toLowerCase().includes(searchTerm)
      )
    );

    return { owners: filteredOwners, receipts: filteredReceipts };
  }, [filters, owners, receipts]);

  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    setIsLoading(true);
    setError(null);
    
    // Update filters immediately
    setFilters(prev => {
      const updatedFilters = { ...prev, ...newFilters };
      return updatedFilters;
    });
    
    // Simulate API delay
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  const resetFilters = () => {
    setFilters({ searchTerm: '' });
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