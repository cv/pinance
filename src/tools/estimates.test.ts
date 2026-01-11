import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerEstimatesTools } from "./estimates.js";
import { getResultText, getTool, type MockTool } from "./test-utils.js";

vi.mock("../api.js", () => ({
	callApi: vi.fn(),
}));

import { callApi } from "../api.js";

const mockCallApi = vi.mocked(callApi);

describe("estimates tools", () => {
	let registeredTools: Map<string, MockTool>;
	let mockPi: { registerTool: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		registeredTools = new Map();
		mockPi = {
			registerTool: vi.fn((tool) => {
				registeredTools.set(tool.name, tool);
			}),
		};
		registerEstimatesTools(mockPi as never);
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("registerEstimatesTools", () => {
		it("should register get_analyst_estimates tool", () => {
			expect(registeredTools.has("get_analyst_estimates")).toBe(true);
		});
	});

	describe("get_analyst_estimates", () => {
		it("should call API with parameters", async () => {
			const mockEstimates = [
				{ fiscal_year: 2024, eps_estimate: 6.5 },
				{ fiscal_year: 2025, eps_estimate: 7.2 },
			];
			mockCallApi.mockResolvedValue({
				data: { analyst_estimates: mockEstimates },
				url: "https://api.financialdatasets.ai/analyst-estimates/",
			});

			const tool = getTool(registeredTools, "get_analyst_estimates");
			const result = await tool.execute(
				"test-id",
				{ ticker: "NVDA", period: "quarterly" },
				vi.fn(),
				{},
				undefined,
			);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/analyst-estimates/",
				{ ticker: "NVDA", period: "quarterly" },
				undefined,
			);
			expect(JSON.parse(getResultText(result))).toEqual(mockEstimates);
			expect(result.details.count).toBe(2);
		});

		it("should use default period", async () => {
			mockCallApi.mockResolvedValue({
				data: { analyst_estimates: [] },
				url: "https://api.financialdatasets.ai/analyst-estimates/",
			});

			const tool = getTool(registeredTools, "get_analyst_estimates");
			await tool.execute("test-id", { ticker: "AAPL" }, vi.fn(), {}, undefined);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/analyst-estimates/",
				{ ticker: "AAPL", period: "annual" },
				undefined,
			);
		});

		it("should handle empty estimates", async () => {
			mockCallApi.mockResolvedValue({
				data: {},
				url: "https://api.financialdatasets.ai/analyst-estimates/",
			});

			const tool = getTool(registeredTools, "get_analyst_estimates");
			const result = await tool.execute("test-id", { ticker: "XYZ" }, vi.fn(), {}, undefined);

			expect(JSON.parse(getResultText(result))).toEqual([]);
			expect(result.details.count).toBe(0);
		});
	});
});
