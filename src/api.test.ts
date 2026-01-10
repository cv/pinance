import { afterEach, describe, expect, it, vi } from "vitest";
import { callApi } from "./api.js";
import { resetConfig } from "./config.js";

// Mock the config module
vi.mock("./config.js", async (importOriginal) => {
	const original = await importOriginal<typeof import("./config.js")>();
	return {
		...original,
		getConfig: vi.fn(() => ({
			financialDatasetsApiKey: "test-api-key",
		})),
	};
});

describe("callApi", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		resetConfig();
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
