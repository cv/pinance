import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerNewsTools } from "./news.js";
import { getTool, type MockTool } from "./test-utils.js";

vi.mock("../api.js", () => ({
	callApi: vi.fn(),
}));

import { callApi } from "../api.js";

const mockCallApi = vi.mocked(callApi);

describe("news tools", () => {
	let registeredTools: Map<string, MockTool>;
	let mockPi: { registerTool: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		registeredTools = new Map();
		mockPi = {
			registerTool: vi.fn((tool) => {
				registeredTools.set(tool.name, tool);
			}),
		};
		registerNewsTools(mockPi as never);
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("registerNewsTools", () => {
		it("should register get_news tool", () => {
			expect(registeredTools.has("get_news")).toBe(true);
		});
	});

	describe("get_news", () => {
		it("should call API with all parameters", async () => {
			const mockNews = [
				{ title: "Apple announces new product", date: "2024-01-15" },
				{ title: "Apple earnings beat expectations", date: "2024-01-10" },
			];
			mockCallApi.mockResolvedValue({
				data: { news: mockNews },
				url: "https://api.financialdatasets.ai/news/",
			});

			const tool = getTool(registeredTools, "get_news");
			const result = await tool.execute(
				"test-id",
				{
					ticker: "AAPL",
					start_date: "2024-01-01",
					end_date: "2024-01-31",
					limit: 20,
				},
				vi.fn(),
				{},
				undefined,
			);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/news/",
				{
					ticker: "AAPL",
					start_date: "2024-01-01",
					end_date: "2024-01-31",
					limit: 20,
				},
				undefined,
			);
			expect(JSON.parse(result.content[0].text)).toEqual(mockNews);
			expect(result.details.count).toBe(2);
		});

		it("should use default limit", async () => {
			mockCallApi.mockResolvedValue({
				data: { news: [] },
				url: "https://api.financialdatasets.ai/news/",
			});

			const tool = getTool(registeredTools, "get_news");
			await tool.execute("test-id", { ticker: "MSFT" }, vi.fn(), {}, undefined);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/news/",
				{
					ticker: "MSFT",
					start_date: undefined,
					end_date: undefined,
					limit: 10,
				},
				undefined,
			);
		});

		it("should handle empty news", async () => {
			mockCallApi.mockResolvedValue({
				data: {},
				url: "https://api.financialdatasets.ai/news/",
			});

			const tool = getTool(registeredTools, "get_news");
			const result = await tool.execute("test-id", { ticker: "XYZ" }, vi.fn(), {}, undefined);

			expect(JSON.parse(result.content[0].text)).toEqual([]);
			expect(result.details.count).toBe(0);
		});
	});
});
