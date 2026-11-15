import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";

const BASE_URL = "https://api.financialdatasets.ai";
const API_KEY_NAME = "FINANCIAL_DATASETS_API_KEY";

/**
 * The API key from the environment, else from `.env` in `cwd` (where pi runs). The pit function
 * `fd.request` resolves the key the same way.
 */
export function resolveApiKey(cwd: string = process.cwd()): string | undefined {
	const fromEnv = process.env[API_KEY_NAME];
	if (fromEnv) {
		return fromEnv;
	}
	try {
		return parseEnv(readFileSync(join(cwd, ".env"), "utf8"))[API_KEY_NAME] || undefined;
	} catch {
		return undefined;
	}
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
	constructor() {
		super(
			"FINANCIAL_DATASETS_API_KEY environment variable is not set.\n\n" +
				"To use pinance tools, you need an API key from Financial Datasets:\n" +
				"1. Get your API key at https://financialdatasets.ai/\n" +
				"2. Set it: export FINANCIAL_DATASETS_API_KEY=your_key_here\n" +
				"   Or add it to a .env file in the directory where you run pi.",
		);
		this.name = "ApiKeyMissingError";
	}
}

export class ApiRequestError extends Error {
	public readonly status: number;
	public readonly statusText: string;
	public readonly url: string;

	constructor(status: number, statusText: string, url: string) {
		let message = `API request failed: ${status} ${statusText}`;

		if (status === 401) {
			message += "\n\nYour API key appears to be invalid. Check your FINANCIAL_DATASETS_API_KEY.";
		} else if (status === 403) {
			message += "\n\nAccess denied. Your API key may not have access to this endpoint.";
		} else if (status === 429) {
			message +=
				"\n\nRate limit exceeded. Please wait a moment before making more requests, or upgrade your plan at https://financialdatasets.ai/";
		} else if (status === 404) {
			message += "\n\nData not found. The ticker symbol or requested data may not exist.";
		} else if (status >= 500) {
			message += "\n\nThe Financial Datasets API is experiencing issues. Please try again later.";
		}

		super(message);
		this.name = "ApiRequestError";
		this.status = status;
		this.statusText = statusText;
		this.url = url;
	}
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

	for (const [key, rawValue] of Object.entries(params)) {
		if (rawValue === undefined) {
			continue;
		}

		// Normalize ticker to uppercase for consistent API calls
		const value =
			key === "ticker" && typeof rawValue === "string" ? rawValue.toUpperCase() : rawValue;
		if (Array.isArray(value)) {
			for (const item of value) {
				url.searchParams.append(key, item);
			}
		} else {
			url.searchParams.append(key, String(value));
		}
	}

	const response = await fetch(url.toString(), {
		headers: {
			"x-api-key": apiKey,
		},
		signal: signal ?? null,
	});

	if (!response.ok) {
		throw new ApiRequestError(response.status, response.statusText, url.toString());
	}

	const data = (await response.json()) as T;
	return { data, url: url.toString() };
}
