import { useState } from 'react';
import type { Trade } from '@/entities/trade/model/types';
import type { TradeFormData } from '../model/types';
import { tradeApi } from '../api/tradeApi';

export const useTradeSubmit = (market: Trade['market']) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submitTrade = async (formData: TradeFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const trade = await tradeApi.createTrade({
        ...formData,
        market,
        currency: market === 'KR' ? 'KRW' : 'USD',
      });

      return trade;
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error('알 수 없는 오류가 발생했습니다');
      setError(error);
      console.error('매매 기록 저장 실패:', err);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    error,
    submitTrade,
  };
};
