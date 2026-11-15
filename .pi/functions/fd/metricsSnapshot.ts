/**
 * Current financial metrics for a company, such as market cap, P/E ratio, and dividend yield.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 */
async function metricsSnapshot(
  { pinance: { get } },
  input: { ticker: string },
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: { [key: string]: PitJsonValue };
  url: string;
  meta?: { [key: string]: PitJsonValue };
}> {
  return get(
    "financialdatasets",
    "/financial-metrics/snapshot/",
    { ticker: input.ticker },
    { rows: "snapshot", object: true },
  );
}
