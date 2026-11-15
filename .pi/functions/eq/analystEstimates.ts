/**
 * Consensus analyst estimates from Equibles: one row per metric, period, and statistic (such as Revenue average for a quarter).
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.metric - Exact source label to keep, such as "Revenue".
 * @param input.limit - Rows (default 100, max 100).
 * @param input.offset - Rows to skip.
 */
async function analystEstimates(
  { pinance: { list } },
  input: { ticker: string; metric?: string; limit?: number; offset?: number },
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: { [key: string]: PitJsonValue }[];
  meta: { [key: string]: PitJsonValue };
  url: string;
  count: number;
}> {
  const res = await list(
    "equibles",
    "/v1/stocks/{ticker}/analyst-estimates",
    { ...input, limit: Math.min(input.limit ?? 100, 100) },
    "data",
  );
  // The snapshot history is bulky and rarely needed; keep the current snapshot's details.
  const { snapshots: _snapshots, ...meta } = res.meta;
  return { ...res, meta };
}
