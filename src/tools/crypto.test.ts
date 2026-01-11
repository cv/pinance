import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerCryptoTools } from "./crypto.js";
import { getTool, type MockTool } from "./test-utils.js";

vi.mock("../api.js", () => ({
	callApi: vi.fn(),
}));

import { callApi } from "../api.js";

const mockCallApi = vi.mocked(callApi);

describe("crypto tools", () => {
	let registeredTools: Map<string, MockTool>;
	let mockPi: { registerTool: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		registeredTools = new Map();
		mockPi = {
			registerTool: vi.fn((tool) => {
				registeredTools.set(tool.name, tool);
			}),
		};
		registerCryptoTools(mockPi as never);
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("registerCryptoTools", () => {
		it("should register all crypto tools", () => {
			expect(registeredTools.has("get_crypto_price_snapshot")).toBe(true);
			expect(registeredTools.has("get_crypto_prices")).toBe(true);
			expect(registeredTools.has("get_available_crypto_tickers")).toBe(true);
		});
	});

	describe("get_crypto_price_snapshot", () => {
		it("should call API and return snapshot", async () => {
			const mockSnapshot = { price: 45000, volume: 500000 };
			mockCallApi.mockResolvedValue({
				data: { snapshot: mockSnapshot },
				url: "https://api.financialdatasets.ai/crypto/prices/snapshot/?ticker=BTC-USD",
			});

			const tool = getTool(registeredTools, "get_crypto_price_snapshot");
			const result = await tool.execute("test-id", { ticker: "BTC-USD" }, vi.fn(), {}, undefined);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/crypto/prices/snapshot/",
				{ ticker: "BTC-USD" },
				undefined,
			);
			expect(JSON.parse(result.content[0].text)).toEqual(mockSnapshot);
		});

		it("should handle empty snapshot", async () => {
			mockCallApi.mockResolvedValue({
				data: {},
				url: "https://api.financialdatasets.ai/crypto/prices/snapshot/",
			});

			const tool = getTool(registeredTools, "get_crypto_price_snapshot");
			const result = await tool.execute("test-id", { ticker: "BTC-USD" }, vi.fn(), {}, undefined);

			expect(JSON.parse(result.content[0].text)).toEqual({});
		});
	});

	describe("get_crypto_prices", () => {
		it("should call API with all parameters", async () => {
			const mockPrices = [
				{ date: "2024-01-01", close: 45000 },
				{ date: "2024-01-02", close: 46000 },
			];
			mockCallApi.mockResolvedValue({
				data: { prices: mockPrices },
				url: "https://api.financialdatasets.ai/crypto/prices/",
			});

			const tool = getTool(registeredTools, "get_crypto_prices");
			const result = await tool.execute(
				"test-id",
				{
					ticker: "BTC-USD",
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
				"/crypto/prices/",
				{
					ticker: "BTC-USD",
					interval: "day",
					interval_multiplier: 1,
					start_date: "2024-01-01",
					end_date: "2024-01-10",
				},
				undefined,
			);
			expect(JSON.parse(result.content[0].text)).toEqual(mockPrices);
			expect(result.details.count).toBe(2);
		});

		it("should use default interval and multiplier", async () => {
			mockCallApi.mockResolvedValue({
				data: { prices: [] },
				url: "https://api.financialdatasets.ai/crypto/prices/",
			});

			const tool = getTool(registeredTools, "get_crypto_prices");
			await tool.execute(
				"test-id",
				{
					ticker: "ETH-USD",
					start_date: "2024-01-01",
					end_date: "2024-01-10",
				},
				vi.fn(),
				{},
				undefined,
			);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/crypto/prices/",
				{
					ticker: "ETH-USD",
					interval: "day",
					interval_multiplier: 1,
					start_date: "2024-01-01",
					end_date: "2024-01-10",
				},
				undefined,
			);
		});

		it("should handle empty prices", async () => {
			mockCallApi.mockResolvedValue({
				data: {},
				url: "https://api.financialdatasets.ai/crypto/prices/",
			});

			const tool = getTool(registeredTools, "get_crypto_prices");
			const result = await tool.execute(
				"test-id",
				{
					ticker: "BTC-USD",
					start_date: "2024-01-01",
					end_date: "2024-01-10",
				},
				vi.fn(),
				{},
				undefined,
			);

			expect(JSON.parse(result.content[0].text)).toEqual([]);
			expect(result.details.count).toBe(0);
		});
	});

	describe("get_available_crypto_tickers", () => {
		it("should return list of tickers", async () => {
			const mockTickers = ["BTC-USD", "ETH-USD", "SOL-USD"];
			mockCallApi.mockResolvedValue({
				data: { tickers: mockTickers },
				url: "https://api.financialdatasets.ai/crypto/prices/tickers/",
			});

			const tool = getTool(registeredTools, "get_available_crypto_tickers");
			const result = await tool.execute("test-id", {}, vi.fn(), {}, undefined);

			expect(mockCallApi).toHaveBeenCalledWith("/crypto/prices/tickers/", {}, undefined);
			expect(JSON.parse(result.content[0].text)).toEqual(mockTickers);
			expect(result.details.count).toBe(3);
		});

		it("should handle empty tickers", async () => {
			mockCallApi.mockResolvedValue({
				data: {},
				url: "https://api.financialdatasets.ai/crypto/prices/tickers/",
			});

			const tool = getTool(registeredTools, "get_available_crypto_tickers");
			const result = await tool.execute("test-id", {}, vi.fn(), {}, undefined);

			expect(JSON.parse(result.content[0].text)).toEqual([]);
			expect(result.details.count).toBe(0);
		});
	});
});
