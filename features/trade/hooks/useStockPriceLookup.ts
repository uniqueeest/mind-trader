import { useState, useCallback, useRef } from 'react';

// 타입 정의
type StockPriceLookupParams = {
  symbol: string;
  market: string;
  date?: string;
};

type StockPriceLookupResult = {
  price: number;
};

type UseStockPriceLookupReturn = {
  currentPrice: number | null;
  priceLoading: boolean;
  priceError: string | null;
  fetchPrice: (params: StockPriceLookupParams) => Promise<void>;
  clearCache: () => void;
};

// 캐시 관리 클래스
class PriceCache {
  private static instance: PriceCache;
  private cache: Map<string, { price: number; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5분

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): PriceCache {
    if (!PriceCache.instance) {
      PriceCache.instance = new PriceCache();
    }
    return PriceCache.instance;
  }

  set(key: string, price: number): void {
    this.cache.set(key, { price, timestamp: Date.now() });
  }

  get(key: string): number | null {
    const data = this.cache.get(key);
    if (!data) return null;

    // TTL 체크
    if (Date.now() - data.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return data.price;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const useStockPriceLookup = (): UseStockPriceLookupReturn => {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState<boolean>(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const lastQueryParamsRef = useRef<StockPriceLookupParams | null>(null);
  const priceCache = PriceCache.getInstance();

  const fetchPrice = useCallback(
    async ({ symbol, market, date }: StockPriceLookupParams): Promise<void> => {
      const trimmedSymbol = symbol.trim();
      if (!trimmedSymbol) {
        return;
      }

      const cacheKey = `${trimmedSymbol}-${market}-${date || 'current'}`;

      // 이전 요청과 동일하고 캐시된 데이터가 있다면 반환
      if (
        lastQueryParamsRef.current &&
        lastQueryParamsRef.current.symbol === trimmedSymbol &&
        lastQueryParamsRef.current.market === market &&
        lastQueryParamsRef.current.date === date
      ) {
        const cachedPrice = priceCache.get(cacheKey);
        if (cachedPrice !== null) {
          console.log(`📋 캐시된 데이터 사용: ${trimmedSymbol}`);
          setCurrentPrice(cachedPrice);
          setPriceError(null);
          return;
        }
      }

      setPriceLoading(true);
      setPriceError(null);

      try {
        const response = await fetch('/api/stock-price', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            symbol: trimmedSymbol,
            market,
            date,
          }),
        });

        if (!response.ok) {
          throw new Error('종가 조회에 실패했습니다.');
        }

        const data: StockPriceLookupResult = await response.json();

        if (data.price) {
          setCurrentPrice(data.price);
          priceCache.set(cacheKey, data.price);
          lastQueryParamsRef.current = { symbol: trimmedSymbol, market, date };
          setPriceError(null);
        } else {
          setPriceError('종가 정보를 찾을 수 없습니다.');
        }
      } catch (error) {
        console.error('종가 조회 오류:', error);
        setPriceError('종가 조회 중 오류가 발생했습니다.');
      } finally {
        setPriceLoading(false);
      }
    },
    []
  );

  const clearCache = useCallback(() => {
    priceCache.clear();
    setCurrentPrice(null);
    lastQueryParamsRef.current = null;
  }, []);

  return { currentPrice, priceLoading, priceError, fetchPrice, clearCache };
};
