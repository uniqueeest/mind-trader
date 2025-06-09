import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { TradeType, Market, Currency } from '@prisma/client';

// 매매 기록 조회 API
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 현재 사용자의 모든 매매 기록 조회 (최신순)
    const trades = await prisma.trade.findMany({
      where: {
        user: {
          email: session.user.email,
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({ trades });
  } catch (error) {
    console.error('매매 기록 조회 실패:', error);
    return NextResponse.json(
      { error: '매매 기록을 불러오는데 실패했습니다' },
      { status: 500 }
    );
  }
}

// 매매 기록 생성 API
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();

    const { symbol, type, date, price, quantity, thoughts, market, currency } =
      body;

    // 입력 데이터 검증
    if (!symbol || !type || !date || !price || !quantity) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 매매 기록 데이터 준비
    const tradeData = {
      userId: user.id,
      symbol,
      type: type as TradeType,
      date: new Date(date),
      price: parseFloat(price),
      quantity: parseInt(quantity),
      thoughts: thoughts || null,
      market: (market || 'KR') as Market,
      currency: (currency || 'KRW') as Currency,
      // 초기값들
      emotionTags: null,
      aiAnalysis: null,
      confidence: null,
      marketKospi: null,
      marketNasdaq: null,
      marketSp500: null,
      currentPrice: null,
      profitLoss: null,
      profitRate: null,
    };

    // 새 매매 기록 생성
    const trade = await prisma.trade.create({
      data: tradeData,
    });

    return NextResponse.json({ trade }, { status: 201 });
  } catch (error) {
    console.error('매매 기록 생성 실패:', error);
    return NextResponse.json(
      { error: '매매 기록을 저장하는데 실패했습니다' },
      { status: 500 }
    );
  }
}
