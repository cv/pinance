/**
 * Income statement segments: revenue by product line and by business segment or geography, plus segment operating income and depreciation.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.period - "annual" or "quarterly".
 * @param input.limit - Number of periods (default 4).
 * @param input.report_period - Only this exact report period, YYYY-MM-DD.
 * @param input.report_period_gte - Only periods on or after this date, YYYY-MM-DD.
 * @param input.report_period_lte - Only periods on or before this date, YYYY-MM-DD.
 */
async function segmentedRevenues(
  { pinance: { get } },
  input: {
    ticker: string;
    period: "annual" | "quarterly";
    limit?: number;
    report_period?: string;
    report_period_gte?: string;
    report_period_lte?: string;
  },
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: { [key: string]: PitJsonValue }[];
  url: string;
  count: number;
}> {
  const { provider, data, url } = await get(
    "financialdatasets",
    "/financials/income-statements/segments/",
    { ...input, limit: input.limit ?? 4 },
  );
  // The API returns `income_statement_segments`; its docs still show `segmented_financials`.
  const rows = data.income_statement_segments ?? data.segmented_financials ?? [];
  return { provider, data: rows, url, count: rows.length };
}
