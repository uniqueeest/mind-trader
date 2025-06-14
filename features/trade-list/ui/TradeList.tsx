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

interface TradeListProps {
  trades: Trade[];
  isLoading?: boolean;
}

// 개별 매매 기록 컴포넌트
function TradeItem({ trade }: { trade: Trade }) {
  const currentMarketConfig = MARKET_CONFIG[trade.market];
  const isBuy = trade.type === 'BUY';
  const isSell = trade.type === 'SELL';

  return (
    <AccordionItem value={trade.id}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isBuy ? 'bg-blue-100' : 'bg-green-100'
              }`}
            >
              <span className="text-lg">{isBuy ? '📈' : '📉'}</span>
            </div>
            <div className="text-left">
              <div className="font-medium">{trade.symbol}</div>
              <div className="text-sm text-gray-500">
                {trade.date} • {trade.quantity}주
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">
              {isBuy ? (
                <>
                  매수가: {currentMarketConfig.symbol}
                  {trade.buyPrice.toLocaleString()}
                </>
              ) : (
                <>
                  매수가: {currentMarketConfig.symbol}
                  {trade.buyPrice.toLocaleString()}
                  <br />
                  매도가: {currentMarketConfig.symbol}
                  {trade.sellPrice?.toLocaleString()}
                </>
              )}
            </div>
            {trade.profitLoss !== null && trade.profitRate !== null && (
              <div
                className={`text-sm ${
                  trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trade.profitLoss >= 0 ? '+' : ''}
                {formatCurrency(trade.profitLoss, trade.currency)} (
                {trade.profitRate >= 0 ? '+' : ''}
                {trade.profitRate.toFixed(1)}%)
              </div>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          {/* 매매 당시 생각 */}
          {trade.thoughts && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                💭 매매 당시 생각
              </h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {trade.thoughts}
              </p>
            </div>
          )}

          {/* AI 감성 태그 */}
          {trade.emotionTags && trade.emotionTags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                🏷️ AI 감성 태그
              </h4>
              <div className="flex flex-wrap gap-1">
                {trade.emotionTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 현재가 정보 (매수 시에만) */}
          {isBuy && trade.currentPrice && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                📊 현재가 정보
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">현재가</p>
                  <p className="font-medium">
                    {currentMarketConfig.symbol}
                    {trade.currentPrice.toLocaleString()}
                  </p>
                </div>
                {trade.profitLoss !== null && trade.profitRate !== null && (
                  <div>
                    <p className="text-sm text-gray-500">평가손익</p>
                    <p
                      className={`font-medium ${
                        trade.profitLoss >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {trade.profitLoss >= 0 ? '+' : ''}
                      {formatCurrency(trade.profitLoss, trade.currency)} (
                      {trade.profitRate >= 0 ? '+' : ''}
                      {trade.profitRate.toFixed(1)}%)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// 날짜별 그룹 헤더 컴포넌트
function DateGroupHeader({ group }: { group: GroupedTrade }) {
  // 통화별 총액 계산
  const totalByKRW = group.trades
    .filter((trade) => trade.currency === 'KRW')
    .reduce((sum, trade) => {
      const price =
        trade.type === 'BUY' ? trade.buyPrice : trade.sellPrice || 0;
      return sum + price * trade.quantity;
    }, 0);

  const totalByUSD = group.trades
    .filter((trade) => trade.currency === 'USD')
    .reduce((sum, trade) => {
      const price =
        trade.type === 'BUY' ? trade.buyPrice : trade.sellPrice || 0;
      return sum + price * trade.quantity;
    }, 0);

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
