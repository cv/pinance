/**
 * Hybrid keyword and semantic search over SEC filings and call transcripts since 2000, from Equibles.
 *
 * @param input.query - What to find, such as "gross margin guidance".
 * @param input.ticker - Search one company's filings; omit to search all filings.
 * @param input.documentType - Document types, such as ["TenK", "TenQ"].
 * @param input.startDate - Earliest filing date, YYYY-MM-DD.
 * @param input.endDate - Latest filing date, YYYY-MM-DD.
 * @param input.limit - Passages (default 5, max 500).
 * @param input.match - "ranked" (default) or "phrase" for exact phrases.
 */
async function searchFilings(
  { eq: { request } },
  input: {
    query: string;
    ticker?: string;
    documentType?: string[];
    startDate?: string;
    endDate?: string;
    limit?: number;
    match?: "ranked" | "phrase";
  },
): Promise<{
  data: { [key: string]: PitJsonValue }[];
  meta: { [key: string]: PitJsonValue };
  url: string;
}> {
  const path = input.ticker
    ? `/v1/stocks/${encodeURIComponent(input.ticker.toUpperCase())}/filings/search`
    : "/v1/filings/search";
  const { data: body, url } = await request(path, {
    query: input.query,
    documentType: input.documentType?.join(","),
    startDate: input.startDate,
    endDate: input.endDate,
    limit: input.limit,
    match: input.match,
  });
  const { data = [], meta = {}, ...rest } = body;
  return { data, meta: { ...rest, ...meta }, url };
}
