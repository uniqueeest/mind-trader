// 거래 관련 타입 정의
export type TradeType = 'BUY' | 'SELL';
export type Currency = 'KRW' | 'USD';
export type Market = 'KR' | 'US';

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
