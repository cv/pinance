import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";

/** The data providers pinance can use. Users need a key for only one of them. */
export const PROVIDERS = {
	financialdatasets: {
		name: "Financial Datasets",
		keyName: "FINANCIAL_DATASETS_API_KEY",
		signup: "https://financialdatasets.ai/",
	},
	equibles: {
		name: "Equibles",
		keyName: "EQUIBLES_API_KEY",
		signup: "https://equibles.com/dashboard/apikeys",
	},
} as const;

export type ProviderId = keyof typeof PROVIDERS;

/** Financial Datasets first: it is the default when both keys are set. */
export const PROVIDER_IDS: readonly ProviderId[] = ["financialdatasets", "equibles"];

/** The environment variable that picks a provider when both keys are set. */
export const PROVIDER_SETTING = "PINANCE_PROVIDER";

/** A setting from the environment, else from `.env` in `cwd` (where pi runs). */
export function readSetting(name: string, cwd: string = process.cwd()): string | undefined {
	const fromEnv = process.env[name];
	if (fromEnv) {
		return fromEnv;
	}
	try {
		return parseEnv(readFileSync(join(cwd, ".env"), "utf8"))[name] || undefined;
	} catch {
		return undefined;
	}
}

/** Accepts the provider ids and the short names `fd` and `eq`, in any case. */
export function parseProviderName(value: string | undefined): ProviderId | undefined {
	switch (
		value
			?.trim()
			.toLowerCase()
			.replaceAll(/[\s_-]/g, "")
	) {
		case "fd":
		case "financialdatasets":
			return "financialdatasets";
		case "eq":
		case "equibles":
			return "equibles";
		default:
			return undefined;
	}
}

export interface ProviderState {
	/** Providers with a key, in PROVIDER_IDS order. */
	configured: ProviderId[];
	/** The provider PINANCE_PROVIDER names, if it names one. */
	preferred: ProviderId | undefined;
	/** A PINANCE_PROVIDER value that names no provider. */
	invalidPreference?: string;
}

export function providerState(cwd: string = process.cwd()): ProviderState {
	const configured = PROVIDER_IDS.filter((id) => readSetting(PROVIDERS[id].keyName, cwd));
	const setting = readSetting(PROVIDER_SETTING, cwd);
	const preferred = parseProviderName(setting);
	return {
		configured,
		preferred,
		...(setting && !preferred ? { invalidPreference: setting } : {}),
	};
}

/** The provider the extension uses for tools that both providers support. */
export function activeProvider(state: ProviderState): ProviderId | undefined {
	if (state.preferred && state.configured.includes(state.preferred)) {
		return state.preferred;
	}
	return state.configured[0];
}

const describeProviders = (ids: readonly ProviderId[]) =>
	ids.map((id) => `${PROVIDERS[id].name} (${PROVIDERS[id].keyName})`).join(" or ");

export class ProviderUnavailableError extends Error {
	constructor(tool: string, supported: readonly ProviderId[], configured: readonly ProviderId[]) {
		const signups = supported
			.map((id) => `Get a ${PROVIDERS[id].name} key at ${PROVIDERS[id].signup}`)
			.join("\n");
		super(
			`${tool} needs ${describeProviders(supported)}, but only ${describeProviders(configured)} is configured.\n\n${signups}`,
		);
		this.name = "ProviderUnavailableError";
	}
}

/**
 * Picks the provider for one call. With no key at all, it returns the tool's first provider, so the
 * request itself reports the missing key.
 */
export function chooseProvider(
	tool: string,
	supported: readonly ProviderId[],
	state: ProviderState,
): ProviderId {
	const candidates = supported.filter((id) => state.configured.includes(id));
	if (state.preferred && candidates.includes(state.preferred)) {
		return state.preferred;
	}
	const [first] = candidates;
	if (first) {
		return first;
	}
	if (state.configured.length > 0) {
		throw new ProviderUnavailableError(tool, supported, state.configured);
	}
	const fallback =
		state.preferred && supported.includes(state.preferred) ? state.preferred : supported[0];
	if (!fallback) {
		throw new Error(`${tool} has no data provider.`);
	}
	return fallback;
}

/** Register a tool when it can run: a provider it supports has a key, or no key is set yet. */
export function canRegister(supported: readonly ProviderId[], state: ProviderState): boolean {
	return state.configured.length === 0 || supported.some((id) => state.configured.includes(id));
}
