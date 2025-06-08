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

// 임시 타입 정의
interface TradeFormData {
  symbol: string;
  type: 'BUY' | 'SELL';
  date: string;
  price: string;
  quantity: string;
  thoughts: string;
}

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

export function TradeDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 인증되지 않은 사용자를 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (status === 'loading') return; // 로딩 중일 때는 대기
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // 임시 데모 데이터
  useEffect(() => {
    if (session) {
      // 실제로는 API에서 사용자별 데이터를 가져올 예정
      const demoTrades: Trade[] = [
        {
          id: '1',
          symbol: '삼성전자',
          type: 'BUY',
          date: '2024-01-15',
          price: 75000,
          quantity: 10,
          thoughts:
            '반도체 업황 회복 기대감에 매수했다. 차트상 지지선 터치 후 반등 구간으로 보임.',
          emotionTags: ['기술적분석', '기대감'],
          profitLoss: 50000,
        },
        {
          id: '2',
          symbol: 'AAPL',
          type: 'BUY',
          date: '2024-01-10',
          price: 150,
          quantity: 5,
          thoughts:
            '애플 실적 발표 전에 급매수. 놓칠까봐 두려워서 시장가로 샀다.',
          emotionTags: ['FOMO', '공포'],
          profitLoss: -25000,
        },
      ];
      setTrades(demoTrades);
    }
  }, [session]);

  const handleSubmitTrade = async (formData: TradeFormData) => {
    setIsLoading(true);

    try {
      // TODO: 실제 API 호출로 대체 예정
      const newTrade: Trade = {
        id: Date.now().toString(),
        symbol: formData.symbol,
        type: formData.type,
        date: formData.date,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        thoughts: formData.thoughts,
        emotionTags: ['분석중'], // TODO: AI 분석 결과로 대체
        profitLoss: undefined,
      };

      setTrades((prev) => [newTrade, ...prev]);
      setShowForm(false);

      // TODO: AI 감성 분석 API 호출
      setTimeout(() => {
        setTrades((prev) =>
          prev.map((trade) =>
            trade.id === newTrade.id
              ? { ...trade, emotionTags: ['희망적'] } // 임시 태그
              : trade
          )
        );
      }, 2000);
    } catch (error) {
      console.error('매매 기록 저장 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  // 로딩 상태
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🧠</div>
          <div className="text-xl text-gray-600">로딩 중...</div>
        </div>
      </div>
    );
  }

  // 인증되지 않은 상태
  if (status === 'unauthenticated') {
    return null; // 리다이렉트 처리 중
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* 헤더 - 사용자 정보 추가 */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🧠 마인드 트레이더
            </h1>
            <p className="text-xl text-gray-600">
              AI가 분석하는 나의 투자 심리 패턴
            </p>
          </div>

          {/* 사용자 프로필 */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {session?.user?.name}
              </div>
              <div className="text-xs text-gray-500">
                {session?.user?.email}
              </div>
            </div>
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt="프로필"
                className="w-10 h-10 rounded-full"
              />
            )}
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              로그아웃
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                총 매매 건수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trades.length}건</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                총 수익/손실
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +
                {trades
                  .reduce((sum, trade) => sum + (trade.profitLoss || 0), 0)
                  .toLocaleString()}
                원
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                주요 감성 태그
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                기술적분석
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 메인 액션 버튼 */}
        {!showForm && (
          <div className="text-center mb-8">
            <Button
              onClick={() => setShowForm(true)}
              size="lg"
              className="text-lg px-8 py-3"
            >
              📝 새 매매 기록 등록
            </Button>
          </div>
        )}

        {/* 매매 기록 입력 폼 */}
        {showForm && (
          <div className="mb-8">
            <TradeForm onSubmit={handleSubmitTrade} isLoading={isLoading} />
            <div className="text-center mt-4">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                취소
              </Button>
            </div>
          </div>
        )}

        {/* 매매 기록 리스트 */}
        <TradeList trades={trades} isLoading={false} />
      </div>
    </div>
  );
}
