import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerSegmentsTools, SEGMENTS_ENDPOINT } from "./segments.js";
import { createMockPi, getResultJson, getTool, type MockPi } from "./test-utils.js";

vi.mock("../api.js", () => ({
	callApi: vi.fn(),
}));

import { callApi } from "../api.js";

const mockCallApi = vi.mocked(callApi);
const url = `https://api.financialdatasets.ai${SEGMENTS_ENDPOINT}`;

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

		it("should use the income statement segments endpoint", () => {
			expect(SEGMENTS_ENDPOINT).toBe("/financials/income-statements/segments/");
		});
	});

	describe("get_segmented_revenues", () => {
		it("should call API with parameters and return income_statement_segments", async () => {
			const rows = [
				{
					ticker: "AAPL",
					report_period: "2026-09-26",
					revenue: { product: [{ label: "iPhone", value: 254098000000 }] },
				},
			];
			mockCallApi.mockResolvedValue({ data: { income_statement_segments: rows }, url });

			const tool = getTool(mockPi.tools, "get_segmented_revenues");
			const result = await tool.execute(
				"test-id",
				{ ticker: "AAPL", period: "annual", limit: 5, report_period_gte: "2024-01-01" },
				undefined,
				vi.fn(),
				{},
			);

			expect(mockCallApi).toHaveBeenCalledWith(
				SEGMENTS_ENDPOINT,
				{ ticker: "AAPL", period: "annual", limit: 5, report_period_gte: "2024-01-01" },
				undefined,
			);
			expect(getResultJson(result)).toEqual(rows);
			expect(result.details).toMatchObject({ count: 1, url });
		});

		it("should fall back to the documented segmented_financials key", async () => {
			const rows = [{ ticker: "MSFT" }];
			mockCallApi.mockResolvedValue({ data: { segmented_financials: rows }, url });

			const tool = getTool(mockPi.tools, "get_segmented_revenues");
			const result = await tool.execute(
				"test-id",
				{ ticker: "MSFT", period: "quarterly" },
				undefined,
				vi.fn(),
				{},
			);

			expect(mockCallApi).toHaveBeenCalledWith(
				SEGMENTS_ENDPOINT,
				{ ticker: "MSFT", period: "quarterly", limit: 4 },
				undefined,
			);
			expect(getResultJson(result)).toEqual(rows);
		});

		it("should handle empty segments", async () => {
			mockCallApi.mockResolvedValue({ data: {}, url });

			const tool = getTool(mockPi.tools, "get_segmented_revenues");
			const result = await tool.execute(
				"test-id",
				{ ticker: "XYZ", period: "annual" },
				undefined,
				vi.fn(),
				{},
			);

			expect(getResultJson(result)).toEqual([]);
		});
	});
});
