import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 기본 감정 태그들 생성
  const emotionTags = [
    // 감정 카테고리
    {
      name: 'FOMO',
      category: '감정',
      description: '놓칠 것 같은 두려움',
      color: '#ef4444',
    },
    {
      name: '공포',
      category: '감정',
      description: '손실에 대한 두려움',
      color: '#dc2626',
    },
    {
      name: '탐욕',
      category: '감정',
      description: '더 많은 수익에 대한 욕심',
      color: '#ea580c',
    },
    {
      name: '희망적',
      category: '감정',
      description: '긍정적인 기대감',
      color: '#16a34a',
    },
    {
      name: '감정적',
      category: '감정',
      description: '이성적이지 않은 판단',
      color: '#dc2626',
    },
    {
      name: '절망적',
      category: '감정',
      description: '부정적인 감정 상태',
      color: '#7c2d12',
    },
    {
      name: '확신',
      category: '감정',
      description: '강한 신념',
      color: '#059669',
    },

    // 분석 방법 카테고리
    {
      name: '기술적분석',
      category: '분석방법',
      description: '차트 기반 분석',
      color: '#2563eb',
    },
    {
      name: '기본적분석',
      category: '분석방법',
      description: '펀더멘털 분석',
      color: '#1d4ed8',
    },
    {
      name: '가치투자',
      category: '분석방법',
      description: '내재가치 기반 투자',
      color: '#1e40af',
    },
    {
      name: '모멘텀',
      category: '분석방법',
      description: '추세 추종 투자',
      color: '#3730a3',
    },
    {
      name: '따라하기',
      category: '분석방법',
      description: '다른 투자자 모방',
      color: '#6b21a8',
    },

    // 시장 상황 카테고리
    {
      name: '뉴스반응',
      category: '시장상황',
      description: '뉴스나 공시에 반응',
      color: '#0891b2',
    },
    {
      name: '시장분위기',
      category: '시장상황',
      description: '전체 시장 분위기 반영',
      color: '#0e7490',
    },
    {
      name: '동조효과',
      category: '시장상황',
      description: '다른 투자자들 따라하기',
      color: '#155e75',
    },
    {
      name: '급등급락',
      category: '시장상황',
      description: '급격한 가격 변동',
      color: '#991b1b',
    },
    {
      name: '박스권',
      category: '시장상황',
      description: '횡보 구간에서의 매매',
      color: '#64748b',
    },

    // 투자 목적 카테고리
    {
      name: '수익실현',
      category: '투자목적',
      description: '이익 실현',
      color: '#16a34a',
    },
    {
      name: '손절매',
      category: '투자목적',
      description: '손실 제한',
      color: '#dc2626',
    },
    {
      name: '목표달성',
      category: '투자목적',
      description: '목표가 도달',
      color: '#059669',
    },
    {
      name: '포트폴리오조정',
      category: '투자목적',
      description: '비중 조절',
      color: '#4338ca',
    },
    {
      name: '세금절약',
      category: '투자목적',
      description: '세금 관련 매매',
      color: '#7c3aed',
    },

    // 테마/섹터 카테고리
    {
      name: 'AI테마',
      category: '테마',
      description: '인공지능 관련',
      color: '#8b5cf6',
    },
    {
      name: '메타버스',
      category: '테마',
      description: '가상현실 관련',
      color: '#a855f7',
    },
    {
      name: 'ESG',
      category: '테마',
      description: '환경/사회/지배구조',
      color: '#10b981',
    },
    {
      name: '2차전지',
      category: '테마',
      description: '배터리 관련',
      color: '#f59e0b',
    },
    {
      name: '바이오',
      category: '테마',
      description: '바이오/헬스케어',
      color: '#ef4444',
    },
    {
      name: '반도체',
      category: '테마',
      description: '반도체 관련',
      color: '#3b82f6',
    },
  ];

  for (const tag of emotionTags) {
    await prisma.emotionTag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ 시드 실행 중 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
