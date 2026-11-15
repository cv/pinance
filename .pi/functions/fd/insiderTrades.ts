/**
 * Insider transactions from SEC Form 4 filings: purchases and sales by executives, directors, and other insiders.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.limit - Maximum trades (default 100, max 1000).
 * @param input.filing_date - Only this filing date, YYYY-MM-DD.
 * @param input.filing_date_gt - Only filings after this date, YYYY-MM-DD.
 * @param input.filing_date_gte - Only filings on or after this date, YYYY-MM-DD.
 * @param input.filing_date_lt - Only filings before this date, YYYY-MM-DD.
 * @param input.filing_date_lte - Only filings on or before this date, YYYY-MM-DD.
 */
async function insiderTrades(
  { pinance: { list } },
  input: {
    ticker: string;
    limit?: number;
    filing_date?: string;
    filing_date_gt?: string;
    filing_date_gte?: string;
    filing_date_lt?: string;
    filing_date_lte?: string;
  },
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: { [key: string]: PitJsonValue }[];
  url: string;
  count: number;
  meta?: { [key: string]: PitJsonValue };
}> {
  return list(
    "financialdatasets",
    "/insider-trades/",
    { ...input, limit: Math.min(input.limit ?? 100, 1000) },
    "insider_trades",
  );
}
