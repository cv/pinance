/**
 * One financial statement for one period from Equibles, as reported line items (lineItem, value, unit, period, form, filing).
 *
 * @param input.ticker - Stock ticker, such as "AAPL", or "MIC:TICKER" for a non-US listing.
 * @param input.statement - "income", "balance", or "cashflow".
 * @param input.year - Fiscal year, such as 2026.
 * @param input.period - "FY" or "Q1" to "Q4".
 */
async function financialStatement(
  { pinance: { list } },
  input: {
    ticker: string;
    statement: "income" | "balance" | "cashflow";
    year?: number;
    period?: "FY" | "Q1" | "Q2" | "Q3" | "Q4";
  },
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: { [key: string]: PitJsonValue }[];
  meta: { [key: string]: PitJsonValue };
  url: string;
  count: number;
}> {
  return list("equibles", "/v1/stocks/{ticker}/financial-statements/{statement}", input, "data");
}
