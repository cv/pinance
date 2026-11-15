/**
 * Consensus analyst estimates from Equibles: one row per metric, period, and statistic.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.metric - Exact source label to keep, such as "Revenue".
 * @param input.limit - Rows (default 100, max 100).
 * @param input.offset - Rows to skip.
 */
async function analystEstimates(
  { eq: { request } },
  input: { ticker: string; metric?: string; limit?: number; offset?: number },
): Promise<{
  data: { [key: string]: PitJsonValue }[];
  meta: { [key: string]: PitJsonValue };
  url: string;
}> {
  const { data: body, url } = await request(
    `/v1/stocks/${encodeURIComponent(input.ticker.trim().toUpperCase())}/analyst-estimates`,
    {
      metric: input.metric,
      limit: Math.min(input.limit ?? 100, 100),
      offset: input.offset,
    },
  );
  const { data = [], snapshots: _snapshots, ...meta } = body;
  return { data, meta, url };
}
