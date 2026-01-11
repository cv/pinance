import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerInsiderTradesTools } from "./insider-trades.js";
import { createMockPi, getResultText, getTool, type MockPi } from "./test-utils.js";

vi.mock("../api.js", () => ({
	callApi: vi.fn(),
}));

import { callApi } from "../api.js";

const mockCallApi = vi.mocked(callApi);

describe("insider-trades tools", () => {
	let mockPi: MockPi;

	beforeEach(() => {
		mockPi = createMockPi();
		registerInsiderTradesTools(mockPi as never);
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("registerInsiderTradesTools", () => {
		it("should register get_insider_trades tool", () => {
			expect(mockPi.tools.has("get_insider_trades")).toBe(true);
		});
	});

	describe("get_insider_trades", () => {
		it("should call API with all parameters", async () => {
			const mockTrades = [
				{ insider_name: "Tim Cook", transaction_type: "Sale", shares: 10000 },
				{ insider_name: "Luca Maestri", transaction_type: "Purchase", shares: 5000 },
			];
			mockCallApi.mockResolvedValue({
				data: { insider_trades: mockTrades },
				url: "https://api.financialdatasets.ai/insider-trades/",
			});

			const tool = getTool(mockPi.tools, "get_insider_trades");
			const result = await tool.execute(
				"test-id",
				{
					ticker: "aapl",
					limit: 50,
					filing_date_gte: "2024-01-01",
					filing_date_lte: "2024-06-30",
				},
				vi.fn(),
				{},
				undefined,
			);

			// Ticker normalization happens in callApi, so tool passes original value
			expect(mockCallApi).toHaveBeenCalledWith(
				"/insider-trades/",
				{
					ticker: "aapl",
					limit: 50,
					filing_date: undefined,
					filing_date_gt: undefined,
					filing_date_gte: "2024-01-01",
					filing_date_lt: undefined,
					filing_date_lte: "2024-06-30",
				},
				undefined,
			);
			expect(JSON.parse(getResultText(result))).toEqual(mockTrades);
			expect(result.details.count).toBe(2);
		});

		it("should pass ticker to API (normalization happens in callApi)", async () => {
			mockCallApi.mockResolvedValue({
				data: { insider_trades: [] },
				url: "https://api.financialdatasets.ai/insider-trades/",
			});

			const tool = getTool(mockPi.tools, "get_insider_trades");
			await tool.execute("test-id", { ticker: "msft" }, vi.fn(), {}, undefined);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/insider-trades/",
				expect.objectContaining({ ticker: "msft" }),
				undefined,
			);
		});

		it("should use default limit", async () => {
			mockCallApi.mockResolvedValue({
				data: { insider_trades: [] },
				url: "https://api.financialdatasets.ai/insider-trades/",
			});

			const tool = getTool(mockPi.tools, "get_insider_trades");
			await tool.execute("test-id", { ticker: "TSLA" }, vi.fn(), {}, undefined);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/insider-trades/",
				expect.objectContaining({ limit: 100 }),
				undefined,
			);
		});

		it("should handle empty trades", async () => {
			mockCallApi.mockResolvedValue({
				data: {},
				url: "https://api.financialdatasets.ai/insider-trades/",
			});

			const tool = getTool(mockPi.tools, "get_insider_trades");
			const result = await tool.execute("test-id", { ticker: "XYZ" }, vi.fn(), {}, undefined);

			expect(JSON.parse(getResultText(result))).toEqual([]);
			expect(result.details.count).toBe(0);
		});
	});
});
