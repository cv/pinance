/**
 * Insider transactions (SEC Forms 3, 4, 5) for a stock from Equibles, newest first.
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
  { eq: { request } },
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
  data: { [key: string]: PitJsonValue }[];
  meta: { [key: string]: PitJsonValue };
  url: string;
}> {
  const { data: body, url } = await request(
    `/v1/stocks/${encodeURIComponent(input.ticker.trim().toUpperCase())}/insider-transactions`,
    {
      startDate: input.startDate,
      endDate: input.endDate,
      transactionType: input.transactionType,
      insiderName: input.insiderName,
      limit: input.limit,
      offset: input.offset,
    },
  );
  const { data = [], meta = {}, ...rest } = body;
  return { data, meta: { ...rest, ...meta }, url };
}
