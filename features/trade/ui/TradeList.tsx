'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { groupTradesByDate, type GroupedTrade } from '@/shared/utils/dateUtils';
import { formatCurrency } from '../utils/format';
import { MARKET_CONFIG } from '../model/market';
import type { Trade } from '@/entities/trade/model/types';
import {
  calculateTotalByCurrency,
  calculateProfitByCurrency,
} from '../utils/tradeCalculations';
import { TradeListSkeleton } from './skeleton/TradeListSkeleton';
import { cn } from '@/lib/utils';

interface TradeListProps {
  trades: Trade[];
  isLoading?: boolean;
}

export function TradeList({ trades, isLoading = false }: TradeListProps) {
  const groupedTrades = groupTradesByDate(trades);

  if (isLoading) {
    return <TradeListSkeleton />;
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
    <section className="w-full max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">나의 매매 기록</h2>
        <p className="text-gray-600">
          총 {trades.length}건의 매매 기록 • AI가 분석한 감성 태그로 패턴을
          발견해보세요
        </p>
      </div>
      <Accordion type="multiple" className="space-y-4">
        {groupedTrades.map((group) => (
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
    </section>
  );
}

// 개별 매매 기록 컴포넌트
function TradeItem({ trade }: { trade: Trade }) {
  const currentMarketConfig = MARKET_CONFIG[trade.market];
  const isBuy = trade.type === 'BUY';

  return (
    <AccordionItem value={trade.id}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center justify-center',
                'w-12 h-12',
                'rounded-full',
                isBuy ? 'bg-blue-100' : 'bg-green-100'
              )}
            >
              <span className="text-xs">{isBuy ? 'BUY' : 'SELL'}</span>
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
                className={cn(
                  'text-sm',
                  trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                )}
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
                매매 당시 생각
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
                AI 감성 태그
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
                현재가 정보
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
                      className={cn(
                        'font-medium',
                        trade.profitLoss >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      )}
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
  const totalByKRW = calculateTotalByCurrency(group.trades, 'KRW');
  const totalByUSD = calculateTotalByCurrency(group.trades, 'USD');
  const profitByKRW = calculateProfitByCurrency(group.trades, 'KRW');
  const profitByUSD = calculateProfitByCurrency(group.trades, 'USD');

  return (
    <div className="flex justify-between items-center w-full">
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold">{group.dateFormatted}</span>
        <span className="text-sm text-gray-500">({group.dayOfWeek})</span>
        <Badge variant="outline" className="text-xs">
          {group.trades.length}건
        </Badge>
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
              className={cn(
                'font-semibold',
                profitByKRW >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {formatCurrency(profitByKRW, 'KRW')}
            </span>
          )}
          {profitByUSD !== 0 && (
            <span
              className={cn(
                'font-semibold',
                profitByUSD >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {formatCurrency(profitByUSD, 'USD')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
