/**
 * A company's SEC filings from Equibles, newest first, with summary, item numbers, accession number, and a document URL.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.documentType - "TenK", "TenQ", "EightK", or another Equibles document type.
 * @param input.startDate - Earliest filing date, YYYY-MM-DD.
 * @param input.endDate - Latest filing date, YYYY-MM-DD.
 * @param input.limit - Filings (default 10, max 500).
 * @param input.offset - Filings to skip (max 2000).
 */
async function filings(
  { pinance: { list } },
  input: {
    ticker: string;
    documentType?: string;
    startDate?: string;
    endDate?: string;
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
  return list("equibles", "/v1/stocks/{ticker}/filings", input, "data");
}
