// 한국투자증권 KIS API 클라이언트
// 국내주식 일자별 시세 + 해외주식 종가 조회

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface KISTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// 국내주식 기간별시세 (일봉 데이터) 응답
interface KISDomesticChartResponse {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output1: {
    prdy_vrss: string; // 전일대비
    prdy_vrss_sign: string; // 전일대비부호
    prdy_ctrt: string; // 전일대비율
    stck_prdy_clpr: string; // 전일종가
    acml_vol: string; // 누적거래량
    acml_tr_pbmn: string; // 누적거래대금
    hts_kor_isnm: string; // HTS 한글 종목명
    stck_prpr: string; // 주식 현재가 (장중이면 현재가, 장마감시 종가)
  };
  output2: Array<{
    stck_bsop_date: string; // 주식영업일자 (YYYYMMDD)
    stck_clpr: string; // 주식종가
    stck_oprc: string; // 주식시가
    stck_hgpr: string; // 주식고가
    stck_lwpr: string; // 주식저가
    acml_vol: string; // 누적거래량
    acml_tr_pbmn: string; // 누적거래대금
    flng_cls_code: string; // 락구분코드
    prtt_rate: string; // 분할비율
    mod_yn: string; // 분할변경여부
    prdy_vrss_sign: string; // 전일대비부호
    prdy_vrss: string; // 전일대비
    revl_issu_reas: string; // 재평가사유코드
  }>;
}

// 국내주식 일자별 시세 응답
interface KISDomesticDailyPriceResponse {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output: Array<{
    stck_bsop_date: string; // 주식영업일자 (YYYYMMDD)
    stck_clpr: string; // 주식종가
    stck_oprc: string; // 주식시가
    stck_hgpr: string; // 주식고가
    stck_lwpr: string; // 주식저가
    acml_vol: string; // 누적거래량
    acml_tr_pbmn: string; // 누적거래대금
    flng_cls_code: string; // 락구분코드
    prdy_vrss_sign: string; // 전일대비부호
    prdy_vrss: string; // 전일대비
    prdy_ctrt: string; // 전일대비율
  }>;
}

// 해외주식 기간별시세 (일봉 데이터) 응답
interface KISOverseaChartResponse {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output1: {
    rsym: string; // 실시간조회종목코드
    zdiv: string; // 소수점자리수
    base: string; // 기준가
    pvol: string; // 전일거래량
    last: string; // 현재가 (장마감시 종가)
    sign: string; // 대비구분
    diff: string; // 대비
    rate: string; // 등락율
    tvol: string; // 거래량
    tamt: string; // 거래대금
  };
  output2: Array<{
    xymd: string; // 일자 (YYYYMMDD)
    clos: string; // 종가
    open: string; // 시가
    high: string; // 고가
    low: string; // 저가
    tvol: string; // 거래량
    tamt: string; // 거래대금
    pbid: string; // 매수호가
    pask: string; // 매도호가
    rsym: string; // 실시간조회종목코드
  }>;
}

export interface StockPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  market: 'KR' | 'US';
  currency: 'KRW' | 'USD';
  date: string;
}

class KISApiClient {
  private baseUrl: string;
  private appKey: string;
  private appSecret: string;

  constructor(isVirtual = false) {
    // 실전투자 vs 모의투자 서버 분기
    this.baseUrl = isVirtual
      ? 'https://openapivts.koreainvestment.com:29443' // 모의투자
      : 'https://openapi.koreainvestment.com:9443'; // 실전투자

    this.appKey = process.env.KIS_APP_KEY || '';
    this.appSecret = process.env.KIS_APP_SECRET || '';

    if (!this.appKey || !this.appSecret) {
      console.warn('⚠️  KIS API 키가 설정되지 않았습니다.');
    }
  }

  // 🔍 DB에서 유효한 토큰 조회
  private async getValidTokenFromDB(): Promise<string | null> {
    try {
      const tokenRecord = await prisma.kisToken.findFirst({
        where: {
          expiresAt: {
            gt: new Date(), // 현재 시간보다 미래인 것만
          },
        },
        orderBy: {
          createdAt: 'desc', // 가장 최근 토큰
        },
      });

      if (tokenRecord) {
        console.log('📦 DB에서 유효한 토큰 발견, 재사용합니다.');
        return tokenRecord.accessToken;
      }

      return null;
    } catch (error) {
      console.error('❌ DB 토큰 조회 실패:', error);
      return null;
    }
  }

  // 💾 토큰을 DB에 저장
  private async saveTokenToDB(tokenData: KISTokenResponse): Promise<void> {
    try {
      // 기존 토큰들 모두 삭제 (하나만 유지)
      await prisma.kisToken.deleteMany({});

      // 새 토큰 저장
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      await prisma.kisToken.create({
        data: {
          accessToken: tokenData.access_token,
          tokenType: tokenData.token_type,
          expiresIn: tokenData.expires_in,
          issuedAt: new Date(),
          expiresAt: expiresAt,
        },
      });

      console.log(
        `💾 토큰이 DB에 저장되었습니다. 만료시간: ${expiresAt.toLocaleString(
          'ko-KR'
        )}`
      );
    } catch (error) {
      console.error('❌ DB 토큰 저장 실패:', error);
    }
  }

  // 🔑 OAuth 토큰 발급
  private async issueAccessToken(): Promise<string> {
    console.log('🔑 KIS 접근토큰 발급 중...');
    console.log('🔑 URL:', `${this.baseUrl}/oauth2/tokenP`);
    console.log('🔑 AppKey 길이:', this.appKey?.length || 0);
    console.log('🔑 AppSecret 길이:', this.appSecret?.length || 0);

    try {
      const requestBody = {
        grant_type: 'client_credentials',
        appkey: this.appKey,
        appsecret: this.appSecret,
      };

      const response = await fetch(`${this.baseUrl}/oauth2/tokenP`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('🔑 Response status:', response.status);
      console.log(
        '🔑 Response headers:',
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔑 Error response body:', errorText);
        throw new Error(`토큰 발급 실패: ${response.status} - ${errorText}`);
      }

      const data: KISTokenResponse = await response.json();

      // DB에 토큰 저장
      await this.saveTokenToDB(data);

      console.log('✅ KIS 접근토큰 발급 완료');
      return data.access_token;
    } catch (error) {
      console.error('❌ 토큰 발급 실패:', error);
      throw error;
    }
  }

  // 🔄 토큰 자동 갱신 (DB 우선 조회)
  private async getAccessToken(): Promise<string> {
    // 1. 먼저 DB에서 유효한 토큰 찾기
    const existingToken = await this.getValidTokenFromDB();
    if (existingToken) {
      return existingToken;
    }

    // 2. 유효한 토큰이 없으면 새로 발급
    console.log('📤 유효한 토큰이 없어 새로 발급합니다.');
    return await this.issueAccessToken();
  }

  // 📈 국내주식 종가 조회 (일봉 데이터 기반)
  async getDomesticStockPrice(
    symbol: string,
    targetDate?: string
  ): Promise<StockPrice | null> {
    try {
      const token = await this.getAccessToken();

      // 날짜 포맷팅 (YYYYMMDD)
      let formattedDate = '';
      if (targetDate) {
        formattedDate = targetDate.replace(/-/g, ''); // 2024-01-15 → 20240115
      }

      console.log(
        `📊 국내주식 조회: ${symbol}${
          formattedDate ? ` (${formattedDate})` : ' (현재가)'
        }`
      );

      // 국내주식 일자별 시세 API 사용
      const response = await fetch(
        `${this.baseUrl}/uapi/domestic-stock/v1/quotations/inquire-daily-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${symbol}&FID_PERIOD_DIV_CODE=D&FID_ORG_ADJ_PRC=0`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
            appkey: this.appKey,
            appsecret: this.appSecret,
            tr_id: 'FHKST01010400', // 주식현재가 일자별
          },
        }
      );

      if (!response.ok) {
        console.error(`국내주식 조회 실패 (${symbol}):`, response.status);
        return null;
      }

      const data: KISDomesticDailyPriceResponse = await response.json();

      if (data.rt_cd !== '0') {
        console.error(`국내주식 조회 실패 (${symbol}):`, data.msg1);
        return null;
      }

      // 특정 날짜 요청 시 해당 날짜 데이터 찾기
      let targetData = data.output[0]; // 기본값: 최신 데이터

      if (formattedDate) {
        const dateMatch = data.output.find(
          (item) => item.stck_bsop_date === formattedDate
        );
        if (dateMatch) {
          targetData = dateMatch;
          console.log(`✅ ${formattedDate} 날짜 데이터 발견`);
        } else {
          console.warn(
            `⚠️ ${formattedDate} 날짜 데이터 없음, 최신 데이터 사용`
          );
        }
      }

      if (!targetData) {
        console.error(`국내주식 데이터 없음 (${symbol})`);
        return null;
      }

      return {
        symbol,
        name: symbol, // 일자별 API는 종목명을 제공하지 않음
        price: parseFloat(targetData.stck_clpr), // 종가 사용
        change: parseFloat(targetData.prdy_vrss),
        changePercent: parseFloat(targetData.prdy_ctrt),
        volume: parseInt(targetData.acml_vol),
        high: parseFloat(targetData.stck_hgpr),
        low: parseFloat(targetData.stck_lwpr),
        open: parseFloat(targetData.stck_oprc),
        market: 'KR',
        currency: 'KRW',
        date: targetData.stck_bsop_date.replace(
          /(\d{4})(\d{2})(\d{2})/,
          '$1-$2-$3'
        ),
      };
    } catch (error) {
      console.error(`국내주식 조회 오류 (${symbol}):`, error);
      return null;
    }
  }

  // 🌎 해외주식 일자별 시세 조회 (ETF 포함)
  async getOverseaStockPrice(
    symbol: string,
    targetDate?: string
  ): Promise<StockPrice | null> {
    try {
      const token = await this.getAccessToken();

      // 날짜 포맷팅 (YYYYMMDD)
      let formattedDate = '';
      if (targetDate) {
        formattedDate = targetDate.replace(/-/g, ''); // 2024-01-15 → 20240115
      }

      console.log(
        `🌍 해외주식 조회: ${symbol}${
          formattedDate ? ` (${formattedDate})` : ' (현재가)'
        }`
      );

      // 여러 거래소 시도 (ETF 지원을 위해)
      const exchanges = [
        'NAS', // NASDAQ (대부분의 기술주/ETF)
        'NYS', // NYSE (전통적인 대형주/ETF)
        'AMS', // AMEX (소형주/ETF)
      ];

      for (const exchange of exchanges) {
        try {
          console.log(`🔍 ${symbol} 조회 시도: ${exchange} 거래소`);

          // 해외주식 일자별 시세 API 사용 (BYMD 파라미터에 날짜 설정)
          const response = await fetch(
            `${this.baseUrl}/uapi/overseas-price/v1/quotations/dailyprice?AUTH=&EXCD=${exchange}&SYMB=${symbol}&GUBN=0&BYMD=${formattedDate}&MODP=0`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                authorization: `Bearer ${token}`,
                appkey: this.appKey,
                appsecret: this.appSecret,
                tr_id: 'HHDFS76240000', // 해외주식 기간별시세
              },
            }
          );

          if (!response.ok) {
            console.log(
              `${exchange} 거래소 조회 실패 (${symbol}):`,
              response.status
            );
            continue; // 다음 거래소 시도
          }

          const data: KISOverseaChartResponse = await response.json();

          if (data.rt_cd !== '0') {
            console.log(
              `${exchange} 거래소 데이터 없음 (${symbol}):`,
              data.msg1
            );
            continue; // 다음 거래소 시도
          }

          // 특정 날짜 요청 시 해당 날짜 데이터 찾기
          let targetData = data.output2[0]; // 기본값: 최신 데이터

          if (formattedDate) {
            const dateMatch = data.output2.find(
              (item) => item.xymd === formattedDate
            );
            if (dateMatch) {
              targetData = dateMatch;
              console.log(`✅ ${formattedDate} 날짜 데이터 발견`);
            } else {
              console.warn(
                `⚠️ ${formattedDate} 날짜 데이터 없음, 최신 데이터 사용`
              );
            }
          }

          if (!targetData) {
            console.log(`${exchange} 거래소 빈 데이터 (${symbol})`);
            continue; // 다음 거래소 시도
          }

          const output1 = data.output1;

          console.log(`✅ ${symbol} 발견: ${exchange} 거래소`);

          return {
            symbol,
            name: symbol, // 해외주식은 종목명 별도 조회 필요
            price: parseFloat(targetData.clos), // 종가 사용
            change: parseFloat(output1.diff),
            changePercent: parseFloat(output1.rate),
            volume: parseInt(targetData.tvol),
            high: parseFloat(targetData.high),
            low: parseFloat(targetData.low),
            open: parseFloat(targetData.open),
            market: 'US',
            currency: 'USD',
            date: targetData.xymd.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
          };
        } catch (exchangeError) {
          console.log(
            `${exchange} 거래소 조회 오류 (${symbol}):`,
            exchangeError
          );
          continue; // 다음 거래소 시도
        }
      }

      // 모든 거래소에서 실패
      console.error(`모든 거래소에서 ${symbol} 조회 실패`);
      return null;
    } catch (error) {
      console.error(`해외주식 조회 오류 (${symbol}):`, error);
      return null;
    }
  }

  // 🎯 통합 주식 가격 조회 (한국/미국 자동 분기)
  async getStockPrice(
    symbol: string,
    market: 'KR' | 'US',
    targetDate?: string
  ): Promise<StockPrice | null> {
    console.log(
      `📊 ${market} 주식 조회: ${symbol}${
        targetDate ? ` (${targetDate})` : ' (현재가)'
      }`
    );

    if (market === 'KR') {
      return await this.getDomesticStockPrice(symbol, targetDate);
    } else {
      return await this.getOverseaStockPrice(symbol, targetDate);
    }
  }

  // 🔍 API 상태 체크
  async checkApiStatus(): Promise<{ domestic: boolean; overseas: boolean }> {
    try {
      const token = await this.getAccessToken();

      return {
        domestic: !!token,
        overseas: !!token,
      };
    } catch (error) {
      console.error('KIS API 상태 체크 실패:', error);
      return {
        domestic: false,
        overseas: false,
      };
    }
  }
}

// 💎 글로벌 인스턴스 생성
export const kisAPI = new KISApiClient(process.env.NODE_ENV !== 'production');

// 📊 매매기록에 주가 정보 자동 추가
export async function enrichTradeWithMarketData(
  symbol: string,
  market: 'KR' | 'US',
  date?: string
): Promise<{
  currentPrice?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  marketKospi?: number;
  marketNasdaq?: number;
  marketSp500?: number;
}> {
  try {
    console.log(
      `💹 시장 데이터 수집: ${symbol} (${market})${
        date ? ` - ${date}` : ' - 현재가'
      }`
    );

    // 해당 종목 특정 날짜/현재가 조회
    const stockData = await kisAPI.getStockPrice(symbol, market, date);

    if (stockData) {
      console.log(
        `✅ ${symbol} 현재가: ${stockData.price.toLocaleString()}${
          stockData.currency === 'USD' ? '$' : '원'
        }`
      );
      console.log(
        `📊 전일대비: ${
          stockData.change >= 0 ? '+' : ''
        }${stockData.changePercent.toFixed(1)}%`
      );
    }

    // 추후 주요 지수 조회도 추가 가능
    // const kospiData = await kisAPI.getDomesticStockPrice('0001'); // 코스피200
    // const nasdaqData = await kisAPI.getOverseaStockPrice('IXIC'); // 나스닥

    return {
      currentPrice: stockData?.price,
      change: stockData?.change,
      changePercent: stockData?.changePercent,
      volume: stockData?.volume,
      // marketKospi: kospiData?.price,
      // marketNasdaq: nasdaqData?.price,
      // marketSp500: sp500Data?.price,
    };
  } catch (error) {
    console.error('시장 데이터 수집 실패:', error);
    return {};
  }
}
