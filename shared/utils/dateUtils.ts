// dayjs를 사용한 날짜 관련 유틸리티 함수들
import dayjs from 'dayjs';
import 'dayjs/locale/ko'; // 한국어 로케일
import relativeTime from 'dayjs/plugin/relativeTime';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

// 플러그인 등록
dayjs.extend(relativeTime);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale('ko'); // 한국어 설정

interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  date: string;
  price: number;
  quantity: number;
  thoughts: string;
  emotionTags: string[];
  profitLoss?: number;
}

export interface GroupedTrade {
  date: string;
  dateFormatted: string;
  trades: Trade[];
  totalProfit: number;
  totalVolume: number;
  dayOfWeek: string;
  isToday: boolean;
  isYesterday: boolean;
}

/**
 * 매매 기록을 날짜별로 그룹핑하는 함수
 */
export function groupTradesByDate(trades: Trade[]): GroupedTrade[] {
  // 날짜별로 그룹핑
  const grouped = trades.reduce((acc, trade) => {
    const date = trade.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(trade);
    return acc;
  }, {} as Record<string, Trade[]>);

  // 그룹핑된 데이터를 정렬하고 포맷팅
  return Object.entries(grouped)
    .map(([date, trades]) => {
      const tradeDate = dayjs(date);
      const totalProfit = trades.reduce(
        (sum, trade) => sum + (trade.profitLoss || 0),
        0
      );
      const totalVolume = trades.reduce(
        (sum, trade) => sum + trade.price * trade.quantity,
        0
      );

      return {
        date,
        dateFormatted: formatDate(date),
        trades: trades.sort(
          (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
        ), // 최신순
        totalProfit,
        totalVolume,
        dayOfWeek: tradeDate.format('dddd'), // dayjs 한국어 요일
        isToday: tradeDate.isSame(dayjs(), 'day'),
        isYesterday: tradeDate.isSame(dayjs().subtract(1, 'day'), 'day'),
      };
    })
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()); // 최신 날짜부터
}

/**
 * 날짜를 한국어 형식으로 포맷팅 (dayjs 사용)
 */
export function formatDate(dateString: string): string {
  const date = dayjs(dateString);
  const today = dayjs();
  const yesterday = today.subtract(1, 'day');

  // 오늘인지 확인
  if (date.isSame(today, 'day')) {
    return `오늘 (${date.format('M월 D일')})`;
  }

  // 어제인지 확인
  if (date.isSame(yesterday, 'day')) {
    return `어제 (${date.format('M월 D일')})`;
  }

  // 올해인지 확인
  if (date.isSame(today, 'year')) {
    return date.format('M월 D일');
  }

  // 다른 년도
  return date.format('YYYY년 M월 D일');
}

/**
 * 요일을 한국어로 반환 (dayjs 사용)
 */
export function getKoreanDay(dateString: string): string {
  return dayjs(dateString).format('dddd');
}

/**
 * 상대적 시간 표시 (예: "3일 전", "1주일 전")
 */
export function getRelativeTime(dateString: string): string {
  return dayjs(dateString).fromNow();
}

/**
 * 날짜 범위 확인 (특정 기간 내의 거래 필터링용)
 */
export function isWithinDateRange(
  dateString: string,
  startDate: string,
  endDate: string
): boolean {
  const date = dayjs(dateString);
  return (
    date.isSameOrAfter(dayjs(startDate), 'day') &&
    date.isSameOrBefore(dayjs(endDate), 'day')
  );
}

/**
 * 월별 그룹핑 (나중에 월별 통계용)
 */
export function groupTradesByMonth(trades: Trade[]): Record<string, Trade[]> {
  return trades.reduce((acc, trade) => {
    const monthKey = dayjs(trade.date).format('YYYY-MM');
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(trade);
    return acc;
  }, {} as Record<string, Trade[]>);
}

/**
 * 주간 통계용 - 이번 주 거래 필터링
 */
export function getThisWeekTrades(trades: Trade[]): Trade[] {
  const startOfWeek = dayjs().startOf('week');
  const endOfWeek = dayjs().endOf('week');

  return trades.filter((trade) => {
    const tradeDate = dayjs(trade.date);
    return tradeDate.isAfter(startOfWeek) && tradeDate.isBefore(endOfWeek);
  });
}
