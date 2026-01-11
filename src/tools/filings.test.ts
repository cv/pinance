import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerFilingsTools } from "./filings.js";
import { getResultText, getTool, type MockTool } from "./test-utils.js";

vi.mock("../api.js", () => ({
	callApi: vi.fn(),
}));

import { callApi } from "../api.js";

const mockCallApi = vi.mocked(callApi);

describe("filings tools", () => {
	let registeredTools: Map<string, MockTool>;
	let mockPi: { registerTool: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		registeredTools = new Map();
		mockPi = {
			registerTool: vi.fn((tool) => {
				registeredTools.set(tool.name, tool);
			}),
		};
		registerFilingsTools(mockPi as never);
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("registerFilingsTools", () => {
		it("should register all filings tools", () => {
			expect(registeredTools.has("get_filings")).toBe(true);
			expect(registeredTools.has("get_10K_filing_items")).toBe(true);
			expect(registeredTools.has("get_10Q_filing_items")).toBe(true);
			expect(registeredTools.has("get_8K_filing_items")).toBe(true);
		});
	});

	describe("get_filings", () => {
		it("should call API with parameters", async () => {
			const mockFilings = [
				{ accession_number: "0000320193-24-000123", filing_type: "10-K" },
				{ accession_number: "0000320193-24-000456", filing_type: "10-Q" },
			];
			mockCallApi.mockResolvedValue({
				data: { filings: mockFilings },
				url: "https://api.financialdatasets.ai/filings/",
			});

			const tool = getTool(registeredTools, "get_filings");
			const result = await tool.execute(
				"test-id",
				{ ticker: "AAPL", filing_type: "10-K", limit: 5 },
				vi.fn(),
				{},
				undefined,
			);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/filings/",
				{ ticker: "AAPL", filing_type: "10-K", limit: 5 },
				undefined,
			);
			expect(JSON.parse(getResultText(result))).toEqual(mockFilings);
			expect(result.details.count).toBe(2);
		});

		it("should use default limit", async () => {
			mockCallApi.mockResolvedValue({
				data: { filings: [] },
				url: "https://api.financialdatasets.ai/filings/",
			});

			const tool = getTool(registeredTools, "get_filings");
			await tool.execute("test-id", { ticker: "AAPL" }, vi.fn(), {}, undefined);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/filings/",
				{ ticker: "AAPL", filing_type: undefined, limit: 10 },
				undefined,
			);
		});

		it("should handle empty filings", async () => {
			mockCallApi.mockResolvedValue({
				data: {},
				url: "https://api.financialdatasets.ai/filings/",
			});

			const tool = getTool(registeredTools, "get_filings");
			const result = await tool.execute("test-id", { ticker: "XYZ" }, vi.fn(), {}, undefined);

			expect(JSON.parse(getResultText(result))).toEqual([]);
			expect(result.details.count).toBe(0);
		});
	});

	describe("get_10K_filing_items", () => {
		it("should call API with correct parameters", async () => {
			const mockData = { "Item-1": "Business description..." };
			mockCallApi.mockResolvedValue({
				data: mockData,
				url: "https://api.financialdatasets.ai/filings/items/",
			});

			const tool = getTool(registeredTools, "get_10K_filing_items");
			const result = await tool.execute(
				"test-id",
				{ ticker: "aapl", year: 2023, item: ["Item-1", "Item-1A"] },
				vi.fn(),
				{},
				undefined,
			);

			// Ticker normalization happens in callApi, so tool passes original value
			expect(mockCallApi).toHaveBeenCalledWith(
				"/filings/items/",
				{
					ticker: "aapl",
					filing_type: "10-K",
					year: 2023,
					item: ["Item-1", "Item-1A"],
				},
				undefined,
			);
			expect(JSON.parse(getResultText(result))).toEqual(mockData);
		});

		it("should work without specific items", async () => {
			mockCallApi.mockResolvedValue({
				data: {},
				url: "https://api.financialdatasets.ai/filings/items/",
			});

			const tool = getTool(registeredTools, "get_10K_filing_items");
			await tool.execute("test-id", { ticker: "MSFT", year: 2022 }, vi.fn(), {}, undefined);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/filings/items/",
				{
					ticker: "MSFT",
					filing_type: "10-K",
					year: 2022,
					item: undefined,
				},
				undefined,
			);
		});
	});

	describe("get_10Q_filing_items", () => {
		it("should call API with quarter parameter", async () => {
			const mockData = { "Item-1": "Q1 Financial statements..." };
			mockCallApi.mockResolvedValue({
				data: mockData,
				url: "https://api.financialdatasets.ai/filings/items/",
			});

			const tool = getTool(registeredTools, "get_10Q_filing_items");
			const result = await tool.execute(
				"test-id",
				{ ticker: "googl", year: 2024, quarter: 1, item: ["Item-1"] },
				vi.fn(),
				{},
				undefined,
			);

			// Ticker normalization happens in callApi, so tool passes original value
			expect(mockCallApi).toHaveBeenCalledWith(
				"/filings/items/",
				{
					ticker: "googl",
					filing_type: "10-Q",
					year: 2024,
					quarter: 1,
					item: ["Item-1"],
				},
				undefined,
			);
			expect(JSON.parse(getResultText(result))).toEqual(mockData);
		});
	});

	describe("get_8K_filing_items", () => {
		it("should call API with accession number", async () => {
			const mockData = { "Item-2.02": "Results of Operations..." };
			mockCallApi.mockResolvedValue({
				data: mockData,
				url: "https://api.financialdatasets.ai/filings/items/",
			});

			const tool = getTool(registeredTools, "get_8K_filing_items");
			const result = await tool.execute(
				"test-id",
				{ ticker: "tsla", accession_number: "0001628280-24-012345" },
				vi.fn(),
				{},
				undefined,
			);

			// Ticker normalization happens in callApi, so tool passes original value
			expect(mockCallApi).toHaveBeenCalledWith(
				"/filings/items/",
				{
					ticker: "tsla",
					filing_type: "8-K",
					accession_number: "0001628280-24-012345",
				},
				undefined,
			);
			expect(JSON.parse(getResultText(result))).toEqual(mockData);
		});
	});
});
