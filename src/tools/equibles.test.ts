import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as Api from "../api.js";

vi.mock("../api.js", async (importOriginal) => ({
	...(await importOriginal<typeof Api>()),
	callApi: vi.fn(),
	callEquibles: vi.fn(),
}));

import { callApi, callEquibles } from "../api.js";
import {
	registerCryptoTools,
	registerEquiblesTools,
	registerEstimatesTools,
	registerFilingsTools,
	registerFundamentalsTools,
	registerInsiderTradesTools,
	registerMetricsTools,
	registerNewsTools,
	registerPriceTools,
	registerSegmentsTools,
} from "./index.js";
import { createMockPi, getTool, type MockPi, useProviders } from "./test-utils.js";

const mockEquibles = vi.mocked(callEquibles);
const mockApi = vi.mocked(callApi);
const url = "https://api.equibles.com/v1/x";

const FD_ONLY = [
	"get_crypto_price_snapshot",
	"get_crypto_prices",
	"get_available_crypto_tickers",
	"get_news",
	"get_10K_filing_items",
	"get_10Q_filing_items",
	"get_8K_filing_items",
];
const EQ_ONLY = [
	"get_earnings_call_transcript",
	"get_institutional_holders",
	"get_short_interest",
	"get_congress_trades",
	"search_filings",
];

function registerAll(): MockPi {
	const pi = createMockPi();
	for (const register of [
		registerCryptoTools,
		registerEquiblesTools,
		registerEstimatesTools,
		registerFilingsTools,
		registerFundamentalsTools,
		registerInsiderTradesTools,
		registerMetricsTools,
		registerNewsTools,
		registerPriceTools,
		registerSegmentsTools,
	]) {
		register(pi as never);
	}
	return pi;
}

const run = (pi: MockPi, name: string, params: Record<string, unknown>) =>
	getTool(pi.tools, name).execute("id", params, undefined, vi.fn(), {});

afterEach(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
});

describe("tool registration by provider", () => {
	it("registers every tool when no key is set, marking single-provider tools", () => {
		useProviders();
		const pi = registerAll();
		for (const name of [...FD_ONLY, ...EQ_ONLY]) {
			expect(pi.tools.has(name)).toBe(true);
		}
		const description = (name: string) => {
			const call = pi.registerTool.mock.calls.find(([tool]) => tool.name === name);
			return String((call?.[0] as { description?: string } | undefined)?.description);
		};
		expect(description("get_news")).toMatch(
			/Needs Financial Datasets \(FINANCIAL_DATASETS_API_KEY\)\.$/,
		);
		expect(description("search_filings")).toMatch(/Needs Equibles \(EQUIBLES_API_KEY\)\.$/);
		expect(description("get_prices")).not.toContain("Needs");
	});

	it("skips Equibles-only tools with only a Financial Datasets key", () => {
		useProviders({ fd: "k" });
		const pi = registerAll();
		for (const name of EQ_ONLY) {
			expect(pi.tools.has(name)).toBe(false);
		}
		expect(pi.tools.has("get_news")).toBe(true);
	});

	it("skips Financial Datasets-only tools with only an Equibles key", () => {
		useProviders({ eq: "k" });
		const pi = registerAll();
		for (const name of FD_ONLY) {
			expect(pi.tools.has(name)).toBe(false);
		}
		expect(pi.tools.has("get_prices")).toBe(true);
		expect(pi.tools.has("search_filings")).toBe(true);
	});
});

describe("tools on Equibles", () => {
	let pi: MockPi;

	beforeEach(() => {
		mockEquibles.mockReset();
		mockApi.mockReset();
		useProviders({ eq: "k" });
		pi = registerAll();
		mockEquibles.mockResolvedValue({
			data: { data: [{ row: 1 }], meta: { hasMore: false }, ticker: "AAPL", points: [] },
			url,
		});
	});

	it.each([
		["get_price_snapshot", { ticker: "AAPL" }, "/v1/prices/latest"],
		[
			"get_prices",
			{ ticker: "AAPL", start_date: "2026-01-01", end_date: "2026-02-01" },
			"/v1/stocks/AAPL/prices",
		],
		[
			"get_income_statements",
			{ ticker: "AAPL", period: "annual" },
			"/v1/stocks/AAPL/financial-statements/income",
		],
		[
			"get_balance_sheets",
			{ ticker: "AAPL", period: "annual" },
			"/v1/stocks/AAPL/financial-statements/balance",
		],
		[
			"get_cash_flow_statements",
			{ ticker: "AAPL", period: "annual" },
			"/v1/stocks/AAPL/financial-statements/cashflow",
		],
		[
			"get_all_financial_statements",
			{ ticker: "AAPL", period: "annual" },
			"/v1/stocks/AAPL/financial-statements/income",
		],
		["get_financial_metrics_snapshot", { ticker: "AAPL" }, "/v1/stocks/AAPL/valuation-multiples"],
		["get_financial_metrics", { ticker: "AAPL" }, "/v1/stocks/AAPL/valuation-multiples/history"],
		["get_analyst_estimates", { ticker: "AAPL" }, "/v1/stocks/AAPL/analyst-estimates"],
		["get_filings", { ticker: "AAPL" }, "/v1/stocks/AAPL/filings"],
		["get_insider_trades", { ticker: "AAPL" }, "/v1/stocks/AAPL/insider-transactions"],
		[
			"get_segmented_revenues",
			{ ticker: "AAPL", period: "annual" },
			"/v1/stocks/AAPL/revenue-breakdown",
		],
		[
			"get_earnings_call_transcript",
			{ ticker: "nvda", fiscal_year: 2027, fiscal_quarter: 1 },
			"/v1/stocks/NVDA/earnings-calls/2027/1/speakers",
		],
		[
			"get_institutional_holders",
			{ ticker: "AAPL", holder_types: ["bank", "ins"] },
			"/v1/stocks/AAPL/institutional-holders",
		],
		["get_short_interest", { ticker: "GME" }, "/v1/stocks/GME/short-interest"],
		["get_congress_trades", { ticker: "nvda" }, "/v1/congress/trades"],
		["search_filings", { query: "margin", ticker: "AAPL" }, "/v1/stocks/AAPL/filings/search"],
		["search_filings", { query: "margin", document_type: ["TenK"] }, "/v1/filings/search"],
	])("%s calls %s", async (name, params, path) => {
		const result = await run(pi, name, params);
		expect(mockEquibles.mock.calls[0]?.[0]).toBe(path);
		expect(mockApi).not.toHaveBeenCalled();
		expect(result.details).toMatchObject({ provider: "equibles", url });
	});

	it("passes Equibles query names for the Equibles-only tools", async () => {
		await run(pi, "get_institutional_holders", {
			ticker: "AAPL",
			holder_types: ["bank", "ins"],
			limit: 5,
		});
		expect(mockEquibles).toHaveBeenLastCalledWith(
			"/v1/stocks/AAPL/institutional-holders",
			{ reportDate: undefined, holderTypes: "bank,ins", limit: 5, offset: undefined },
			undefined,
		);
		await run(pi, "get_congress_trades", { ticker: "nvda", transaction_type: "Sale" });
		expect(mockEquibles).toHaveBeenLastCalledWith(
			"/v1/congress/trades",
			expect.objectContaining({ ticker: "NVDA", transactionType: "Sale" }),
			undefined,
		);
	});

	it("splits rows from paging and call details", async () => {
		const transcript = await run(pi, "get_earnings_call_transcript", {
			ticker: "NVDA",
			fiscal_year: 2027,
			fiscal_quarter: 1,
		});
		expect(transcript.details).not.toHaveProperty("count");
		expect(JSON.parse(transcript.content[0]?.text.split("\n\n[Source")[0] ?? "")).toEqual({
			turns: [{ row: 1 }],
			meta: { ticker: "AAPL", points: [], hasMore: false },
		});

		mockEquibles.mockResolvedValue({ data: {}, url });
		const holders = await run(pi, "get_institutional_holders", { ticker: "AAPL" });
		expect(JSON.parse(holders.content[0]?.text.split("\n\n[Source")[0] ?? "")).toEqual({
			holders: [],
			meta: {},
		});
		const shorts = await run(pi, "get_short_interest", { ticker: "GME" });
		expect(shorts.details).toMatchObject({ count: 0 });
	});

	it("needs a ticker or member for congressional trades", async () => {
		await expect(run(pi, "get_congress_trades", {})).rejects.toThrow(
			"needs ticker, member_id, or both",
		);
		await run(pi, "get_congress_trades", { member_id: "m1" });
		expect(mockEquibles).toHaveBeenLastCalledWith(
			"/v1/congress/trades",
			expect.objectContaining({ memberId: "m1", ticker: undefined }),
			undefined,
		);
	});
});

describe("tools with both keys", () => {
	it("use Financial Datasets unless PINANCE_PROVIDER says Equibles", async () => {
		mockApi.mockResolvedValue({ data: { snapshot: { price: 1 } }, url: "https://fd" });
		mockEquibles.mockResolvedValue({ data: { data: [{ close: 2 }] }, url });

		useProviders({ fd: "a", eq: "b" });
		let pi = registerAll();
		expect((await run(pi, "get_price_snapshot", { ticker: "AAPL" })).details).toMatchObject({
			provider: "financialdatasets",
		});

		vi.restoreAllMocks();
		useProviders({ fd: "a", eq: "b", prefer: "equibles" });
		pi = registerAll();
		expect((await run(pi, "get_price_snapshot", { ticker: "AAPL" })).details).toMatchObject({
			provider: "equibles",
		});
		// Tools only Financial Datasets has still use it.
		mockApi.mockResolvedValue({ data: { news: [] }, url: "https://fd/news" });
		expect((await run(pi, "get_news", { ticker: "AAPL" })).details).toMatchObject({
			provider: "financialdatasets",
		});
	});
});
