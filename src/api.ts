const BASE_URL = "https://api.financialdatasets.ai";

export interface ApiResponse<T> {
	data: T;
	url: string;
}

export async function callApi<T>(
	endpoint: string,
	params: Record<string, string | number | string[] | undefined>,
	signal?: AbortSignal,
): Promise<ApiResponse<T>> {
	// biome-ignore lint/nursery/noProcessEnv: API key must come from environment
	const apiKey = process.env.FINANCIAL_DATASETS_API_KEY;
	if (!apiKey) {
		throw new Error("FINANCIAL_DATASETS_API_KEY environment variable is not set");
	}

	const url = new URL(`${BASE_URL}${endpoint}`);

	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== null) {
			if (Array.isArray(value)) {
				for (const v of value) {
					url.searchParams.append(key, v);
				}
			} else {
				url.searchParams.append(key, String(value));
			}
		}
	}

	const response = await fetch(url.toString(), {
		headers: {
			"x-api-key": apiKey,
		},
		signal,
	});

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status} ${response.statusText}`);
	}

	const data = (await response.json()) as T;
	return { data, url: url.toString() };
}
