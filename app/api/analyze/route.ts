import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API 초기화
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { thoughts } = await request.json();

    if (!thoughts || thoughts.trim().length === 0) {
      return NextResponse.json({ tags: [] });
    }

    // Gemini 1.5 Flash 모델 사용
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

    return NextResponse.json({
      tags: extractedTags,
      confidence: extractedTags.length > 0 ? 0.8 : 0.3,
    });
  } catch (error) {
    console.error('AI 분석 실패:', error);
    return NextResponse.json(
      { error: 'AI 분석에 실패했습니다', tags: [] },
      { status: 500 }
    );
  }
}
