import { useState, useEffect } from 'react';
import type { Trade } from '@/entities/trade/model/types';
import { tradeApi } from '../api/tradeApi';

export const useTradeList = (market?: 'KR' | 'US') => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await tradeApi.getTrades(market);
        setTrades(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error('알 수 없는 오류가 발생했습니다')
        );
        console.error('매매 기록 조회 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrades();
  }, [market]);

  return {
    trades,
    isLoading,
    error,
    setTrades,
  };
};
