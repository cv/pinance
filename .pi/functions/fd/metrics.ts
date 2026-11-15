/**
 * Historical financial metrics, such as P/E ratio, revenue per share, and enterprise value, for trend analysis.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.period - "annual", "quarterly", or "ttm" (default).
 * @param input.limit - Number of periods (default 4).
 * @param input.report_period - Only this exact report period, YYYY-MM-DD.
 * @param input.report_period_gt - Only periods after this date, YYYY-MM-DD.
 * @param input.report_period_gte - Only periods on or after this date, YYYY-MM-DD.
 * @param input.report_period_lt - Only periods before this date, YYYY-MM-DD.
 * @param input.report_period_lte - Only periods on or before this date, YYYY-MM-DD.
 */
async function metrics(
  { pinance: { list } },
  input: {
    ticker: string;
    period?: "annual" | "quarterly" | "ttm";
    limit?: number;
    report_period?: string;
    report_period_gt?: string;
    report_period_gte?: string;
    report_period_lt?: string;
    report_period_lte?: string;
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
    "/financial-metrics/",
    { ...input, period: input.period ?? "ttm", limit: input.limit ?? 4 },
    "financial_metrics",
  );
}
