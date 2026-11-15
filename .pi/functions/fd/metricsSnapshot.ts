/**
 * Current financial metrics for a company, such as market cap, P/E ratio, and dividend yield.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 */
async function metricsSnapshot(
  { fd: { request } },
  input: { ticker: string },
): Promise<{ data: { [key: string]: PitJsonValue }; url: string }> {
  const { data, url } = await request("/financial-metrics/snapshot/", { ticker: input.ticker });
  return { data: data.snapshot ?? {}, url };
}
