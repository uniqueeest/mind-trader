import type { Currency, Market } from '@/entities/trade/model/types';

export type BaseEntity = {
  id: string;
  createdAt: string;
  updatedAt: string;
};

// 시장별 설정 타입
export type MarketConfig = {
  label: string;
  currency: Currency;
  symbol: string;
  locale: string;
  examples: string[];
  priceStep: number;
  minPrice: number;
};

export type MarketConfigs = {
  [K in Market]: MarketConfig;
};
