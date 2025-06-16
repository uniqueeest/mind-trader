const CACHE_TIME = 1000 * 60; // 1분
const cache = new Map<string, { data: any; timestamp: number }>();

export const getCacheKey = (market?: 'KR' | 'US') =>
  `/api/trades${market ? `?market=${market}` : ''}`;

export const getCachedData = (cacheKey: string) => {
  const cachedData = cache.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TIME) {
    return cachedData.data;
  }
  return null;
};

export const setCachedData = (cacheKey: string, data: any) => {
  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
};
