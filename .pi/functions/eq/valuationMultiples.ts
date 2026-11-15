/**
 * Valuation multiples from Equibles: current (market cap, EV, P/E, forward P/E, EV/EBITDA, TTM figures) or quarterly history.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.history - true for quarterly points (oldest first) instead of the current snapshot.
 */
async function valuationMultiples(
  { pinance: { get, list } },
  input: { ticker: string; history?: boolean },
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: PitJsonValue;
  url: string;
  count?: number;
  meta?: { [key: string]: PitJsonValue };
}> {
  return input.history
    ? list(
        "equibles",
        "/v1/stocks/{ticker}/valuation-multiples/history",
        { ticker: input.ticker },
        "points",
      )
    : get("equibles", "/v1/stocks/{ticker}/valuation-multiples", { ticker: input.ticker });
}
