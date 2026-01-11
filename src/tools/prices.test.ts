import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerPriceTools } from "./prices.js";
import { createMockPi, getResultText, getResultType, getTool, type MockPi } from "./test-utils.js";

// Mock the api module
vi.mock("../api.js", () => ({
	callApi: vi.fn(),
}));

import { callApi } from "../api.js";

const mockCallApi = vi.mocked(callApi);

describe("prices tools", () => {
	let mockPi: MockPi;

	beforeEach(() => {
		mockPi = createMockPi();
		registerPriceTools(mockPi as never);
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("registerPriceTools", () => {
		it("should register get_price_snapshot tool", () => {
			expect(mockPi.tools.has("get_price_snapshot")).toBe(true);
			const tool = getTool(mockPi.tools, "get_price_snapshot");
			expect(tool.name).toBe("get_price_snapshot");
		});

		it("should register get_prices tool", () => {
			expect(mockPi.tools.has("get_prices")).toBe(true);
			const tool = getTool(mockPi.tools, "get_prices");
			expect(tool.name).toBe("get_prices");
		});
	});

	describe("get_price_snapshot", () => {
		it("should call API and return snapshot data", async () => {
			const mockSnapshot = { price: 150.25, volume: 1000000 };
			mockCallApi.mockResolvedValue({
				data: { snapshot: mockSnapshot },
				url: "https://api.financialdatasets.ai/prices/snapshot/?ticker=AAPL",
			});

			const tool = getTool(mockPi.tools, "get_price_snapshot");
			const result = await tool.execute("test-id", { ticker: "AAPL" }, vi.fn(), {}, undefined);

			expect(mockCallApi).toHaveBeenCalledWith("/prices/snapshot/", { ticker: "AAPL" }, undefined);
			expect(getResultType(result)).toBe("text");
			expect(JSON.parse(getResultText(result))).toEqual(mockSnapshot);
			expect(result.details.snapshot).toEqual(mockSnapshot);
		});

		it("should handle empty snapshot", async () => {
			mockCallApi.mockResolvedValue({
				data: {},
				url: "https://api.financialdatasets.ai/prices/snapshot/?ticker=XYZ",
			});

			const tool = getTool(mockPi.tools, "get_price_snapshot");
			const result = await tool.execute("test-id", { ticker: "XYZ" }, vi.fn(), {}, undefined);

			expect(JSON.parse(getResultText(result))).toEqual({});
		});
	});

	describe("get_prices", () => {
		it("should call API with all parameters", async () => {
			const mockPrices = [
				{ date: "2024-01-01", close: 150 },
				{ date: "2024-01-02", close: 151 },
			];
			mockCallApi.mockResolvedValue({
				data: { prices: mockPrices },
				url: "https://api.financialdatasets.ai/prices/?ticker=AAPL",
			});

			const tool = getTool(mockPi.tools, "get_prices");
			const result = await tool.execute(
				"test-id",
				{
					ticker: "AAPL",
					interval: "day",
					interval_multiplier: 1,
					start_date: "2024-01-01",
					end_date: "2024-01-10",
				},
				vi.fn(),
				{},
				undefined,
			);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/prices/",
				{
					ticker: "AAPL",
					interval: "day",
					interval_multiplier: 1,
					start_date: "2024-01-01",
					end_date: "2024-01-10",
				},
				undefined,
			);
			expect(JSON.parse(getResultText(result))).toEqual(mockPrices);
			expect(result.details.count).toBe(2);
		});

		it("should use default interval and multiplier", async () => {
			mockCallApi.mockResolvedValue({
				data: { prices: [] },
				url: "https://api.financialdatasets.ai/prices/",
			});

			const tool = getTool(mockPi.tools, "get_prices");
			await tool.execute(
				"test-id",
				{
					ticker: "AAPL",
					start_date: "2024-01-01",
					end_date: "2024-01-10",
				},
				vi.fn(),
				{},
				undefined,
			);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/prices/",
				{
					ticker: "AAPL",
					interval: "day",
					interval_multiplier: 1,
					start_date: "2024-01-01",
					end_date: "2024-01-10",
				},
				undefined,
			);
		});

		it("should handle empty prices array", async () => {
			mockCallApi.mockResolvedValue({
				data: {},
				url: "https://api.financialdatasets.ai/prices/",
			});

			const tool = getTool(mockPi.tools, "get_prices");
			const result = await tool.execute(
				"test-id",
				{
					ticker: "XYZ",
					start_date: "2024-01-01",
					end_date: "2024-01-10",
				},
				vi.fn(),
				{},
				undefined,
			);

			expect(JSON.parse(getResultText(result))).toEqual([]);
			expect(result.details.count).toBe(0);
		});
	});
});
