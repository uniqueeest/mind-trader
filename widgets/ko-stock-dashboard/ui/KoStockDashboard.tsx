'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TradeForm } from '@/features/trade/ui/TradeForm';
import { TradeList } from '@/features/trade/ui/TradeList';
import { formatCurrency } from '@/features/trade/utils/format';
import { useTradeList } from '@/features/trade/hooks/useTradeList';
import { useTradeSubmit } from '@/features/trade/hooks/useTradeSubmit';
import { LoadingLayout } from '@/shared/ui/loading/LoadingLayout';
import { useTradeStats } from '@/features/trade/hooks/useTradeStats';

export function KoStockDashboard() {
  const { trades, isLoading, setTrades } = useTradeList('KR');
  const { isSubmitting, submitTrade } = useTradeSubmit('KR');
  const koStats = useTradeStats(trades);

  const handleSubmitTrade = async (formData: any) => {
    try {
      const newTrade = await submitTrade(formData);
      setTrades((prev) => [newTrade, ...prev]);
    } catch (error) {
      alert('매매 기록 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <LoadingLayout isLoading={isLoading}>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* 한국 주식 헤더 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🇰🇷 한국 주식 매매일지
          </h1>
          <p className="text-gray-600 break-keep">
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
                  삼성전자, 카카오, LG에너지솔루션 등 다양한 국내 종목을 기록할
                  수 있습니다.
                </p>
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
