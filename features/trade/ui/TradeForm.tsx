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
import type { Market, Currency } from '@/entities/trade/model/types';
import { getPriceStatus } from '../utils/getPriceStatus';
import { useStockPriceLookup } from '@/features/trade/hooks/useStockPriceLookup';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import dayjs from 'dayjs';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isTradingDay } from '../utils/tradeCalculations';

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

  // useStockPriceLookup 훅 사용
  const { currentPrice, priceLoading, priceError, fetchPrice, clearCache } =
    useStockPriceLookup();

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
      // 캐시 초기화
      clearCache();
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
        clearCache();
      }
    };

  const handleSelectChange = (value: 'BUY' | 'SELL') => {
    setFormData((prev) => ({
      ...prev,
      type: value,
    }));
  };

  // 종가 조회 함수 (날짜 포함)
  const handlePriceLookup = useCallback(async () => {
    const symbol = formData.symbol.trim();
    if (!symbol) return;

    await fetchPrice({
      symbol,
      market: formData.market,
      date: formData.date,
    });
  }, [
    formData.symbol,
    formData.market,
    formData.date,
    currentPrice,
    fetchPrice,
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
              매매 날짜
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !formData.date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? (
                    dayjs(formData.date).format('YYYY년 MM월 DD일')
                  ) : (
                    <span>날짜를 선택하세요</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dayjs(formData.date).toDate()}
                  onSelect={(date) => {
                    if (date) {
                      setFormData((prev) => ({
                        ...prev,
                        date: dayjs(date).format('YYYY-MM-DD'),
                      }));
                      clearCache();
                    }
                  }}
                  disabled={(date) => !isTradingDay(date)}
                />
              </PopoverContent>
            </Popover>
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
                  onClick={handlePriceLookup}
                  disabled={!formData.symbol.trim() || priceLoading}
                  className="px-3"
                >
                  {getPriceStatus(
                    formData,
                    priceLoading,
                    currentPrice ? 'cached' : ''
                  )}
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
              매매 당시 생각
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
