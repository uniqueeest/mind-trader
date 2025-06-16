import type { Trade } from '@/entities/trade/model/types';
import dayjs from 'dayjs';

export const calculateTotalByCurrency = (
  trades: Trade[],
  currency: 'KRW' | 'USD'
) => {
  return trades
    .filter((trade) => trade.currency === currency)
    .reduce((sum, trade) => {
      const price =
        trade.type === 'BUY' ? trade.buyPrice : trade.sellPrice || 0;
      return sum + price * trade.quantity;
    }, 0);
};

export const calculateProfitByCurrency = (
  trades: Trade[],
  currency: 'KRW' | 'USD'
) => {
  return trades
    .filter((trade) => trade.currency === currency)
    .reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
};

export const isWeekend = (date: Date | string): boolean => {
  const day = dayjs(date).day();
  return day === 0 || day === 6; // 0: 일요일, 6: 토요일
};

export const isTradingDay = (date: Date | string): boolean => {
  const targetDate = dayjs(date);
  const today = dayjs();

  // 미래 날짜 체크
  if (targetDate.isAfter(today, 'day')) {
    return false;
  }

  // 주말 체크
  if (isWeekend(date)) {
    return false;
  }

  return true;
};
