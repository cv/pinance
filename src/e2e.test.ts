/**
 * End-to-end tests for pinance tools.
 * These tests require FINANCIAL_DATASETS_API_KEY and make real API calls.
 *
 * Run with: npm run test:e2e
 * Skip in CI by not setting the API key.
 */

import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const API_KEY = process.env.FINANCIAL_DATASETS_API_KEY;
const SKIP_E2E = !API_KEY;

const runPi = (tools: string, prompt: string): string => {
	if (SKIP_E2E) {
		return "";
	}
	try {
		return execSync(`pi -e ./src/index.ts --tools ${tools} -p "${prompt}"`, {
			encoding: "utf-8",
			env: { ...process.env },
			timeout: 120000,
		});
	} catch (error) {
		const execError = error as { stdout?: string; stderr?: string };
		return `${execError.stdout ?? ""}\n${execError.stderr ?? ""}`;
	}
};

describe.skipIf(SKIP_E2E)("E2E: Stock Prices", () => {
	it("get_price_snapshot returns AAPL price", () => {
		const output = runPi("get_price_snapshot", "Get the current stock price of AAPL");
		expect(output.toLowerCase()).toMatch(/price|aapl|\$[\d,]+/);
	});

	it("get_prices returns historical data", () => {
		const output = runPi("get_prices", "Get AAPL daily stock prices from 2024-01-01 to 2024-01-10");
		expect(output.toLowerCase()).toMatch(/price|close|open|2024/);
	});
});

describe.skipIf(SKIP_E2E)("E2E: Crypto", () => {
	it("get_crypto_price_snapshot returns BTC price", () => {
		const output = runPi("get_crypto_price_snapshot", "Get the current Bitcoin price in USD");
		expect(output.toLowerCase()).toMatch(/btc|bitcoin|price|\$/);
	});

	it("get_crypto_prices returns historical data", () => {
		const output = runPi(
			"get_crypto_prices",
			"Get BTC-USD daily prices from 2024-01-01 to 2024-01-10",
		);
		expect(output.toLowerCase()).toMatch(/btc|price|close|open/);
	});

	it("get_available_crypto_tickers lists tickers", () => {
		const output = runPi("get_available_crypto_tickers", "List all available crypto tickers");
		expect(output).toMatch(/BTC|ETH|USD/);
	});
});

describe.skipIf(SKIP_E2E)("E2E: Financial Statements", () => {
	it("get_income_statements returns income data", () => {
		const output = runPi("get_income_statements", "Get Apple's annual income statements");
		expect(output.toLowerCase()).toMatch(/revenue|income|net/);
	});

	it("get_balance_sheets returns balance sheet", () => {
		const output = runPi("get_balance_sheets", "Get Apple's latest annual balance sheet");
		expect(output.toLowerCase()).toMatch(/assets|liabilities|equity/);
	});

	it("get_cash_flow_statements returns cash flow", () => {
		const output = runPi("get_cash_flow_statements", "Get Tesla's annual cash flow statements");
		expect(output.toLowerCase()).toMatch(/cash|operating|flow/);
	});

	it("get_all_financial_statements returns all statements", () => {
		const output = runPi(
			"get_all_financial_statements",
			"Get all annual financial statements for MSFT",
		);
		expect(output.toLowerCase()).toMatch(/revenue|assets|cash/);
	});
});

describe.skipIf(SKIP_E2E)("E2E: Financial Metrics", () => {
	it("get_financial_metrics_snapshot returns current metrics", () => {
		const output = runPi(
			"get_financial_metrics_snapshot",
			"What is Apple's current P/E ratio and market cap?",
		);
		expect(output.toLowerCase()).toMatch(/p\/e|ratio|market.*cap|\$/);
	});

	it("get_financial_metrics returns historical metrics", () => {
		const output = runPi("get_financial_metrics", "Get historical financial metrics for GOOGL");
		expect(output.toLowerCase()).toMatch(/metric|p\/e|ratio|margin/);
	});
});

describe.skipIf(SKIP_E2E)("E2E: SEC Filings", () => {
	it("get_filings lists recent filings", () => {
		const output = runPi("get_filings", "List recent SEC filings for Apple");
		expect(output).toMatch(/10-K|10-Q|8-K|filing|accession/i);
	});

	it("get_10K_filing_items returns 10-K sections", () => {
		const output = runPi(
			"get_10K_filing_items",
			"Get the Risk Factors section from Apple's 2023 10-K annual report",
		);
		expect(output.toLowerCase()).toMatch(/risk|business|apple/);
	});

	it("get_10Q_filing_items returns 10-Q sections", () => {
		const output = runPi(
			"get_10Q_filing_items",
			"Get the MD&A section from Apple's Q1 2024 10-Q quarterly report",
		);
		expect(output.toLowerCase()).toMatch(/management|discussion|quarter|q1/);
	});

	it("get_8K_filing_items returns 8-K content", () => {
		const output = runPi(
			"get_filings,get_8K_filing_items",
			"First get the latest 8-K filing for AAPL, then get its content using the accession number",
		);
		expect(output.toLowerCase()).toMatch(/8-k|filing|apple|item/);
	});
});

describe.skipIf(SKIP_E2E)("E2E: Analyst Estimates", () => {
	it("get_analyst_estimates returns EPS estimates", () => {
		const output = runPi("get_analyst_estimates", "What are the analyst EPS estimates for NVDA?");
		expect(output.toLowerCase()).toMatch(/eps|estimate|nvda|nvidia/);
	});
});

describe.skipIf(SKIP_E2E)("E2E: Insider Trades", () => {
	it("get_insider_trades returns insider transactions", () => {
		const output = runPi("get_insider_trades", "Show recent insider trades for Apple");
		expect(output.toLowerCase()).toMatch(/insider|trade|shares|sell|buy/);
	});
});

describe.skipIf(SKIP_E2E)("E2E: News", () => {
	it("get_news returns company news", () => {
		const output = runPi("get_news", "Get recent news articles about Microsoft");
		expect(output.toLowerCase()).toMatch(/news|article|microsoft/);
	});
});

describe.skipIf(SKIP_E2E)("E2E: Segmented Revenues", () => {
	it("get_segmented_revenues returns revenue breakdown", () => {
		const output = runPi(
			"get_segmented_revenues",
			"Show Apple's annual revenue breakdown by segment",
		);
		expect(output.toLowerCase()).toMatch(/segment|revenue|iphone|services/);
	});
});
