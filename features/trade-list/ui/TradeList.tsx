'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  groupTradesByDate,
  getKoreanDay,
  type GroupedTrade,
} from '@/shared/utils/dateUtils';

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

// 개별 매매 기록 컴포넌트
function TradeItem({ trade }: { trade: Trade }) {
  return (
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-lg font-semibold">{trade.symbol}</h4>
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
            <div className="text-sm text-gray-600">
              <span>가격: {trade.price.toLocaleString()}원</span>
              <span className="mx-2">•</span>
              <span>수량: {trade.quantity}주</span>
            </div>
          </div>

          {/* 수익/손실 표시 */}
          {trade.profitLoss !== undefined && (
            <div
              className={`text-right ${
                trade.profitLoss >= 0 ? 'text-red-600' : 'text-blue-600'
              }`}
            >
              <div className="text-base font-semibold">
                {trade.profitLoss >= 0 ? '+' : ''}
                {trade.profitLoss.toLocaleString()}원
              </div>
              <div className="text-xs">
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
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {trade.emotionTags.map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200 text-xs"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* 매매 당시 생각 */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs font-medium text-gray-700 mb-1">
            💭 매매 당시의 생각
          </div>
          <p className="text-sm text-gray-800 leading-relaxed">
            {trade.thoughts}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// 날짜별 그룹 헤더 컴포넌트
function DateGroupHeader({ group }: { group: GroupedTrade }) {
  return (
    <div className="flex justify-between items-center w-full">
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold">{group.dateFormatted}</span>
        <span className="text-sm text-gray-500">({group.dayOfWeek})</span>
        <Badge variant="outline" className="text-xs">
          {group.trades.length}건
        </Badge>
        {/* 오늘/어제 특별 표시 */}
        {group.isToday && (
          <Badge className="bg-green-100 text-green-800 text-xs">TODAY</Badge>
        )}
        {group.isYesterday && (
          <Badge className="bg-blue-100 text-blue-800 text-xs">어제</Badge>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="text-gray-600">
          거래대금: {group.totalVolume.toLocaleString()}원
        </div>
        {group.totalProfit !== 0 && (
          <div
            className={`font-semibold ${
              group.totalProfit >= 0 ? 'text-red-600' : 'text-blue-600'
            }`}
          >
            {group.totalProfit >= 0 ? '+' : ''}
            {group.totalProfit.toLocaleString()}원
          </div>
        )}
      </div>
    </div>
  );
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

  // 날짜별로 그룹핑
  const groupedTrades = groupTradesByDate(trades);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">나의 매매 기록</h2>
        <p className="text-gray-600">
          총 {trades.length}건의 매매 기록 • AI가 분석한 감성 태그로 패턴을
          발견해보세요
        </p>
      </div>

      <Accordion type="multiple" className="space-y-4">
        {groupedTrades.map((group, index) => (
          <AccordionItem
            key={group.date}
            value={group.date}
            className="border rounded-lg shadow-sm bg-white"
          >
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <DateGroupHeader group={group} />
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <div className="space-y-3">
                {group.trades.map((trade) => (
                  <TradeItem key={trade.id} trade={trade} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
