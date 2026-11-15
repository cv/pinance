/**
 * Recent news articles about a company, for announcements, market trends, and sentiment.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.start_date - Only articles on or after this date, YYYY-MM-DD.
 * @param input.end_date - Only articles on or before this date, YYYY-MM-DD.
 * @param input.limit - Number of articles (default 10, max 100).
 */
async function news(
  { fd: { request } },
  input: { ticker: string; start_date?: string; end_date?: string; limit?: number },
): Promise<{ data: { [key: string]: PitJsonValue }[]; url: string; count: number }> {
  const { data, url } = await request("/news/", {
    ticker: input.ticker,
    start_date: input.start_date,
    end_date: input.end_date,
    limit: Math.min(input.limit ?? 10, 100),
  });
  const rows = data.news ?? [];
  return { data: rows, url, count: rows.length };
}
