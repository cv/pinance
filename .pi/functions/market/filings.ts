/**
 * A company's SEC filings, normalized across providers, newest first: { form, filedDate, reportDate, accessionNumber, url, summary }.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.form - "10-K", "10-Q", or "8-K"; omit for all forms.
 * @param input.limit - Filings (default 10).
 * @param input.provider - "financialdatasets" or "equibles" (or "fd"/"eq"); default: the configured provider.
 */
async function filings(
  { pinance: { choose }, fd: { filings: fdFilings }, eq: { filings: eqFilings } },
  input: { ticker: string; form?: "10-K" | "10-Q" | "8-K"; limit?: number; provider?: string },
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: {
    form: string | null;
    filedDate: string | null;
    reportDate: string | null;
    accessionNumber: string | null;
    url: string | null;
    summary: string | null;
  }[];
  count: number;
  url: string;
  sources: string[];
}> {
  const str = (v: PitJsonValue | undefined) => (typeof v === "string" && v ? v : null);
  const provider = await choose({ provider: input.provider, dataset: "SEC filings" });
  const limit = input.limit ?? 10;
  if (provider === "equibles") {
    const documentType = input.form
      ? ({ "10-K": "TenK", "10-Q": "TenQ", "8-K": "EightK" } as const)[input.form]
      : undefined;
    const res = await eqFilings({ ticker: input.ticker, documentType, limit });
    const data = res.data.map((r) => ({
      form: str(r.documentTypeName),
      filedDate: str(r.filedDate),
      reportDate: str(r.reportingForDate),
      accessionNumber: str(r.accessionNumber),
      url: str(r.url),
      summary: str(r.summary),
    }));
    return { provider, data, count: data.length, url: res.url, sources: [res.url] };
  }
  const res = await fdFilings({ ticker: input.ticker, filing_type: input.form, limit });
  const data = res.data.map((r) => ({
    form: str(r.filing_type),
    filedDate: str(r.filing_date),
    reportDate: str(r.report_date),
    accessionNumber: str(r.accession_number),
    url: str(r.url),
    summary: null,
  }));
  return { provider, data, count: data.length, url: res.url, sources: [res.url] };
}
