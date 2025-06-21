import { tradeApi } from '../api/tradeApi';
import { getCacheKey, getCachedData, setCachedData } from './cache';

export const prefetchTrades = async (market: 'KR' | 'US') => {
  const cacheKey = getCacheKey(market);

  // 이미 캐시되어 있으면 프리페칭 스킵
  if (getCachedData(cacheKey)) return;

  try {
    const data = await tradeApi.getTrades(market);
    setCachedData(cacheKey, data);
  } catch (error) {
    console.error('Failed to prefetch trades:', error);
  }
};
