'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TradeForm } from '@/features/trade-form/ui/TradeForm';
import { TradeList } from '@/features/trade-list/ui/TradeList';
import { formatCurrency, type Market, type Currency } from '@/shared/types';

// UI에서 사용할 Trade 타입
interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  date: string;
  price: number;
  quantity: number;
  thoughts: string;
  market: Market;
  currency: Currency;
  emotionTags: string[];
  profitLoss?: number;
  currentPrice?: number;
  profitRate?: number;
}

// TradeForm 데이터 타입
interface TradeFormData {
  symbol: string;
  type: 'BUY' | 'SELL';
  date: string;
  price: string;
  quantity: string;
  thoughts: string;
  market: Market;
  currency: Currency;
}

export function KoStockDashboard() {
  const { data: session, status } = useSession();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 한국 주식만 필터링된 매매 기록 조회
  useEffect(() => {
    const fetchTrades = async () => {
      if (status !== 'authenticated') return;

      try {
        setIsLoading(true);
        const response = await fetch('/api/trades');
        if (response.ok) {
          const data = await response.json();
          // 한국 주식만 필터링
          const koTrades = (data.trades || []).filter(
            (trade: Trade) => trade.market === 'KR'
          );
          setTrades(koTrades);
        }
      } catch (error) {
        console.error('한국 주식 매매 기록 조회 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrades();
  }, [status]);

  // 새 매매 기록 제출 (한국 시장 고정)
  const handleSubmitTrade = async (formData: TradeFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          market: 'KR', // 한국 시장 고정
          currency: 'KRW', // 원화 고정
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('새 한국 주식 매매 기록 저장:', data);

        // 새 매매 기록을 목록에 추가 (AI 태그 포함)
        const newTrade: Trade = {
          id: data.trade.id,
          symbol: data.trade.symbol,
          type: data.trade.type,
          date: data.trade.date,
          price: data.trade.price,
          quantity: data.trade.quantity,
          thoughts: data.trade.thoughts,
          market: 'KR',
          currency: 'KRW',
          emotionTags: data.trade.emotionTags || [],
          currentPrice: data.marketData?.currentPrice,
        };

        setTrades((prev) => [newTrade, ...prev]);
      } else {
        throw new Error('서버 오류가 발생했습니다');
      }
    } catch (error) {
      console.error('한국 주식 매매 기록 저장 실패:', error);
      alert('매매 기록 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 한국 주식 통계 계산
  const koStats = {
    totalTrades: trades.length,
    totalValue: trades.reduce((sum, t) => sum + t.price * t.quantity, 0),
    totalProfit: trades.reduce((sum, t) => {
      if (!t.currentPrice) return sum;
      const profitLoss =
        t.type === 'BUY'
          ? (t.currentPrice - t.price) * t.quantity
          : (t.price - t.currentPrice) * t.quantity;
      return sum + profitLoss;
    }, 0),
    recentEmotionTags: [
      ...new Set(trades.flatMap((t) => t.emotionTags).slice(0, 5)),
    ],
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">한국 주식 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>로그인이 필요합니다</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              한국 주식 매매일지를 작성하려면 먼저 로그인해주세요.
            </p>
            <Link href="/auth/signin">
              <Button className="w-full">로그인하기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* 한국 주식 헤더 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🇰🇷 한국 주식 매매일지
        </h1>
        <p className="text-gray-600">
          국내 증시 매매 경험을 기록하고 AI 감성 분석을 받아보세요
        </p>
      </div>

      {/* 한국 주식 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              한국 주식 매매 건수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {koStats.totalTrades}건
            </div>
            <p className="text-xs text-gray-500">국내 증시 거래</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              총 거래대금
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(koStats.totalValue, 'KRW')}
            </div>
            <p className="text-xs text-gray-500">누적 거래대금</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              평가손익
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                koStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {koStats.totalProfit >= 0 ? '+' : ''}
              {formatCurrency(koStats.totalProfit, 'KRW')}
            </div>
            <p className="text-xs text-gray-500">현재가 기준</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              주요 감정 태그
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {koStats.recentEmotionTags.length > 0 ? (
                koStats.recentEmotionTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-400">태그 없음</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 매매 기록 입력 폼 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          📝 새 매매 기록 등록
        </h2>
        <TradeForm
          onSubmit={handleSubmitTrade}
          isLoading={isSubmitting}
          market="KR"
          currency="KRW"
        />
      </div>

      {/* 한국 주식 매매 기록 목록 */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            📈 한국 주식 매매 기록
          </h2>
          {trades.length > 0 && (
            <p className="text-sm text-gray-500">
              최신 순으로 표시 • 총 {trades.length}건
            </p>
          )}
        </div>

        {trades.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🇰🇷</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                한국 주식 매매 기록이 없습니다
              </h3>
              <p className="text-gray-600 mb-4">
                첫 번째 국내 증시 매매일지를 작성해보세요!
              </p>
              <p className="text-sm text-gray-500">
                삼성전자, 카카오, LG에너지솔루션 등 다양한 국내 종목을 기록할 수
                있습니다.
              </p>
            </CardContent>
          </Card>
        ) : (
          <TradeList trades={trades} />
        )}
      </div>
    </div>
  );
}
