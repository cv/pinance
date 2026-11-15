/**
 * Recent news articles about a company, for announcements, market trends, and sentiment.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.start_date - Only articles on or after this date, YYYY-MM-DD.
 * @param input.end_date - Only articles on or before this date, YYYY-MM-DD.
 * @param input.limit - Number of articles (default 10, max 100).
 */
async function news(
  { pinance: { list } },
  input: { ticker: string; start_date?: string; end_date?: string; limit?: number },
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: { [key: string]: PitJsonValue }[];
  url: string;
  count: number;
  meta?: { [key: string]: PitJsonValue };
}> {
  return list(
    "financialdatasets",
    "/news/",
    { ...input, limit: Math.min(input.limit ?? 10, 100) },
    "news",
  );
}
