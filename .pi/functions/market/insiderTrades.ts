/**
 * Insider transactions, normalized across providers, newest first:
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.startDate - Earliest date, YYYY-MM-DD.
 * @param input.endDate - Latest date, YYYY-MM-DD.
 * @param input.limit - Transactions (default 50).
 * @param input.provider - "financialdatasets" or "equibles" (or "fd"/"eq"); default: the configured provider.
 */
async function insiderTrades(
  { pinance: { choose }, fd: { insiderTrades: fdTrades }, eq: { insiderTransactions } },
  input: {
    ticker: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    provider?: string;
  },
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: {
    transactionDate: string | null;
    filingDate: string | null;
    name: string | null;
    title: string | null;
    type: string | null;
    direction: "buy" | "sell" | "other";
    shares: number | null;
    price: number | null;
    value: number | null;
    sharesOwnedAfter: number | null;
  }[];
  count: number;
  url: string;
  sources: string[];
}> {
  const num = (v: PitJsonValue | undefined) => (typeof v === "number" ? v : null);
  const str = (v: PitJsonValue | undefined) => (typeof v === "string" && v ? v : null);
  const direction = (type: string | null): "buy" | "sell" | "other" =>
    type && /\b(sale|sell|sold)\b/i.test(type)
      ? "sell"
      : type && /\b(purchase|buy|bought)\b/i.test(type)
        ? "buy"
        : "other";
  const provider = await choose({ provider: input.provider, dataset: "insider trades" });
  const limit = input.limit ?? 50;
  if (provider === "equibles") {
    const res = await insiderTransactions({
      ticker: input.ticker,
      startDate: input.startDate,
      endDate: input.endDate,
      limit,
    });
    const data = res.data.map((r) => {
      const type = str(r.transactionType);
      return {
        transactionDate: str(r.transactionDate),
        filingDate: str(r.filingDate),
        name: str(r.insiderName),
        title: str(r.role),
        type,
        direction: direction(type),
        shares: num(r.shares),
        price: num(r.pricePerShare),
        value: num(r.value),
        sharesOwnedAfter: num(r.sharesOwnedAfter),
      };
    });
    return { provider, data, count: data.length, url: res.url, sources: [res.url] };
  }
  const res = await fdTrades({
    ticker: input.ticker,
    filing_date_gte: input.startDate,
    filing_date_lte: input.endDate,
    limit,
  });
  const data = res.data.map((r) => {
    const type = str(r.transaction_type);
    return {
      transactionDate: str(r.transaction_date),
      filingDate: str(r.filing_date),
      name: str(r.name),
      title: str(r.title),
      type,
      direction: direction(type),
      shares: num(r.transaction_shares),
      price: num(r.transaction_price_per_share),
      value: num(r.transaction_value),
      sharesOwnedAfter: num(r.shares_owned_after_transaction),
    };
  });
  return { provider, data, count: data.length, url: res.url, sources: [res.url] };
}
