'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// 임시 타입 정의 (나중에 엔티티에서 가져올 예정)
interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  date: string;
  price: number;
  quantity: number;
  thoughts: string;
  emotionTags: string[];
  profitLoss?: number; // 수익/손실
}

interface TradeListProps {
  trades: Trade[];
  isLoading?: boolean;
}

export function TradeList({ trades, isLoading = false }: TradeListProps) {
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">매매 기록이 없습니다</h3>
          <p className="text-gray-600">
            첫 번째 매매 기록을 등록하고 AI 분석으로 나의 투자 심리를
            알아보세요!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">나의 매매 기록</h2>
        <p className="text-gray-600">
          총 {trades.length}건의 매매 기록 • AI가 분석한 감성 태그로 패턴을
          발견해보세요
        </p>
      </div>

      {trades.map((trade) => (
        <Card key={trade.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{trade.symbol}</h3>
                  <Badge
                    variant={trade.type === 'BUY' ? 'default' : 'secondary'}
                    className={
                      trade.type === 'BUY'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {trade.type === 'BUY' ? '매수' : '매도'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    날짜: {new Date(trade.date).toLocaleDateString('ko-KR')}
                  </p>
                  <p>
                    가격: {trade.price.toLocaleString()}원 • 수량:{' '}
                    {trade.quantity}주
                  </p>
                </div>
              </div>

              {/* 수익/손실 표시 */}
              {trade.profitLoss !== undefined && (
                <div
                  className={`text-right ${
                    trade.profitLoss >= 0 ? 'text-red-600' : 'text-blue-600'
                  }`}
                >
                  <div className="text-lg font-semibold">
                    {trade.profitLoss >= 0 ? '+' : ''}
                    {trade.profitLoss.toLocaleString()}원
                  </div>
                  <div className="text-sm">
                    ({trade.profitLoss >= 0 ? '+' : ''}
                    {(
                      (trade.profitLoss / (trade.price * trade.quantity)) *
                      100
                    ).toFixed(1)}
                    %)
                  </div>
                </div>
              )}
            </div>

            {/* AI 감성 태그 */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {trade.emotionTags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-200"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 매매 당시 생각 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">
                💭 매매 당시의 생각
              </div>
              <p className="text-sm text-gray-800 leading-relaxed">
                {trade.thoughts}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
