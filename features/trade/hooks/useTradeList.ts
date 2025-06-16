import { useState, useEffect, useCallback } from 'react';
import type { Trade } from '@/entities/trade/model/types';
import { tradeApi } from '../api/tradeApi';

const CACHE_TIME = 1000 * 60; // 1분
const cache = new Map<string, { data: any; timestamp: number }>();

export function useTradeList(market?: 'KR' | 'US') {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTrades = useCallback(async () => {
    const cacheKey = `/api/trades${market ? `?market=${market}` : ''}`;
    const cachedData = cache.get(cacheKey);

    // 캐시가 있고 1분이 지나지 않았다면 캐시된 데이터 사용
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TIME) {
      setTrades(cachedData.data);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await tradeApi.getTrades(market);

      // 캐시 업데이트
      cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

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
