/**
 * Latest quotes for one or more stocks, normalized across providers: { ticker, price, change, changePercent, asOf, currency }.
 *
 * @param input.tickers - Stock tickers, such as ["AAPL", "MSFT"].
 * @param input.provider - "financialdatasets" or "equibles" (or "fd"/"eq"); default: the configured provider.
 */
async function quote(
  { pinance: { choose }, fd: { priceSnapshot }, eq: { latestPrices } },
  input: { tickers: string[]; provider?: string },
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: {
    ticker: string;
    price: number | null;
    change: number | null;
    changePercent: number | null;
    asOf: string | null;
    currency: string | null;
  }[];
  count: number;
  url: string;
  sources: string[];
}> {
  const num = (v: PitJsonValue | undefined) =>
    typeof v === "number"
      ? v
      : typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))
        ? Number(v)
        : null;
  const str = (v: PitJsonValue | undefined) => (typeof v === "string" ? v : null);
  const provider = await choose({ provider: input.provider, dataset: "quotes" });
  if (provider === "equibles") {
    const res = await latestPrices({ tickers: input.tickers });
    const data = res.data.map((r) => ({
      ticker: String(r.ticker),
      price: num(r.close),
      change: num(r.change),
      changePercent: num(r.changePercent),
      asOf: str(r.date),
      currency: str(r.currency),
    }));
    return { provider, data, count: data.length, url: res.url, sources: [res.url] };
  }
  const results = await Promise.all(input.tickers.map((ticker) => priceSnapshot({ ticker })));
  const data = results.map(({ data: r }, i) => ({
    ticker: String(r.ticker ?? input.tickers[i]?.toUpperCase()),
    price: num(r.price),
    change: num(r.day_change),
    changePercent: num(r.day_change_percent),
    asOf: str(r.time),
    currency: null,
  }));
  const sources = results.map((r) => r.url);
  return { provider, data, count: data.length, url: sources[0] ?? "", sources };
}
