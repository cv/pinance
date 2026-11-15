/**
 * Analyst estimates, including EPS forecasts, for consensus expectations and growth outlook.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.period - "annual" (default) or "quarterly".
 */
async function estimates(
  { fd: { request } },
  input: { ticker: string; period?: "annual" | "quarterly" },
): Promise<{ data: { [key: string]: PitJsonValue }[]; url: string; count: number }> {
  const { data, url } = await request("/analyst-estimates/", {
    ticker: input.ticker,
    period: input.period ?? "annual",
  });
  const rows = data.analyst_estimates ?? [];
  return { data: rows, url, count: rows.length };
}
