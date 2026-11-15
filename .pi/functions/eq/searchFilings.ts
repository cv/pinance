/**
 * Hybrid keyword and semantic search over SEC filings and call transcripts since 2000, from Equibles. Each passage has a `url` deep link to cite.
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
  { pinance: { list } },
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
  provider: "financialdatasets" | "equibles";
  data: { [key: string]: PitJsonValue }[];
  meta: { [key: string]: PitJsonValue };
  url: string;
  count: number;
}> {
  const path = input.ticker ? "/v1/stocks/{ticker}/filings/search" : "/v1/filings/search";
  return list("equibles", path, { ...input, documentType: input.documentType?.join(",") }, "data");
}
