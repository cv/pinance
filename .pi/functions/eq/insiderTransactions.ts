/**
 * Insider transactions (SEC Forms 3, 4, 5) for a stock from Equibles, newest first, with role, type, shares, price, and value.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.startDate - First transaction date, YYYY-MM-DD.
 * @param input.endDate - Last transaction date, YYYY-MM-DD.
 * @param input.transactionType - Such as "Buy", "Sell", "Award", "Exercise", "Gift" ("Purchase" and "Sale" also work).
 * @param input.insiderName - Words that must all occur in the filed name.
 * @param input.limit - Rows (default 50, max 500).
 * @param input.offset - Rows to skip.
 */
async function insiderTransactions(
  { pinance: { list } },
  input: {
    ticker: string;
    startDate?: string;
    endDate?: string;
    transactionType?: string;
    insiderName?: string;
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
  return list("equibles", "/v1/stocks/{ticker}/insider-transactions", input, "data");
}
