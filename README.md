# pinance

A [pi](https://github.com/badlogic/pi-mono) extension for financial data tools. Provides access to stock prices, crypto prices, SEC filings, financial statements, and more.

## Features

- **Stock Prices** - Real-time snapshots and historical price data
- **Crypto Prices** - Cryptocurrency price data and available tickers
- **SEC Filings** - 10-K, 10-Q, and 8-K filing metadata and content
- **Financial Statements** - Income statements, balance sheets, cash flow statements
- **Financial Metrics** - P/E ratio, market cap, dividend yield, and more
- **Analyst Estimates** - EPS estimates and analyst expectations
- **Insider Trades** - SEC Form 4 insider trading data
- **Company News** - Recent news articles for companies
- **Segmented Revenues** - Revenue breakdown by segment

## Installation

```bash
# Clone the repository
git clone https://github.com/cv/pinance.git

# Install dependencies
cd pinance
npm install
```

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

## API Key

This extension uses the [Financial Datasets API](https://financialdatasets.ai/). Set your API key:

```bash
export FINANCIAL_DATASETS_API_KEY=your_api_key_here
```

## Development

```bash
# Run linter and formatter
npm run check

# Auto-fix issues
npm run check:fix

# Type check
npm run typecheck

# Run tests
npm test
```

## License

MIT
