/**
 * Revenue by segment, geography, and product for every reported fiscal year, plus segment operating income and margin, from Equibles.
 *
 * @param input.ticker - Stock ticker, such as "AAPL", or "MIC:TICKER" for a non-US listing.
 */
async function revenueBreakdown(
  { pinance: { get } },
  input: { ticker: string },
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: { [key: string]: PitJsonValue };
  url: string;
}> {
  const { provider, data, url } = await get("equibles", "/v1/stocks/{ticker}/revenue-breakdown", {
    ticker: input.ticker,
  });
  return { provider, data, url };
}
