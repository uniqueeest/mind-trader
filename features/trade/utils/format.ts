import type { Currency } from '../types';
import { MARKET_CONFIG } from '../model/market';

// 통화 포맷팅 유틸리티
export const formatCurrency = (amount: number, currency: Currency): string => {
  const config = currency === 'KRW' ? MARKET_CONFIG.KR : MARKET_CONFIG.US;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'KRW' ? 0 : 2,
    maximumFractionDigits: currency === 'KRW' ? 0 : 2,
  }).format(amount);
};
