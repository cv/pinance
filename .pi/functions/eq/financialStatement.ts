/**
 * One financial statement for one period from Equibles, as reported line items.
 *
 * @param input.ticker - Stock ticker, such as "AAPL", or "MIC:TICKER" for a non-US listing.
 * @param input.statement - "income", "balance", or "cashflow".
 * @param input.year - Fiscal year, such as 2026.
 * @param input.period - "FY" or "Q1" to "Q4".
 */
async function financialStatement(
  { eq: { request } },
  input: {
    ticker: string;
    statement: "income" | "balance" | "cashflow";
    year?: number;
    period?: "FY" | "Q1" | "Q2" | "Q3" | "Q4";
  },
): Promise<{
  data: { [key: string]: PitJsonValue }[];
  meta: { [key: string]: PitJsonValue };
  url: string;
}> {
  const { data: body, url } = await request(
    `/v1/stocks/${encodeURIComponent(input.ticker.trim().toUpperCase())}/financial-statements/${input.statement}`,
    { year: input.year, period: input.period },
  );
  const { data = [], ...meta } = body;
  return { data, meta, url };
}
