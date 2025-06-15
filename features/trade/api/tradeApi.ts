import type { Trade } from '@/entities/trade/model/types';
import type { TradeFormData } from '../model/types';

export const tradeApi = {
  // 매매 기록 목록 조회
  async getTrades(market?: string): Promise<Trade[]> {
    const response = await fetch('/api/trades');
    if (!response.ok) {
      throw new Error('매매 기록 조회 실패');
    }
    const data = await response.json();
    const trades = data.trades || [];

    // market이 지정된 경우 필터링
    return market
      ? trades.filter((trade: Trade) => trade.market === market)
      : trades;
  },

  // 새 매매 기록 등록
  async createTrade(formData: TradeFormData): Promise<Trade> {
    const response = await fetch('/api/trades', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...formData,
        buyPrice: parseFloat(formData.buyPrice || '0'),
        sellPrice: parseFloat(formData.sellPrice || '0'),
        quantity: parseInt(formData.quantity),
      }),
    });

    if (!response.ok) {
      throw new Error('매매 기록 저장 실패');
    }

    const data = await response.json();
    return data.trade;
  },
};
