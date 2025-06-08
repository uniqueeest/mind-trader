// 공통 타입 정의
export type TradeType = 'BUY' | 'SELL';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}
