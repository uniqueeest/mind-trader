import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { TradeType, Market, Currency } from '@prisma/client';
import { enrichTradeWithMarketData } from '@/lib/kis-api';

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

    // 프론트엔드용 데이터 변환
    const transformedTrades = trades.map((trade) => ({
      ...trade,
      date: trade.date.toISOString().split('T')[0], // Date -> string 변환
      emotionTags: trade.emotionTags ? JSON.parse(trade.emotionTags) : [], // null -> 빈 배열 변환
    }));

    return NextResponse.json({ trades: transformedTrades });
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

    // 🚀 한국투자증권 API로 실시간 종가 수집
    console.log(`💹 ${symbol} (${market || 'KR'}) 종가 데이터 수집 시작...`);
    const marketData = await enrichTradeWithMarketData(
      symbol,
      (market || 'KR') as Market,
      date
    );

    // 매매 기록 데이터 준비 (KIS API 데이터 포함)
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

      // 🔥 한국투자증권 실시간 데이터 자동 추가
      currentPrice: marketData.currentPrice || null,
      marketKospi: marketData.marketKospi || null,
      marketNasdaq: marketData.marketNasdaq || null,
      marketSp500: marketData.marketSp500 || null,

      // AI 분석은 추후 구현
      emotionTags: null,
      aiAnalysis: null,
      confidence: null,

      // 수익률 계산 (현재가 기준)
      profitLoss: marketData.currentPrice
        ? type === 'BUY'
          ? (marketData.currentPrice - parseFloat(price)) * parseInt(quantity)
          : (parseFloat(price) - marketData.currentPrice) * parseInt(quantity)
        : null,
      profitRate: marketData.currentPrice
        ? type === 'BUY'
          ? ((marketData.currentPrice - parseFloat(price)) /
              parseFloat(price)) *
            100
          : ((parseFloat(price) - marketData.currentPrice) /
              parseFloat(price)) *
            100
        : null,
    };

    // 매매 기록 데이터 디버깅
    console.log('💾 저장할 데이터:', {
      ...tradeData,
      currentPrice: tradeData.currentPrice,
      profitLoss: tradeData.profitLoss,
      profitRate: tradeData.profitRate,
    });

    // 새 매매 기록 생성 (시장 데이터 포함)
    const trade = await prisma.trade.create({
      data: tradeData,
    });

    console.log('✅ 저장된 데이터:', {
      id: trade.id,
      symbol: trade.symbol,
      currentPrice: trade.currentPrice,
      profitLoss: trade.profitLoss,
      profitRate: trade.profitRate,
    });

    // 로그 출력
    if (marketData.currentPrice) {
      const profitLoss =
        type === 'BUY'
          ? (marketData.currentPrice - parseFloat(price)) * parseInt(quantity)
          : (parseFloat(price) - marketData.currentPrice) * parseInt(quantity);
      const profitRate =
        type === 'BUY'
          ? ((marketData.currentPrice - parseFloat(price)) /
              parseFloat(price)) *
            100
          : ((parseFloat(price) - marketData.currentPrice) /
              parseFloat(price)) *
            100;

      console.log(
        `✅ ${symbol} 현재가: ${marketData.currentPrice.toLocaleString()}${
          currency === 'USD' ? '$' : '원'
        }`
      );
      console.log(
        `📊 수익률: ${
          profitLoss >= 0 ? '+' : ''
        }${profitLoss.toLocaleString()}${currency === 'USD' ? '$' : '원'} (${
          profitRate >= 0 ? '+' : ''
        }${profitRate.toFixed(1)}%)`
      );
    }

    return NextResponse.json(
      {
        trade,
        marketData,
        message: `매매 기록이 저장되었습니다. ${
          marketData.currentPrice
            ? `실시간 종가 데이터도 함께 수집되었습니다. (현재가: ${marketData.currentPrice.toLocaleString()}${
                currency === 'USD' ? '$' : '원'
              })`
            : '종가 데이터 수집에 실패했습니다.'
        }`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('매매 기록 생성 실패:', error);
    return NextResponse.json(
      { error: '매매 기록을 저장하는데 실패했습니다' },
      { status: 500 }
    );
  }
}
