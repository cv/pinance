/**
 * Historical OHLCV prices for a stock over a date range.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.start_date - Start date, YYYY-MM-DD.
 * @param input.end_date - End date, YYYY-MM-DD.
 * @param input.interval - "minute", "day" (default), "week", "month", or "year".
 * @param input.interval_multiplier - Bars per interval, such as 5 with "minute" (default 1).
 */
async function prices(
  { fd: { request } },
  input: {
    ticker: string;
    start_date: string;
    end_date: string;
    interval?: "minute" | "day" | "week" | "month" | "year";
    interval_multiplier?: number;
  },
): Promise<{ data: { [key: string]: PitJsonValue }[]; url: string; count: number }> {
  const { data, url } = await request("/prices/", {
    ticker: input.ticker,
    interval: input.interval ?? "day",
    interval_multiplier: input.interval_multiplier ?? 1,
    start_date: input.start_date,
    end_date: input.end_date,
  });
  const rows = data.prices ?? [];
  return { data: rows, url, count: rows.length };
}
