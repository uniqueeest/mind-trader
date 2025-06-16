import { useState, useEffect, useCallback } from 'react';
import type { Trade } from '@/entities/trade/model/types';
import { tradeApi } from '../api/tradeApi';
import { getCacheKey, getCachedData, setCachedData } from '../model/cache';

export function useTradeList(market?: 'KR' | 'US') {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTrades = useCallback(async () => {
    const cacheKey = getCacheKey(market);
    const cachedData = getCachedData(cacheKey);

    if (cachedData) {
      setTrades(cachedData);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await tradeApi.getTrades(market);

      setCachedData(cacheKey, data);
      setTrades(data);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다')
      );
      console.error('매매 기록 조회 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, [market]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  return {
    trades,
    isLoading,
    error,
    setTrades,
    refetch: fetchTrades,
  };
}
