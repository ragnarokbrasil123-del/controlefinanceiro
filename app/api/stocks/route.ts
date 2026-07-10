import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tickersParam = searchParams.get('tickers');

  if (!tickersParam) {
    return NextResponse.json({ error: 'Nenhum ticker fornecido.' }, { status: 400 });
  }

  const tickers = tickersParam.split(',').map(t => t.trim().toUpperCase());
  const results = [];

  for (const ticker of tickers) {
    try {
      // Append .SA for Brazilian stocks if not specified and doesn't look like a US stock
      let formattedTicker = ticker;
      if (/^[A-Z]{4}\d{1,2}$/.test(ticker)) {
        formattedTicker = `${ticker}.SA`;
      }

      const quote = (await yahooFinance.quote(formattedTicker)) as any;
      results.push({
        ticker: ticker,
        symbol: quote.symbol,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        name: quote.shortName || quote.longName || ticker,
      });
    } catch (error) {
      console.error(`Erro ao buscar ${ticker}:`, error);
      // Return a fallback or just skip
      results.push({
        ticker: ticker,
        error: true,
        price: 0,
        change: 0,
        changePercent: 0,
        name: ticker,
      });
    }
  }

  return NextResponse.json(results);
}
