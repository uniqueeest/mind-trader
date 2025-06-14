import { BaseEntity, TradeType } from '../../../shared/types';

// 매매 기록 엔티티
export interface Trade extends BaseEntity {
  symbol: string; // 종목명
  type: TradeType; // 매수/매도 구분
  date: string; // 매매 날짜 (YYYY-MM-DD)
  buyPrice: number; // 매수가
  sellPrice?: number; // 매도가
  quantity: number; // 수량
  thoughts: string; // 매매 당시 생각 (저널링)
  emotionTags: string[]; // AI 분석 감성 태그
  marketData?: MarketData; // 해당일 시장 데이터
}

// 시장 데이터 타입
export interface MarketData {
  kospi: number; // 코스피 종가
  nasdaq: number; // 나스닥 종가
  kospiChange: number; // 코스피 등락률
  nasdaqChange: number; // 나스닥 등락률
}

// 매매 기록 입력 폼 타입
export interface TradeFormData {
  symbol: string;
  type: TradeType;
  date: string;
  buyPrice?: string;
  sellPrice?: string;
  quantity: string;
  thoughts: string;
}
