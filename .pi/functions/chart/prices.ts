/**
 * A closing-price chart for one or more tickers from market.prices, ready to post.
 *
 * @param input.tickers - One to six tickers, such as ["NVDA", "AMD"].
 * @param input.startDate - First date, YYYY-MM-DD.
 * @param input.endDate - Last date, YYYY-MM-DD.
 * @param input.interval - "day" (default), "week", or "month".
 * @param input.provider - "fd" or "eq"; default: the active provider.
 * @param input.rebase - Rebase to 100 (default: true with several tickers).
 * @param input.maxPoints - Most points to plot (default 40).
 */
async function prices(
  { market: { prices: bars }, chart: { xy } },
  input: {
    tickers: string[];
    startDate: string;
    endDate: string;
    interval?: "day" | "week" | "month";
    provider?: string;
    rebase?: boolean;
    maxPoints?: number;
  },
): Promise<{
  markdown: string;
  mermaid: string;
  caption: string;
  provider: string;
  sources: string[];
  points: number;
}> {
  const tickers = [...new Set(input.tickers.map((t) => t.trim().toUpperCase()).filter(Boolean))];
  if (tickers.length === 0 || tickers.length > 6)
    throw new Error("chart.prices takes one to six tickers.");
  const results = await Promise.all(
    tickers.map((ticker) =>
      bars({
        ticker,
        startDate: input.startDate,
        endDate: input.endDate,
        interval: input.interval ?? "day",
        provider: input.provider,
      }),
    ),
  );
  const closes = results.map(
    (r) =>
      new Map(
        (r.data as { date: string; close: number }[]).map((b) => [
          String(b.date).slice(0, 10),
          b.close,
        ]),
      ),
  );
  const dates = [...closes[0].keys()].filter((d) => closes.every((m) => m.has(d))).sort();
  if (dates.length === 0)
    throw new Error(
      `No dates with prices for all of ${tickers.join(", ")} between ${input.startDate} and ${input.endDate}.`,
    );
  const rebase = input.rebase ?? tickers.length > 1;
  const series = tickers.map((ticker, k) => {
    const base = closes[k].get(dates[0]) as number;
    return {
      name: ticker,
      values: dates.map((d) =>
        rebase ? ((closes[k].get(d) as number) / base) * 100 : (closes[k].get(d) as number),
      ),
    };
  });
  const sources = results.flatMap((r) => (Array.isArray(r.sources) ? r.sources : [r.url]));
  const chart = await xy({
    title: `${tickers.join(" vs ")} closing price, ${dates[0]} to ${dates[dates.length - 1]}`,
    x: dates,
    series,
    yLabel: rebase ? `Close, rebased to 100 on ${dates[0]}` : "Close",
    unit: rebase ? undefined : "$",
    scale: "none",
    maxPoints: input.maxPoints,
    source: sources,
  });
  return {
    markdown: chart.markdown,
    mermaid: chart.mermaid,
    caption: chart.caption,
    provider: results[0].provider,
    sources,
    points: chart.points,
  };
}
