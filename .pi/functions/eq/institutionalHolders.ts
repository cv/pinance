/**
 * Largest 13F institutional holders of a stock or ETF from Equibles, ranked by shares, with value, share of total, holder type, and style.
 *
 * @param input.ticker - Exact listed symbol, such as "AAPL".
 * @param input.reportDate - 13F report date, YYYY-MM-DD (default latest; must be one of the stock's report dates).
 * @param input.holderTypes - Holder types to keep: adv, era, ia, bank, ins, bd, fund, plan, nonus, hc, unk.
 * @param input.styles - Styles to keep: idx (index-like), sys (systematic-like), conc (concentrated), divact (diversified active), unk.
 * @param input.limit - Rows (default 20, max 500).
 * @param input.offset - Rows to skip.
 */
async function institutionalHolders(
  { pinance: { list } },
  input: {
    ticker: string;
    reportDate?: string;
    holderTypes?: string[];
    styles?: string[];
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
    "/v1/stocks/{ticker}/institutional-holders",
    { ...input, holderTypes: input.holderTypes?.join(","), styles: input.styles?.join(",") },
    "data",
  );
}
