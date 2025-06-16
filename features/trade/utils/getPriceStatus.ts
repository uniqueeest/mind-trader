import { TradeFormData } from '../model/types';

export const getPriceStatus = (
  formData: TradeFormData,
  priceLoading: boolean,
  lastQueriedSymbol: string
) => {
  const { date, symbol, market } = formData;

  const isDateToday = date === new Date().toISOString().split('T')[0];
  const currentQuery = `${symbol.trim()}-${market}-${date || 'current'}`;

  if (priceLoading) {
    return '조회중';
  }

  if (isDateToday) {
    return '현재가 조회';
  }

  if (lastQueriedSymbol === currentQuery) {
    return '조회완료';
  }

  return '종가 조회';
};
