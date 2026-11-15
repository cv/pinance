/**
 * Revenue by segment, geography, and product for every reported fiscal year, from Equibles.
 *
 * @param input.ticker - Stock ticker, such as "AAPL", or "MIC:TICKER" for a non-US listing.
 */
async function revenueBreakdown(
  { eq: { request } },
  input: { ticker: string },
): Promise<{ data: { [key: string]: PitJsonValue }; url: string }> {
  return request(
    `/v1/stocks/${encodeURIComponent(input.ticker.trim().toUpperCase())}/revenue-breakdown`,
  );
}
