/**
 * Daily, weekly, or monthly OHLCV bars for a stock or ETF from Equibles, newest first.
 *
 * @param input.ticker - Exact listed symbol, such as "NVDA" or "BRK-A", or "MIC:TICKER" such as "XETR:SIE".
 * @param input.startDate - First date, YYYY-MM-DD (default one year ago).
 * @param input.endDate - Last date, YYYY-MM-DD (default today).
 * @param input.interval - "daily" (default), "weekly", or "monthly".
 * @param input.limit - Bars (default 260, max 500).
 * @param input.offset - Bars to skip.
 */
async function prices(
  { pinance: { list } },
  input: {
    ticker: string;
    startDate?: string;
    endDate?: string;
    interval?: "daily" | "weekly" | "monthly";
    limit?: number;
    offset?: number;
  },
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: { [key: string]: PitJsonValue }[];
  meta: { [key: string]: PitJsonValue };
  url: string;
  count: number;
}> {
  return list("equibles", "/v1/stocks/{ticker}/prices", input, "data");
}
