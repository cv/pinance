import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callApi } from "./api.js";

describe("callApi", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = { ...originalEnv, FINANCIAL_DATASETS_API_KEY: "test-api-key" };
	});

	afterEach(() => {
		process.env = originalEnv;
		vi.restoreAllMocks();
	});

	it("should throw error when API key is not set", async () => {
		process.env = { ...originalEnv };
		process.env.FINANCIAL_DATASETS_API_KEY = undefined;

		await expect(callApi("/test", {})).rejects.toThrow(
			"FINANCIAL_DATASETS_API_KEY environment variable is not set",
		);
	});

	it("should build URL with params", async () => {
		const mockFetch = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(new Response(JSON.stringify({ data: "test" }), { status: 200 }));

		await callApi("/prices/snapshot/", { ticker: "AAPL" });

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.financialdatasets.ai/prices/snapshot/?ticker=AAPL",
			expect.objectContaining({
				headers: { "x-api-key": "test-api-key" },
			}),
		);
	});

	it("should handle array params", async () => {
		const mockFetch = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(new Response(JSON.stringify({ data: "test" }), { status: 200 }));

		await callApi("/test", { items: ["a", "b", "c"] });

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.financialdatasets.ai/test?items=a&items=b&items=c",
			expect.any(Object),
		);
	});

	it("should skip undefined params", async () => {
		const mockFetch = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(new Response(JSON.stringify({ data: "test" }), { status: 200 }));

		await callApi("/test", { ticker: "AAPL", limit: undefined });

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.financialdatasets.ai/test?ticker=AAPL",
			expect.any(Object),
		);
	});

	it("should throw on non-OK response", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("Not Found", { status: 404, statusText: "Not Found" }),
		);

		await expect(callApi("/test", {})).rejects.toThrow("API request failed: 404 Not Found");
	});

	it("should return data and url", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify({ snapshot: { price: 150 } }), { status: 200 }),
		);

		const result = await callApi<{ snapshot: { price: number } }>("/prices/snapshot/", {
			ticker: "AAPL",
		});

		expect(result.data).toEqual({ snapshot: { price: 150 } });
		expect(result.url).toBe("https://api.financialdatasets.ai/prices/snapshot/?ticker=AAPL");
	});
});
