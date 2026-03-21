import { NextResponse } from "next/server";

// Top CAC40 components — Yahoo Finance symbols
const SYMBOLS: { symbol: string; name: string }[] = [
  { symbol: "^FCHI",  name: "CAC 40"           },
  { symbol: "MC.PA",  name: "LVMH"             },
  { symbol: "TTE.PA", name: "TotalEnergies"    },
  { symbol: "SAN.PA", name: "Sanofi"           },
  { symbol: "AI.PA",  name: "Air Liquide"      },
  { symbol: "BNP.PA", name: "BNP Paribas"      },
  { symbol: "OR.PA",  name: "L'Oréal"          },
  { symbol: "SU.PA",  name: "Schneider"        },
  { symbol: "AIR.PA", name: "Airbus"           },
  { symbol: "CS.PA",  name: "AXA"              },
  { symbol: "DG.PA",  name: "Vinci"            },
  { symbol: "RMS.PA", name: "Hermès"           },
];

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketState: string;
}

async function fetchSymbol(symbol: string, name: string): Promise<StockQuote | null> {
  const encoded = encodeURIComponent(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=1d`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price: number = meta.regularMarketPrice ?? 0;
    const prev: number = meta.chartPreviousClose ?? price;
    const change = price - prev;
    const changePercent = prev !== 0 ? (change / prev) * 100 : 0;

    return {
      symbol,
      name,
      price,
      change,
      changePercent,
      marketState: "CLOSED", // v8 doesn't expose market state easily
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const results = await Promise.all(
    SYMBOLS.map(({ symbol, name }) => fetchSymbol(symbol, name))
  );

  const quotes: StockQuote[] = results.filter((q): q is StockQuote => q !== null);

  return NextResponse.json(
    { quotes, fetchedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "public, max-age=60" } }
  );
}
