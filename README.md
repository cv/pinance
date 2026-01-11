# pinance

A [pi](https://github.com/badlogic/pi-mono) extension for financial data tools. Provides access to stock prices, crypto prices, SEC filings, financial statements, and more.

This project is a TypeScript port of [virattt/dexter](https://github.com/virattt/dexter), a Python-based financial AI agent.

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

Run pi with the extension:

```bash
pi -e /path/to/pinance/src/index.ts
```

Or add to your pi settings (`~/.pi/agent/settings.json`):

```json
{
  "extensions": ["/path/to/pinance/src/index.ts"]
}
```

## Workflow Enforcement

The extension injects financial research guidelines into the system prompt, ensuring:

- **Structured workflow**: Parse → Fetch (parallel) → Validate → Respond
- **Source citations**: All responses include API URLs used
- **Key finding first**: Direct answer in the first sentence
- **Completeness validation**: Verify data for all entities before answering

## Skills

This repository also includes [pi skills](.pi/skills/) with detailed guidance:

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

## License

[MIT](LICENSE)
