# pit functions

The [pit](https://github.com/cv/pit) functions in [`.pi/functions/`](../.pi/functions/) give programs the same data as the extension's tools. They are layered so that Financial Datasets and Equibles share everything except what really differs between them: endpoints and field names.

| Layer | Functions | Job |
|---|---|---|
| Presentation | `chart.*` | Mermaid charts and sparklines from any of the layers below ([charts.md](charts.md)) |
| Domain | `market.*` | Normalized records, from the provider chosen for each call |
| Provider families | `fd.*`, `eq.*` | One declarative call per endpoint |
| Transport | `pinance.get`, `pinance.list` | URL, key, `curl`, errors, and the result envelope |
| Configuration | `pinance.providers`, `pinance.choose` | Which keys are set, and which provider to use |
| Data | `pinance.registry` | What differs between the providers |

A wrapper is a single call, such as `list("equibles", "/v1/stocks/{ticker}/prices", input, "data")`.

## What the providers share

| Concern | Where | How |
|---|---|---|
| Base URL, key variable, auth header, signup URL | `pinance.registry` | One entry per provider |
| Paths | `registry.pathPattern`, `pinance.get` | `{name}` placeholders are filled from the parameters, encoded, and left out of the query |
| Tickers | `registry.upperCaseParams` | Trimmed and upper-cased, in the path or the query |
| Query strings | `pinance.get` | Undefined values skipped, arrays repeat the key, safe inside single quotes |
| Keys | `registry.readSettingShell`, `pinance.get` | Read from the environment, then `.env`, in the shell and sent with `curl -H @-`, so a key never enters the sandbox, a URL, or a result; key-like parameters are refused |
| Timeouts | `registry.timeoutSeconds` | 60 seconds for Financial Datasets; 150 for Equibles, whose uncached valuation snapshots can take over a minute |
| Errors | `registry.hints`, `pinance.get` | Provider, HTTP status, URL, a hint, and the API's own reason, from `{ error, message }` (Financial Datasets) or `{ error: { code, message } }` (Equibles) |
| Results | `pinance.get` options, `pinance.list` | `{ provider, data, url }`. Lists add `count`. Everything in the body besides the rows (Financial Datasets' `prices` or `insider_trades`, Equibles' `data`) becomes `meta` |
| Choosing a provider | `pinance.providers`, `pinance.choose` | A named provider, else `PINANCE_PROVIDER` when both keys are set, else the one with a key |

The extension has the same parts in [`src/providers.ts`](../src/providers.ts), [`src/api.ts`](../src/api.ts), and [`src/equibles.ts`](../src/equibles.ts). pit runs functions in a sandbox that cannot import modules, so the two cannot share code; keep them in step.

## The domain

Both providers cover these five datasets, so `market.*` maps each provider's rows to one record. Each function takes an optional `provider` (`"fd"` or `"eq"`), else `pinance.choose` picks the active one, and returns `{ provider, data, count, url, sources }`.

| Record | Fields | Function | Financial Datasets | Equibles |
|---|---|---|---|---|
| Quote | ticker, price, change, changePercent, asOf, currency | `market.quote({ tickers })` | `/prices/snapshot/`, one call per ticker | `/v1/prices/latest`, one call for up to 25 |
| Bar | date, open, high, low, close, volume, oldest first | `market.prices({ ticker, startDate, endDate, interval })` | `/prices/` | `/v1/stocks/{ticker}/prices`, paged until complete |
| Filing | form, filedDate, reportDate, accessionNumber, url | `market.filings({ ticker, form, limit })` | `/filings/` | `/v1/stocks/{ticker}/filings` (`EightK` and so on) |
| InsiderTrade | transactionDate, filingDate, name, title, type, direction (buy, sell, or other), shares, price, value, sharesOwnedAfter | `market.insiderTrades({ ticker, startDate, endDate, limit })` | `/insider-trades/`, dates filter filing dates | `/v1/stocks/{ticker}/insider-transactions`, dates filter transaction dates |
| Valuation | ticker, marketCap, enterpriseValue, pe, evToEbitda, evToRevenue, priceToBook, priceToSales | `market.valuation({ tickers })` | `/financial-metrics/snapshot/` | `/v1/stocks/{ticker}/valuation-multiples` |

The two providers agree closely but not to the cent, because their prices and trailing figures come from different feeds and times. On 2026-11-13, Apple's P/E was 39.60 from Financial Datasets and 39.67 from Equibles. Cite the provider with the number.

Other data stays provider-specific:

- Statements, estimates, and segments are in both, but in different shapes. Financial Datasets has named fields per statement; Equibles has as-reported line items (such as "Cash & Cash Equivalents"), one estimate row per metric, period, and statistic, and a revenue breakdown by year. Mapping one to the other would mean guessing at accounting taxonomies, so use `fd.*` or `eq.*` directly.
- Only Financial Datasets has crypto, third-party news, and filing items by section.
- Only Equibles has earnings call transcripts, 13F holders, short interest, congressional trades, and filing search.

## Adding things

- **An endpoint:** one function in `fd/` or `eq/` that calls `pinance.list` (rows) or `pinance.get` (an object or the whole body).
- **A normalized dataset:** a `market.*` function that calls each provider's function and maps the rows to one record.
- **A provider:** an entry in `pinance.registry`, a namespace of wrappers, and a branch in each `market.*` function. Provider ids also appear in signatures as the union `"financialdatasets" | "equibles"`.

[CONTRIBUTING.md](../CONTRIBUTING.md#pit-functions) explains how to change a saved function.
