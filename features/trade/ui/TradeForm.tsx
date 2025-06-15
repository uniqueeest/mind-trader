'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MARKET_CONFIG } from '@/features/trade/model/market';
import type { Market, Currency } from '@/features/trade/types';

interface TradeFormData {
  symbol: string;
  type: 'BUY' | 'SELL';
  date: string;
  buyPrice?: string;
  sellPrice?: string;
  quantity: string;
  thoughts: string;
  market: 'KR' | 'US';
  currency: 'KRW' | 'USD';
}

interface TradeFormProps {
  onSubmit: (data: TradeFormData) => Promise<void>;
  isLoading?: boolean;
  market: Market; // 고정된 시장 값
  currency: Currency; // 고정된 통화 값
}

export function TradeForm({
  onSubmit,
  isLoading = false,
  market,
  currency,
}: TradeFormProps) {
  const [formData, setFormData] = useState<TradeFormData>({
    symbol: '',
    type: 'BUY',
    date: new Date().toISOString().split('T')[0],
    buyPrice: '',
    sellPrice: '',
    quantity: '',
    thoughts: '',
    market: market,
    currency: currency,
  });

  // 실시간 종가 조회 상태
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [lastQueriedSymbol, setLastQueriedSymbol] = useState<string>(''); // 마지막 조회한 티커+날짜

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      // 성공 시 폼 리셋
      setFormData({
        symbol: '',
        type: 'BUY',
        date: new Date().toISOString().split('T')[0],
        buyPrice: '',
        sellPrice: '',
        quantity: '',
        thoughts: '',
        market: market,
        currency: currency,
      });
      // 가격 상태도 리셋
      setCurrentPrice(null);
      setPriceError(null);
      setLastQueriedSymbol('');
    } catch (error) {
      console.error('매매 기록 저장 실패:', error);
    }
  };

  const handleChange =
    (field: keyof TradeFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));

      // 종목명 또는 날짜 변경 시 캐시 초기화
      if (field === 'symbol' || field === 'date') {
        setCurrentPrice(null);
        setPriceError(null);
        setLastQueriedSymbol('');
      }
    };

  const handleSelectChange = (value: 'BUY' | 'SELL') => {
    setFormData((prev) => ({
      ...prev,
      type: value,
    }));
  };

  // 종가 조회 함수 (날짜 포함)
  const fetchCurrentPrice = useCallback(async () => {
    const symbol = formData.symbol.trim();
    const market = formData.market;
    const date = formData.date;

    if (!symbol) return;

    // 캐시 키 생성 (종목+시장+날짜)
    const cacheKey = `${symbol}-${market}-${date || 'current'}`;
    if (lastQueriedSymbol === cacheKey && currentPrice) {
      console.log(`📋 캐시된 데이터 사용: ${symbol}`);
      return;
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
          symbol,
          market,
          date, // 날짜 전달
        }),
      });

      if (!response.ok) {
        throw new Error('종가 조회에 실패했습니다');
      }

      const data = await response.json();

      if (data.price) {
        setCurrentPrice(data.price);
        setLastQueriedSymbol(cacheKey); // 캐시 키 저장
        setPriceError(null);

        // 자동으로 가격 필드에 조회된 종가 입력 (선택사항)
        if (formData.type === 'BUY' && !formData.buyPrice) {
          setFormData((prev) => ({
            ...prev,
            buyPrice: data.price.toString(),
          }));
        }
      } else {
        setPriceError('종가 정보를 찾을 수 없습니다');
      }
    } catch (error) {
      console.error('종가 조회 오류:', error);
      setPriceError('종가 조회 중 오류가 발생했습니다');
    } finally {
      setPriceLoading(false);
    }
  }, [
    formData.symbol,
    formData.market,
    formData.date,
    formData.type,
    formData.buyPrice,
    lastQueriedSymbol,
    currentPrice,
  ]);

  const currentMarketConfig = MARKET_CONFIG[formData.market];
  const isDateToday = formData.date === new Date().toISOString().split('T')[0];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>새 매매 기록 등록</CardTitle>
        <CardDescription>
          매매 기록과 함께 그 순간의 생각을 기록해보세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 시장 정보 표시 (선택 불가) */}
          <div className="space-y-2">
            <Label>거래 시장</Label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
              <span className="text-lg">
                {formData.market === 'KR' ? '🇰🇷' : '🇺🇸'}
              </span>
              <span className="font-medium">
                {formData.market === 'KR' ? '한국 시장' : '미국 시장'}
              </span>
              <span className="text-sm text-gray-500">
                ({formData.currency})
              </span>
            </div>
          </div>

          {/* 매매 날짜 (최상단으로 이동) */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-base font-semibold">
              📅 매매 날짜
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={handleChange('date')}
              max={new Date().toISOString().split('T')[0]}
              required
              className="text-base"
            />
            <p className="text-xs text-gray-500">
              {isDateToday
                ? '오늘 날짜로 설정되었습니다 (현재가 조회)'
                : '선택한 날짜의 종가를 조회할 수 있습니다 (미래 날짜는 선택할 수 없습니다)'}
            </p>
          </div>

          {/* 종목명 */}
          <div className="space-y-2">
            <Label htmlFor="symbol">종목명</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="symbol"
                  placeholder={`예: ${currentMarketConfig.examples.join(', ')}`}
                  value={formData.symbol}
                  onChange={handleChange('symbol')}
                  required
                  className={currentPrice ? 'border-green-300' : ''}
                />
                {priceLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              {formData.type === 'BUY' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fetchCurrentPrice}
                  disabled={
                    !formData.symbol.trim() ||
                    priceLoading ||
                    lastQueriedSymbol ===
                      `${formData.symbol.trim()}-${formData.market}-${
                        formData.date || 'current'
                      }`
                  }
                  className="px-3"
                >
                  {priceLoading
                    ? '조회중'
                    : lastQueriedSymbol ===
                      `${formData.symbol.trim()}-${formData.market}-${
                        formData.date || 'current'
                      }`
                    ? '조회완료'
                    : isDateToday
                    ? '현재가 조회'
                    : '종가 조회'}
                </Button>
              )}
            </div>

            {/* 종가 정보 표시 (매수 시에만) */}
            {formData.type === 'BUY' && currentPrice && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">
                    📈 {isDateToday ? '실시간 현재가' : `${formData.date} 종가`}
                  </span>
                  <span className="text-lg font-bold text-green-700">
                    {currentMarketConfig.symbol}
                    {currentPrice.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  KIS API에서 조회된{' '}
                  {isDateToday ? '최신 현재가' : '해당 일자 종가'}입니다
                </p>
              </div>
            )}

            {priceError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-red-800">
                    ⚠️ {priceError}
                  </span>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  종목명을 다시 확인해주세요
                </p>
              </div>
            )}

            <p className="text-xs text-gray-500">
              {formData.market === 'KR'
                ? '한국 종목명을 입력하세요 (예: 삼성전자, 카카오)'
                : '미국 주식/ETF 티커를 입력하세요 (예: AAPL, SPY, QQQ)'}
            </p>
          </div>

          {/* 매수/매도 구분 */}
          <div className="space-y-2">
            <Label>매수/매도</Label>
            <Select value={formData.type} onValueChange={handleSelectChange}>
              <SelectTrigger>
                <SelectValue placeholder="매수 또는 매도를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BUY">매수</SelectItem>
                <SelectItem value="SELL">매도</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 가격, 수량 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.type === 'BUY' ? (
              <div className="space-y-2">
                <Label htmlFor="buyPrice">
                  매수가 ({currentMarketConfig.symbol})
                </Label>
                <Input
                  id="buyPrice"
                  type="number"
                  step={currentMarketConfig.priceStep}
                  min={currentMarketConfig.minPrice}
                  placeholder={formData.market === 'KR' ? '50000' : '150.25'}
                  value={formData.buyPrice}
                  onChange={handleChange('buyPrice')}
                  required
                />
                <p className="text-xs text-gray-500">
                  {formData.market === 'KR'
                    ? '원화 단위로 입력 (예: 50000)'
                    : '달러 단위로 입력 (예: 150.25)'}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="buyPrice">
                    매수가 ({currentMarketConfig.symbol})
                  </Label>
                  <Input
                    id="buyPrice"
                    type="number"
                    step={currentMarketConfig.priceStep}
                    min={currentMarketConfig.minPrice}
                    placeholder={formData.market === 'KR' ? '50000' : '150.25'}
                    value={formData.buyPrice}
                    onChange={handleChange('buyPrice')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellPrice">
                    매도가 ({currentMarketConfig.symbol})
                  </Label>
                  <Input
                    id="sellPrice"
                    type="number"
                    step={currentMarketConfig.priceStep}
                    min={currentMarketConfig.minPrice}
                    placeholder={formData.market === 'KR' ? '50000' : '150.25'}
                    value={formData.sellPrice}
                    onChange={handleChange('sellPrice')}
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">수량</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="10"
                value={formData.quantity}
                onChange={handleChange('quantity')}
                required
              />
            </div>
          </div>

          {/* 핵심: 매매 당시 생각 저널링 */}
          <div className="space-y-2">
            <Label
              htmlFor="thoughts"
              className="text-base font-semibold text-blue-700"
            >
              💭 매매 당시 생각
            </Label>
            <Textarea
              id="thoughts"
              placeholder="매매 결정을 내린 이유, 당시의 감정, 시장 상황 등을 자유롭게 기록해보세요"
              value={formData.thoughts}
              onChange={handleChange('thoughts')}
              className="min-h-[120px]"
            />
            <p className="text-xs text-gray-500">
              AI가 분석하여 감성 태그를 자동으로 생성합니다
            </p>
          </div>

          {/* 제출 버튼 */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '저장 중...' : '매매 기록 저장'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
