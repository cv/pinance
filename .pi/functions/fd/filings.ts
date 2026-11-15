/**
 * SEC filing metadata (accession numbers, types, dates, URLs). Returns no filing text; use fd.filingItems for that.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.filing_type - "10-K" (annual), "10-Q" (quarterly), or "8-K" (current report). Omit for all types.
 * @param input.limit - Maximum filings to return (default 10).
 */
async function filings(
  { fd: { request } },
  input: { ticker: string; filing_type?: "10-K" | "10-Q" | "8-K"; limit?: number },
): Promise<{ data: { [key: string]: PitJsonValue }[]; url: string; count: number }> {
  const { data, url } = await request("/filings/", {
    ticker: input.ticker,
    filing_type: input.filing_type,
    limit: input.limit ?? 10,
  });
  const rows = data.filings ?? [];
  return { data: rows, url, count: rows.length };
}
