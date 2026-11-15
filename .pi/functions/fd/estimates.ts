/**
 * Analyst estimates, including EPS forecasts, for consensus expectations and growth outlook.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.period - "annual" (default) or "quarterly".
 */
async function estimates(
  { pinance: { list } },
  input: { ticker: string; period?: "annual" | "quarterly" },
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: { [key: string]: PitJsonValue }[];
  url: string;
  count: number;
  meta?: { [key: string]: PitJsonValue };
}> {
  return list(
    "financialdatasets",
    "/analyst-estimates/",
    { ticker: input.ticker, period: input.period ?? "annual" },
    "analyst_estimates",
  );
}
