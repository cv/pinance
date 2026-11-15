/**
 * Current valuation for one or more stocks, normalized across providers:
 *
 * @param input.tickers - Stock tickers, such as ["AAPL", "MSFT"].
 * @param input.provider - "financialdatasets" or "equibles" (or "fd"/"eq"); default: the configured provider.
 */
async function valuation(
  { pinance: { choose }, fd: { metricsSnapshot }, eq: { valuationMultiples } },
  input: { tickers: string[]; provider?: string },
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: {
    ticker: string;
    marketCap: number | null;
    enterpriseValue: number | null;
    pe: number | null;
    evToEbitda: number | null;
    evToRevenue: number | null;
    priceToBook: number | null;
    priceToSales: number | null;
  }[];
  count: number;
  url: string;
  sources: string[];
}> {
  const num = (v: PitJsonValue | undefined) => (typeof v === "number" ? v : null);
  const provider = await choose({ provider: input.provider, dataset: "valuation" });
  const tickers = input.tickers.map((t) => t.trim().toUpperCase());
  if (provider === "equibles") {
    const results = await Promise.all(tickers.map((ticker) => valuationMultiples({ ticker })));
    const data = results.map(({ data }, i) => {
      const r = (data && typeof data === "object" && !Array.isArray(data) ? data : {}) as {
        [key: string]: PitJsonValue;
      };
      return {
        ticker: String(r.ticker ?? tickers[i]),
        marketCap: num(r.marketCap),
        enterpriseValue: num(r.enterpriseValue),
        pe: num(r.peRatio),
        evToEbitda: num(r.evToEbitda),
        evToRevenue: num(r.evToRevenue),
        priceToBook: num(r.priceToBook),
        priceToSales: num(r.priceToSales),
      };
    });
    const sources = results.map((r) => r.url);
    return { provider, data, count: data.length, url: sources[0] ?? "", sources };
  }
  const results = await Promise.all(tickers.map((ticker) => metricsSnapshot({ ticker })));
  const data = results.map(({ data: r }, i) => ({
    ticker: String(r.ticker ?? tickers[i]),
    marketCap: num(r.market_cap),
    enterpriseValue: num(r.enterprise_value),
    pe: num(r.price_to_earnings_ratio),
    evToEbitda: num(r.enterprise_value_to_ebitda_ratio),
    evToRevenue: num(r.enterprise_value_to_revenue_ratio),
    priceToBook: num(r.price_to_book_ratio),
    priceToSales: num(r.price_to_sales_ratio),
  }));
  const sources = results.map((r) => r.url);
  return { provider, data, count: data.length, url: sources[0] ?? "", sources };
}
