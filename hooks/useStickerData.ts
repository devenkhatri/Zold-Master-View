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
  refetch: (forceRefresh?: boolean) => Promise<void>;
  clearCache: () => Promise<void>;
}

export const useStickerData = (): UseStickerDataReturn => {
  const [data, setData] = useState<StickerApiResponse['data'] | null>(null);
  const [meta, setMeta] = useState<StickerApiResponse['_meta'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStickerData = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true);
      setHasError(false);
      setError(null);

      const url = new URL('/api/sticker-data', window.location.origin);
      if (forceRefresh) {
        url.searchParams.set('refresh', 'true');
      }

      console.log('Fetching sticker data...', { forceRefresh });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result: StickerApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      setData(result.data);
      setMeta(result._meta);
      
      console.log('Sticker data fetched successfully', {
        owners: result.data.owners.length,
        totalFlats: result.data.summary.totalFlats,
        assignedFlats: result.data.summary.assignedFlats,
        fromCache: result._meta.fromCache,
        validationErrors: result._meta.validationErrors?.length || 0
      });

    } catch (err) {
      console.error('Error fetching sticker data:', err);
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
    refetch: fetchStickerData,
    clearCache,
  };
};