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
  loadingStage: 'fetching' | 'processing' | 'complete';
  retryCount: number;
  canRetry: boolean;
  refetch: (forceRefresh?: boolean) => Promise<void>;
  clearCache: () => Promise<void>;
  retry: () => Promise<void>;
}

export const useAmcData = (): UseAmcDataReturn => {
  const [data, setData] = useState<AmcApiResponse['data'] | null>(null);
  const [meta, setMeta] = useState<AmcApiResponse['_meta'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<'fetching' | 'processing' | 'complete'>('fetching');
  const [retryCount, setRetryCount] = useState(0);

  const fetchAmcData = useCallback(async (forceRefresh: boolean = false, isRetry: boolean = false) => {
    try {
      setIsLoading(true);
      setHasError(false);
      setError(null);
      setLoadingStage('fetching');

      if (isRetry) {
        setRetryCount(prev => prev + 1);
      } else {
        setRetryCount(0);
      }

      const url = new URL('/api/amc-data', window.location.origin);
      if (forceRefresh) {
        url.searchParams.set('refresh', 'true');
      }

      console.log('Fetching AMC data...', { forceRefresh, isRetry, retryCount });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout for better error handling
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      setLoadingStage('processing');

      const result: AmcApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'API returned unsuccessful response');
      }

      setLoadingStage('complete');
      setData(result.data);
      setMeta(result._meta);
      
      console.log('AMC data fetched successfully', {
        receipts: result.data.receipts.length,
        owners: result.data.owners.length,
        fromCache: result._meta.fromCache,
        validationErrors: result._meta.validationErrors?.length || 0,
        retryCount
      });

    } catch (err) {
      console.error('Error fetching AMC data:', err);
      setHasError(true);
      
      // Enhanced error message based on error type
      let errorMessage = 'Unknown error occurred';
      if (err instanceof Error) {
        if (err.name === 'AbortError' || err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (err.message.includes('quota') || err.message.includes('rate limit')) {
          errorMessage = 'API rate limit exceeded. Please wait a few minutes and try again.';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setData(null);
      setMeta(null);
    } finally {
      setIsLoading(false);
      setLoadingStage('complete');
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

  const retry = useCallback(async () => {
    if (retryCount < 3) { // Max 3 retries
      await fetchAmcData(false, true);
    }
  }, [fetchAmcData, retryCount]);

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
    loadingStage,
    retryCount,
    canRetry: retryCount < 3 && hasError,
    refetch: fetchAmcData,
    clearCache,
    retry,
  };
};