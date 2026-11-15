/**
 * Latest settled daily close, change, volume, and 52-week range for up to 25 stocks or ETFs, from Equibles.
 *
 * @param input.tickers - Exact listed symbols, such as ["AAPL", "MSFT"], or "MIC:TICKER" for non-US listings.
 */
async function latestPrices(
  { eq: { request } },
  input: { tickers: string[] },
): Promise<{
  data: { [key: string]: PitJsonValue }[];
  meta: { [key: string]: PitJsonValue };
  url: string;
}> {
  if (input.tickers.length === 0 || input.tickers.length > 25)
    throw new Error("eq.latestPrices takes 1 to 25 tickers.");
  const { data: body, url } = await request("/v1/prices/latest", {
    tickers: input.tickers.map((t) => t.trim().toUpperCase()).join(","),
  });
  const { data = [], meta = {}, ...rest } = body;
  return { data, meta: { ...rest, ...meta }, url };
}
