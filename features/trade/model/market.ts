import type { Currency, Market } from '../types';

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

// 시장별 설정 (비즈니스 로직)
export const MARKET_CONFIG: MarketConfigs = {
  KR: {
    label: '한국',
    currency: 'KRW',
    symbol: '₩',
    locale: 'ko-KR',
    examples: ['삼성전자', '카카오', 'LG에너지솔루션'],
    priceStep: 1,
    minPrice: 1,
  },
  US: {
    label: '미국',
    currency: 'USD',
    symbol: '$',
    locale: 'en-US',
    examples: ['AAPL', 'TSLA', 'SPY', 'QQQ', 'VTI'],
    priceStep: 0.01,
    minPrice: 0.01,
  },
} as const;

// 시장별 검증 로직 (비즈니스 규칙)
export const validateSymbol = (symbol: string, market: Market): boolean => {
  if (market === 'KR') {
    return /^[가-힣a-zA-Z0-9\s]+$/.test(symbol);
  } else {
    return /^[A-Z]{1,5}$/.test(symbol);
  }
};

export const validatePrice = (price: number, currency: Currency): boolean => {
  const config = currency === 'KRW' ? MARKET_CONFIG.KR : MARKET_CONFIG.US;
  return price >= config.minPrice && price % config.priceStep === 0;
};
