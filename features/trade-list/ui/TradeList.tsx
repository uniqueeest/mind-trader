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
import {
  formatCurrency,
  MARKET_CONFIG,
  type Currency,
  type Market,
} from '@/shared/types';

// Trade 타입 정의 (KIS API 데이터 포함)
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
  profitLoss?: number; // 수익/손실
  currentPrice?: number; // KIS API에서 가져온 현재가
  profitRate?: number; // 수익률 (%)
}

interface TradeListProps {
  trades: Trade[];
  isLoading?: boolean;
}

// 개별 매매 기록 컴포넌트
function TradeItem({ trade }: { trade: Trade }) {
  console.log(trade);

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
              <span>매매가: {formatCurrency(trade.price, trade.currency)}</span>
              <span className="mx-2">•</span>
              <span>수량: {trade.quantity}주</span>
              {trade.currentPrice && (
                <>
                  <span className="mx-2">•</span>
                  <span className="text-blue-600 font-medium">
                    현재가: {formatCurrency(trade.currentPrice, trade.currency)}
                  </span>
                </>
              )}
              <span className="mx-2">•</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {MARKET_CONFIG[trade.market].label}
              </span>
            </div>
          </div>

          {/* 수익/손실 표시 (현재가 기준) */}
          {trade.currentPrice && (
            <div className="text-right">
              {(() => {
                const totalValue = trade.price * trade.quantity;
                const currentValue = trade.currentPrice * trade.quantity;
                const profitLoss =
                  trade.type === 'BUY'
                    ? currentValue - totalValue // 매수: 현재가치 - 매수가치
                    : totalValue - currentValue; // 매도: 매도가치 - 현재가치
                const profitRate = (profitLoss / totalValue) * 100;

                return (
                  <div
                    className={`${
                      profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    <div className="text-base font-semibold">
                      {profitLoss >= 0 ? '+' : ''}
                      {formatCurrency(profitLoss, trade.currency)}
                    </div>
                    <div className="text-xs">
                      ({profitLoss >= 0 ? '+' : ''}
                      {profitRate.toFixed(1)}%)
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      평가금액: {formatCurrency(currentValue, trade.currency)}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* KIS API 데이터가 없는 경우 */}
          {!trade.currentPrice && (
            <div className="text-right text-gray-400">
              <div className="text-xs">현재가 정보 없음</div>
              <div className="text-xs">
                매매금액:{' '}
                {formatCurrency(trade.price * trade.quantity, trade.currency)}
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
  // 통화별 총액 계산
  const totalByKRW = group.trades
    .filter((trade) => trade.currency === 'KRW')
    .reduce((sum, trade) => sum + trade.price * trade.quantity, 0);

  const totalByUSD = group.trades
    .filter((trade) => trade.currency === 'USD')
    .reduce((sum, trade) => sum + trade.price * trade.quantity, 0);

  const profitByKRW = group.trades
    .filter((trade) => trade.currency === 'KRW')
    .reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);

  const profitByUSD = group.trades
    .filter((trade) => trade.currency === 'USD')
    .reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);

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
        {/* 통화별 거래대금 표시 */}
        <div className="text-gray-600 space-x-2">
          {totalByKRW > 0 && (
            <span>KRW: {formatCurrency(totalByKRW, 'KRW')}</span>
          )}
          {totalByUSD > 0 && (
            <span>USD: {formatCurrency(totalByUSD, 'USD')}</span>
          )}
        </div>

        {/* 통화별 수익/손실 표시 */}
        <div className="space-x-2">
          {profitByKRW !== 0 && (
            <span
              className={`font-semibold ${
                profitByKRW >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(profitByKRW, 'KRW')}
            </span>
          )}
          {profitByUSD !== 0 && (
            <span
              className={`font-semibold ${
                profitByUSD >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(profitByUSD, 'USD')}
            </span>
          )}
        </div>
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
