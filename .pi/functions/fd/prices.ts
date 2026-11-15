/**
 * Historical OHLCV prices for a stock over a date range, oldest first.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.start_date - Start date, YYYY-MM-DD.
 * @param input.end_date - End date, YYYY-MM-DD.
 * @param input.interval - "minute", "day" (default), "week", "month", or "year".
 * @param input.interval_multiplier - Bars per interval, such as 5 with "minute" (default 1).
 */
async function prices(
  { pinance: { list } },
  input: {
    ticker: string;
    start_date: string;
    end_date: string;
    interval?: "minute" | "day" | "week" | "month" | "year";
    interval_multiplier?: number;
  },
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: { [key: string]: PitJsonValue }[];
  url: string;
  count: number;
  meta?: { [key: string]: PitJsonValue };
}> {
  return list(
    "financialdatasets",
    "/prices/",
    {
      ...input,
      interval: input.interval ?? "day",
      interval_multiplier: input.interval_multiplier ?? 1,
    },
    "prices",
  );
}
