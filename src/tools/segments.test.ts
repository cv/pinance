import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerSegmentsTools } from "./segments.js";
import { createMockPi, getResultJson, getTool, type MockPi } from "./test-utils.js";

vi.mock("../api.js", () => ({
	callApi: vi.fn(),
}));

import { callApi } from "../api.js";

const mockCallApi = vi.mocked(callApi);

describe("segments tools", () => {
	let mockPi: MockPi;

	beforeEach(() => {
		mockPi = createMockPi();
		registerSegmentsTools(mockPi as never);
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("registerSegmentsTools", () => {
		it("should register get_segmented_revenues tool", () => {
			expect(mockPi.tools.has("get_segmented_revenues")).toBe(true);
		});
	});

	describe("get_segmented_revenues", () => {
		it("should call API with parameters", async () => {
			const mockSegments = {
				i_phone: 200000000000,
				services: 80000000000,
				mac: 30000000000,
			};
			mockCallApi.mockResolvedValue({
				data: { segmented_revenues: mockSegments },
				url: "https://api.financialdatasets.ai/financials/segmented-revenues/",
			});

			const tool = getTool(mockPi.tools, "get_segmented_revenues");
			const result = await tool.execute(
				"test-id",
				{ ticker: "AAPL", period: "annual", limit: 5 },
				vi.fn(),
				{},
				undefined,
			);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/financials/segmented-revenues/",
				{ ticker: "AAPL", period: "annual", limit: 5 },
				undefined,
			);
			expect(getResultJson(result)).toEqual(mockSegments);
		});

		it("should use default limit", async () => {
			mockCallApi.mockResolvedValue({
				data: { segmented_revenues: {} },
				url: "https://api.financialdatasets.ai/financials/segmented-revenues/",
			});

			const tool = getTool(mockPi.tools, "get_segmented_revenues");
			await tool.execute(
				"test-id",
				{ ticker: "MSFT", period: "quarterly" },
				vi.fn(),
				{},
				undefined,
			);

			expect(mockCallApi).toHaveBeenCalledWith(
				"/financials/segmented-revenues/",
				{ ticker: "MSFT", period: "quarterly", limit: 10 },
				undefined,
			);
		});

		it("should handle empty segments", async () => {
			mockCallApi.mockResolvedValue({
				data: {},
				url: "https://api.financialdatasets.ai/financials/segmented-revenues/",
			});

			const tool = getTool(mockPi.tools, "get_segmented_revenues");
			const result = await tool.execute(
				"test-id",
				{ ticker: "XYZ", period: "annual" },
				vi.fn(),
				{},
				undefined,
			);

			expect(getResultJson(result)).toEqual({});
		});
	});
});
