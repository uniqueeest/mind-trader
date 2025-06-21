import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { TradeType, Market, Currency } from '@prisma/client';
import { enrichTradeWithMarketData } from '@/lib/kis-api';

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

// AI 분석 함수 (동기적 실행)
async function performAIAnalysis(
  thoughts: string
): Promise<{ tags: string[]; confidence: number }> {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

    const data = { trades: transformedTrades };

    const response = NextResponse.json(data);

    // 브라우저 캐시 설정 (1분)
    response.headers.set('Cache-Control', 'public, max-age=60');

    return response;
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

    const {
      symbol,
      type,
      date,
      buyPrice,
      sellPrice,
      quantity,
      thoughts,
      market,
      currency,
    } = body;

    // 입력 데이터 검증
    if (!symbol || !type || !date || !quantity) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 매수/매도 가격 검증
    if (type === 'BUY' && !buyPrice) {
      return NextResponse.json(
        { error: '매수가를 입력해주세요' },
        { status: 400 }
      );
    }

    if (type === 'SELL' && (!buyPrice || !sellPrice)) {
      return NextResponse.json(
        { error: '매수가와 매도가를 모두 입력해주세요' },
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

    // 🚀 한국투자증권 API로 실시간 종가 수집 (매수 시에만)
    let marketData = null;
    if (type === 'BUY') {
      console.log(`💹 ${symbol} (${market || 'KR'}) 종가 데이터 수집 시작...`);
      marketData = await enrichTradeWithMarketData(
        symbol,
        (market || 'KR') as Market,
        date
      );
    }

    // 매매 기록 데이터 준비
    const tradeData = {
      userId: user.id,
      symbol,
      type: type as TradeType,
      date: new Date(date),
      buyPrice: parseFloat(buyPrice),
      sellPrice: type === 'SELL' ? parseFloat(sellPrice) : null,
      quantity: parseInt(quantity),
      thoughts: thoughts || null,
      market: (market || 'KR') as Market,
      currency: (currency || 'KRW') as Currency,

      // 🔥 한국투자증권 실시간 데이터 자동 추가 (매수 시에만)
      currentPrice: type === 'BUY' ? marketData?.currentPrice || null : null,
      marketKospi: type === 'BUY' ? marketData?.marketKospi || null : null,
      marketNasdaq: type === 'BUY' ? marketData?.marketNasdaq || null : null,
      marketSp500: type === 'BUY' ? marketData?.marketSp500 || null : null,

      // AI 분석은 백그라운드에서 처리
      emotionTags: [],
      aiAnalysis: null,
      confidence: null,

      // 수익률 계산
      profitLoss:
        type === 'SELL'
          ? (parseFloat(sellPrice) - parseFloat(buyPrice)) * parseInt(quantity)
          : marketData?.currentPrice
          ? (marketData.currentPrice - parseFloat(buyPrice)) *
            parseInt(quantity)
          : null,
      profitRate:
        type === 'SELL'
          ? ((parseFloat(sellPrice) - parseFloat(buyPrice)) /
              parseFloat(buyPrice)) *
            100
          : marketData?.currentPrice
          ? ((marketData.currentPrice - parseFloat(buyPrice)) /
              parseFloat(buyPrice)) *
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
      } catch (error) {
        console.error('AI 분석 실패:', error);
      }
    }

    // 매매 기록 저장
    const trade = await prisma.trade.create({
      data: {
        ...tradeData,
        emotionTags,
        aiAnalysis,
        confidence,
      },
    });

    return NextResponse.json({
      trade,
      marketData,
      emotionTags,
      aiAnalysis,
      confidence,
    });
  } catch (error) {
    console.error('매매 기록 저장 실패:', error);
    return NextResponse.json(
      { error: '매매 기록 저장에 실패했습니다' },
      { status: 500 }
    );
  }
}
