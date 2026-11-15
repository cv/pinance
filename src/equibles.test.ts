import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as Api from "./api.js";

vi.mock("./api.js", async (importOriginal) => ({
	...(await importOriginal<typeof Api>()),
	callEquibles: vi.fn(),
}));

import { callEquibles } from "./api.js";
import * as equibles from "./equibles.js";

const mockCall = vi.mocked(callEquibles);
const url = "https://api.equibles.com/v1/test";
const respond = (data: unknown) => mockCall.mockResolvedValue({ data, url });

describe("Equibles backends", () => {
	beforeEach(() => {
		mockCall.mockReset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("latestPrice returns the first row and keeps a Free-plan notice", async () => {
		respond({ data: [{ ticker: "AAPL", close: 1 }], notice: "delayed" });
		await expect(equibles.latestPrice(" aapl ")).resolves.toEqual({
			data: { ticker: "AAPL", close: 1, notice: "delayed" },
			url,
		});
		expect(mockCall).toHaveBeenCalledWith("/v1/prices/latest", { tickers: "AAPL" }, undefined);

		respond({});
		await expect(equibles.latestPrice("AAPL")).resolves.toEqual({ data: {}, url });
	});

	it("priceInterval maps day, week, and month, and rejects the rest", () => {
		expect(equibles.priceInterval()).toBe("daily");
		expect(equibles.priceInterval("week")).toBe("weekly");
		expect(equibles.priceInterval("month")).toBe("monthly");
		expect(() => equibles.priceInterval("minute")).toThrow(equibles.UnsupportedOnEquiblesError);
		expect(() => equibles.priceInterval("year")).toThrow("Equibles does not provide year bars");
		expect(() => equibles.priceInterval("day", 5)).toThrow("interval multipliers");
	});

	it("prices asks for up to 500 bars in the date range", async () => {
		respond({ data: [{ close: 1 }] });
		const params = {
			ticker: "nvda",
			start_date: "2026-01-01",
			end_date: "2026-02-01",
			interval: "week" as const,
		};
		await expect(equibles.prices(params)).resolves.toEqual({ data: [{ close: 1 }], url });
		expect(mockCall).toHaveBeenCalledWith(
			"/v1/stocks/NVDA/prices",
			{ startDate: "2026-01-01", endDate: "2026-02-01", interval: "weekly", limit: 500 },
			undefined,
		);
		respond({});
		await expect(equibles.prices(params)).resolves.toEqual({ data: [], url });
	});

	it("statementQuery picks FY for annual, the latest for quarterly, and rejects TTM", () => {
		expect(equibles.statementQuery({ ticker: "A", period: "annual" })).toEqual({
			year: undefined,
			period: "FY",
		});
		expect(equibles.statementQuery({ ticker: "A", period: "quarterly" })).toEqual({
			year: undefined,
			period: undefined,
		});
		expect(
			equibles.statementQuery({
				ticker: "A",
				period: "quarterly",
				fiscal_year: 2026,
				fiscal_period: "Q2",
			}),
		).toEqual({ year: 2026, period: "Q2" });
		expect(() => equibles.statementQuery({ ticker: "A", period: "ttm" })).toThrow(
			"trailing-twelve-month",
		);
	});

	it("statement and allStatements call the statement endpoints", async () => {
		respond({ statement: "x" });
		await equibles.statement("cash_flow", { ticker: "aapl", period: "annual" });
		expect(mockCall).toHaveBeenCalledWith(
			"/v1/stocks/AAPL/financial-statements/cashflow",
			{ year: undefined, period: "FY" },
			undefined,
		);

		mockCall.mockReset();
		mockCall.mockImplementation(async (path) => ({ data: { path }, url: `u:${path}` }));
		const all = await equibles.allStatements({ ticker: "AAPL", period: "annual" });
		expect(all.url).toBe("u:/v1/stocks/AAPL/financial-statements/income");
		expect(all.data).toEqual({
			income: { path: "/v1/stocks/AAPL/financial-statements/income" },
			balance: { path: "/v1/stocks/AAPL/financial-statements/balance" },
			cash_flow: { path: "/v1/stocks/AAPL/financial-statements/cashflow" },
			sources: [
				"u:/v1/stocks/AAPL/financial-statements/income",
				"u:/v1/stocks/AAPL/financial-statements/balance",
				"u:/v1/stocks/AAPL/financial-statements/cashflow",
			],
		});
	});

	it("valuationHistory returns the newest points first", async () => {
		respond({ points: [{ label: "Q1" }, { label: "Q2" }, { label: "Q3" }] });
		await expect(equibles.valuationHistory("AAPL", 2)).resolves.toEqual({
			data: [{ label: "Q3" }, { label: "Q2" }],
			url,
		});
		respond({});
		await expect(equibles.valuationHistory("AAPL")).resolves.toEqual({ data: [], url });
	});

	it.each([
		["valuationMultiples", equibles.valuationMultiples, "/v1/stocks/AAPL/valuation-multiples", {}],
		[
			"analystEstimates",
			equibles.analystEstimates,
			"/v1/stocks/AAPL/analyst-estimates",
			{ limit: 100 },
		],
		["revenueBreakdown", equibles.revenueBreakdown, "/v1/stocks/AAPL/revenue-breakdown", {}],
	] as const)("%s calls its endpoint", async (_name, fn, path, query) => {
		respond({ ok: true });
		await expect(fn("aapl")).resolves.toEqual({ data: { ok: true }, url });
		expect(mockCall).toHaveBeenCalledWith(path, query, undefined);
	});

	it("filings maps form names to Equibles document types", async () => {
		respond({ data: [{ id: 1 }] });
		await expect(
			equibles.filings({ ticker: "AAPL", filing_type: "8-K", limit: 900 }),
		).resolves.toEqual({
			data: [{ id: 1 }],
			url,
		});
		expect(mockCall).toHaveBeenCalledWith(
			"/v1/stocks/AAPL/filings",
			{ documentType: "EightK", limit: 500 },
			undefined,
		);
		respond({});
		await equibles.filings({ ticker: "AAPL" });
		expect(mockCall).toHaveBeenLastCalledWith(
			"/v1/stocks/AAPL/filings",
			{ documentType: undefined, limit: 10 },
			undefined,
		);
	});

	it("insiderTransactions maps filing-date filters to a transaction-date range", async () => {
		expect(equibles.transactionDateRange({ filing_date: "2026-01-01" })).toEqual({
			startDate: "2026-01-01",
			endDate: "2026-01-01",
		});
		expect(
			equibles.transactionDateRange({ filing_date_gt: "2026-01-01", filing_date_lt: "2026-02-01" }),
		).toEqual({ startDate: "2026-01-01", endDate: "2026-02-01" });

		respond({ data: [{ shares: 1 }] });
		await equibles.insiderTransactions({
			ticker: "AAPL",
			filing_date_gte: "2026-01-01",
			limit: 900,
		});
		expect(mockCall).toHaveBeenCalledWith(
			"/v1/stocks/AAPL/insider-transactions",
			{ startDate: "2026-01-01", endDate: undefined, limit: 500 },
			undefined,
		);
		respond({});
		await expect(equibles.insiderTransactions({ ticker: "AAPL" })).resolves.toEqual({
			data: [],
			url,
		});
	});
});
