'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TradeList } from '@/features/trade/ui/TradeList';
import { formatCurrency } from '@/features/trade/utils/format';
import { useTradeList } from '@/features/trade/hooks/useTradeList';
import { useMarketStats } from '@/features/trade/hooks/useTradeStats';
import { LoadingLayout } from '@/shared/ui/loading/LoadingLayout';

export function OverviewDashboard() {
  const { trades, isLoading } = useTradeList();
  const stats = useMarketStats(trades);

  return (
    <LoadingLayout isLoading={isLoading}>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* 웰컴 헤더 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            반갑습니다! 👋
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
    </LoadingLayout>
  );
}
