// 공통 타입 정의
export type TradeType = 'BUY' | 'SELL';
export type Currency = 'KRW' | 'USD';
export type Market = 'KR' | 'US';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// 시장별 설정
export const MARKET_CONFIG = {
  KR: {
    label: '한국',
    currency: 'KRW' as Currency,
    symbol: '₩',
    locale: 'ko-KR',
    examples: ['삼성전자', '카카오', 'LG에너지솔루션'],
    priceStep: 1,
    minPrice: 1,
  },
  US: {
    label: '미국',
    currency: 'USD' as Currency,
    symbol: '$',
    locale: 'en-US',
    examples: ['AAPL', 'TSLA', 'NVDA', 'MSFT'],
    priceStep: 0.01,
    minPrice: 0.01,
  },
} as const;

// 통화별 포맷팅 유틸리티
export const formatCurrency = (amount: number, currency: Currency): string => {
  const config = currency === 'KRW' ? MARKET_CONFIG.KR : MARKET_CONFIG.US;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'KRW' ? 0 : 2,
    maximumFractionDigits: currency === 'KRW' ? 0 : 2,
  }).format(amount);
};

// 시장별 종목명 검증
export const validateSymbol = (symbol: string, market: Market): boolean => {
  if (market === 'KR') {
    // 한국: 한글 또는 영문 허용
    return /^[가-힣a-zA-Z0-9\s]+$/.test(symbol);
  } else {
    // 미국: 영문 티커 형식 (대문자 알파벳)
    return /^[A-Z]{1,5}$/.test(symbol);
  }
};

// 가격 검증
export const validatePrice = (price: number, currency: Currency): boolean => {
  const config = currency === 'KRW' ? MARKET_CONFIG.KR : MARKET_CONFIG.US;
  return price >= config.minPrice && price % config.priceStep === 0;
};
