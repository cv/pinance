# Equibles as an alternative data source

Investigated 2026-11-15 from <https://equibles.com/docs/api> (the docs serve Markdown when `.md` is appended to a page URL; the index is <https://equibles.com/docs/llms.txt>). The `eq.*` functions below were then tested live with a free-plan key.

## Summary

Equibles is a broader US equity research API than Financial Datasets (FD): it adds earnings-call transcripts, 13F holdings, congressional trades, short data, options, macro series, company KPIs, guidance, and full-text filing search. It does **not** offer crypto prices or a general company-news feed, and filings come as searchable documents and lines, not as 10-K/10-Q items that are already split out. **Recommendation:** add it next to FD as a second set of pit functions (`eq.*`) for the datasets FD lacks. Don't replace FD.

## API basics

| | Equibles | Financial Datasets |
|---|---|---|
| Base URL | `https://api.equibles.com/v1` | `https://api.financialdatasets.ai` |
| Auth | `Authorization: Bearer eq_…` (or `?api_key=`, which leaks into logs) | `x-api-key` header |
| Paging | `limit`/`offset`; rows in `data`, plus `meta.hasMore` (max `limit` 500, analyst estimates 100) | `limit` per endpoint, with a different response key for each |
| Errors | JSON `{ error: { code, message, status } }`; unknown query parameters return `400 invalid_parameter` | `{ error, message }` |
| Other access | MCP server at `https://mcp.equibles.com/mcp` (154 tools, OAuth or key) | MCP server at `https://mcp.financialdatasets.ai/` |

Unauthenticated probe: `GET /v1/stocks/AAPL/prices` → `401 unauthorized`, "Missing API key… Get a free API key at https://equibles.com/dashboard/apikeys".

## Pricing and limits

One daily request counter covers REST and MCP together and resets at 00:00 UTC. Requests that return `400`, `403`, or `404` still count. A `5xx` does not. Each page of a paged read counts as one request.

| Plan | Price | Requests/day | Notes |
|---|---|---|---|
| Free | $0 | 100 | "Selected reported datasets", end-of-day prices |
| Plus | $14.99/mo ($149.90/yr) | 10,000 | Delayed quotes, options chains, forecasts |
| Pro | $49.99/mo ($19.99 first month; $499.90/yr) | 100,000 | Real-time prices, bulk export, advanced screening; supply-chain names |

Requests pause at the cap instead of incurring overage charges. With 100 requests/day, the free tier suits trying the API, but a single multi-company research question would use up a large share of it.

## Mapping the pinance tools

| pinance tool / pit function | Equibles endpoint | Fit |
|---|---|---|
| `get_price_snapshot` / `fd.priceSnapshot` | `GET /v1/stocks/{ticker}/quote` (live), `GET /v1/prices/latest` | Good; how fresh the quote is depends on the plan |
| `get_prices` / `fd.prices` | `GET /v1/stocks/{ticker}/prices` (daily), `/bars` (intraday) | Good; adds dividends, splits, technicals |
| `get_crypto_*` / `fd.crypto*` | none | **Gap** |
| `get_*_statements` / `fd.financialStatements` | `GET /v1/stocks/{ticker}/financial-statements/{statement}`, `/financial-facts/{concept}` | Good; XBRL concepts too |
| `get_financial_metrics*` / `fd.metrics*` | `/valuation-multiples`, `/valuation-multiples/history` | Partial; check which ratios it covers |
| `get_analyst_estimates` / `fd.estimates` | `GET /v1/stocks/{ticker}/analyst-estimates` | Good (`limit` ≤ 100) |
| `get_segmented_revenues` / `fd.segmentedRevenues` | `GET /v1/stocks/{ticker}/revenue-breakdown` | Good |
| `get_filings` / `fd.filings` | `GET /v1/stocks/{ticker}/filings`, `GET /v1/filings` | Good; filings since 2000 |
| `get_10K/10Q/8K_filing_items` / `fd.filingItems` | `/v1/filings/{documentId}/lines`, `/search`, `/keyword-search`; `/v1/stocks/{ticker}/filings/search` | Different: semantic and keyword search over full text, but no item split |
| `get_insider_trades` / `fd.insiderTrades` | `GET /v1/stocks/{ticker}/insider-transactions` (+ `insider-ownership`, Form 144 `proposed-sales`) | Good, broader |
| `get_news` / `fd.news` | `/v1/stocks/{ticker}/ir-news` (investor-relations news only) | **Gap** for third-party news |

## What Equibles adds

- Earnings calls: transcripts by fiscal year and quarter, speakers, Q&A, live transcripts, briefs, tone, and themes (`/v1/stocks/{ticker}/earnings-calls/{fiscalYear}/{fiscalQuarter}`, and others)
- Ownership: 13F institutional holders and activity, holder mix, congressional trades, insider sentiment scores
- Short data and options: short volume, short interest, off-exchange volume, fails-to-deliver; option chains, volatility, term structure
- Fundamentals beyond statements: KPIs, guidance, non-GAAP bridges, customer concentration, going-concern flags, debt profiles
- Macro and markets: FRED series, CFTC positioning, CBOE VIX and put/call ratios, index constituents, IPO pipeline, FDA calendar
- International listings (Europe, China, Hong Kong, Japan, Canada) through `/v1/stocks/{exchange}/{ticker}/…`, with partial REST coverage

## Integration

Equibles runs next to Financial Datasets as pit project functions in [`.pi/functions/eq/`](../.pi/functions/eq/), covering only what FD lacks. `fd.*` remains the source for news, crypto, and filing items.

| Function | Endpoint |
|---|---|
| `eq.earningsCall({ ticker, fiscalYear, fiscalQuarter })` | `GET /v1/stocks/{ticker}/earnings-calls/{fiscalYear}/{fiscalQuarter}/speakers` |
| `eq.institutionalHolders({ ticker })` | `GET /v1/stocks/{ticker}/institutional-holders` |
| `eq.shortInterest({ ticker })` | `GET /v1/stocks/{ticker}/short-interest` |
| `eq.congressTrades({ ticker \| memberId })` | `GET /v1/congress/trades` |
| `eq.searchFilings({ query, ticker? })` | `GET /v1/stocks/{ticker}/filings/search` or `GET /v1/filings/search` |
| `eq.request(path, params)` | any other `/v1` endpoint |

Each returns `{ data, meta, url }`: the rows, the paging and context fields (such as `hasMore`, `totalTurnCount`, or `reportDate`), and the URL to cite.

`eq.request` reads `EQUIBLES_API_KEY` from the environment or `.env` in the shell and sends it as `Authorization: Bearer` with `curl -H @-`. It refuses `api_key` query parameters, because pi-action stores tool output and URLs in public thread refs. The free plan allows 100 requests a day, shared with the MCP server, and 4xx answers count too, so check parameters against the docs before calling.
