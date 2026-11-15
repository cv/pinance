import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	activeProvider,
	canRegister,
	chooseProvider,
	parseProviderName,
	ProviderUnavailableError,
	providerState,
	readSetting,
} from "./providers.js";
import { useProviders } from "./tools/test-utils.js";

afterEach(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
});

describe("readSetting", () => {
	it("prefers the environment, then .env, then undefined", () => {
		const dir = mkdtempSync(join(tmpdir(), "pinance-setting-"));
		writeFileSync(join(dir, ".env"), "PINANCE_TEST=from-file\n");
		vi.stubEnv("PINANCE_TEST", "from-env");
		expect(readSetting("PINANCE_TEST", dir)).toBe("from-env");
		vi.stubEnv("PINANCE_TEST", "");
		expect(readSetting("PINANCE_TEST", dir)).toBe("from-file");
		expect(readSetting("PINANCE_TEST", join(dir, "missing"))).toBeUndefined();
	});
});

describe("parseProviderName", () => {
	it.each([
		["fd", "financialdatasets"],
		["Financial-Datasets", "financialdatasets"],
		["financial_datasets", "financialdatasets"],
		[" EQ ", "equibles"],
		["Equibles", "equibles"],
	])("reads %s as %s", (value, id) => {
		expect(parseProviderName(value)).toBe(id);
	});

	it("rejects other names", () => {
		expect(parseProviderName("bloomberg")).toBeUndefined();
		expect(parseProviderName(undefined)).toBeUndefined();
	});
});

describe("providerState and activeProvider", () => {
	it("lists configured providers in order and defaults to Financial Datasets", () => {
		useProviders({ fd: "a", eq: "b" });
		const state = providerState();
		expect(state).toEqual({ configured: ["financialdatasets", "equibles"], preferred: undefined });
		expect(activeProvider(state)).toBe("financialdatasets");
	});

	it("follows PINANCE_PROVIDER when its key is set", () => {
		useProviders({ fd: "a", eq: "b", prefer: "eq" });
		expect(activeProvider(providerState())).toBe("equibles");
	});

	it("ignores a preference without a key", () => {
		useProviders({ fd: "a", prefer: "equibles" });
		expect(activeProvider(providerState())).toBe("financialdatasets");
	});

	it("reports a preference that names no provider", () => {
		useProviders({ eq: "b", prefer: "yahoo" });
		expect(providerState()).toEqual({
			configured: ["equibles"],
			preferred: undefined,
			invalidPreference: "yahoo",
		});
	});

	it("has no active provider without keys", () => {
		useProviders();
		expect(activeProvider(providerState())).toBeUndefined();
	});
});

describe("chooseProvider", () => {
	const both = ["financialdatasets", "equibles"] as const;

	it("uses the preferred provider when the tool supports it", () => {
		const state = { configured: [...both], preferred: "equibles" as const };
		expect(chooseProvider("t", both, state)).toBe("equibles");
		expect(chooseProvider("t", ["financialdatasets"], state)).toBe("financialdatasets");
	});

	it("uses the configured provider the tool supports", () => {
		const state = { configured: ["equibles" as const], preferred: undefined };
		expect(chooseProvider("t", both, state)).toBe("equibles");
	});

	it("explains a tool that needs another provider", () => {
		const state = { configured: ["equibles" as const], preferred: undefined };
		expect(() => chooseProvider("get_news", ["financialdatasets"], state)).toThrow(
			ProviderUnavailableError,
		);
		expect(() => chooseProvider("get_news", ["financialdatasets"], state)).toThrow(
			/get_news needs Financial Datasets \(FINANCIAL_DATASETS_API_KEY\), but only Equibles \(EQUIBLES_API_KEY\) is configured[\s\S]*financialdatasets\.ai/,
		);
	});

	it("without keys, falls back to the preferred or first provider so the request names the key", () => {
		expect(chooseProvider("t", both, { configured: [], preferred: undefined })).toBe(
			"financialdatasets",
		);
		expect(chooseProvider("t", both, { configured: [], preferred: "equibles" })).toBe("equibles");
		expect(
			chooseProvider("t", ["equibles"], { configured: [], preferred: "financialdatasets" }),
		).toBe("equibles");
	});

	it("fails for a tool without providers", () => {
		expect(() => chooseProvider("t", [], { configured: [], preferred: undefined })).toThrow(
			"t has no data provider.",
		);
	});
});

describe("canRegister", () => {
	it("registers everything without keys, else only tools a configured provider supports", () => {
		expect(canRegister(["equibles"], { configured: [], preferred: undefined })).toBe(true);
		expect(canRegister(["equibles"], { configured: ["equibles"], preferred: undefined })).toBe(
			true,
		);
		expect(
			canRegister(["financialdatasets"], { configured: ["equibles"], preferred: undefined }),
		).toBe(false);
	});
});
