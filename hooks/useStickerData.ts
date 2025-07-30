"use client";

import { useState, useEffect, useCallback } from 'react';
import { Owner } from '@/types/property';

interface StickerStatistics {
  totalFlats: number;
  assignedFlats: number;
  unassignedFlats: number;
  multipleStickers: number;
  totalStickers: number;
  uniqueBlocks: number;
  stickersByBlock: Record<string, number>;
  assignmentsByBlock: Record<string, { assigned: number; total: number }>;
}

interface StickerApiResponse {
  success: boolean;
  data: {
    owners: Owner[];
    statistics: StickerStatistics;
    summary: {
      totalOwners: number;
      totalFlats: number;
      assignedFlats: number;
      unassignedFlats: number;
      totalStickers: number;
      uniqueBlocks: number;
      assignmentRate: number;
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

interface UseStickerDataReturn {
  owners: Owner[];
  statistics: StickerStatistics | null;
  summary: StickerApiResponse['data']['summary'] | null;
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

export const useStickerData = (): UseStickerDataReturn => {
  const [data, setData] = useState<StickerApiResponse['data'] | null>(null);
  const [meta, setMeta] = useState<StickerApiResponse['_meta'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<'fetching' | 'processing' | 'complete'>('fetching');
  const [retryCount, setRetryCount] = useState(0);

  const fetchStickerData = useCallback(async (forceRefresh: boolean = false, isRetry: boolean = false) => {
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

      const url = new URL('/api/sticker-data', window.location.origin);
      if (forceRefresh) {
        url.searchParams.set('refresh', 'true');
      }

      console.log('Fetching sticker data...', { forceRefresh, isRetry, retryCount });

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

      const result: StickerApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'API returned unsuccessful response');
      }

      setLoadingStage('complete');
      setData(result.data);
      setMeta(result._meta);
      
      console.log('Sticker data fetched successfully', {
        owners: result.data.owners.length,
        totalFlats: result.data.summary.totalFlats,
        assignedFlats: result.data.summary.assignedFlats,
        fromCache: result._meta.fromCache,
        validationErrors: result._meta.validationErrors?.length || 0,
        retryCount
      });

    } catch (err) {
      console.error('Error fetching sticker data:', err);
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
      console.log('Clearing sticker data cache...');
      
      const response = await fetch('/api/sticker-data', {
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

      console.log('Sticker data cache cleared successfully');
      
      // Refetch data after clearing cache
      await fetchStickerData(true);

    } catch (err) {
      console.error('Error clearing sticker data cache:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
    }
  }, [fetchStickerData]);

  const retry = useCallback(async () => {
    if (retryCount < 3) { // Max 3 retries
      await fetchStickerData(false, true);
    }
  }, [fetchStickerData, retryCount]);

  // Initial data fetch
  useEffect(() => {
    fetchStickerData();
  }, [fetchStickerData]);

  // Auto-refresh every 5 minutes if the page is visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && data && meta) {
        const cacheAge = Date.now() - new Date(meta.receivedAt).getTime();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (cacheAge > fiveMinutes) {
          console.log('Auto-refreshing sticker data due to cache age');
          fetchStickerData();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [data, meta, fetchStickerData]);

  return {
    owners: data?.owners || [],
    statistics: data?.statistics || null,
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
    refetch: fetchStickerData,
    clearCache,
    retry,
  };
};