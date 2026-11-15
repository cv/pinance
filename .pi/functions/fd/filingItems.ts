/**
 * Text sections of an SEC filing. One function for 10-K, 10-Q, and 8-K items; results can be large, so filter them in the program before returning.
 *
 * 10-K items: Item-1 Business, Item-1A Risk Factors, Item-1B Unresolved Staff Comments, Item-2 Properties, Item-3 Legal Proceedings,
 * Item-4 Mine Safety, Item-5 Market for Equity, Item-6 [Reserved], Item-7 MD&A, Item-7A Market Risk, Item-8 Financial Statements,
 * Item-9 Accountant Changes, Item-9A Controls, Item-9B Other, Item-10 Directors and Governance, Item-11 Executive Compensation,
 * Item-12 Security Ownership, Item-13 Related Transactions, Item-14 Accounting Fees, Item-15 Exhibits, Item-16 Form 10-K Summary.
 * 10-Q items: Item-1 Financial Statements, Item-2 MD&A, Item-3 Market Risk, Item-4 Controls.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 * @param input.filing_type - "10-K", "10-Q", or "8-K".
 * @param input.year - Filing year (10-K and 10-Q).
 * @param input.quarter - Quarter 1-4 (10-Q).
 * @param input.accession_number - Accession number (8-K), such as "0000320193-24-000123"; get it from fd.filings.
 * @param input.item - Items to return, such as ["Item-1A", "Item-7"]. Omit for all items.
 */
async function filingItems(
  { pinance: { get } },
  input: {
    ticker: string;
    filing_type: "10-K" | "10-Q" | "8-K";
    year?: number;
    quarter?: number;
    accession_number?: string;
    item?: string[];
  },
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: { [key: string]: PitJsonValue };
  url: string;
}> {
  const eightK = input.filing_type === "8-K";
  if (eightK && !input.accession_number)
    throw new Error("8-K items need accession_number (see fd.filings).");
  if (!eightK && input.year === undefined) throw new Error(`${input.filing_type} items need year.`);
  if (input.filing_type === "10-Q" && input.quarter === undefined)
    throw new Error("10-Q items need quarter (1-4).");
  return get("financialdatasets", "/filings/items/", {
    ticker: input.ticker,
    filing_type: input.filing_type,
    year: eightK ? undefined : input.year,
    quarter: input.filing_type === "10-Q" ? input.quarter : undefined,
    accession_number: eightK ? input.accession_number : undefined,
    item: input.item,
  });
}
