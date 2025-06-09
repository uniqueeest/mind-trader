'use client';

import { useState } from 'react';
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
import { MARKET_CONFIG, type Market, type Currency } from '@/shared/types';

interface TradeFormData {
  symbol: string;
  type: 'BUY' | 'SELL';
  date: string;
  price: string;
  quantity: string;
  thoughts: string;
  market: 'KR' | 'US';
  currency: 'KRW' | 'USD';
}

interface TradeFormProps {
  onSubmit: (data: TradeFormData) => Promise<void>;
  isLoading?: boolean;
}

export function TradeForm({ onSubmit, isLoading = false }: TradeFormProps) {
  const [formData, setFormData] = useState<TradeFormData>({
    symbol: '',
    type: 'BUY',
    date: new Date().toISOString().split('T')[0],
    price: '',
    quantity: '',
    thoughts: '',
    market: 'KR',
    currency: 'KRW',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      // 성공 시 폼 리셋
      setFormData({
        symbol: '',
        type: 'BUY',
        date: new Date().toISOString().split('T')[0],
        price: '',
        quantity: '',
        thoughts: '',
        market: 'KR',
        currency: 'KRW',
      });
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
    };

  const handleSelectChange = (value: 'BUY' | 'SELL') => {
    setFormData((prev) => ({
      ...prev,
      type: value,
    }));
  };

  const handleMarketChange = (value: Market) => {
    const currency = MARKET_CONFIG[value].currency;
    setFormData((prev) => ({
      ...prev,
      market: value,
      currency: currency,
      symbol: '', // 시장 변경 시 종목명 리셋
      price: '', // 가격도 리셋 (통화가 바뀌므로)
    }));
  };

  const currentMarketConfig = MARKET_CONFIG[formData.market];

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
          {/* 시장 선택 */}
          <div className="space-y-2">
            <Label>거래 시장</Label>
            <Select value={formData.market} onValueChange={handleMarketChange}>
              <SelectTrigger>
                <SelectValue placeholder="거래 시장을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KR">🇰🇷 한국 시장 (KRW)</SelectItem>
                <SelectItem value="US">🇺🇸 미국 시장 (USD)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 종목명 */}
          <div className="space-y-2">
            <Label htmlFor="symbol">종목명</Label>
            <Input
              id="symbol"
              placeholder={`예: ${currentMarketConfig.examples.join(', ')}`}
              value={formData.symbol}
              onChange={handleChange('symbol')}
              required
            />
            <p className="text-xs text-gray-500">
              {formData.market === 'KR'
                ? '한국 종목명을 입력하세요 (한글 또는 영문)'
                : '미국 종목 티커를 입력하세요 (예: AAPL, TSLA)'}
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

          {/* 날짜, 가격, 수량을 한 줄에 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">매매 날짜</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={handleChange('date')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">
                매매 가격 ({currentMarketConfig.symbol})
              </Label>
              <Input
                id="price"
                type="number"
                step={currentMarketConfig.priceStep}
                min={currentMarketConfig.minPrice}
                placeholder={formData.market === 'KR' ? '50000' : '150.25'}
                value={formData.price}
                onChange={handleChange('price')}
                required
              />
              <p className="text-xs text-gray-500">
                {formData.market === 'KR'
                  ? '원화 단위로 입력 (예: 50000)'
                  : '달러 단위로 입력 (예: 150.25)'}
              </p>
            </div>

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
              💭 매매의 순간, 나의 생각은?
            </Label>
            <Textarea
              id="thoughts"
              placeholder="예: XX 뉴스를 보고 급등할 것 같아서 추격 매수했다. 놓칠까 봐 두려웠다..."
              className="min-h-[120px] resize-none"
              value={formData.thoughts}
              onChange={handleChange('thoughts')}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '저장 중...' : '매매 기록 저장'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
