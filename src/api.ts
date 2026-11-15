import { PROVIDERS, type ProviderId, readSetting } from "./providers.js";

const BASE_URL = "https://api.financialdatasets.ai";
const EQUIBLES_BASE_URL = "https://api.equibles.com";

/**
 * The provider's API key from the environment, else from `.env` in `cwd` (where pi runs). The pit
 * functions `fd.request` and `eq.request` resolve keys the same way.
 */
export function resolveApiKey(
	cwd: string = process.cwd(),
	provider: ProviderId = "financialdatasets",
): string | undefined {
	return readSetting(PROVIDERS[provider].keyName, cwd);
}

export interface ApiResponse<T> {
	data: T;
	url: string;
}

// Generic response types for common API patterns
export type SnapshotResponse = { snapshot: Record<string, unknown> };
export type ArrayResponse<K extends string> = { [P in K]: Record<string, unknown>[] };
export type ObjectResponse<K extends string> = { [P in K]: Record<string, unknown> };

export class ApiKeyMissingError extends Error {
	constructor(provider: ProviderId = "financialdatasets") {
		const { name, keyName, signup } = PROVIDERS[provider];
		const other = PROVIDERS[provider === "financialdatasets" ? "equibles" : "financialdatasets"];
		super(
			`${keyName} environment variable is not set.\n\n` +
				`To use pinance tools, you need an API key from ${name}:\n` +
				`1. Get your API key at ${signup}\n` +
				`2. Set it: export ${keyName}=your_key_here\n` +
				"   Or add it to a .env file in the directory where you run pi.\n\n" +
				`Most tools also work with ${other.name} instead (${other.keyName}).`,
		);
		this.name = "ApiKeyMissingError";
	}
}

/**
 * Financial Datasets errors are JSON like { error, message }, Equibles errors like
 * { error: { code, message } }; fall back to the first 500 characters.
 */
function describeErrorBody(body: string): string {
	const text = body.trim();
	if (!text) {
		return "";
	}
	try {
		const parsed: unknown = JSON.parse(text);
		if (parsed && typeof parsed === "object") {
			const { error, message } = parsed as { error?: unknown; message?: unknown };
			const nested =
				error && typeof error === "object"
					? (error as { code?: unknown; message?: unknown })
					: { code: error, message: undefined };
			const parts = [nested.code, nested.message ?? message].filter(
				(part) => typeof part === "string" && part,
			);
			if (parts.length > 0) {
				return parts.join(": ");
			}
		}
	} catch {
		// Not JSON: show the text itself.
	}
	return text.slice(0, 500);
}

export class ApiRequestError extends Error {
	public readonly status: number;
	public readonly statusText: string;
	public readonly url: string;
	public readonly provider: ProviderId;
	/** The response body, so the API's own reason (such as "Crypto access restricted") reaches the user. */
	public readonly body: string;

	constructor(
		status: number,
		statusText: string,
		url: string,
		body = "",
		provider: ProviderId = "financialdatasets",
	) {
		const { name, keyName } = PROVIDERS[provider];
		let message = `API request failed: ${status} ${statusText}`;

		if (status === 401) {
			message += `\n\nYour API key appears to be invalid. Check your ${keyName}.`;
		} else if (status === 403) {
			message += "\n\nAccess denied. Your API key may not have access to this endpoint.";
		} else if (status === 429) {
			message +=
				provider === "equibles"
					? "\n\nRequest allowance used up. Equibles counts requests per day (resetting at 00:00 UTC); see https://equibles.com/pricing"
					: "\n\nRate limit exceeded. Please wait a moment before making more requests, or upgrade your plan at https://financialdatasets.ai/";
		} else if (status === 404) {
			message += "\n\nData not found. The ticker symbol or requested data may not exist.";
		} else if (status >= 500) {
			message += `\n\nThe ${name} API is experiencing issues. Please try again later.`;
		}

		const detail = describeErrorBody(body);
		if (detail) {
			message += `\n\nAPI response: ${detail}`;
		}

		super(message);
		this.name = "ApiRequestError";
		this.body = body;
		this.status = status;
		this.statusText = statusText;
		this.url = url;
		this.provider = provider;
	}
}

type QueryParams = Record<string, string | number | boolean | string[] | undefined>;

function appendParams(url: URL, params: QueryParams, upperCaseTicker: boolean): void {
	for (const [key, rawValue] of Object.entries(params)) {
		if (rawValue === undefined) {
			continue;
		}
		const value =
			upperCaseTicker && key === "ticker" && typeof rawValue === "string"
				? rawValue.toUpperCase()
				: rawValue;
		for (const item of Array.isArray(value) ? value : [value]) {
			url.searchParams.append(key, String(item));
		}
	}
}

/** A ticker for an Equibles path segment, such as "AAPL" or "XETR:SIE". */
export function equiblesTicker(ticker: string): string {
	return encodeURIComponent(ticker.trim().toUpperCase());
}

/**
 * Calls the Equibles REST API (https://api.equibles.com/v1). The key goes in the Authorization
 * header, never in the URL, because tool results and URLs end up in logs and session files.
 */
export async function callEquibles<T>(
	path: string,
	params: QueryParams,
	signal?: AbortSignal,
): Promise<ApiResponse<T>> {
	const apiKey = resolveApiKey(process.cwd(), "equibles");
	if (!apiKey) {
		throw new ApiKeyMissingError("equibles");
	}

	const url = new URL(`${EQUIBLES_BASE_URL}${path}`);
	appendParams(url, params, false);

	const response = await fetch(url.toString(), {
		headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
		signal: signal ?? null,
	});

	if (!response.ok) {
		const body = await response.text().catch(() => "");
		throw new ApiRequestError(
			response.status,
			response.statusText,
			url.toString(),
			body,
			"equibles",
		);
	}

	// The caller names the response shape; the API documents it.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	const data = (await response.json()) as T;
	return { data, url: url.toString() };
}

export async function callApi<T>(
	endpoint: string,
	params: Record<string, string | number | string[] | undefined>,
	signal?: AbortSignal,
): Promise<ApiResponse<T>> {
	const apiKey = resolveApiKey();
	if (!apiKey) {
		throw new ApiKeyMissingError();
	}

	const url = new URL(`${BASE_URL}${endpoint}`);
	// Normalize ticker to uppercase for consistent API calls
	appendParams(url, params, true);

	const response = await fetch(url.toString(), {
		headers: {
			"x-api-key": apiKey,
		},
		signal: signal ?? null,
	});

	if (!response.ok) {
		const body = await response.text().catch(() => "");
		throw new ApiRequestError(response.status, response.statusText, url.toString(), body);
	}

	// The caller names the response shape; the API documents it.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	const data = (await response.json()) as T;
	return { data, url: url.toString() };
}
