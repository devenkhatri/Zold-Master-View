"use client";

import { useState, useEffect, useCallback } from 'react';
import { Owner, Receipt } from '@/types/property';

interface AmcApiResponse {
  success: boolean;
  data: {
    receipts: Receipt[];
    owners: Owner[];
    availableYears: number[];
    summary: {
      totalReceipts: number;
      totalOwners: number;
      totalPayments: number;
      uniqueBlocks: number;
      uniqueFlats: number;
      availableYears: number;
    };
  };
  _meta: {
    receivedAt: string;
    fromCache: boolean;
    cacheTimestamp: string | null;
    validationErrors?: string[];
  };
  error?: string;
  code?: string;
}

interface UseAmcDataReturn {
  owners: Owner[];
  receipts: Receipt[];
  availableYears: number[];
  summary: AmcApiResponse['data']['summary'] | null;
  isLoading: boolean;
  hasError: boolean;
  error: string | null;
  fromCache: boolean;
  lastUpdated: string | null;
  validationErrors: string[];
  refetch: (forceRefresh?: boolean) => Promise<void>;
  clearCache: () => Promise<void>;
}

export const useAmcData = (): UseAmcDataReturn => {
  const [data, setData] = useState<AmcApiResponse['data'] | null>(null);
  const [meta, setMeta] = useState<AmcApiResponse['_meta'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAmcData = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true);
      setHasError(false);
      setError(null);

      const url = new URL('/api/amc-data', window.location.origin);
      if (forceRefresh) {
        url.searchParams.set('refresh', 'true');
      }

      console.log('Fetching AMC data...', { forceRefresh });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result: AmcApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      setData(result.data);
      setMeta(result._meta);
      
      console.log('AMC data fetched successfully', {
        receipts: result.data.receipts.length,
        owners: result.data.owners.length,
        fromCache: result._meta.fromCache,
        validationErrors: result._meta.validationErrors?.length || 0
      });

    } catch (err) {
      console.error('Error fetching AMC data:', err);
      setHasError(true);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setData(null);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      console.log('Clearing AMC data cache...');
      
      const response = await fetch('/api/amc-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clearCache' }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to clear cache');
      }

      console.log('AMC data cache cleared successfully');
      
      // Refetch data after clearing cache
      await fetchAmcData(true);

    } catch (err) {
      console.error('Error clearing AMC data cache:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
    }
  }, [fetchAmcData]);

  // Initial data fetch
  useEffect(() => {
    fetchAmcData();
  }, [fetchAmcData]);

  // Auto-refresh every 5 minutes if the page is visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && data && meta) {
        const cacheAge = Date.now() - new Date(meta.receivedAt).getTime();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (cacheAge > fiveMinutes) {
          console.log('Auto-refreshing AMC data due to cache age');
          fetchAmcData();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [data, meta, fetchAmcData]);

  return {
    owners: data?.owners || [],
    receipts: data?.receipts || [],
    availableYears: data?.availableYears || [],
    summary: data?.summary || null,
    isLoading,
    hasError,
    error,
    fromCache: meta?.fromCache || false,
    lastUpdated: meta?.receivedAt || null,
    validationErrors: meta?.validationErrors || [],
    refetch: fetchAmcData,
    clearCache,
  };
};