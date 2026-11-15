/**
 * Speaker-labelled earnings call transcript from Equibles, in spoken order. Page with offset while meta.hasMore is true.
 *
 * @param input.ticker - Exact listed symbol, such as "NVDA", or "MIC:TICKER" for a non-US listing.
 * @param input.fiscalYear - The company's own fiscal year, such as 2027 for Nvidia's FY2027.
 * @param input.fiscalQuarter - Fiscal quarter, 1-4.
 * @param input.limit - Turns per response (default 50, max 200).
 * @param input.offset - Turns to skip (default 0).
 */
async function earningsCall(
  { pinance: { list } },
  input: {
    ticker: string;
    fiscalYear: number;
    fiscalQuarter: 1 | 2 | 3 | 4;
    limit?: number;
    offset?: number;
  },
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: { [key: string]: PitJsonValue }[];
  meta: { [key: string]: PitJsonValue };
  url: string;
  count: number;
}> {
  return list(
    "equibles",
    "/v1/stocks/{ticker}/earnings-calls/{fiscalYear}/{fiscalQuarter}/speakers",
    input,
    "data",
  );
}
