/**
 * Latest settled daily close, change, volume, and 52-week range for up to 25 stocks or ETFs, from Equibles.
 *
 * @param input.tickers - Exact listed symbols, such as ["AAPL", "MSFT"], or "MIC:TICKER" for non-US listings.
 */
async function latestPrices(
  { pinance: { list } },
  input: { tickers: string[] },
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: { [key: string]: PitJsonValue }[];
  meta: { [key: string]: PitJsonValue };
  url: string;
  count: number;
}> {
  if (input.tickers.length === 0 || input.tickers.length > 25)
    throw new Error("eq.latestPrices takes 1 to 25 tickers.");
  return list(
    "equibles",
    "/v1/prices/latest",
    { tickers: input.tickers.map((t) => t.trim()).join(",") },
    "data",
  );
}
