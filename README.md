# pinance

A [pi](https://github.com/earendil-works/pi) extension and set of [pit](https://github.com/cv/pit) functions for financial data tools. Provides access to stock prices, crypto prices, SEC filings, financial statements, earnings calls, ownership data, and more, from [Financial Datasets](https://financialdatasets.ai/) or [Equibles](https://equibles.com/docs/api): a key for either one is enough.

Heavily inspired by [virattt/dexter](https://github.com/virattt/dexter).

## Features

**24 tools**. Most work with either provider; the rest need the provider named in their description and are offered only when its key is set.

| Category | Tools | Financial Datasets | Equibles |
|----------|-------|:--:|:--:|
| **Stock Prices** | `get_price_snapshot`, `get_prices` | ✓ | ✓ (end-of-day; day, week, or month bars) |
| **Financial Statements** | `get_income_statements`, `get_balance_sheets`, `get_cash_flow_statements`, `get_all_financial_statements` | ✓ | ✓ (one period per call; `fiscal_year`, `fiscal_period`) |
| **Financial Metrics** | `get_financial_metrics_snapshot`, `get_financial_metrics` | ✓ | ✓ (valuation multiples) |
| **Analyst Estimates** | `get_analyst_estimates` | ✓ | ✓ |
| **Revenue Segments** | `get_segmented_revenues` | ✓ | ✓ |
| **SEC Filings** | `get_filings` | ✓ | ✓ |
| **Insider Trades** | `get_insider_trades` | ✓ | ✓ (filtered by transaction date) |
| **Filing Sections** | `get_10K_filing_items`, `get_10Q_filing_items`, `get_8K_filing_items` | ✓ | |
| **Crypto Prices** | `get_crypto_price_snapshot`, `get_crypto_prices`, `get_available_crypto_tickers` | ✓ | |
| **Company News** | `get_news` | ✓ | |
| **Earnings Calls** | `get_earnings_call_transcript` | | ✓ |
| **Ownership and Trading** | `get_institutional_holders`, `get_short_interest`, `get_congress_trades` | | ✓ |
| **Filing Search** | `search_filings` (keyword and semantic, since 2000) | | ✓ |

Each provider returns its own field names; every result names its `provider` and the URL to cite. Crypto prices need a Financial Datasets plan with crypto access; other plans get `403 Crypto access restricted`.

## Installation

```bash
git clone https://github.com/cv/pinance.git
cd pinance
npm install
```

## API keys and data providers

Set a key for one provider, in the environment or in a `.env` file where you run pi (see [`.env.example`](.env.example)):

```bash
export FINANCIAL_DATASETS_API_KEY=...   # https://financialdatasets.ai/
# or
export EQUIBLES_API_KEY=eq_...          # https://equibles.com/dashboard/apikeys (free: 100 requests a day)
```

With both keys, shared tools use Financial Datasets unless `PINANCE_PROVIDER=equibles` (or `eq`; `financialdatasets` or `fd` for the default). Tools that only one provider has always use it. [docs/equibles.md](docs/equibles.md) compares the two.

## Usage

Needs pi 1.5 or later. Run pi with the extension:

```bash
pi -e /path/to/pinance/src/index.ts
```

Or install it as a package, which adds it to `packages` in `~/.pi/agent/settings.json`:

```bash
pi install /path/to/pinance
```

### With pit

Under [pit](https://github.com/cv/pit) (`pi install git:github.com/cv/pit`), the model writes TypeScript programs instead of calling tools one at a time. This repository has the same data as project functions, loaded when you trust the project: [`.pi/functions/fd/`](.pi/functions/fd/) for Financial Datasets and [`.pi/functions/eq/`](.pi/functions/eq/) for Equibles. `pinance.providers()` reports which provider has a key (never the key itself).

For data both providers have, the [`market.*`](.pi/functions/market/) functions return one normalized shape from whichever provider is active, or the one named with `provider: "fd"` or `"eq"`: `market.quote({ tickers })`, `market.prices({ ticker, startDate, endDate, interval })`, `market.filings({ ticker, form })`, `market.insiderTrades({ ticker })`, and `market.valuation({ tickers })`. The provider functions cover everything else. [`chart.*`](docs/charts.md) turns any of it into Mermaid charts that GitHub renders in issues and pull requests.

| Data | Financial Datasets | Equibles |
|------|--------------------|----------|
| Latest price | `fd.priceSnapshot` | `eq.latestPrices({ tickers })` (up to 25) |
| Price history | `fd.prices` | `eq.prices` |
| Statements | `fd.financialStatements({ statement })` | `eq.financialStatement({ statement, year, period })` |
| Metrics | `fd.metricsSnapshot`, `fd.metrics` | `eq.valuationMultiples({ history })` |
| Estimates | `fd.estimates` | `eq.analystEstimates` |
| Segments | `fd.segmentedRevenues` | `eq.revenueBreakdown` |
| Filings | `fd.filings`, `fd.filingItems({ filing_type })` | `eq.filings`, `eq.searchFilings` |
| Insider trades | `fd.insiderTrades` | `eq.insiderTransactions` |
| Crypto, news | `fd.cryptoPriceSnapshot`, `fd.cryptoPrices`, `fd.cryptoTickers`, `fd.news` | |
| Earnings calls, ownership | | `eq.earningsCall`, `eq.institutionalHolders`, `eq.shortInterest`, `eq.congressTrades` |
| Any other endpoint | `fd.request(endpoint, params)` | `eq.request(path, params)` |

Every function returns `{ provider, data, url }` (lists add `count`; Equibles results add `meta` with paging and context), so a program can fetch several companies at once and return only the fields it needs:

```ts
async ({ market: { valuation } }) => {
  const { data, sources } = await valuation({ tickers: ["AAPL", "MSFT"] });
  return { pe: data.map(({ ticker, pe }) => ({ ticker, pe })), sources };
}
```

Every request goes through `pinance.get`, which reads the key from the environment or `.env` in the shell and sends it with `curl`, so a key never enters the sandbox, a URL, or a result. [docs/functions.md](docs/functions.md) describes the layers and how to add an endpoint, a dataset, or a provider.

### On GitHub with pi-action

[`.github/workflows/pi-assistant.yml`](.github/workflows/pi-assistant.yml) runs [pi-action](https://github.com/cv/pi-action) with pit when @cv mentions `@pi` (`allowed_users`; edit it to let others in) in an issue or pull request. pi-action does not load the tools of plain pi extensions, so it uses the `fd.*` and `eq.*` functions and the skills (`trust_project: true`). The model runs on the NVIDIA inference endpoint (`https://inference-api.nvidia.com`, Claude Opus 5.5 over the Anthropic Messages API), the same one local pi uses through `~/.pi/agent/models.json`. Add the repository secret `NVIDIA_API_KEY`, plus `FINANCIAL_DATASETS_API_KEY` or `EQUIBLES_API_KEY` (or both, with an optional `PINANCE_PROVIDER` repository variable). pi-action stores tool output in `refs/pi/threads/*`, which anyone who can read the repository can read, so never print the key.

## Example Queries

**Quick lookups:**
- "What's Apple's P/E ratio?"
- "Bitcoin price?"
- "NVDA stock price"

**Financial analysis:**
- "Compare operating margins of AAPL, MSFT, and GOOGL"
- "How has Tesla's revenue grown over the last 4 years?"
- "Is Amazon's balance sheet healthy?"

**SEC filings:**
- "What are NVDA's main risk factors?"
- "Summarize Apple's latest 10-K MD&A section"
- "Recent 8-K filings from Tesla"

**Market signals:**
- "Any insider buying at Apple recently?"
- "What's the latest news on META?"
- "NVDA insider activity and news sentiment"

**Comprehensive research:**
- "Give me a full overview of MSFT - financials, valuation, and recent news"
- "Due diligence on CRM - financial health, growth, and insider activity"

## Workflow Enforcement

The extension adds financial research guidelines as a `<financial_research>` section of the system prompt. pi sends a section once per session, not again on every turn. The guidelines ensure:

- **Structured workflow**: Parse → Fetch (parallel) → Validate → Respond
- **Source citations**: All responses include API URLs used
- **Key finding first**: Direct answer in the first sentence
- **Completeness validation**: Verify data for all entities before answering

## Skills

This repository also includes [pi skills](.pi/skills/) with detailed guidance, including the matching `fd.*` and `eq.*` functions for each tool:

| Skill | Description |
|-------|-------------|
| [`analyzing-financials`](.pi/skills/analyzing-financials/SKILL.md) | Financial statements, metrics, estimates |
| [`researching-stocks`](.pi/skills/researching-stocks/SKILL.md) | Multi-step research workflow with checklists |
| [`reading-sec-filings`](.pi/skills/reading-sec-filings/SKILL.md) | 10-K, 10-Q, 8-K content extraction |
| [`fetching-prices`](.pi/skills/fetching-prices/SKILL.md) | Stock and crypto price data |
| [`tracking-signals`](.pi/skills/tracking-signals/SKILL.md) | Insider trades and news |

Skills are loaded automatically when running pi from this directory, or can be copied to `~/.pi/agent/skills/` for global use.

## Development

```bash
npm run check       # Lint (oxlint, type-aware) and check formatting (oxfmt)
npm run check:fix   # Fix lint issues and format
npm run typecheck   # TypeScript type check
npm test            # Run unit tests
npm run test:e2e    # Run e2e tests (needs a provider key and a model)
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

[MIT](LICENSE)
