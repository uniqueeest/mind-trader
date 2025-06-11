import { NextRequest, NextResponse } from 'next/server';
import { kisAPI } from '@/lib/kis-api';
import { Market } from '@prisma/client';

// 실시간 종가 조회 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, market, date } = body;

    if (!symbol || !market) {
      return NextResponse.json(
        { error: '종목명과 시장 정보가 필요합니다' },
        { status: 400 }
      );
    }

    console.log(
      `📈 종가 조회: ${symbol} (${market})${date ? ` - ${date}` : ' - 현재가'}`
    );

    // KIS API로 종가 조회 (날짜 지정 가능)
    const stockData = await kisAPI.getStockPrice(
      symbol,
      market as Market,
      date
    );

    if (!stockData) {
      return NextResponse.json(
        { error: '종가 정보를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    console.log(`✅ ${symbol} 현재가: ${stockData.price.toLocaleString()}`);

    return NextResponse.json({
      symbol: stockData.symbol,
      name: stockData.name,
      price: stockData.price,
      change: stockData.change,
      changePercent: stockData.changePercent,
      volume: stockData.volume,
      high: stockData.high,
      low: stockData.low,
      open: stockData.open,
      market: stockData.market,
      currency: stockData.currency,
      date: stockData.date,
    });
  } catch (error) {
    console.error('실시간 종가 조회 오류:', error);
    return NextResponse.json(
      { error: '종가 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
