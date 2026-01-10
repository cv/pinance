import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getConfig, resetConfig } from "./config.js";

describe("config", () => {
	let originalApiKey: string | undefined;

	beforeEach(() => {
		originalApiKey = process.env.FINANCIAL_DATASETS_API_KEY;
		resetConfig();
	});

	afterEach(() => {
		if (originalApiKey !== undefined) {
			process.env.FINANCIAL_DATASETS_API_KEY = originalApiKey;
		} else {
			delete process.env.FINANCIAL_DATASETS_API_KEY;
		}
		resetConfig();
	});

	it("should throw error when API key is not set", () => {
		delete process.env.FINANCIAL_DATASETS_API_KEY;

		expect(() => getConfig()).toThrow("FINANCIAL_DATASETS_API_KEY environment variable is not set");
	});

	it("should throw error when API key is empty", () => {
		process.env.FINANCIAL_DATASETS_API_KEY = "";

		expect(() => getConfig()).toThrow("FINANCIAL_DATASETS_API_KEY environment variable is not set");
	});

	it("should return config when API key is set", () => {
		process.env.FINANCIAL_DATASETS_API_KEY = "test-key";

		const config = getConfig();

		expect(config.financialDatasetsApiKey).toBe("test-key");
	});

	it("should cache config", () => {
		process.env.FINANCIAL_DATASETS_API_KEY = "test-key";

		const config1 = getConfig();
		process.env.FINANCIAL_DATASETS_API_KEY = "changed-key";
		const config2 = getConfig();

		expect(config1).toBe(config2);
		expect(config2.financialDatasetsApiKey).toBe("test-key");
	});

	it("should reset cache", () => {
		process.env.FINANCIAL_DATASETS_API_KEY = "test-key";
		getConfig();

		resetConfig();
		process.env.FINANCIAL_DATASETS_API_KEY = "new-key";

		const config = getConfig();
		expect(config.financialDatasetsApiKey).toBe("new-key");
	});
});
