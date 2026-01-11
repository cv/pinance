import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerEstimatesTools } from "./estimates.js";
import { createMockPi, getResultJson, getTool, type MockPi } from "./test-utils.js";

vi.mock("../api.js", () => ({
	callApi: vi.fn(),
}));

import { callApi } from "../api.js";

const mockCallApi = vi.mocked(callApi);

describe("estimates tools", () => {
	let mockPi: MockPi;

	beforeEach(() => {
		mockPi = createMockPi();
		registerEstimatesTools(mockPi as never);
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("registerEstimatesTools", () => {
		it("should register get_analyst_estimates tool", () => {
			expect(mockPi.tools.has("get_analyst_estimates")).toBe(true);
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

			const tool = getTool(mockPi.tools, "get_analyst_estimates");
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
			expect(getResultJson(result)).toEqual(mockEstimates);
			expect(result.details.count).toBe(2);
		});

		it("should use default period", async () => {
			mockCallApi.mockResolvedValue({
				data: { analyst_estimates: [] },
				url: "https://api.financialdatasets.ai/analyst-estimates/",
			});

			const tool = getTool(mockPi.tools, "get_analyst_estimates");
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

			const tool = getTool(mockPi.tools, "get_analyst_estimates");
			const result = await tool.execute("test-id", { ticker: "XYZ" }, vi.fn(), {}, undefined);

			expect(getResultJson(result)).toEqual([]);
			expect(result.details.count).toBe(0);
		});
	});
});
