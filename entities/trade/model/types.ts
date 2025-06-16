// 거래 관련 타입 정의
export type TradeType = 'BUY' | 'SELL';
export type Currency = 'KRW' | 'USD';
export type Market = 'KR' | 'US';

// 매매 기록 엔티티
export type Trade = {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  date: string;
  buyPrice: number;
  sellPrice?: number;
  quantity: number;
  thoughts: string;
  market: Market;
  currency: Currency;
  emotionTags: string[];
  profitLoss: number | null;
  currentPrice?: number;
  profitRate: number | null;
};

// 시장 데이터 타입
export type MarketData = {
  kospi: number; // 코스피 종가
  nasdaq: number; // 나스닥 종가
  kospiChange: number; // 코스피 등락률
  nasdaqChange: number; // 나스닥 등락률
};

// API 모델 타입
export type TradeModel = {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  date: string;
  buyPrice: number;
  sellPrice?: number;
  quantity: number;
  thoughts: string;
  market: Market;
  currency: Currency;
  currentPrice?: number;
  emotionTags: string[];
};
