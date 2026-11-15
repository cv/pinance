/**
 * Financial statements for a company: income statements, balance sheets, cash flow statements, or all three in one call.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.period - "annual", "quarterly", or "ttm" (trailing twelve months).
 * @param input.statement - "income", "balance", "cash_flow", or "all" (default).
 * @param input.limit - Maximum periods to return (default 10).
 * @param input.report_period_gt - Only periods after this date, YYYY-MM-DD.
 * @param input.report_period_gte - Only periods on or after this date, YYYY-MM-DD.
 * @param input.report_period_lt - Only periods before this date, YYYY-MM-DD.
 * @param input.report_period_lte - Only periods on or before this date, YYYY-MM-DD.
 */
async function financialStatements(
  { fd: { request } },
  input: {
    ticker: string;
    period: "annual" | "quarterly" | "ttm";
    statement?: "income" | "balance" | "cash_flow" | "all";
    limit?: number;
    report_period_gt?: string;
    report_period_gte?: string;
    report_period_lt?: string;
    report_period_lte?: string;
  },
): Promise<{ data: PitJsonValue; url: string }> {
  const routes = {
    income: ["/financials/income-statements/", "income_statements"],
    balance: ["/financials/balance-sheets/", "balance_sheets"],
    cash_flow: ["/financials/cash-flow-statements/", "cash_flow_statements"],
    all: ["/financials/", "financials"],
  } as const;
  const [endpoint, key] = routes[input.statement ?? "all"];
  const { data, url } = await request(endpoint, {
    ticker: input.ticker,
    period: input.period,
    limit: input.limit ?? 10,
    report_period_gt: input.report_period_gt,
    report_period_gte: input.report_period_gte,
    report_period_lt: input.report_period_lt,
    report_period_lte: input.report_period_lte,
  });
  return { data: data[key] ?? {}, url };
}
