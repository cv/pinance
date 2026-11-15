---
name: reading-sec-filings
description: Extracts content from SEC filings (10-K, 10-Q, 8-K) via Financial Datasets API. Use when asked about risk factors, MD&A, business descriptions, or SEC filing content.
---

# Reading SEC Filings

## Tools

| Tool | Financial Datasets | Equibles | Use |
|------|--------------------|----------|-----|
| `get_filings` | `fd.filings` | `eq.filings` | List filings (metadata, accession numbers) |
| `get_10K_filing_items` | `fd.filingItems({ filing_type: "10-K" })` | `eq.searchFilings (passages)` | Extract sections from annual reports |
| `get_10Q_filing_items` | `fd.filingItems({ filing_type: "10-Q" })` | `eq.searchFilings (passages)` | Extract sections from quarterly reports |
| `get_8K_filing_items` | `fd.filingItems({ filing_type: "8-K" })` | `eq.filings + eq.searchFilings` | Extract content from current reports |

Tools pick the provider that has a key (Financial Datasets or Equibles; `PINANCE_PROVIDER` decides when both do). A dash means that provider lacks the data.

Under [pit](https://github.com/cv/pit), call the saved functions from one program: `fd.*` with a Financial Datasets key, `eq.*` with an Equibles key; `pinance.providers()` says which is active. For example `({ fd: { metrics } }) => metrics({ ticker: "AAPL" })`. `fd.*` returns `{ data, url }` (lists also `count`) and `eq.*` returns `{ data, meta, url }`; cite `url`.

Only Equibles has (tool / function):
- `search_filings` / `eq.searchFilings({ query, ticker? })`: keyword and semantic search over filings and transcripts since 2000, with deep links to the passage
- `get_earnings_call_transcript` / `eq.earningsCall({ ticker, fiscalYear, fiscalQuarter })`: speaker-labelled earnings call transcript

## 10-K Items

Use `item` parameter with array of item IDs:
- `Item-1`: Business
- `Item-1A`: Risk Factors
- `Item-7`: MD&A
- `Item-8`: Financial Statements

## 10-Q Items

- `Item-1`: Financial Statements
- `Item-2`: MD&A
- `Item-3`: Market Risk
- `Item-4`: Controls

## Examples

**Input:** "What are Apple's risk factors?"
```
get_10K_filing_items(ticker: "AAPL", year: 2024, item: ["Item-1A"])
```
**Output:** Summarize key risks, don't dump the full text:
"Apple's key risks include supply chain concentration in Asia, intense competition across all product categories, and regulatory scrutiny in multiple jurisdictions."

---

**Input:** "What does NVDA's management say about AI demand?"
```
get_10K_filing_items(ticker: "NVDA", year: 2024, item: ["Item-7"])
```
**Output:** Extract relevant MD&A sections:
"NVIDIA's management highlights unprecedented data center demand driven by generative AI, with revenue up 217% YoY in that segment."

---

**Input:** "Recent Tesla 8-K filings"
```
get_filings(ticker: "TSLA", filing_type: "8-K", limit: 5)
```
Then for each relevant filing:
```
get_8K_filing_items(ticker: "TSLA", accession_number: "0001628280-24-012345")
```
**Output:** Summarize material events:
"Tesla's recent 8-Ks cover Q3 earnings (Oct 23), executive departure (Oct 15), and factory expansion announcement (Oct 8)."

---

**Input:** "How did Microsoft describe its cloud business in Q2?"
```
get_10Q_filing_items(ticker: "MSFT", year: 2024, quarter: 2, item: ["Item-2"])
```
**Output:** Extract cloud-specific commentary from MD&A.
