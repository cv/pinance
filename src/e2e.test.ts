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

interface ToolCall {
	name: string;
	arguments: Record<string, unknown>;
}

interface PiResult {
	output: string;
	toolCalls: ToolCall[];
}

const runPi = (prompt: string): PiResult => {
	if (SKIP_E2E) {
		return { output: "", toolCalls: [] };
	}
	try {
		const rawOutput = execSync(`pi -e ./src/index.ts --mode json -p "${prompt}"`, {
			encoding: "utf-8",
			env: { ...process.env },
			timeout: 120000,
		});

		// Parse JSON lines to extract tool calls and final text
		const lines = rawOutput.trim().split("\n");
		const toolCalls: ToolCall[] = [];
		let output = "";

		for (const line of lines) {
			try {
				const event = JSON.parse(line);

				// Extract tool calls from agent_end event which has the full message history
				if (event.type === "agent_end" && event.messages) {
					for (const msg of event.messages) {
						if (msg.role === "assistant" && msg.content) {
							for (const content of msg.content) {
								if (content.type === "toolCall") {
									toolCalls.push({
										name: content.name,
										arguments: content.arguments,
									});
								}
								if (content.type === "text") {
									output += content.text;
								}
							}
						}
					}
				}
			} catch {
				// Skip non-JSON lines
			}
		}

		return { output, toolCalls };
	} catch (error) {
		const execError = error as { stdout?: string; stderr?: string };
		return { output: `${execError.stdout ?? ""}\n${execError.stderr ?? ""}`, toolCalls: [] };
	}
};

describe.skipIf(SKIP_E2E)("E2E: Stock Prices", () => {
	it("get_price_snapshot returns AAPL price", () => {
		const { output, toolCalls } = runPi("Get the current stock price of AAPL");
		expect(toolCalls.some((tc) => tc.name === "get_price_snapshot")).toBe(true);
		expect(output.toLowerCase()).toMatch(/price|aapl|\$[\d,]+/);
	});

	it("get_prices returns historical data", () => {
		const { output, toolCalls } = runPi(
			"Get AAPL daily stock prices from 2024-01-01 to 2024-01-10",
		);
		expect(toolCalls.some((tc) => tc.name === "get_prices")).toBe(true);
		expect(output.toLowerCase()).toMatch(/price|close|open|2024/);
	});
});

describe.skipIf(SKIP_E2E)("E2E: Crypto", () => {
	it("get_crypto_price_snapshot returns BTC price", () => {
		const { output, toolCalls } = runPi("Get the current Bitcoin price in USD");
		expect(toolCalls.some((tc) => tc.name === "get_crypto_price_snapshot")).toBe(true);
		expect(output.toLowerCase()).toMatch(/btc|bitcoin|price|\$/);
	});

	it("get_crypto_prices returns historical data", () => {
		const { output, toolCalls } = runPi("Get BTC-USD daily prices from 2024-01-01 to 2024-01-10");
		expect(toolCalls.some((tc) => tc.name === "get_crypto_prices")).toBe(true);
		expect(output.toLowerCase()).toMatch(/btc|price|close|open/);
	});

	it("get_available_crypto_tickers lists tickers", () => {
		const { output, toolCalls } = runPi("List all available crypto tickers");
		expect(toolCalls.some((tc) => tc.name === "get_available_crypto_tickers")).toBe(true);
		expect(output).toMatch(/BTC|ETH|USD/);
	});
});

describe.skipIf(SKIP_E2E)("E2E: Financial Statements", () => {
	it("get_income_statements returns income data", () => {
		const { output, toolCalls } = runPi("Get Apple's annual income statements");
		expect(toolCalls.some((tc) => tc.name === "get_income_statements")).toBe(true);
		expect(output.toLowerCase()).toMatch(/revenue|income|net/);
	});

	it("get_balance_sheets returns balance sheet", () => {
		const { output, toolCalls } = runPi("Get Apple's latest annual balance sheet");
		expect(toolCalls.some((tc) => tc.name === "get_balance_sheets")).toBe(true);
		expect(output.toLowerCase()).toMatch(/assets|liabilities|equity/);
	});

	it("get_cash_flow_statements returns cash flow", () => {
		const { output, toolCalls } = runPi("Get Tesla's annual cash flow statements");
		expect(toolCalls.some((tc) => tc.name === "get_cash_flow_statements")).toBe(true);
		expect(output.toLowerCase()).toMatch(/cash|operating|flow/);
	});

	it("get_all_financial_statements returns all statements", () => {
		const { output, toolCalls } = runPi("Get all annual financial statements for MSFT");
		expect(toolCalls.some((tc) => tc.name === "get_all_financial_statements")).toBe(true);
		expect(output.toLowerCase()).toMatch(/revenue|assets|cash/);
	});
});

describe.skipIf(SKIP_E2E)("E2E: Financial Metrics", () => {
	it("get_financial_metrics_snapshot returns current metrics", () => {
		const { output, toolCalls } = runPi("What is Apple's current P/E ratio and market cap?");
		expect(toolCalls.some((tc) => tc.name === "get_financial_metrics_snapshot")).toBe(true);
		expect(output.toLowerCase()).toMatch(/p\/e|ratio|market.*cap|\$/);
	});

	it("get_financial_metrics returns historical metrics", () => {
		const { output, toolCalls } = runPi("Get historical financial metrics for GOOGL");
		expect(toolCalls.some((tc) => tc.name === "get_financial_metrics")).toBe(true);
		expect(output.toLowerCase()).toMatch(/metric|p\/e|ratio|margin/);
	});
});

describe.skipIf(SKIP_E2E)("E2E: SEC Filings", () => {
	it("get_filings lists recent filings", () => {
		const { output, toolCalls } = runPi("List recent SEC filings for Apple");
		expect(toolCalls.some((tc) => tc.name === "get_filings")).toBe(true);
		expect(output).toMatch(/10-K|10-Q|8-K|filing|accession/i);
	});

	it("get_10K_filing_items returns 10-K sections", () => {
		const { output, toolCalls } = runPi(
			"Get the Risk Factors section from Apple's 2023 10-K annual report",
		);
		expect(toolCalls.some((tc) => tc.name === "get_10K_filing_items")).toBe(true);
		expect(output.toLowerCase()).toMatch(/risk|business|apple/);
	});

	it("get_10Q_filing_items returns 10-Q sections", () => {
		const { output, toolCalls } = runPi(
			"Get the MD&A section from Apple's Q1 2024 10-Q quarterly report",
		);
		expect(toolCalls.some((tc) => tc.name === "get_10Q_filing_items")).toBe(true);
		expect(output.toLowerCase()).toMatch(/management|discussion|quarter|q1/);
	});

	it("get_8K_filing_items returns 8-K content", () => {
		const { output, toolCalls } = runPi(
			"First get the latest 8-K filing for AAPL, then get its content using the accession number",
		);
		expect(toolCalls.some((tc) => tc.name === "get_filings")).toBe(true);
		expect(toolCalls.some((tc) => tc.name === "get_8K_filing_items")).toBe(true);
		expect(output.toLowerCase()).toMatch(/8-k|filing|apple|item/);
	});
});

describe.skipIf(SKIP_E2E)("E2E: Analyst Estimates", () => {
	it("get_analyst_estimates returns EPS estimates", () => {
		const { output, toolCalls } = runPi("What are the analyst EPS estimates for NVDA?");
		expect(toolCalls.some((tc) => tc.name === "get_analyst_estimates")).toBe(true);
		expect(output.toLowerCase()).toMatch(/eps|estimate|nvda|nvidia/);
	});
});

describe.skipIf(SKIP_E2E)("E2E: Insider Trades", () => {
	it("get_insider_trades returns insider transactions", () => {
		const { output, toolCalls } = runPi("Show recent insider trades for Apple");
		expect(toolCalls.some((tc) => tc.name === "get_insider_trades")).toBe(true);
		expect(output.toLowerCase()).toMatch(/insider|trade|shares|sell|buy/);
	});
});

describe.skipIf(SKIP_E2E)("E2E: News", () => {
	it("get_news returns company news", () => {
		const { output, toolCalls } = runPi("Get recent news articles about Microsoft");
		expect(toolCalls.some((tc) => tc.name === "get_news")).toBe(true);
		expect(output.toLowerCase()).toMatch(/news|article|microsoft/);
	});
});

describe.skipIf(SKIP_E2E)("E2E: Segmented Revenues", () => {
	it("get_segmented_revenues returns revenue breakdown", () => {
		const { output, toolCalls } = runPi("Show Apple's annual revenue breakdown by segment");
		expect(toolCalls.some((tc) => tc.name === "get_segmented_revenues")).toBe(true);
		expect(output.toLowerCase()).toMatch(/segment|revenue|iphone|services/);
	});
});
