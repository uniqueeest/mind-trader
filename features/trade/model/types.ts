import type { Trade } from '@/entities/trade/model/types';

// 통계 관련 타입
export type TradeStats = {
  totalTrades: number;
  totalValue: number;
  totalProfit: number;
  recentEmotionTags: string[];
};

export type MarketStats = {
  totalTrades: number;
  koTrades: number;
  usTrades: number;
  totalValueKRW: number;
  totalValueUSD: number;
  recentEmotionTags: string[];
};

export type TradeFormData = {
  symbol: string;
  type: 'BUY' | 'SELL';
  date: string;
  buyPrice?: string;
  sellPrice?: string;
  quantity: string;
  thoughts: string;
  market: Trade['market'];
  currency: Trade['currency'];
};
