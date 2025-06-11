import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { TradeType, Market, Currency } from '@prisma/client';
import { enrichTradeWithMarketData } from '@/lib/kis-api';

// AI 분석 함수 (동기적 실행)
async function performAIAnalysis(
  thoughts: string
): Promise<{ tags: string[]; confidence: number }> {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

    // 현재 프로젝트의 감정 태그 목록
    const EMOTION_TAGS = [
      // 감정
      'FOMO',
      '공포',
      '탐욕',
      '희망적',
      '감정적',
      '절망적',
      '확신',
      // 분석방법
      '기술적분석',
      '기본적분석',
      '가치투자',
      '모멘텀',
      '따라하기',
      // 시장상황
      '뉴스반응',
      '시장분위기',
      '동조효과',
      '급등급락',
      '박스권',
      // 투자목적
      '수익실현',
      '손절매',
      '목표달성',
      '포트폴리오조정',
      '세금절약',
      // 테마
      'AI테마',
      '메타버스',
      'ESG',
      '2차전지',
      '바이오',
      '반도체',
    ];

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `다음은 주식 매매 당시의 투자자 심리를 담은 일지입니다.
이 텍스트에서 드러나는 핵심 감정이나 판단 기준을 분석해서, 아래 태그 목록에서 가장 적합한 태그 1-3개만 선택해주세요.

===== 태그 목록 =====
${EMOTION_TAGS.join(', ')}

===== 매매 일지 =====
"${thoughts}"

===== 응답 형식 =====
선택된 태그들을 쉼표로 구분해서 반환해주세요. 예: FOMO, 뉴스반응, 기술적분석

응답:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // 응답에서 태그 추출
    const extractedTags = text
      .split(',')
      .map((tag: string) => tag.trim())
      .filter((tag: string) => EMOTION_TAGS.includes(tag))
      .slice(0, 3); // 최대 3개로 제한

    return {
      tags: extractedTags,
      confidence: extractedTags.length > 0 ? 0.8 : 0.3,
    };
  } catch (error) {
    console.error('AI 분석 실패:', error);
    return { tags: [], confidence: 0 };
  }
}

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
      emotionTags: trade.emotionTags || [], // PostgreSQL 배열 타입, null 체크만
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

      // AI 분석은 백그라운드에서 처리
      emotionTags: [],
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

    // 🤖 저장 전에 먼저 AI 감성 분석 실행
    let emotionTags: string[] = [];
    let aiAnalysis = null;
    let confidence = null;

    if (thoughts && thoughts.trim().length > 0) {
      try {
        console.log('🤖 AI 분석 시작...');
        const analysisResult = await performAIAnalysis(thoughts);
        emotionTags = analysisResult.tags;
        confidence = analysisResult.confidence;
        aiAnalysis = `AI 분석: ${emotionTags.join(', ')}`;
        console.log(`🤖 AI 분석 완료: ${emotionTags.join(', ')}`);
      } catch (error) {
        console.error('AI 분석 실패:', error);
      }
    }

    // AI 분석 결과를 포함하여 매매 기록 생성
    const trade = await prisma.trade.create({
      data: {
        ...tradeData,
        emotionTags: emotionTags.length > 0 ? emotionTags : [], // PostgreSQL 배열로 직접 저장
        aiAnalysis,
        confidence,
      },
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

    // 프론트엔드용 응답 데이터 (emotionTags를 배열로 변환)
    const responseData = {
      trade: {
        ...trade,
        date: trade.date.toISOString().split('T')[0],
        emotionTags: emotionTags, // 이미 배열 형태
      },
      marketData,
      message: `매매 기록이 저장되었습니다. ${
        emotionTags.length > 0
          ? `AI가 분석한 감정 태그: ${emotionTags.join(', ')}`
          : ''
      } ${
        marketData.currentPrice
          ? `실시간 종가: ${marketData.currentPrice.toLocaleString()}${
              currency === 'USD' ? '$' : '원'
            }`
          : '종가 데이터 수집 실패'
      }`,
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('매매 기록 생성 실패:', error);
    return NextResponse.json(
      { error: '매매 기록을 저장하는데 실패했습니다' },
      { status: 500 }
    );
  }
}
