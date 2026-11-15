/**
 * Historical OHLCV prices for a cryptocurrency pair over a date range. Needs a Financial Datasets plan with crypto access.
 *
 * @param input.ticker - Crypto pair, such as "BTC-USD".
 * @param input.start_date - Start date, YYYY-MM-DD.
 * @param input.end_date - End date, YYYY-MM-DD.
 * @param input.interval - "minute", "day" (default), "week", "month", or "year".
 * @param input.interval_multiplier - Bars per interval (default 1).
 */
async function cryptoPrices(
  { fd: { request } },
  input: {
    ticker: string;
    start_date: string;
    end_date: string;
    interval?: "minute" | "day" | "week" | "month" | "year";
    interval_multiplier?: number;
  },
): Promise<{ data: { [key: string]: PitJsonValue }[]; url: string; count: number }> {
  const { data, url } = await request("/crypto/prices/", {
    ticker: input.ticker,
    interval: input.interval ?? "day",
    interval_multiplier: input.interval_multiplier ?? 1,
    start_date: input.start_date,
    end_date: input.end_date,
  });
  const rows = data.prices ?? [];
  return { data: rows, url, count: rows.length };
}
