import { useMemo } from 'react';
import type { Trade } from '@/entities/trade/model/types';
import type { TradeStats, MarketStats } from '../model/types';

export const useTradeStats = (trades: Trade[]): TradeStats => {
  return useMemo(
    () => ({
      totalTrades: trades.length,
      totalValue: trades.reduce((sum, t) => sum + t.buyPrice * t.quantity, 0),
      totalProfit: trades.reduce((sum, t) => {
        if (!t.currentPrice) return sum;
        const profitLoss =
          t.type === 'BUY'
            ? (t.currentPrice - t.buyPrice) * t.quantity
            : (t.buyPrice - t.currentPrice) * t.quantity;
        return sum + profitLoss;
      }, 0),
      recentEmotionTags: [
        ...new Set(trades.flatMap((t) => t.emotionTags).slice(0, 5)),
      ],
    }),
    [trades]
  );
};

export const useMarketStats = (trades: Trade[]): MarketStats => {
  return useMemo(
    () => ({
      totalTrades: trades.length,
      koTrades: trades.filter((t) => t.market === 'KR').length,
      usTrades: trades.filter((t) => t.market === 'US').length,
      totalValueKRW: trades
        .filter((t) => t.currency === 'KRW')
        .reduce((sum, t) => sum + t.buyPrice * t.quantity, 0),
      totalValueUSD: trades
        .filter((t) => t.currency === 'USD')
        .reduce((sum, t) => sum + t.buyPrice * t.quantity, 0),
      recentEmotionTags: [
        ...new Set(trades.flatMap((t) => t.emotionTags).slice(0, 5)),
      ],
    }),
    [trades]
  );
};
