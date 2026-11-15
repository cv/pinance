/**
 * Daily, weekly, or monthly OHLCV bars for a stock, normalized across providers and sorted oldest first:
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.startDate - First date, YYYY-MM-DD.
 * @param input.endDate - Last date, YYYY-MM-DD.
 * @param input.interval - "day" (default), "week", or "month".
 * @param input.provider - "financialdatasets" or "equibles" (or "fd"/"eq"); default: the configured provider.
 */
async function prices(
  { pinance: { choose }, fd: { prices: fdPrices }, eq: { prices: eqPrices } },
  input: {
    ticker: string;
    startDate: string;
    endDate: string;
    interval?: "day" | "week" | "month";
    provider?: string;
  },
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: {
    date: string;
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
    volume: number | null;
  }[];
  count: number;
  url: string;
  sources: string[];
}> {
  const num = (v: PitJsonValue | undefined) => (typeof v === "number" ? v : null);
  const bar = (date: string, r: { [key: string]: PitJsonValue }) => ({
    date,
    open: num(r.open),
    high: num(r.high),
    low: num(r.low),
    close: num(r.close),
    volume: num(r.volume),
  });
  const interval = input.interval ?? "day";
  const provider = await choose({ provider: input.provider, dataset: "price history" });
  let rows: ReturnType<typeof bar>[] = [];
  const sources: string[] = [];
  if (provider === "equibles") {
    const eqInterval = ({ day: "daily", week: "weekly", month: "monthly" } as const)[interval];
    for (let offset = 0, page = 0; page < 5; page++, offset += 500) {
      const res = await eqPrices({
        ticker: input.ticker,
        startDate: input.startDate,
        endDate: input.endDate,
        interval: eqInterval,
        limit: 500,
        offset,
      });
      sources.push(res.url);
      rows.push(...res.data.map((r) => bar(String(r.date), r)));
      if (res.meta.hasMore !== true) break;
    }
  } else {
    const res = await fdPrices({
      ticker: input.ticker,
      start_date: input.startDate,
      end_date: input.endDate,
      interval,
    });
    sources.push(res.url);
    rows = res.data.map((r) => bar(String(r.time).slice(0, 10), r));
  }
  rows.sort((a, b) => a.date.localeCompare(b.date));
  return { provider, data: rows, count: rows.length, url: sources[0] ?? "", sources };
}
