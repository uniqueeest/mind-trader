'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { TradeForm } from '@/features/trade-form/ui/TradeForm';
import { TradeList } from '@/features/trade-list/ui/TradeList';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency, type Currency, type Market } from '@/shared/types';

// API 응답 타입 정의
interface ApiTrade {
  id: string;
  userId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  date: string; // ISO 날짜 문자열
  price: number;
  quantity: number;
  thoughts: string | null;
  market: Market;
  currency: Currency;
  emotionTags: string | null; // JSON 문자열
  aiAnalysis: string | null;
  confidence: number | null;
  marketKospi: number | null;
  marketNasdaq: number | null;
  marketSp500: number | null;
  currentPrice: number | null;
  profitLoss: number | null;
  profitRate: number | null;
  createdAt: string;
  updatedAt: string;
}

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
  currentPrice?: number; // 현재가 추가
  profitRate?: number; // 수익률 추가
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

export function TradeDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 인증되지 않은 사용자를 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (status === 'loading') return; // 로딩 중일 때는 대기
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // 매매 기록 불러오기
  const fetchTrades = async () => {
    if (!session?.user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/trades');

      if (!response.ok) {
        throw new Error('매매 기록을 불러오는데 실패했습니다');
      }

      const data = await response.json();

      // API 응답을 UI용 타입으로 변환 (API에서 이미 변환됨)
      const convertedTrades: Trade[] = data.trades.map(
        (apiTrade: ApiTrade) => ({
          id: apiTrade.id,
          symbol: apiTrade.symbol,
          type: apiTrade.type,
          date: apiTrade.date, // API에서 이미 YYYY-MM-DD 형식으로 변환됨
          price: apiTrade.price,
          quantity: apiTrade.quantity,
          thoughts: apiTrade.thoughts || '',
          market: apiTrade.market,
          currency: apiTrade.currency,
          emotionTags: apiTrade.emotionTags as any, // API에서 이미 배열로 변환됨
          profitLoss: apiTrade.profitLoss || undefined,
          currentPrice: apiTrade.currentPrice || undefined, // 현재가 추가
          profitRate: apiTrade.profitRate || undefined, // 수익률 추가
        })
      );

      setTrades(convertedTrades);
    } catch (error) {
      console.error('매매 기록 조회 실패:', error);
      setError(
        error instanceof Error
          ? error.message
          : '알 수 없는 오류가 발생했습니다'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 및 세션 변경 시 데이터 로드
  useEffect(() => {
    if (session?.user) {
      fetchTrades();
    }
  }, [session]);

  // 새 매매 기록 저장
  const handleSubmitTrade = async (formData: TradeFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '매매 기록 저장에 실패했습니다');
      }

      const data = await response.json();

      // 새로운 매매 기록을 목록에 추가 (AI 분석 결과 포함)
      const newTrade: Trade = {
        id: data.trade.id,
        symbol: data.trade.symbol,
        type: data.trade.type,
        date: data.trade.date,
        price: data.trade.price,
        quantity: data.trade.quantity,
        thoughts: data.trade.thoughts || '',
        market: data.trade.market,
        currency: data.trade.currency,
        emotionTags: data.trade.emotionTags || [], // AI 분석된 태그
        profitLoss: data.trade.profitLoss || undefined,
        currentPrice: data.trade.currentPrice || undefined,
        profitRate: data.trade.profitRate || undefined,
      };

      setTrades((prev) => [newTrade, ...prev]);
      setShowForm(false);

      // 🎉 AI 분석 완료 알림
      if (data.trade.emotionTags && data.trade.emotionTags.length > 0) {
        console.log('🤖 AI 분석 완료:', data.trade.emotionTags);
      }
    } catch (error) {
      console.error('매매 기록 저장 실패:', error);
      setError(
        error instanceof Error ? error.message : '매매 기록 저장에 실패했습니다'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = () => {
    signOut({
      callbackUrl: '/auth/signin',
      redirect: false,
    }).then(() => {
      // 로그아웃 후 히스토리 교체로 로그인 페이지로 이동
      router.replace('/auth/signin');
    });
  };

  // 로딩 중일 때 표시
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우 리다이렉트 대기
  if (!session) {
    return null;
  }

  const totalTrades = trades.length;

  // 통화별 수익/손실 계산
  const profitByKRW = trades
    .filter((trade) => trade.currency === 'KRW')
    .reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
  const profitByUSD = trades
    .filter((trade) => trade.currency === 'USD')
    .reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
  const recentEmotionTags = trades
    .slice(0, 10)
    .flatMap((trade) => trade.emotionTags)
    .reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topEmotionTag =
    Object.entries(recentEmotionTags).sort(([, a], [, b]) => b - a)[0]?.[0] ||
    '분석 준비중';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 헤더 섹션 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🧠 마인드 트레이더
            </h1>
            <p className="text-gray-600 mt-1">
              {session.user?.name}님의 투자 심리 분석 대시보드
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowForm(!showForm)}
              className="bg-white"
            >
              {showForm ? '목록 보기' : '새 기록 등록'}
            </Button>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="bg-white"
            >
              로그아웃
            </Button>
          </div>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <p className="text-red-600">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setError(null)}
                className="mt-2"
              >
                닫기
              </Button>
            </CardContent>
          </Card>
        )}

        {showForm ? (
          /* 매매 기록 입력 폼 */
          <TradeForm onSubmit={handleSubmitTrade} isLoading={isSubmitting} />
        ) : (
          <>
            {/* 통계 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>총 매매 건수</CardDescription>
                  <CardTitle className="text-2xl">{totalTrades}건</CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>총 수익/손실</CardDescription>
                  <div className="space-y-1">
                    {profitByKRW !== 0 && (
                      <CardTitle
                        className={`text-lg ${
                          profitByKRW >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        KRW: {formatCurrency(profitByKRW, 'KRW')}
                      </CardTitle>
                    )}
                    {profitByUSD !== 0 && (
                      <CardTitle
                        className={`text-lg ${
                          profitByUSD >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        USD: {formatCurrency(profitByUSD, 'USD')}
                      </CardTitle>
                    )}
                    {profitByKRW === 0 && profitByUSD === 0 && (
                      <CardTitle className="text-xl text-gray-500">
                        수익 데이터 없음
                      </CardTitle>
                    )}
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>주요 감성 태그</CardDescription>
                  <CardTitle className="text-2xl text-blue-600">
                    {topEmotionTag}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* 매매 기록 목록 */}
            {isLoading ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">매매 기록을 불러오는 중...</p>
                </CardContent>
              </Card>
            ) : trades.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500 mb-4">
                    아직 등록된 매매 기록이 없습니다.
                  </p>
                  <Button onClick={() => setShowForm(true)}>
                    첫 번째 매매 기록 등록하기
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <TradeList trades={trades} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
