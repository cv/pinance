import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiKeyMissingError, ApiRequestError, callApi } from "./api.js";

describe("callApi", () => {
	beforeEach(() => {
		vi.stubEnv("FINANCIAL_DATASETS_API_KEY", "test-api-key");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it("should throw ApiKeyMissingError when API key is not set", async () => {
		vi.stubEnv("FINANCIAL_DATASETS_API_KEY", "");

		await expect(callApi("/test", {})).rejects.toThrow(ApiKeyMissingError);
		await expect(callApi("/test", {})).rejects.toThrow("FINANCIAL_DATASETS_API_KEY");
		await expect(callApi("/test", {})).rejects.toThrow("https://financialdatasets.ai");
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

	it("should throw ApiRequestError on non-OK response", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("Not Found", { status: 404, statusText: "Not Found" }),
		);

		await expect(callApi("/test", {})).rejects.toThrow(ApiRequestError);
		await expect(callApi("/test", {})).rejects.toThrow("API request failed: 404 Not Found");
		await expect(callApi("/test", {})).rejects.toThrow("Data not found");
	});

	it("should provide helpful message for 401 errors", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("Unauthorized", { status: 401, statusText: "Unauthorized" }),
		);

		await expect(callApi("/test", {})).rejects.toThrow("API key appears to be invalid");
	});

	it("should provide helpful message for 429 rate limit errors", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("Too Many Requests", { status: 429, statusText: "Too Many Requests" }),
		);

		await expect(callApi("/test", {})).rejects.toThrow("Rate limit exceeded");
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

	it("should normalize ticker to uppercase", async () => {
		const mockFetch = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(new Response(JSON.stringify({ data: "test" }), { status: 200 }));

		await callApi("/prices/snapshot/", { ticker: "aapl" });

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.financialdatasets.ai/prices/snapshot/?ticker=AAPL",
			expect.any(Object),
		);
	});
});
