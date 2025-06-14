'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TradeList } from '@/features/trade-list/ui/TradeList';
import { formatCurrency, type Market, type Currency } from '@/shared/types';

// UI에서 사용할 Trade 타입
interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  date: string;
  buyPrice: number;
  sellPrice?: number;
  quantity: number;
  thoughts: string;
  market: Market;
  currency: Currency;
  emotionTags: string[];
  profitLoss: number | null;
  currentPrice?: number;
  profitRate: number | null;
}

export function OverviewDashboard() {
  const { data: session, status } = useSession();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 사용자 매매 기록 조회
  useEffect(() => {
    const fetchTrades = async () => {
      // 세션이 로딩 중이면 기다리기
      if (status === 'loading') return;

      // 인증되지 않은 경우 로딩 종료
      if (status !== 'authenticated') {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch('/api/trades');
        if (response.ok) {
          const data = await response.json();
          setTrades(data.trades || []);
        }
      } catch (error) {
        console.error('매매 기록 조회 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrades();
  }, [status]);

  // 통계 계산
  const stats = {
    totalTrades: trades.length,
    koTrades: trades.filter((t) => t.market === 'KR').length,
    usTrades: trades.filter((t) => t.market === 'US').length,
    totalValueKRW: trades
      .filter((t) => t.currency === 'KRW')
      .reduce((sum, t) => sum + t.buyPrice * t.quantity, 0),
    totalValueUSD: trades
      .filter((t) => t.currency === 'USD')
      .reduce((sum, t) => sum + t.buyPrice * t.quantity, 0),
    recentEmotionTags: [
      ...new Set(trades.flatMap((t) => t.emotionTags).slice(0, 5)),
    ],
  };

  // NextAuth 세션 로딩 중
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 로그인되지 않은 경우
  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>로그인이 필요합니다</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              매매 기록을 보려면 먼저 로그인해주세요.
            </p>
            <Link href="/auth/signin">
              <Button className="w-full">로그인하기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 매매 기록 로딩 중 (인증된 상태에서)
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">매매 기록 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* 웰컴 헤더 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          반갑습니다, {session?.user?.name}님! 👋
        </h1>
        <p className="text-gray-600">
          전체 매매 기록을 한눈에 확인하고, 새로운 매매일지를 작성해보세요.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 매매 건수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrades}건</div>
            <p className="text-xs text-gray-500">
              한국 {stats.koTrades}건 • 미국 {stats.usTrades}건
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              한국 주식 거래대금
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.totalValueKRW, 'KRW')}
            </div>
            <p className="text-xs text-gray-500">누적 거래대금</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              미국 주식 거래대금
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalValueUSD, 'USD')}
            </div>
            <p className="text-xs text-gray-500">누적 거래대금</p>
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
              {stats.recentEmotionTags.length > 0 ? (
                stats.recentEmotionTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-xs rounded"
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

      {/* 새 매매일지 작성 CTA */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            📝 새로운 매매일지 작성하기
          </h2>
          <p className="text-gray-600">
            오늘의 매매 경험을 기록하고 AI 감성 분석을 받아보세요
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/ko-stock">
              <Button className="bg-blue-600 hover:bg-blue-700">
                🇰🇷 한국 주식 매매일지
              </Button>
            </Link>
            <Link href="/us-stock">
              <Button className="bg-green-600 hover:bg-green-700">
                🇺🇸 미국 주식 매매일지
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 전체 매매 기록 */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            📈 전체 매매 기록
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
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                아직 매매 기록이 없습니다
              </h3>
              <p className="text-gray-600 mb-6">
                첫 번째 매매일지를 작성해서 AI 감성 분석을 받아보세요!
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/ko-stock">
                  <Button>🇰🇷 한국 주식 시작하기</Button>
                </Link>
                <Link href="/us-stock">
                  <Button variant="outline">🇺🇸 미국 주식 시작하기</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <TradeList trades={trades} />
        )}
      </div>
    </div>
  );
}
