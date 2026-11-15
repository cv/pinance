/**
 * Valuation multiples from Equibles: current snapshot or quarterly history.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.history - true for quarterly points (oldest first) instead of the current snapshot.
 */
async function valuationMultiples(
  { eq: { request } },
  input: { ticker: string; history?: boolean },
): Promise<{ data: PitJsonValue; url: string }> {
  const base = `/v1/stocks/${encodeURIComponent(input.ticker.trim().toUpperCase())}/valuation-multiples`;
  const { data, url } = await request(input.history ? `${base}/history` : base);
  return { data: input.history ? (data.points ?? []) : data, url };
}
