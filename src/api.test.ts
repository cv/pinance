import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiKeyMissingError, ApiRequestError, callApi, resolveApiKey } from "./api.js";

function withTempDir(envFile?: string): string {
	const dir = mkdtempSync(join(tmpdir(), "pinance-"));
	if (envFile !== undefined) {
		writeFileSync(join(dir, ".env"), envFile);
	}
	return dir;
}

describe("resolveApiKey", () => {
	const dirs: string[] = [];
	const tempDir = (envFile?: string) => {
		const dir = withTempDir(envFile);
		dirs.push(dir);
		return dir;
	};

	afterEach(() => {
		vi.unstubAllEnvs();
		for (const dir of dirs.splice(0)) {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("prefers the environment", () => {
		vi.stubEnv("FINANCIAL_DATASETS_API_KEY", "from-env");
		expect(resolveApiKey(tempDir("FINANCIAL_DATASETS_API_KEY=from-file\n"))).toBe("from-env");
	});

	it("falls back to .env in the directory", () => {
		vi.stubEnv("FINANCIAL_DATASETS_API_KEY", "");
		// Keep the repository's own .env out of this test.
		const emptyDir = withTempDir();
		vi.spyOn(process, "cwd").mockReturnValue(emptyDir);
		const dir = tempDir('# comment\nOTHER=1\nFINANCIAL_DATASETS_API_KEY="from-file"\n');
		expect(resolveApiKey(dir)).toBe("from-file");
	});

	it("returns undefined without a key or .env", () => {
		vi.stubEnv("FINANCIAL_DATASETS_API_KEY", "");
		expect(resolveApiKey(tempDir())).toBeUndefined();
		expect(resolveApiKey(tempDir("FINANCIAL_DATASETS_API_KEY=\n"))).toBeUndefined();
	});
});

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

	it("should include the API's own reason from a JSON error body", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(
				JSON.stringify({
					error: "Crypto access restricted",
					message: "Crypto price data is only available to existing subscribers.",
				}),
				{ status: 403, statusText: "Forbidden" },
			),
		);

		const error = await callApi("/crypto/prices/snapshot/", { ticker: "BTC-USD" }).catch((e) => e);
		expect(error).toBeInstanceOf(ApiRequestError);
		expect(error.message).toContain("Access denied");
		expect(error.message).toContain(
			"API response: Crypto access restricted: Crypto price data is only available to existing subscribers.",
		);
		expect(error.body).toContain("Crypto access restricted");
	});

	it("should include a plain-text error body", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("upstream timeout", { status: 502, statusText: "Bad Gateway" }),
		);

		await expect(callApi("/test", {})).rejects.toThrow("API response: upstream timeout");
	});

	it("should provide helpful message for 401 errors", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("Unauthorized", { status: 401, statusText: "Unauthorized" }),
		);

		await expect(callApi("/test", {})).rejects.toThrow("API key appears to be invalid");
	});

	it("should provide helpful message and details for 403 errors", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("Forbidden", { status: 403, statusText: "Forbidden" }),
		);

		await expect(callApi("/test", { ticker: "AAPL" })).rejects.toThrow("Access denied");
		await expect(callApi("/test", { ticker: "AAPL" })).rejects.toMatchObject({
			status: 403,
			statusText: "Forbidden",
			url: "https://api.financialdatasets.ai/test?ticker=AAPL",
		});
	});

	it("should provide helpful message for 429 rate limit errors", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("Too Many Requests", { status: 429, statusText: "Too Many Requests" }),
		);

		await expect(callApi("/test", {})).rejects.toThrow("Rate limit exceeded");
	});

	it("should provide helpful message for server errors", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("Server Error", { status: 500, statusText: "Server Error" }),
		);

		await expect(callApi("/test", {})).rejects.toThrow(
			"Financial Datasets API is experiencing issues",
		);
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
