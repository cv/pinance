import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerFundamentalsTools } from "./fundamentals.js";
import { getResultText, getTool, type MockTool } from "./test-utils.js";

vi.mock("../api.js", () => ({
	callApi: vi.fn(),
}));

import { callApi } from "../api.js";

const mockCallApi = vi.mocked(callApi);

describe("fundamentals tools", () => {
	let registeredTools: Map<string, MockTool>;
	let mockPi: { registerTool: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		registeredTools = new Map();
		mockPi = {
			registerTool: vi.fn((tool) => {
				registeredTools.set(tool.name, tool);
			}),
		};
		registerFundamentalsTools(mockPi as never);
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("registerFundamentalsTools", () => {
		it("should register all fundamentals tools", () => {
			expect(registeredTools.has("get_income_statements")).toBe(true);
			expect(registeredTools.has("get_balance_sheets")).toBe(true);
			expect(registeredTools.has("get_cash_flow_statements")).toBe(true);
			expect(registeredTools.has("get_all_financial_statements")).toBe(true);
		});
	});

	describe("get_income_statements", () => {
		it("should call API with parameters", async () => {
			const mockData = { revenue: 100000, net_income: 20000 };
			mockCallApi.mockResolvedValue({
				data: { income_statements: mockData },
				url: "https://api.financialdatasets.ai/financials/income-statements/",
			});

			const tool = getTool(registeredTools, "get_income_statements");
			const result = await tool.execute(
				"test-id",
				{ ticker: "AAPL", period: "annual", limit: 5 },
				vi.fn(),
				{},
				undefined,
			);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/financials/income-statements/",
				{
					ticker: "AAPL",
					period: "annual",
					limit: 5,
					report_period_gt: undefined,
					report_period_gte: undefined,
					report_period_lt: undefined,
					report_period_lte: undefined,
				},
				undefined,
			);
			expect(JSON.parse(getResultText(result))).toEqual(mockData);
		});

		it("should use default limit", async () => {
			mockCallApi.mockResolvedValue({
				data: { income_statements: {} },
				url: "https://api.financialdatasets.ai/financials/income-statements/",
			});

			const tool = getTool(registeredTools, "get_income_statements");
			await tool.execute(
				"test-id",
				{ ticker: "AAPL", period: "quarterly" },
				vi.fn(),
				{},
				undefined,
			);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/financials/income-statements/",
				expect.objectContaining({ limit: 10 }),
				undefined,
			);
		});

		it("should pass date filters", async () => {
			mockCallApi.mockResolvedValue({
				data: { income_statements: {} },
				url: "https://api.financialdatasets.ai/financials/income-statements/",
			});

			const tool = getTool(registeredTools, "get_income_statements");
			await tool.execute(
				"test-id",
				{
					ticker: "AAPL",
					period: "annual",
					report_period_gte: "2020-01-01",
					report_period_lte: "2023-12-31",
				},
				vi.fn(),
				{},
				undefined,
			);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/financials/income-statements/",
				expect.objectContaining({
					report_period_gte: "2020-01-01",
					report_period_lte: "2023-12-31",
				}),
				undefined,
			);
		});

		it("should handle empty response", async () => {
			mockCallApi.mockResolvedValue({
				data: {},
				url: "https://api.financialdatasets.ai/financials/income-statements/",
			});

			const tool = getTool(registeredTools, "get_income_statements");
			const result = await tool.execute(
				"test-id",
				{ ticker: "XYZ", period: "annual" },
				vi.fn(),
				{},
				undefined,
			);

			expect(JSON.parse(getResultText(result))).toEqual({});
		});
	});

	describe("get_balance_sheets", () => {
		it("should call API and return data", async () => {
			const mockData = { total_assets: 500000, total_liabilities: 200000 };
			mockCallApi.mockResolvedValue({
				data: { balance_sheets: mockData },
				url: "https://api.financialdatasets.ai/financials/balance-sheets/",
			});

			const tool = getTool(registeredTools, "get_balance_sheets");
			const result = await tool.execute(
				"test-id",
				{ ticker: "MSFT", period: "quarterly" },
				vi.fn(),
				{},
				undefined,
			);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/financials/balance-sheets/",
				expect.objectContaining({ ticker: "MSFT", period: "quarterly" }),
				undefined,
			);
			expect(JSON.parse(getResultText(result))).toEqual(mockData);
		});
	});

	describe("get_cash_flow_statements", () => {
		it("should call API and return data", async () => {
			const mockData = { operating_cash_flow: 80000, investing_cash_flow: -20000 };
			mockCallApi.mockResolvedValue({
				data: { cash_flow_statements: mockData },
				url: "https://api.financialdatasets.ai/financials/cash-flow-statements/",
			});

			const tool = getTool(registeredTools, "get_cash_flow_statements");
			const result = await tool.execute(
				"test-id",
				{ ticker: "GOOGL", period: "ttm" },
				vi.fn(),
				{},
				undefined,
			);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/financials/cash-flow-statements/",
				expect.objectContaining({ ticker: "GOOGL", period: "ttm" }),
				undefined,
			);
			expect(JSON.parse(getResultText(result))).toEqual(mockData);
		});
	});

	describe("get_all_financial_statements", () => {
		it("should call API and return all financials", async () => {
			const mockData = {
				income_statement: { revenue: 100000 },
				balance_sheet: { assets: 500000 },
				cash_flow: { operating: 80000 },
			};
			mockCallApi.mockResolvedValue({
				data: { financials: mockData },
				url: "https://api.financialdatasets.ai/financials/",
			});

			const tool = getTool(registeredTools, "get_all_financial_statements");
			const result = await tool.execute(
				"test-id",
				{ ticker: "TSLA", period: "annual" },
				vi.fn(),
				{},
				undefined,
			);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/financials/",
				expect.objectContaining({ ticker: "TSLA", period: "annual" }),
				undefined,
			);
			expect(JSON.parse(getResultText(result))).toEqual(mockData);
		});
	});
});
