import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerMetricsTools } from "./metrics.js";
import { createMockPi, getResultJson, getTool, type MockPi } from "./test-utils.js";

vi.mock("../api.js", () => ({
	callApi: vi.fn(),
}));

import { callApi } from "../api.js";

const mockCallApi = vi.mocked(callApi);

describe("metrics tools", () => {
	let mockPi: MockPi;

	beforeEach(() => {
		mockPi = createMockPi();
		registerMetricsTools(mockPi as never);
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("registerMetricsTools", () => {
		it("should register all metrics tools", () => {
			expect(mockPi.tools.has("get_financial_metrics_snapshot")).toBe(true);
			expect(mockPi.tools.has("get_financial_metrics")).toBe(true);
		});
	});

	describe("get_financial_metrics_snapshot", () => {
		it("should call API and return snapshot", async () => {
			const mockSnapshot = { pe_ratio: 25.5, market_cap: 3000000000000 };
			mockCallApi.mockResolvedValue({
				data: { snapshot: mockSnapshot },
				url: "https://api.financialdatasets.ai/financial-metrics/snapshot/",
			});

			const tool = getTool(mockPi.tools, "get_financial_metrics_snapshot");
			const result = await tool.execute("test-id", { ticker: "AAPL" }, vi.fn(), {}, undefined);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/financial-metrics/snapshot/",
				{ ticker: "AAPL" },
				undefined,
			);
			expect(getResultJson(result)).toEqual(mockSnapshot);
		});

		it("should handle empty snapshot", async () => {
			mockCallApi.mockResolvedValue({
				data: {},
				url: "https://api.financialdatasets.ai/financial-metrics/snapshot/",
			});

			const tool = getTool(mockPi.tools, "get_financial_metrics_snapshot");
			const result = await tool.execute("test-id", { ticker: "XYZ" }, vi.fn(), {}, undefined);

			expect(getResultJson(result)).toEqual({});
		});
	});

	describe("get_financial_metrics", () => {
		it("should call API with all parameters", async () => {
			const mockMetrics = [
				{ date: "2024-01-01", pe_ratio: 25 },
				{ date: "2023-01-01", pe_ratio: 23 },
			];
			mockCallApi.mockResolvedValue({
				data: { financial_metrics: mockMetrics },
				url: "https://api.financialdatasets.ai/financial-metrics/",
			});

			const tool = getTool(mockPi.tools, "get_financial_metrics");
			const result = await tool.execute(
				"test-id",
				{
					ticker: "AAPL",
					period: "annual",
					limit: 10,
					report_period_gte: "2020-01-01",
				},
				vi.fn(),
				{},
				undefined,
			);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/financial-metrics/",
				{
					ticker: "AAPL",
					period: "annual",
					limit: 10,
					report_period: undefined,
					report_period_gt: undefined,
					report_period_gte: "2020-01-01",
					report_period_lt: undefined,
					report_period_lte: undefined,
				},
				undefined,
			);
			expect(getResultJson(result)).toEqual(mockMetrics);
			expect(result.details.count).toBe(2);
		});

		it("should use defaults for period and limit", async () => {
			mockCallApi.mockResolvedValue({
				data: { financial_metrics: [] },
				url: "https://api.financialdatasets.ai/financial-metrics/",
			});

			const tool = getTool(mockPi.tools, "get_financial_metrics");
			await tool.execute("test-id", { ticker: "MSFT" }, vi.fn(), {}, undefined);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/financial-metrics/",
				expect.objectContaining({
					ticker: "MSFT",
					period: "ttm",
					limit: 4,
				}),
				undefined,
			);
		});

		it("should handle empty metrics", async () => {
			mockCallApi.mockResolvedValue({
				data: {},
				url: "https://api.financialdatasets.ai/financial-metrics/",
			});

			const tool = getTool(mockPi.tools, "get_financial_metrics");
			const result = await tool.execute("test-id", { ticker: "XYZ" }, vi.fn(), {}, undefined);

			expect(getResultJson(result)).toEqual([]);
			expect(result.details.count).toBe(0);
		});
	});
});
