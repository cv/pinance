# pinance

A [pi](https://github.com/earendil-works/pi) extension and set of [pit](https://github.com/cv/pit) functions for financial data tools. Provides access to stock prices, crypto prices, SEC filings, financial statements, and more.

Heavily inspired by [virattt/dexter](https://github.com/virattt/dexter).

## Features

**19 tools** for comprehensive financial data access:

| Category | Tools |
|----------|-------|
| **Stock Prices** | `get_price_snapshot`, `get_prices` |
| **Crypto Prices** | `get_crypto_price_snapshot`, `get_crypto_prices`, `get_available_crypto_tickers` |
| **SEC Filings** | `get_filings`, `get_10K_filing_items`, `get_10Q_filing_items`, `get_8K_filing_items` |
| **Financial Statements** | `get_income_statements`, `get_balance_sheets`, `get_cash_flow_statements`, `get_all_financial_statements` |
| **Financial Metrics** | `get_financial_metrics_snapshot`, `get_financial_metrics` |
| **Analyst Estimates** | `get_analyst_estimates` |
| **Insider Trades** | `get_insider_trades` |
| **Company News** | `get_news` |
| **Revenue Segments** | `get_segmented_revenues` |

Crypto prices need a Financial Datasets plan with crypto access; other plans get `403 Crypto access restricted`.

## Installation

```bash
git clone https://github.com/cv/pinance.git
cd pinance
npm install
```

## API Key

This extension uses the [Financial Datasets API](https://financialdatasets.ai/). Set your API key:

```bash
export FINANCIAL_DATASETS_API_KEY=your_api_key_here
```

Or create a `.env` file (see [`.env.example`](.env.example)).

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

Under [pit](https://github.com/cv/pit) (`pi install git:github.com/cv/pit`), the model writes TypeScript programs instead of calling tools one at a time. This repository has the same data as project functions in [`.pi/functions/fd/`](.pi/functions/fd/), loaded when you trust the project:

| pit function | Replaces |
|--------------|----------|
| `fd.priceSnapshot`, `fd.prices` | `get_price_snapshot`, `get_prices` |
| `fd.cryptoPriceSnapshot`, `fd.cryptoPrices`, `fd.cryptoTickers` | the crypto tools |
| `fd.financialStatements({ statement })` | the four statement tools (`income`, `balance`, `cash_flow`, `all`) |
| `fd.metricsSnapshot`, `fd.metrics`, `fd.estimates`, `fd.segmentedRevenues` | the metrics, estimates, and segments tools |
| `fd.filings`, `fd.filingItems({ filing_type })` | `get_filings` and the three filing-item tools |
| `fd.insiderTrades`, `fd.news` | `get_insider_trades`, `get_news` |
| `fd.request(endpoint, params)` | any other Financial Datasets endpoint |

Each function returns `{ data, url }` (lists add `count`), so a program can fetch several companies with `Promise.all` and return only the fields it needs:

```ts
async ({ fd: { metricsSnapshot } }) => {
  const rows = await Promise.all(["AAPL", "MSFT"].map((ticker) => metricsSnapshot({ ticker })));
  return rows.map(({ data, url }) => ({ ticker: data.ticker, pe: data.price_to_earnings_ratio, url }));
}
```

`fd.request` reads `FINANCIAL_DATASETS_API_KEY` from the environment or `.env` in the shell and sends it with `curl`, so the key never enters the sandbox or a result.

### On GitHub with pi-action

[`.github/workflows/pi-assistant.yml`](.github/workflows/pi-assistant.yml) runs [pi-action](https://github.com/cv/pi-action) with pit when an owner or member mentions `@pi` in an issue or pull request. pi-action does not load the tools of plain pi extensions, so it uses the `fd.*` functions and the skills (`trust_project: true`). Add the repository secrets `ANTHROPIC_API_KEY` and `FINANCIAL_DATASETS_API_KEY`. pi-action stores tool output in `refs/pi/threads/*`, which anyone who can read the repository can read, so never print the key.

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

This repository also includes [pi skills](.pi/skills/) with detailed guidance, including the matching `fd.*` function for each tool:

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
npm run check       # Lint and format (Biome)
npm run check:fix   # Auto-fix lint/format issues
npm run typecheck   # TypeScript type check
npm test            # Run unit tests
npm run test:e2e    # Run e2e tests (requires API key)
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Alternative data source

[docs/equibles.md](docs/equibles.md) compares the [Equibles API](https://equibles.com/docs/api) with Financial Datasets and maps each tool to an Equibles endpoint.

## License

[MIT](LICENSE)
