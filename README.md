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
