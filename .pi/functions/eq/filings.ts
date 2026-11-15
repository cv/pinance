/**
 * A company's SEC filings from Equibles, newest first, with summary, items, accession number, and URL.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.documentType - "TenK", "TenQ", "EightK", or another Equibles document type.
 * @param input.startDate - Earliest filing date, YYYY-MM-DD.
 * @param input.endDate - Latest filing date, YYYY-MM-DD.
 * @param input.limit - Filings (default 10, max 500).
 * @param input.offset - Filings to skip (max 2000).
 */
async function filings(
  { eq: { request } },
  input: {
    ticker: string;
    documentType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  },
): Promise<{
  data: { [key: string]: PitJsonValue }[];
  meta: { [key: string]: PitJsonValue };
  url: string;
}> {
  const { data: body, url } = await request(
    `/v1/stocks/${encodeURIComponent(input.ticker.trim().toUpperCase())}/filings`,
    {
      documentType: input.documentType,
      startDate: input.startDate,
      endDate: input.endDate,
      limit: input.limit,
      offset: input.offset,
    },
  );
  const { data = [], meta = {}, ...rest } = body;
  return { data, meta: { ...rest, ...meta }, url };
}
