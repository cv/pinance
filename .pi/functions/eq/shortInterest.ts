/**
 * Bi-monthly FINRA short interest for a stock or ETF from Equibles, newest first: short position, change, average daily volume, days to cover.
 *
 * @param input.ticker - Exact listed symbol, such as "GME".
 * @param input.startDate - First settlement date, YYYY-MM-DD (default: trailing 12 months).
 * @param input.endDate - Last settlement date, YYYY-MM-DD.
 * @param input.limit - Rows (default 24, max 500).
 * @param input.offset - Rows to skip.
 */
async function shortInterest(
  { pinance: { list } },
  input: { ticker: string; startDate?: string; endDate?: string; limit?: number; offset?: number },
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: { [key: string]: PitJsonValue }[];
  meta: { [key: string]: PitJsonValue };
  url: string;
  count: number;
}> {
  return list("equibles", "/v1/stocks/{ticker}/short-interest", input, "data");
}
